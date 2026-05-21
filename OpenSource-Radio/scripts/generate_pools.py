#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
from __future__ import annotations

import argparse
import json
import os
import random
import subprocess
from pathlib import Path
from typing import Dict, Iterable, List, Set


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

NORMALIZE_MAP = {
    # Exemple volontairement court : adaptez cette table à vos propres tags.
    "nuit": "night",
    "night": "night",
    "calme": "calm",
    "calm": "calm",
    "matin": "morning",
    "morning": "morning",
    "journee": "daytime",
    "journée": "daytime",
    "daytime": "daytime",
    "soir": "evening",
    "soiree": "evening",
    "soirée": "evening",
}

DEFAULT_CONFIG = {
    "music_root": "/home/votreradio/Musique",
    "pools_dir": "/home/votreradio/radio/pools",
    "cooldown_policy": {
        "artist_s": 90 * 60,
        "album_s": 180 * 60,
        "title_s": 24 * 60 * 60,
    },
    "pools": [
        {"name": "bloc-nuit", "tags": ["night", "calm"], "min_duration_s": 600},
        {"name": "bloc-nuit-endcap", "tags": ["night", "calm"], "max_duration_s": 900},
        {"name": "bloc-matin", "tags": ["morning"], "max_duration_s": 1200},
        {"name": "bloc-journee", "tags": ["daytime"]},
        {"name": "bloc-soiree", "tags": ["evening"]},
        {"name": "format-court", "max_duration_s": 600},
        {"name": "format-long", "min_duration_s": 1200},
    ],
    "artist_pools": [],
}

META_CACHE: Dict[Path, dict] = {}


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


def split_genres(raw: str) -> List[str]:
    if not raw:
        return ["(sans genre)"]
    parts: List[str] = [raw]
    for sep in [";", ",", "|"]:
        next_parts: List[str] = []
        for item in parts:
            next_parts.extend(item.split(sep))
        parts = next_parts
    cleaned = [part.strip() for part in parts if part.strip()]
    return cleaned or ["(sans genre)"]


def normalize_genre(tag: str) -> str:
    normalized = tag.strip().lower()
    if not normalized:
        return "(sans genre)"
    return NORMALIZE_MAP.get(normalized, normalized)


def ffprobe_metadata(path: Path) -> dict:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration:format_tags=genre,artist,album,title",
        "-of",
        "json",
        str(path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        return {"duration": 0.0, "artist": "", "album": "", "title": "", "genres": ["(sans genre)"]}

    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        return {"duration": 0.0, "artist": "", "album": "", "title": "", "genres": ["(sans genre)"]}

    fmt = data.get("format", {}) or {}
    tags = {str(k).lower(): str(v) for k, v in (fmt.get("tags", {}) or {}).items()}

    try:
        duration = float(fmt.get("duration", 0.0) or 0.0)
    except Exception:
        duration = 0.0

    genres = sorted({normalize_genre(genre) for genre in split_genres(tags.get("genre", ""))})
    return {
        "duration": duration,
        "artist": tags.get("artist", "").strip(),
        "album": tags.get("album", "").strip(),
        "title": tags.get("title", "").strip(),
        "genres": genres or ["(sans genre)"],
    }


def artist_key(path: Path) -> str:
    artist = (META_CACHE[path].get("artist") or "").strip().lower()
    if artist:
        return artist
    return f"__unknown_artist__::{path.parent.name.lower()}"


def album_key(path: Path) -> str:
    artist = artist_key(path)
    album = (META_CACHE[path].get("album") or "").strip().lower()
    if album:
        return f"{artist}::{album}"
    return f"{artist}::__unknown_album__::{path.parent.name.lower()}"


def title_key(path: Path) -> str:
    artist = artist_key(path)
    album = (META_CACHE[path].get("album") or "").strip().lower()
    title = (META_CACHE[path].get("title") or path.stem).strip().lower()
    return f"{artist}::{album}::{title}"


def duration_seconds(path: Path) -> float:
    try:
        return float(META_CACHE[path].get("duration", 0.0) or 0.0)
    except Exception:
        return 0.0


def candidate_penalty(
    path: Path,
    artist_last_end: Dict[str, float],
    album_last_end: Dict[str, float],
    title_last_end: Dict[str, float],
    cursor_s: float,
    cooldown_artist_s: float,
    cooldown_album_s: float,
    cooldown_title_s: float,
) -> tuple[int, float, float, float]:
    artist = artist_key(path)
    album = album_key(path)
    title = title_key(path)

    artist_wait = max(0.0, artist_last_end.get(artist, float("-inf")) + cooldown_artist_s - cursor_s)
    album_wait = max(0.0, album_last_end.get(album, float("-inf")) + cooldown_album_s - cursor_s)
    title_wait = max(0.0, title_last_end.get(title, float("-inf")) + cooldown_title_s - cursor_s)

    violations = int(artist_wait > 0.0) + int(album_wait > 0.0) + int(title_wait > 0.0)
    total_wait = artist_wait + album_wait + title_wait
    return violations, total_wait, title_wait, album_wait


def spaced_order(files: List[Path], cooldown_policy: dict) -> List[Path]:
    unique_files = list(dict.fromkeys(files))
    if not unique_files:
        return []

    rng = random.Random()
    rng.seed()

    remaining = unique_files[:]
    rng.shuffle(remaining)
    ordered: List[Path] = []

    artist_last_end: Dict[str, float] = {}
    album_last_end: Dict[str, float] = {}
    title_last_end: Dict[str, float] = {}
    cursor_s = 0.0

    cooldown_artist_s = float(cooldown_policy.get("artist_s", 90 * 60))
    cooldown_album_s = float(cooldown_policy.get("album_s", 180 * 60))
    cooldown_title_s = float(cooldown_policy.get("title_s", 24 * 60 * 60))

    while remaining:
        scored = []
        for idx, path in enumerate(remaining):
            scored.append(
                (
                    *candidate_penalty(
                        path,
                        artist_last_end,
                        album_last_end,
                        title_last_end,
                        cursor_s,
                        cooldown_artist_s,
                        cooldown_album_s,
                        cooldown_title_s,
                    ),
                    idx,
                    path,
                )
            )

        min_violations = min(item[0] for item in scored)
        best = [item for item in scored if item[0] == min_violations]
        min_total_wait = min(item[1] for item in best)
        best = [item for item in best if item[1] == min_total_wait]
        min_title_wait = min(item[2] for item in best)
        best = [item for item in best if item[2] == min_title_wait]
        min_album_wait = min(item[3] for item in best)
        best = [item for item in best if item[3] == min_album_wait]

        *_, chosen = rng.choice(best)
        remaining.remove(chosen)
        ordered.append(chosen)

        end_s = cursor_s + max(1.0, duration_seconds(chosen))
        artist_last_end[artist_key(chosen)] = end_s
        album_last_end[album_key(chosen)] = end_s
        title_last_end[title_key(chosen)] = end_s
        cursor_s = end_s

    return ordered


def pool_tags(pool: dict) -> Set[str]:
    return {normalize_genre(str(tag)) for tag in pool.get("tags", [])}


def match_duration(meta: dict, pool: dict) -> bool:
    duration = float(meta.get("duration", 0.0) or 0.0)
    min_duration = pool.get("min_duration_s")
    max_duration = pool.get("max_duration_s")
    if min_duration is not None and duration < float(min_duration):
        return False
    if max_duration is not None and duration >= float(max_duration):
        return False
    return True


def match_pool(path: Path, pool: dict) -> bool:
    meta = META_CACHE[path]
    if not match_duration(meta, pool):
        return False

    tags = pool_tags(pool)
    if tags:
        genres = {normalize_genre(genre) for genre in meta.get("genres", [])}
        if not (genres & tags):
            return False

    return True


def match_artist_pool(path: Path, pool: dict) -> bool:
    meta = META_CACHE[path]
    if not match_duration(meta, pool):
        return False
    artists = {str(artist).strip().lower() for artist in pool.get("artists", [])}
    return bool(artists and (meta.get("artist") or "").strip().lower() in artists)


def write_m3u(pools_dir: Path, name: str, files: List[Path]) -> None:
    pools_dir.mkdir(parents=True, exist_ok=True)
    out = pools_dir / f"{name}.m3u"
    with out.open("w", encoding="utf-8") as f:
        for path in files:
            f.write(str(path) + "\n")


def load_config(path: Path | None) -> dict:
    config = json.loads(json.dumps(DEFAULT_CONFIG))
    if path and path.exists():
        with path.open("r", encoding="utf-8") as f:
            user_config = json.load(f)
        config.update(user_config)

    config["music_root"] = os.environ.get("MUSIC_ROOT", config.get("music_root", DEFAULT_CONFIG["music_root"]))
    config["pools_dir"] = os.environ.get("POOLS_DIR", config.get("pools_dir", DEFAULT_CONFIG["pools_dir"]))
    return config


def main() -> int:
    parser = argparse.ArgumentParser(description="Génère des playlists M3U depuis une bibliothèque audio.")
    parser.add_argument("--config", default="", help="Chemin vers pools.example.json ou une config locale.")
    args = parser.parse_args()

    config_path = Path(args.config) if args.config else None
    config = load_config(config_path)
    music_root = Path(config["music_root"])
    pools_dir = Path(config["pools_dir"])
    cooldown_policy = config.get("cooldown_policy", DEFAULT_CONFIG["cooldown_policy"])

    if not music_root.exists():
        raise SystemExit(f"Bibliothèque introuvable : {music_root}")

    tracks = list(iter_audio_files(music_root))
    print(f"{len(tracks)} fichiers audio détectés.")

    for index, path in enumerate(tracks, start=1):
        META_CACHE[path] = ffprobe_metadata(path)
        if index % 250 == 0:
            print(f"  ... {index}/{len(tracks)}")

    pools = list(config.get("pools", []))
    pools.extend(config.get("artist_pools", []))

    print("\nGénération des pools :")
    for pool in pools:
        name = pool["name"]
        if "artists" in pool:
            selected = [path for path in tracks if match_artist_pool(path, pool)]
        else:
            selected = [path for path in tracks if match_pool(path, pool)]

        ordered = spaced_order(selected, cooldown_policy)
        write_m3u(pools_dir, name, ordered)
        print(f"  - {name}.m3u : {len(ordered)} titres")

    print(f"\nDossier de sortie : {pools_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
