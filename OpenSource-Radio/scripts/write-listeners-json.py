#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


def parse_int(value: str, default: int = 0) -> int:
    try:
        return int(str(value).strip())
    except Exception:
        return default


def atomic_write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False, dir=str(path.parent)) as tmp:
        json.dump(payload, tmp, ensure_ascii=False, indent=2)
        tmp.write("\n")
        tmp_path = Path(tmp.name)
    tmp_path.replace(path)
    path.chmod(0o644)


def fetch_icecast_xml(url: str, user: str, password: str, timeout: int) -> bytes:
    if not password:
        raise RuntimeError("ICECAST_ADMIN_PASSWORD est vide.")
    password_mgr = urllib.request.HTTPPasswordMgrWithDefaultRealm()
    password_mgr.add_password(None, url, user, password)
    handler = urllib.request.HTTPBasicAuthHandler(password_mgr)
    opener = urllib.request.build_opener(handler)
    req = urllib.request.Request(url)
    with opener.open(req, timeout=timeout) as resp:
        return resp.read()


def find_source(root: ET.Element, mount: str) -> ET.Element | None:
    for source in root.findall("source"):
        if source.attrib.get("mount") == mount:
            return source
    return None


def text_of(parent: ET.Element, tag: str, default: str = "") -> str:
    el = parent.find(tag)
    if el is None or el.text is None:
        return default
    return el.text


def main() -> int:
    parser = argparse.ArgumentParser(description="Expose un résumé public des statistiques Icecast.")
    parser.add_argument("--status-url", default=env("ICECAST_STATUS_URL", "http://127.0.0.1:8000/admin/stats"))
    parser.add_argument("--user", default=env("ICECAST_ADMIN_USER", "admin"))
    parser.add_argument("--password", default=env("ICECAST_ADMIN_PASSWORD", ""))
    parser.add_argument("--mount", default=env("ICECAST_TARGET_MOUNT", "/stream.mp3"))
    parser.add_argument("--out", default=str(Path(env("WEB_ROOT", "/var/www/html")) / "listeners.json"))
    parser.add_argument("--timeout", type=int, default=int(env("ICECAST_TIMEOUT_SECONDS", "5")))
    args = parser.parse_args()

    try:
        xml_data = fetch_icecast_xml(args.status_url, args.user, args.password, args.timeout)
        root = ET.fromstring(xml_data)
        source = find_source(root, args.mount)

        if source is None:
            print(f"Mount introuvable: {args.mount}", file=sys.stderr)
            return 1

        payload = {
            "mount": args.mount,
            "current": parse_int(text_of(source, "listeners", "0")),
            "peak": parse_int(text_of(source, "listener_peak", "0")),
            "server_listeners": parse_int(text_of(root, "listeners", "0")),
            "updatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
        }

        atomic_write_json(Path(args.out), payload)
        return 0

    except Exception as exc:
        print(f"Erreur: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
