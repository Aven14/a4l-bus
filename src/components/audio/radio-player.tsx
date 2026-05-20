"use client";

import { useAudio } from "@/contexts/audio-context";

export function RadioPlayer() {
  const {
    isPlaying,
    isAnnouncing,
    currentTrackTitle,
    volume,
    setVolume,
    playRadio,
    pauseRadio,
  } = useAudio();

  const togglePlay = () => {
    if (isPlaying) {
      pauseRadio();
    } else {
      playRadio();
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-line/60 bg-surface/95 shadow-[0_-8px_28px_-6px_rgba(15,23,42,0.1),0_-4px_12px_-2px_rgba(29,78,216,0.1)] backdrop-blur-md ${
        isAnnouncing ? "announce-blink" : ""
      }`}
    >
      <div className="h-px bg-gradient-to-r from-primary/40 via-primary/20 to-accent/30" />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <button
          type="button"
          onClick={togglePlay}
          disabled={isAnnouncing}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-white shadow-elevated transition hover:bg-primary-dark disabled:opacity-40"
          aria-label={isPlaying ? "Pause" : "Lecture"}
        >
          {isPlaying ? (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {currentTrackTitle || "Radio Cross Track Bus"}
          </p>
          <p className="text-xs text-muted">
            {isAnnouncing ? "📢 Annonce en cours..." : "Radio en direct disponible 24h/24"}
          </p>
        </div>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="h-1 w-24 cursor-pointer accent-primary md:w-32"
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
