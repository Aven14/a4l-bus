#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
set -euo pipefail

RADIO_ROOT="${RADIO_ROOT:-$HOME/radio}"
MUSIC_ROOT="${MUSIC_ROOT:-$HOME/Musique}"

TARGETS=(
  "$RADIO_ROOT/emissions"
  "$MUSIC_ROOT"
)

PATTERNS=(
  ".DS_Store"
  "._*"
)

log() {
  printf '[votreradio-clean-macos-artifacts] %s\n' "$1"
}

existing_targets=()
for dir in "${TARGETS[@]}"; do
  if [ -d "$dir" ]; then
    existing_targets+=("$dir")
  else
    log "répertoire ignore (absent) : $dir"
  fi
done

if [ "${#existing_targets[@]}" -eq 0 ]; then
  log "aucun répertoire cible disponible, arrêt"
  exit 0
fi

log "début du nettoyage"

count_before=0
for pattern in "${PATTERNS[@]}"; do
  while IFS= read -r _; do
    count_before=$((count_before + 1))
  done < <(find "${existing_targets[@]}" -type f -name "$pattern" -print)
done

for pattern in "${PATTERNS[@]}"; do
  find "${existing_targets[@]}" -type f -name "$pattern" -delete
done

count_after=0
for pattern in "${PATTERNS[@]}"; do
  while IFS= read -r _; do
    count_after=$((count_after + 1))
  done < <(find "${existing_targets[@]}" -type f -name "$pattern" -print)
done

removed=$((count_before - count_after))
log "fichiers supprimés : $removed"
log "nettoyage terminé"
