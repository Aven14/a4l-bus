"use client";

import { useState, useEffect } from "react";
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
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    fetchTracks();
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

  const handleSkip = (track: MusicTrack) => {
    const audio = new Audio(track.path);
    
    if (currentTrack === track.path && isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setCurrentTrack(null);
    } else {
      if (currentTrack) {
        // Stop current track
        const prevAudio = document.querySelector('audio[data-music-player]') as HTMLAudioElement;
        if (prevAudio) {
          prevAudio.pause();
        }
      }
      
      audio.setAttribute("data-music-player", "true");
      audio.play()
        .then(() => {
          setCurrentTrack(track.path);
          setIsPlaying(true);
          setAudioError(null);
        })
        .catch((err) => {
          setAudioError(`Impossible de jouer: ${track.name}`);
          setIsPlaying(false);
          setCurrentTrack(null);
        });

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTrack(null);
      };
    }
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
        <h3 className="text-lg font-bold text-primary">Musiques de la radio</h3>
        <p className="text-sm text-muted">
          {tracks.length} musique{tracks.length !== 1 ? "s" : ""} disponible{tracks.length !== 1 ? "s" : ""}
        </p>
      </div>

      {audioError && (
        <p className="rounded-md bg-accent-light p-3 text-sm text-accent">{audioError}</p>
      )}

      {tracks.length === 0 ? (
        <div className="panel-soft p-10 text-center text-muted">
          Aucune musique dans public/audio/music/
        </div>
      ) : (
        <div className="space-y-2">
          {tracks.map((track) => {
            const isCurrentTrack = currentTrack === track.path;
            
            return (
              <div
                key={track.filename}
                className={`rounded-md p-4 shadow-card transition ${
                  isCurrentTrack ? "bg-primary-light border-l-4 border-primary" : "bg-surface"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink truncate">{track.name}</p>
                    <div className="mt-1 flex gap-3 text-xs text-muted">
                      <span>{formatFileSize(track.size)}</span>
                      <span>•</span>
                      <span>{track.filename}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSkip(track)}
                      disabled={pending}
                      className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
                        isCurrentTrack && isPlaying
                          ? "bg-accent text-white hover:bg-accent/90"
                          : "bg-primary text-white hover:bg-primary-dark"
                      }`}
                    >
                      {isCurrentTrack && isPlaying ? "⏹ Stop" : "▶ Skip/Play"}
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
