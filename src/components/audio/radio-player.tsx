"use client";

import { useAudio } from "@/contexts/audio-context";

export function RadioPlayer() {
  const {
    isPlaying,
    volume,
    currentTrackTitle,
    isAnnouncing,
    togglePlay,
    setVolume,
    nextTrack,
  } = useAudio();

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 border-t-2 border-track bg-surface ${
        isAnnouncing ? "announce-blink" : ""
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <button
          type="button"
          onClick={togglePlay}
          disabled={isAnnouncing}
          className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-track bg-track text-surface transition hover:bg-surface hover:text-track disabled:opacity-40"
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
          <p className="truncate font-display text-sm font-bold uppercase tracking-wide text-track">
            {currentTrackTitle}
          </p>
          <p className="label-caps mt-0.5">Cross Track Bus Radio</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="label-caps hidden sm:inline">Vol</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="h-1 w-24 cursor-pointer accent-track md:w-32"
            aria-label="Volume"
          />
        </div>

        <button
          type="button"
          onClick={nextTrack}
          disabled={isAnnouncing}
          className="btn-secondary py-2 text-xs disabled:opacity-40"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
