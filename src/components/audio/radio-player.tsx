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
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-navy-900/95 backdrop-blur-xl ${
        isAnnouncing ? "announce-active border-accent/40" : ""
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            disabled={isAnnouncing}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 transition hover:scale-105 disabled:opacity-50"
            aria-label={isPlaying ? "Pause" : "Lecture"}
          >
            {isPlaying ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {currentTrackTitle}
            </p>
            <p className="text-xs text-slate-500">CrossBus Radio — Libre de droits</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="h-1 w-24 cursor-pointer accent-accent md:w-32"
            aria-label="Volume"
          />
        </div>

        <button
          type="button"
          onClick={nextTrack}
          disabled={isAnnouncing}
          className="btn-secondary py-2 text-sm disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
