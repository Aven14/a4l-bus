#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime
from pathlib import Path


FIELDNAMES = ["timestamp", "artist", "title", "album", "year"]


def append_csv(path: Path, row: dict[str, str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    file_exists = path.exists() and path.stat().st_size > 0
    with path.open("a", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)
    path.chmod(0o644)


def append_jsonl(path: Path, row: dict[str, str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")
    path.chmod(0o644)


def main() -> int:
    parser = argparse.ArgumentParser(description="Ajoute une entrée dans l'historique nowplaying.")
    parser.add_argument("--artist", default="")
    parser.add_argument("--title", default="")
    parser.add_argument("--album", default="")
    parser.add_argument("--year", default="")
    parser.add_argument("--outdir", default="/var/www/html/history")
    args = parser.parse_args()

    row = {
        "timestamp": datetime.now().astimezone().isoformat(timespec="seconds"),
        "artist": args.artist,
        "title": args.title,
        "album": args.album,
        "year": args.year,
    }
    outdir = Path(args.outdir)
    append_csv(outdir / "nowplaying.csv", row)
    append_jsonl(outdir / "nowplaying.jsonl", row)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

