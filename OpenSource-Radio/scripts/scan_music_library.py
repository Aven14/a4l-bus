#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
from __future__ import annotations

import argparse
import csv
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Iterable


AUDIO_EXTS = {
    ".mp3",
    ".flac",
    ".ogg",
    ".opus",
    ".m4a",
    ".aac",
    ".wav",
    ".aif",
    ".aiff",
    ".ape",
    ".wv",
    ".alac",
}

FIELDNAMES = [
    "path",
    "artist",
    "album",
    "title",
    "genre",
    "duration_seconds",
    "duration_hms",
    "missing_artist",
    "missing_album",
    "missing_title",
    "missing_genre",
]


def is_audio_file(path: Path) -> bool:
    return (
        path.is_file()
        and not path.name.startswith("._")
        and path.name != ".DS_Store"
        and path.suffix.lower() in AUDIO_EXTS
    )


def iter_audio_files(root: Path) -> Iterable[Path]:
    for path in root.rglob("*"):
        if is_audio_file(path):
            yield path


def hms(seconds: float) -> str:
    total = max(0, int(round(seconds)))
    h = total // 3600
    m = (total % 3600) // 60
    s = total % 60
    return f"{h:02d}:{m:02d}:{s:02d}"


def ffprobe(path: Path) -> dict:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration:format_tags=artist,album,title,genre",
        "-of",
        "json",
        str(path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        return {"duration": 0.0, "tags": {}}

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        return {"duration": 0.0, "tags": {}}

    fmt = data.get("format", {}) or {}
    tags = fmt.get("tags", {}) or {}
    try:
        duration = float(fmt.get("duration", 0.0) or 0.0)
    except Exception:
        duration = 0.0
    return {"duration": duration, "tags": tags}


def row_for(path: Path, root: Path) -> dict[str, str]:
    meta = ffprobe(path)
    tags = meta["tags"]
    artist = str(tags.get("artist", "")).strip()
    album = str(tags.get("album", "")).strip()
    title = str(tags.get("title", "")).strip()
    genre = str(tags.get("genre", "")).strip()
    duration = float(meta["duration"] or 0.0)

    try:
        display_path = str(path.relative_to(root))
    except ValueError:
        display_path = str(path)

    return {
        "path": display_path,
        "artist": artist,
        "album": album,
        "title": title,
        "genre": genre,
        "duration_seconds": f"{duration:.3f}",
        "duration_hms": hms(duration),
        "missing_artist": "1" if not artist else "0",
        "missing_album": "1" if not album else "0",
        "missing_title": "1" if not title else "0",
        "missing_genre": "1" if not genre else "0",
    }


def main() -> int:
    default_music_root = os.environ.get("MUSIC_ROOT", "/home/votreradio/Musique")
    default_radio_root = os.environ.get("RADIO_ROOT", "/home/votreradio/radio")
    parser = argparse.ArgumentParser(description="Scanne une bibliothèque audio et produit un CSV de contrôle.")
    parser.add_argument("--music-root", default=default_music_root)
    parser.add_argument("--out", default=str(Path(default_radio_root) / "reports" / "genres_durees_musique.csv"))
    args = parser.parse_args()

    root = Path(args.music_root)
    if not root.exists():
        print(f"Bibliothèque introuvable: {root}", file=sys.stderr)
        return 1

    rows = []
    for index, path in enumerate(iter_audio_files(root), start=1):
        rows.append(row_for(path, root))
        if index % 250 == 0:
            print(f"... {index} fichiers analysés", file=sys.stderr)

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)
    out.chmod(0o644)

    missing_genres = sum(1 for row in rows if row["missing_genre"] == "1")
    print(f"{len(rows)} fichiers audio analysés.")
    print(f"{missing_genres} fichier(s) sans genre.")
    print(f"CSV: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
