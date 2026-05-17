"use client";

import { useAudio } from "@/contexts/audio-context";

export function RadioPlayer() {
  const {
    isPlaying,
    volume,
    currentTrackTitle,
    isAnnouncing,
    radioReady,
    togglePlay,
    setVolume,
  } = useAudio();

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-surface/95 shadow-[0_-4px_24px_rgba(29,78,216,0.08)] backdrop-blur-md ${
        isAnnouncing ? "announce-blink border-accent/30" : ""
      }`}
    >
      <div className="h-0.5 bg-gradient-to-r from-primary via-primary to-accent" />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <button
          type="button"
          onClick={togglePlay}
          disabled={isAnnouncing || !radioReady}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition hover:bg-primary-dark disabled:opacity-40"
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
            {currentTrackTitle}
          </p>
          <p className="text-xs text-muted">
            Lecture aléatoire · synchronisée pour tous
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
