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

  const playRadio = useCallback(async () => {
    const music = musicRef.current;
    if (!music) return;

    try {
      // Récupérer l'état actuel de la radio
      const response = await fetch("/api/radio");
      if (!response.ok) return;

      const state = await response.json();
      
      if (state.track && state.tracks.length > 0) {
        // Charger la piste
        const audioSrc = `/audio/music/${state.track}`;
        music.src = audioSrc;
        setCurrentTrackTitle(state.track.replace(".mp3", ""));
        
        // Mettre à la position actuelle de la radio
        music.currentTime = state.position;
        
        // Jouer
        await music.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("[Radio play error]:", error);
    }
  }, []);

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
