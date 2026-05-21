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
        playNextTrack();
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

  const playNextTrack = useCallback(async () => {
    const music = musicRef.current;
    if (!music) return;

    try {
      // Récupérer la liste des pistes
      const response = await fetch("/api/radio");
      if (!response.ok) return;

      const state = await response.json();
      
      if (state.tracks && state.tracks.length > 0) {
        // Trouver l'index actuel et passer au suivant
        const currentTrack = music.src.split('/').pop();
        let currentIndex = state.tracks.indexOf(currentTrack || "");
        if (currentIndex === -1) currentIndex = 0;
        
        const nextIndex = (currentIndex + 1) % state.tracks.length;
        const nextTrack = state.tracks[nextIndex];
        
        // Charger la piste suivante au début
        const audioSrc = `/audio/music/${nextTrack}`;
        music.src = audioSrc;
        setCurrentTrackTitle(nextTrack.replace(".mp3", ""));
        music.currentTime = 0;
        
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
      console.error("[Radio next track error]:", error);
    }
  }, [volume]);

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

    console.log("[Announcement] Starting announcement:", label);
    
    // Vérifier l'état réel de l'audio
    const actuallyPlaying = !music.paused && music.src !== "";
    console.log("[Announcement] Audio state - isPlaying:", isPlaying, "actuallyPlaying:", actuallyPlaying, "paused:", music.paused, "src:", music.src);
    
    // Sauvegarder l'état de la radio
    wasPlayingRef.current = actuallyPlaying;
    const currentSrc = music.src;
    const currentTime = music.currentTime;
    console.log("[Announcement] Saved state - wasPlaying:", wasPlayingRef.current, "src:", currentSrc, "time:", currentTime);
    
    // Si la radio n'est pas en lecture, juste jouer l'annonce sans fade out
    if (!actuallyPlaying) {
      console.log("[Announcement] Radio not playing, playing announcement directly");
      chime.src = "/audio/sfx/chime.mp3";
      chime.volume = volume;
      chime.play().catch(() => {});
      
      chime.onended = () => {
        console.log("[Announcement] Chime ended, playing announcement");
        announcement.src = audioUrl;
        announcement.volume = volume;
        announcement.play().catch(() => {});
        
        announcement.onended = () => {
          console.log("[Announcement] Announcement ended, not resuming (radio was not playing)");
        };
      };
      return;
    }
    
    // Fade out de la musique sur 500ms
    const fadeOutInterval = setInterval(() => {
      if (music.volume > 0) {
        music.volume = Math.max(music.volume - 0.05, 0);
      } else {
        clearInterval(fadeOutInterval);
        music.pause();
        console.log("[Announcement] Music paused");
        
        // Jouer le chime
        chime.src = "/audio/sfx/chime.mp3";
        chime.volume = volume;
        chime.play().catch(() => {});
        console.log("[Announcement] Chime playing");
        
        // Après le chime, jouer l'annonce
        chime.onended = () => {
          console.log("[Announcement] Chime ended, playing announcement");
          announcement.src = audioUrl;
          announcement.volume = volume;
          announcement.play().catch(() => {});
          
          // Après l'annonce, reprendre la radio avec fade in
          announcement.onended = () => {
            console.log("[Announcement] Announcement ended, wasPlaying:", wasPlayingRef.current);
            if (wasPlayingRef.current) {
              console.log("[Announcement] Resuming music");
              // Reprendre exactement où on était
              music.src = currentSrc;
              music.currentTime = currentTime;
              music.volume = 0;
              music.play().then(() => {
                setIsPlaying(true);
                console.log("[Announcement] Music resumed");
                
                // Fade in sur 500ms
                const fadeInInterval = setInterval(() => {
                  if (music.volume < volume) {
                    music.volume = Math.min(music.volume + 0.05, volume);
                  } else {
                    clearInterval(fadeInInterval);
                    console.log("[Announcement] Fade in complete");
                  }
                }, 25);
              }).catch((err) => {
                console.error("[Announcement] Error resuming music:", err);
              });
            } else {
              console.log("[Announcement] Not resuming - wasPlaying was false");
            }
          };
        };
      }
    }, 25);
  }, [isPlaying, volume]);

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
