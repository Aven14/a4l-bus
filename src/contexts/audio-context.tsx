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
  playAnnouncement: (audioUrl: string, label: string) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackTitle, setCurrentTrackTitle] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);

  const musicRef = useRef<HTMLAudioElement | null>(null);
  const announcementRef = useRef<HTMLAudioElement | null>(null);
  const wasPlayingRef = useRef(false);

  // Set volume on music element when it changes
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = volume;
    }
    if (announcementRef.current) {
      announcementRef.current.volume = volume;
    }
  }, [volume]);

  // Initialize audio elements
  useEffect(() => {
    if (!musicRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      musicRef.current = audio;
      
      // Changer de piste automatiquement à la fin
      audio.addEventListener("ended", () => {
        playRadio();
      });
    }
    
    if (!announcementRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      announcementRef.current = audio;
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

  const playAnnouncement = useCallback((audioUrl: string, label: string) => {
    const music = musicRef.current;
    const announcement = announcementRef.current;
    if (!music || !announcement) return;

    // Sauvegarder l'état de la radio
    wasPlayingRef.current = isPlaying;
    
    // Mettre en pause la radio
    music.pause();
    setIsPlaying(false);
    
    // Jouer l'annonce
    announcement.src = audioUrl;
    announcement.play().catch(() => {});
    
    // Reprendre la radio après l'annonce
    announcement.onended = () => {
      if (wasPlayingRef.current) {
        playRadio();
      }
    };
  }, [isPlaying, playRadio]);

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        currentTrackTitle,
        volume,
        setVolume,
        playRadio,
        pauseRadio,
        playAnnouncement,
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
