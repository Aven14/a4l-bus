import type { RadioTrackConfig } from "@/lib/radio-sync";
import { getPlaylistSeed, shuffleWithSeed } from "@/lib/radio-sync";

type ApiTrack = RadioTrackConfig & { filename?: string };

/** Lit automatiquement tous les .mp3 dans public/audio/music */
export async function fetchRadioTracks(): Promise<RadioTrackConfig[]> {
  try {
    const res = await fetch("/api/radio/tracks", { cache: "no-store" });
    if (!res.ok) return [];

    const json = await res.json();
    // L'API retourne { tracks: [...] } ou directement [...]
    const data: ApiTrack[] = Array.isArray(json) ? json : (json.tracks || []);
    
    if (!Array.isArray(data) || data.length === 0) {
      console.warn("[Radio] No tracks found");
      return [];
    }

    console.log(`[Radio] Found ${data.length} tracks`);

    const filenames = data.map((t) => t.filename ?? t.src.split("/").pop() ?? "");
    const seed = getPlaylistSeed(filenames);

    const shuffled = shuffleWithSeed(
      data.map(({ title, src }) => ({ title, src })),
      seed
    );

    return shuffled;
  } catch (err) {
    console.error("[Radio] Error fetching tracks:", err);
    return [];
  }
}
