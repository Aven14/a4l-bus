"use client";

import { useAudio } from "@/contexts/audio-context";

export function RadioPlayer() {
  const { isPlaying, currentTrackTitle, volume, setVolume, playRadio, pauseRadio } = useAudio();

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 shadow-xl border border-gray-700 z-50">
      <div className="flex items-center gap-4">
        <button
          onClick={isPlaying ? pauseRadio : playRadio}
          className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors"
        >
          {isPlaying ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        
        <div className="flex flex-col">
          <span className="text-white font-medium text-sm">
            {currentTrackTitle || "Radio CrossBus"}
          </span>
          <span className="text-gray-400 text-xs">
            {isPlaying ? "En lecture" : "En pause"}
          </span>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 accent-blue-600"
          />
        </div>
      </div>
    </div>
  );
}
