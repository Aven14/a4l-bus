export const RADIO_VOLUME_STORAGE_KEY = "clearbus-radio-volume";

export function readStoredVolume(fallback = 0.5): number {
  if (typeof window === "undefined") return fallback;

  try {
    const stored = localStorage.getItem(RADIO_VOLUME_STORAGE_KEY);
    if (stored === null) return fallback;

    const parsed = parseFloat(stored);
    if (Number.isNaN(parsed)) return fallback;

    return Math.min(1, Math.max(0, parsed));
  } catch {
    return fallback;
  }
}

export function writeStoredVolume(volume: number) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      RADIO_VOLUME_STORAGE_KEY,
      String(Math.min(1, Math.max(0, volume)))
    );
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
}

export function formatPlaybackTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
