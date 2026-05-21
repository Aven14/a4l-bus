#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
from __future__ import annotations

import argparse
import json
import tempfile
from datetime import datetime
from pathlib import Path


def atomic_write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False, dir=str(path.parent)) as tmp:
        json.dump(payload, tmp, ensure_ascii=False, indent=2)
        tmp.write("\n")
        tmp_path = Path(tmp.name)
    tmp_path.replace(path)
    path.chmod(0o644)


def main() -> int:
    parser = argparse.ArgumentParser(description="Écrit nowplaying.json de manière atomique.")
    parser.add_argument("--artist", default="")
    parser.add_argument("--title", default="")
    parser.add_argument("--album", default="")
    parser.add_argument("--year", default="")
    parser.add_argument("--out", default="/var/www/html/nowplaying.json")
    args = parser.parse_args()

    payload = {
        "artist": args.artist,
        "title": args.title,
        "album": args.album,
        "year": args.year,
        "updatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
    }
    atomic_write_json(Path(args.out), payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
