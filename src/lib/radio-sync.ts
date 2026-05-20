/** Point de départ identique pour tous les visiteurs (radio synchronisée) */
export const RADIO_SYNC_EPOCH = Date.parse("2026-01-01T00:00:00.000Z");

export type RadioTrackConfig = {
  title: string;
  src: string;
};

export type RadioTrackWithDuration = RadioTrackConfig & {
  duration: number;
};

/** Graine du jour + liste des fichiers → même ordre aléatoire pour tout le monde */
export function getPlaylistSeed(filenames: string[]): number {
  const d = new Date();
  const day = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const listKey = [...filenames].sort().join("|");
  let hash = day;
  for (let i = 0; i < listKey.length; i++) {
    hash = (hash * 31 + listKey.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed >>> 0;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getAudioDuration(src: string): Promise<number> {
  // Vérifier si on est côté client (Audio n'existe pas côté serveur)
  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    return Promise.resolve(0);
  }

  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      resolve(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0);
    };
    audio.onerror = () => resolve(0);
    audio.src = src;
  });
}

export async function loadTracksWithDurations(
  tracks: RadioTrackConfig[]
): Promise<RadioTrackWithDuration[]> {
  const withDuration = await Promise.all(
    tracks.map(async (t) => ({
      ...t,
      duration: await getAudioDuration(t.src),
    }))
  );
  return withDuration.filter((t) => t.duration > 0);
}

export function getSyncedPosition(
  tracks: RadioTrackWithDuration[],
  now = Date.now()
): { trackIndex: number; offsetSeconds: number } {
  if (tracks.length === 0) return { trackIndex: 0, offsetSeconds: 0 };

  const total = tracks.reduce((sum, t) => sum + t.duration, 0);
  if (total <= 0) return { trackIndex: 0, offsetSeconds: 0 };

  let elapsed = ((now - RADIO_SYNC_EPOCH) / 1000) % total;
  if (elapsed < 0) elapsed += total;

  for (let i = 0; i < tracks.length; i++) {
    if (elapsed < tracks[i].duration) {
      return { trackIndex: i, offsetSeconds: elapsed };
    }
    elapsed -= tracks[i].duration;
  }

  return { trackIndex: 0, offsetSeconds: 0 };
}
