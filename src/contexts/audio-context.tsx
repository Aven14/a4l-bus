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
  const chimeRef = useRef<HTMLAudioElement | null>(null);
  const wasPlayingRef = useRef(false);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // Set volume on music element when it changes
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = volume;
    }
    if (announcementRef.current) {
      announcementRef.current.volume = volume;
    }
    if (chimeRef.current) {
      chimeRef.current.volume = volume;
    }
  }, [volume]);

  // Initialize audio elements and BroadcastChannel
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
    
    if (!chimeRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      chimeRef.current = audio;
    }
    
    // BroadcastChannel pour annonces globales
    if (!broadcastRef.current) {
      broadcastRef.current = new BroadcastChannel("crossbus-announcements");
      broadcastRef.current.onmessage = (event) => {
        const { audioUrl, label } = event.data;
        playAnnouncement(audioUrl, label);
      };
    }
    
    return () => {
      if (broadcastRef.current) {
        broadcastRef.current.close();
      }
    };
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
        
        // Jouer avec fade in
        music.volume = 0;
        await music.play();
        setIsPlaying(true);
        
        // Fade in sur 500ms
        const fadeInInterval = setInterval(() => {
          if (music.volume < volume) {
            music.volume = Math.min(music.volume + 0.05, volume);
          } else {
            clearInterval(fadeInInterval);
          }
        }, 25);
      }
    } catch (error) {
      console.error("[Radio play error]:", error);
    }
  }, [volume]);

  const pauseRadio = useCallback(async () => {
    const music = musicRef.current;
    if (!music) return;

    setIsPlaying(false);
    music.pause();
  }, []);

  const playAnnouncement = useCallback((audioUrl: string, label: string) => {
    const music = musicRef.current;
    const announcement = announcementRef.current;
    const chime = chimeRef.current;
    if (!music || !announcement || !chime) return;

    // Sauvegarder l'état de la radio
    wasPlayingRef.current = isPlaying;
    
    // Fade out de la musique sur 500ms
    const fadeOutInterval = setInterval(() => {
      if (music.volume > 0) {
        music.volume = Math.max(music.volume - 0.05, 0);
      } else {
        clearInterval(fadeOutInterval);
        music.pause();
        
        // Jouer le chime
        chime.src = "/audio/sfx/chime.mp3";
        chime.volume = volume;
        chime.play().catch(() => {});
        
        // Après le chime, jouer l'annonce
        chime.onended = () => {
          announcement.src = audioUrl;
          announcement.volume = volume;
          announcement.play().catch(() => {});
          
          // Après l'annonce, reprendre la radio avec fade in
          announcement.onended = () => {
            if (wasPlayingRef.current) {
              playRadio();
            }
          };
        };
      }
    }, 25);
  }, [isPlaying, volume, playRadio]);

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
