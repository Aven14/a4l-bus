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
  tracks: string[],
  durations: Map<string, number>
): { trackIndex: number; position: number } {
  if (tracks.length === 0) {
    return { trackIndex: 0, position: 0 };
  }

  let idx = ((trackIndex % tracks.length) + tracks.length) % tracks.length;
  let pos = position;
  let guard = 0;

  while (tracks.length > 0 && guard < tracks.length * 2) {
    guard += 1;
    const duration = getTrackDuration(tracks[idx], durations);

    if (pos < duration) {
      return { trackIndex: idx, position: pos };
    }

    pos -= duration;
    idx = (idx + 1) % tracks.length;
  }

  return { trackIndex: idx, position: 0 };
}

export function durationsToRecord(durations: Map<string, number>) {
  return Object.fromEntries(durations.entries());
}

export function invalidateTrackDurationsCache() {
  durationsCache = null;
  loadPromise = null;
}
