import fs from "fs";
import path from "path";
import { parseFile } from "music-metadata";

export const DEFAULT_TRACK_DURATION = 180;

const musicDir = path.join(process.cwd(), "public", "audio", "music");

let durationsCache: Map<string, number> | null = null;
let loadPromise: Promise<Map<string, number>> | null = null;

export function getMusicTracks(): string[] {
  if (!fs.existsSync(musicDir)) return [];

  return fs
    .readdirSync(musicDir)
    .filter((file) => file.endsWith(".mp3") && file !== ".gitkeep")
    .sort((a, b) => a.localeCompare(b, "fr"));
}

export function shuffleTracks(tracks: string[]): string[] {
  const shuffled = [...tracks];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function normalizePlaylist(
  tracks: string[],
  existingOrder: string[] = []
): string[] {
  const trackSet = new Set(tracks);
  const filtered = existingOrder.filter((track) => trackSet.has(track));
  const missing = tracks.filter((track) => !filtered.includes(track));

  if (filtered.length === tracks.length && filtered.length > 0) {
    return filtered;
  }

  return shuffleTracks([...filtered, ...missing]);
}

async function loadTrackDurations(): Promise<Map<string, number>> {
  const tracks = getMusicTracks();
  const durations = new Map<string, number>();

  await Promise.all(
    tracks.map(async (filename) => {
      const filePath = path.join(musicDir, filename);

      try {
        const metadata = await parseFile(filePath, { duration: true });
        const seconds = metadata.format.duration;

        if (seconds && seconds > 0) {
          durations.set(filename, seconds);
          return;
        }
      } catch {
        // Fallback below
      }

      durations.set(filename, DEFAULT_TRACK_DURATION);
    })
  );

  return durations;
}

export async function ensureTrackDurations(): Promise<Map<string, number>> {
  if (durationsCache) return durationsCache;

  if (!loadPromise) {
    loadPromise = loadTrackDurations().then((map) => {
      durationsCache = map;
      return map;
    });
  }

  return loadPromise;
}

export function getTrackDuration(
  filename: string,
  durations: Map<string, number>
): number {
  return durations.get(filename) ?? DEFAULT_TRACK_DURATION;
}

export function advanceTrackPosition(
  trackIndex: number,
  position: number,
  playlist: string[],
  durations: Map<string, number>
): {
  trackIndex: number;
  position: number;
  needsReshuffle: boolean;
} {
  if (playlist.length === 0) {
    return { trackIndex: 0, position: 0, needsReshuffle: false };
  }

  let idx = ((trackIndex % playlist.length) + playlist.length) % playlist.length;
  let pos = position;
  let guard = 0;

  while (playlist.length > 0 && guard < playlist.length * 2) {
    guard += 1;
    const duration = getTrackDuration(playlist[idx], durations);

    if (pos < duration) {
      return { trackIndex: idx, position: pos, needsReshuffle: false };
    }

    pos -= duration;
    idx += 1;

    if (idx >= playlist.length) {
      return { trackIndex: 0, position: 0, needsReshuffle: true };
    }
  }

  return { trackIndex: idx, position: 0, needsReshuffle: false };
}

export function durationsToRecord(durations: Map<string, number>) {
  return Object.fromEntries(durations.entries());
}

export function invalidateTrackDurationsCache() {
  durationsCache = null;
  loadPromise = null;
}
