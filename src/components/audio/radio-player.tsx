"use client";

import { useAudio } from "@/contexts/audio-context";
import { formatPlaybackTime } from "@/lib/radio-preferences";

export function RadioPlayer() {
  const {
    isPlaying,
    currentTrackTitle,
    playbackCurrent,
    playbackDuration,
    volume,
    setVolume,
    playRadio,
    pauseRadio,
  } = useAudio();

  const progressPercent =
    playbackDuration > 0
      ? Math.min(100, (playbackCurrent / playbackDuration) * 100)
      : 0;
  const volumePercent = Math.round(volume * 100);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(100vw-2rem,22rem)] rounded-lg border border-gray-700 bg-gray-900/90 p-4 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={isPlaying ? pauseRadio : playRadio}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 transition-colors hover:bg-blue-700"
          aria-label={isPlaying ? "Mettre en pause" : "Lancer la radio"}
        >
          {isPlaying ? (
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="ml-0.5 h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {currentTrackTitle || "Radio ClearBus"}
          </p>
          <p className="text-xs text-gray-400">
            {isPlaying ? "Synchronisé" : "Appuyez pour écouter"}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <div
          className="h-1.5 overflow-hidden rounded-full bg-gray-700"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
          aria-label="Progression du morceau"
        >
          <div
            className="h-full rounded-full bg-blue-500 transition-[width] duration-300 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] tabular-nums text-gray-400">
          <span>{formatPlaybackTime(playbackCurrent)}</span>
          <span>{formatPlaybackTime(playbackDuration)}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <svg
          className="h-4 w-4 shrink-0 text-gray-400"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={volumePercent}
          onChange={(e) => setVolume(parseInt(e.target.value, 10) / 100)}
          className="h-2 w-full min-w-0 flex-1 cursor-pointer accent-blue-600"
          aria-label="Volume"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={volumePercent}
        />
        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-gray-300">
          {volumePercent}%
        </span>
      </div>
    </div>
  );
}
