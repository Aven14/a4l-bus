#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
from __future__ import annotations

import argparse
import json
import tempfile
from datetime import datetime
from pathlib import Path


def parse_bool(value: str) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "y", "on"}


def atomic_write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False, dir=str(path.parent)) as tmp:
        json.dump(payload, tmp, ensure_ascii=False, indent=2)
        tmp.write("\n")
        tmp_path = Path(tmp.name)
    tmp_path.replace(path)
    path.chmod(0o644)


def main() -> int:
    parser = argparse.ArgumentParser(description="Écrit current-show.json de manière atomique.")
    parser.add_argument("--show", required=True)
    parser.add_argument("--kind", required=True)
    parser.add_argument("--is-live", default="false")
    parser.add_argument("--out", default="/var/www/html/current-show.json")
    args = parser.parse_args()

    payload = {
        "show": args.show,
        "kind": args.kind,
        "is_live": parse_bool(args.is_live),
        "updatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
    }
    atomic_write_json(Path(args.out), payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
