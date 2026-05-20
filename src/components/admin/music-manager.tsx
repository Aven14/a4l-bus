"use client";

import { useEffect, useState, useTransition } from "react";
import { useAudio } from "@/contexts/audio-context";

type MusicTrack = {
  title: string;
  src: string;
  filename: string;
};

export function MusicManager() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const { isPlaying } = useAudio();

  useEffect(() => {
    fetchTracks();

    // Poll server state every 3 seconds
    const interval = setInterval(() => {
      if (isPlaying) {
        fetch("/api/radio/sync", { cache: "no-store" })
          .then((res) => res.json())
          .then((state) => {
            if (state.trackIndex !== undefined) {
              setCurrentIndex(state.trackIndex);
            }
          })
          .catch(() => {});
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const fetchTracks = async () => {
    try {
      const res = await fetch("/api/radio/tracks");
      if (!res.ok) return;
      
      const json = await res.json();
      const data = Array.isArray(json) ? json : (json.tracks || []);
      setTracks(data);
    } catch (error) {
      console.error("Failed to fetch tracks:", error);
    }
  };

  const handleSkip = (trackIndex: number) => {
    startTransition(async () => {
      try {
        // Update server state - tous les clients vont sync
        await fetch("/api/radio/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackIndex,
            position: 0,
            isPlaying: true,
          }),
        });
        
        setCurrentIndex(trackIndex);
      } catch (error) {
        console.error("Failed to skip track:", error);
      }
    });
  };

  const handleDownload = (track: MusicTrack) => {
    const a = document.createElement("a");
    a.href = track.src;
    a.download = track.filename;
    a.click();
  };

  if (tracks.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-center py-6">
          <p className="text-gray-600">
            Aucune musique trouvée dans <code>/audio/music/</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-2xl">🎵</span>
        <div>
          <h3 className="text-lg font-bold">Contrôle Radio</h3>
          <p className="text-sm text-gray-600">
            Les changements sont synchronisés pour tous les utilisateurs
          </p>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {tracks.map((track, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-between p-3 rounded-lg transition ${
              idx === currentIndex
                ? "bg-blue-50 border-2 border-blue-400"
                : "bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {idx === currentIndex && (
                <span className="text-blue-600 animate-pulse">●</span>
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    idx === currentIndex ? "text-blue-900" : "text-gray-900"
                  }`}
                >
                  {track.title}
                </p>
                {idx === currentIndex && (
                  <p className="text-xs text-blue-600 font-medium">
                    ♫ En cours de diffusion
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-3">
              {idx !== currentIndex && (
                <button
                  onClick={() => handleSkip(idx)}
                  disabled={isPending}
                  className="px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition whitespace-nowrap"
                >
                  ⏭ Passer à celle-ci
                </button>
              )}
              <button
                onClick={() => handleDownload(track)}
                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Télécharger"
              >
                💾
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          💡 La musique actuelle est : <strong>{tracks[currentIndex]?.title}</strong>
        </p>
      </div>
    </div>
  );
}
