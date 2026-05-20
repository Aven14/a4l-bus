"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTransition } from "react";

type MusicTrack = {
  filename: string;
  name: string;
  path: string;
  size: number;
  lastModified: Date;
};

export function MusicManager() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [currentIndex, setCurrentIndex] = useState(0);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    fetchTracks();

    // Écouter les contrôles radio broadcast
    broadcastRef.current = new BroadcastChannel("crossbus-radio-control");
    broadcastRef.current.onmessage = (event) => {
      const { action, trackIndex } = event.data;
      
      if (action === "skip" && trackIndex !== undefined) {
        setCurrentIndex(trackIndex);
      }
    };

    return () => {
      broadcastRef.current?.close();
    };
  }, []);

  const fetchTracks = async () => {
    try {
      const res = await fetch("/api/radio/tracks");
      const data = await res.json();
      setTracks(data.tracks || []);
    } catch (err) {
      console.error("Error fetching tracks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = (trackIndex: number) => {
    startTransition(() => {
      // Diffuser le skip à tous les clients
      broadcastRef.current?.postMessage({
        action: "skip",
        trackIndex,
      });
      
      setCurrentIndex(trackIndex);
    });
  };

  const handleDownload = (track: MusicTrack) => {
    const link = document.createElement("a");
    link.href = track.path;
    link.download = track.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) {
    return <p className="text-muted">Chargement des musiques...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-primary">Contrôle de la radio</h3>
        <p className="text-sm text-muted">
          {tracks.length} musique{tracks.length !== 1 ? "s" : ""} • Skip synchronisé pour tous les utilisateurs
        </p>
      </div>

      {tracks.length === 0 ? (
        <div className="panel-soft p-10 text-center text-muted">
          Aucune musique dans public/audio/music/
        </div>
      ) : (
        <div className="space-y-2">
          {tracks.map((track, index) => {
            const isCurrentTrack = index === currentIndex;
            
            return (
              <div
                key={track.filename}
                className={`rounded-md p-4 shadow-card transition ${
                  isCurrentTrack ? "bg-primary-light border-l-4 border-primary" : "bg-surface"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {isCurrentTrack && (
                        <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                      )}
                      <p className="font-medium text-ink truncate">{track.name}</p>
                    </div>
                    <div className="mt-1 flex gap-3 text-xs text-muted">
                      <span>{formatFileSize(track.size)}</span>
                      <span>•</span>
                      <span>{track.filename}</span>
                      {isCurrentTrack && (
                        <>
                          <span>•</span>
                          <span className="text-primary font-semibold">♫ En cours</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSkip(index)}
                      disabled={pending || isCurrentTrack}
                      className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
                        isCurrentTrack
                          ? "bg-muted text-white cursor-not-allowed opacity-50"
                          : "bg-primary text-white hover:bg-primary-dark"
                      }`}
                    >
                      {isCurrentTrack ? "♫ En cours" : "⏭ Passer à celle-ci"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(track)}
                      className="rounded-md bg-surface px-3 py-2 text-xs font-semibold text-primary border border-line hover:bg-primary-light transition"
                    >
                      ⬇ Télécharger
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
