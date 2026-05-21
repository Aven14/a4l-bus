"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface AudioContextType {
  isPlaying: boolean;
  currentTrackTitle: string | null;
  volume: number;
  setVolume: (vol: number) => void;
  playRadio: () => void;
  pauseRadio: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackTitle, setCurrentTrackTitle] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);

  const musicRef = useRef<HTMLAudioElement | null>(null);

  // Set volume on music element when it changes
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = volume;
    }
  }, [volume]);

  // Initialize audio element
  useEffect(() => {
    if (!musicRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      musicRef.current = audio;
    }
  }, []);

  // Sync with server periodically
  const syncWithServer = useCallback(async () => {
    try {
      const response = await fetch("/api/radio");
      if (!response.ok) return;

      const state = await response.json();
      const music = musicRef.current;
      if (!music) return;

      if (state.tracks && state.tracks.length > 0) {
        const track = state.tracks[state.trackIndex % state.tracks.length];
        const audioSrc = track.src;
        
        if (music.src !== audioSrc) {
          music.src = audioSrc;
          setCurrentTrackTitle(track.title);
        }
        
        // Sync position seulement si l'utilisateur écoute
        if (isPlaying) {
          if (Math.abs(music.currentTime - state.position) > 1) {
            music.currentTime = state.position;
          }
          
          if (music.paused) {
            music.play().catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error("[Radio sync error]:", error);
    }
  }, [isPlaying]);

  const playRadio = useCallback(async () => {
    const music = musicRef.current;
    if (!music) return;

    // Sync une seule fois au démarrage
    await syncWithServer();
    
    setIsPlaying(true);
    music.play().catch(() => {});
  }, [syncWithServer]);

  const pauseRadio = useCallback(async () => {
    const music = musicRef.current;
    if (!music) return;

    setIsPlaying(false);
    music.pause();
  }, []);

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        currentTrackTitle,
        volume,
        setVolume,
        playRadio,
        pauseRadio,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within AudioProvider");
  }
  return context;
}
