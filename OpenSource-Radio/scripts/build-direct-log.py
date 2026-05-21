#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
from __future__ import annotations

import argparse
import ipaddress
import json
import re
from datetime import datetime
from pathlib import Path


UFW_RE = re.compile(
    r"^(?P<ts>\S+)\s+\S+\s+kernel:\s+\[(?P<action>UFW (?:ALLOW|BLOCK))\].*?"
    r"SRC=(?P<ip>[0-9a-fA-F:.]+).*?DPT=(?P<port>\d+)\b"
)

LIQ_DECODE_RE = re.compile(
    r"^(?P<ts>\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2}) \[input\.harbor:\d+\] Decoding\.\.\.$"
)
LIQ_META_RE = re.compile(
    r"^(?P<ts>\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2}) \[input\.harbor:\d+\] New metadata chunk \? -- (?P<title>.+)$"
)
LIQ_SWITCH_IN_RE = re.compile(
    r"^(?P<ts>\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2}) \[switch\.\d+:\d+\] Switch to (?:input\.harbor|metadata_map\.\d+) with transition\.$"
)
LIQ_FEED_STOP_RE = re.compile(
    r"^(?P<ts>\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2}) \[input\.harbor:\d+\] Feeding stopped: .+$"
)
LIQ_SWITCH_OUT_RE = re.compile(
    r"^(?P<ts>\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2}) \[switch\.\d+:\d+\] Switch to switch(?:\.\d+)? with forgetful transition\.$"
)


def parse_kern_ts(ts: str) -> datetime:
    return datetime.fromisoformat(ts)


def parse_liq_ts(ts: str) -> datetime:
    return datetime.strptime(ts, "%Y/%m/%d %H:%M:%S")


def anonymize_ip(value: str, mode: str) -> str:
    if mode == "raw":
        return value
    try:
        ip = ipaddress.ip_address(value)
    except ValueError:
        return value

    if mode == "hash":
        import hashlib

        return hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]

    if isinstance(ip, ipaddress.IPv4Address):
        return str(ipaddress.ip_network(f"{ip}/24", strict=False).network_address)

    return str(ipaddress.ip_network(f"{ip}/64", strict=False).network_address)


def read_lines(paths):
    for path in paths:
        if path.exists():
            with path.open("r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    yield line.rstrip("\n")


def load_existing_keys(output_path: Path):
    keys = set()
    if not output_path.exists():
        return keys

    with output_path.open("r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except Exception:
                continue

            if obj.get("status") == "LIVE_OK":
                key = (
                    obj.get("status"),
                    obj.get("ip"),
                    obj.get("live_start_ts"),
                    obj.get("live_end_ts"),
                    obj.get("title"),
                )
            else:
                key = (obj.get("status"), obj.get("ip"), obj.get("try_ts"))
            keys.add(key)
    return keys


def parse_ufw_events(paths, port: int, ip_mode: str):
    events = []
    for line in read_lines(paths):
        match = UFW_RE.search(line)
        if not match or int(match.group("port")) != port:
            continue
        ts = parse_kern_ts(match.group("ts"))
        events.append(
            {
                "ts": ts,
                "ts_str": match.group("ts"),
                "ip": anonymize_ip(match.group("ip"), ip_mode),
                "action": match.group("action").split()[1],
            }
        )
    events.sort(key=lambda item: item["ts"])
    return events


def compress_ufw_events(events, gap_seconds=30):
    if not events:
        return []

    compressed = []
    current = {
        "action": events[0]["action"],
        "ip": events[0]["ip"],
        "first_ts": events[0]["ts"],
        "first_ts_str": events[0]["ts_str"],
        "last_ts": events[0]["ts"],
        "count": 1,
    }

    for event in events[1:]:
        same_group = (
            event["action"] == current["action"]
            and event["ip"] == current["ip"]
            and (event["ts"] - current["last_ts"]).total_seconds() <= gap_seconds
        )
        if same_group:
            current["last_ts"] = event["ts"]
            current["count"] += 1
        else:
            compressed.append(current)
            current = {
                "action": event["action"],
                "ip": event["ip"],
                "first_ts": event["ts"],
                "first_ts_str": event["ts_str"],
                "last_ts": event["ts"],
                "count": 1,
            }

    compressed.append(current)
    return compressed


def parse_liquidsoap_sessions(log_path: Path):
    sessions = []
    current = None

    if not log_path.exists():
        return sessions

    with log_path.open("r", encoding="utf-8", errors="ignore") as f:
        for raw_line in f:
            line = raw_line.rstrip("\n")

            match = LIQ_DECODE_RE.match(line)
            if match:
                ts_str = match.group("ts")
                if current and current.get("live_end_ts") is None:
                    sessions.append(current)
                current = {
                    "decode_ts": parse_liq_ts(ts_str),
                    "decode_ts_str": ts_str,
                    "title_ts": None,
                    "title_ts_str": None,
                    "title": None,
                    "live_start_ts": None,
                    "live_start_ts_str": None,
                    "feed_stop_ts": None,
                    "feed_stop_ts_str": None,
                    "live_end_ts": None,
                    "live_end_ts_str": None,
                }
                continue

            if current is None:
                continue

            match = LIQ_META_RE.match(line)
            if match and current["title_ts"] is None:
                current["title_ts"] = parse_liq_ts(match.group("ts"))
                current["title_ts_str"] = match.group("ts")
                current["title"] = match.group("title")
                continue

            match = LIQ_SWITCH_IN_RE.match(line)
            if match and current["live_start_ts"] is None:
                current["live_start_ts"] = parse_liq_ts(match.group("ts"))
                current["live_start_ts_str"] = match.group("ts")
                continue

            match = LIQ_FEED_STOP_RE.match(line)
            if match and current["feed_stop_ts"] is None:
                current["feed_stop_ts"] = parse_liq_ts(match.group("ts"))
                current["feed_stop_ts_str"] = match.group("ts")
                continue

            match = LIQ_SWITCH_OUT_RE.match(line)
            if match and current["live_end_ts"] is None:
                current["live_end_ts"] = parse_liq_ts(match.group("ts"))
                current["live_end_ts_str"] = match.group("ts")
                sessions.append(current)
                current = None

    if current:
        sessions.append(current)

    return sessions


def find_best_allow_for_session(session, allow_groups):
    decode_ts = session.get("decode_ts")
    if decode_ts is None:
        return None

    best = None
    best_delta = None
    for group in allow_groups:
        if group["action"] != "ALLOW":
            continue
        delta = (decode_ts - group["first_ts"].replace(tzinfo=None)).total_seconds()
        if delta < -5 or delta > 120:
            continue
        if best is None or delta < best_delta:
            best = group
            best_delta = delta
    return best


def build_live_ok_records(sessions, allow_groups):
    records = []
    for session in sessions:
        if not session.get("live_start_ts_str") or not session.get("live_end_ts_str"):
            continue
        allow = find_best_allow_for_session(session, allow_groups)
        duration = int((session["live_end_ts"] - session["live_start_ts"]).total_seconds())
        records.append(
            {
                "ip": allow["ip"] if allow else None,
                "try_ts": allow["first_ts_str"] if allow else None,
                "decode_ts": session.get("decode_ts_str"),
                "title_ts": session.get("title_ts_str"),
                "title": session.get("title"),
                "live_start_ts": session.get("live_start_ts_str"),
                "feed_stop_ts": session.get("feed_stop_ts_str"),
                "live_end_ts": session.get("live_end_ts_str"),
                "duration_on_air_s": duration,
                "status": "LIVE_OK",
            }
        )
    return records


def build_block_records(block_groups):
    records = []
    for group in block_groups:
        if group["action"] != "BLOCK":
            continue
        records.append(
            {
                "ip": group["ip"],
                "try_ts": group["first_ts_str"],
                "last_try_ts": group["last_ts"].isoformat(),
                "attempt_count": group["count"],
                "status": "BLOCK",
            }
        )
    return records


def dedupe_records(records, existing_keys):
    new_records = []
    for record in records:
        if record.get("status") == "LIVE_OK":
            key = (
                record.get("status"),
                record.get("ip"),
                record.get("live_start_ts"),
                record.get("live_end_ts"),
                record.get("title"),
            )
        else:
            key = (record.get("status"), record.get("ip"), record.get("try_ts"))

        if key in existing_keys:
            continue
        existing_keys.add(key)
        new_records.append(record)
    return new_records


def main() -> int:
    parser = argparse.ArgumentParser(description="Construit un JSONL des accès DIRECT depuis UFW et Liquidsoap.")
    parser.add_argument("--kern-log", action="append", default=["/var/log/kern.log", "/var/log/kern.log.1"])
    parser.add_argument("--liquidsoap-log", default="/home/votreradio/radio/logs/liquidsoap.log")
    parser.add_argument("--out", default="/home/votreradio/radio/logs/live/direct-access.jsonl")
    parser.add_argument("--port", type=int, default=18005)
    parser.add_argument("--ip-mode", choices=["prefix", "hash", "raw"], default="prefix")
    args = parser.parse_args()

    output_path = Path(args.out)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.touch(exist_ok=True)

    existing_keys = load_existing_keys(output_path)
    ufw_events = parse_ufw_events([Path(path) for path in args.kern_log], args.port, args.ip_mode)
    ufw_groups = compress_ufw_events(ufw_events, gap_seconds=30)
    sessions = parse_liquidsoap_sessions(Path(args.liquidsoap_log))

    all_records = build_block_records(ufw_groups) + build_live_ok_records(sessions, ufw_groups)
    new_records = dedupe_records(all_records, existing_keys)

    if not new_records:
        print("Aucun nouvel événement à ajouter.")
        return 0

    with output_path.open("a", encoding="utf-8") as f:
        for record in new_records:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    output_path.chmod(0o640)
    print(f"{len(new_records)} entrée(s) ajoutee(s) à {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
