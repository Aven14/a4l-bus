"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { fetchRadioTracks } from "@/lib/radio-tracks";
import type { RadioTrackConfig } from "@/lib/radio-sync";

interface AudioContextType {
  isPlaying: boolean;
  currentTrackTitle: string | null;
  isAnnouncing: boolean;
  announcementLabel: string | null;
  announcementError: string | null;
  volume: number;
  setVolume: (vol: number) => void;
  playRadio: () => void;
  pauseRadio: () => void;
  playAnnouncement: (
    audioUrl: string,
    label: string,
    callback?: () => void
  ) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackTitle, setCurrentTrackTitle] = useState<string | null>(null);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [announcementLabel, setAnnouncementLabel] = useState<string | null>(null);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);

  const musicRef = useRef<HTMLAudioElement | null>(null);
  // Set volume on music element when it changes
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = volume;
    }
  }, [volume]);

  const tracksRef = useRef<RadioTrackConfig[]>([]);
  const trackIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const isAnnouncingRef = useRef(false);
  const processingRef = useRef(false);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (!musicRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      musicRef.current = audio;

      const onEnded = () => {
        if (processingRef.current || isAnnouncingRef.current) return;

        const tracks = tracksRef.current;
        const music = musicRef.current;
        if (!music || tracks.length === 0) return;

        const nextIndex = (trackIndexRef.current + 1) % tracks.length;
        trackIndexRef.current = nextIndex;

        const nextTrack = tracks[nextIndex];
        music.src = nextTrack.src;

        fetch("/api/radio/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackIndex: nextIndex,
            position: 0,
            isPlaying: true,
          }),
        }).catch(() => {});

        music
          .play()
          .then(() => {
            setCurrentTrackTitle(nextTrack.title);
          })
          .catch(() => {});
      };

      audio.addEventListener("ended", onEnded);
    }
  }, []);

  // Load tracks and auto-start if radio is already playing
  useEffect(() => {
    let mounted = true;

    const loadTracks = async () => {
      try {
        const tracks = await fetchRadioTracks();
        if (!mounted || tracks.length === 0) return;

        tracksRef.current = tracks;
        console.log(`[Radio] ${tracks.length} tracks loaded`);

        // Check if radio is already playing on server
        const res = await fetch("/api/radio/heartbeat", { cache: "no-store" });
        if (res.ok) {
          const serverState = await res.json();
          
          // If radio is playing, auto-start for this client
          if (serverState.playing) {
            const music = musicRef.current;
            if (!music) return;

            trackIndexRef.current = serverState.trackIndex || 0;
            const track = tracks[trackIndexRef.current];
            
            if (track) {
              music.src = track.src;
              music.currentTime = serverState.position;
              setCurrentTrackTitle(track.title);
              
              // Auto-play
              try {
                await music.play();
                setIsPlaying(true);
                isPlayingRef.current = true;
                console.log("[Radio] Auto-started, synced to server");
              } catch (error) {
                console.log("[Radio] Auto-play blocked by browser, waiting for user interaction");
              }
            }
          }
        }
      } catch (error) {
        console.error("[Radio] Failed to load tracks:", error);
      }
    };

    loadTracks();
    return () => {
      mounted = false;
    };
  }, []);

  // NO polling - heartbeat handles sync

  const playRadio = useCallback(async () => {
    const music = musicRef.current;
    const tracks = tracksRef.current;

    if (!music || tracks.length === 0) {
      console.warn("[Radio] No tracks loaded yet");
      return;
    }

    processingRef.current = true;
    isPlayingRef.current = true;

    try {
      // Just start playing - heartbeat already initialized the radio
      const res = await fetch("/api/radio/heartbeat", { cache: "no-store" });
      
      if (res.ok) {
        const serverState = await res.json();
        
        if (serverState.playing) {
          trackIndexRef.current = serverState.trackIndex || 0;
          const track = tracks[trackIndexRef.current];
          
          if (track) {
            music.src = track.src;
            music.currentTime = serverState.position;
            setCurrentTrackTitle(track.title);
          }
        } else {
          // Start from beginning
          trackIndexRef.current = 0;
          const track = tracks[0];
          music.src = track.src;
          music.currentTime = 0;
          setCurrentTrackTitle(track.title);
        }
      }

      await music.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("[Radio] Failed to play:", error);
    } finally {
      processingRef.current = false;
    }
  }, []);

  const pauseRadio = useCallback(async () => {
    const music = musicRef.current;
    if (!music) return;

    processingRef.current = true;
    isPlayingRef.current = false;

    if (tracksRef.current.length > 0) {
      fetch("/api/radio/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: music.currentTime,
          isPlaying: false,
        }),
      }).catch(() => {});
    }

    music.pause();
    setIsPlaying(false);
    processingRef.current = false;
  }, []);

  const playAnnouncement = useCallback(
    async (audioUrl: string, label: string, callback?: () => void) => {
      const music = musicRef.current;
      if (!music) return;

      isAnnouncingRef.current = true;
      setIsAnnouncing(true);
      setAnnouncementLabel(label);
      setAnnouncementError(null);

      const currentPosition = music.currentTime;
      const wasPlaying = !music.paused;

      try {
        music.pause();

        await fetch("/api/radio/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            position: currentPosition,
            isPlaying: false,
          }),
        }).catch(() => {});

        const tempAudio = new Audio(audioUrl);
        tempAudio.preload = "auto";

        tempAudio.addEventListener("canplaythrough", async () => {
          try {
            await tempAudio.play();
          } catch (err) {
            console.error("[Announcement] Failed to play:", err);
            isAnnouncingRef.current = false;
            setIsAnnouncing(false);
            setAnnouncementLabel(null);
            if (wasPlaying && isPlayingRef.current) {
              playRadio();
            }
          }
        }, { once: true });

        tempAudio.addEventListener("ended", async () => {
          isAnnouncingRef.current = false;
          setIsAnnouncing(false);
          setAnnouncementLabel(null);
          callback?.();

          if (wasPlaying && isPlayingRef.current) {
            await playRadio();
          }
        }, { once: true });
      } catch (error) {
        console.error("[Announcement] Error:", error);
        isAnnouncingRef.current = false;
        setIsAnnouncing(false);
        setAnnouncementError("Erreur lors de l'annonce");
        setAnnouncementLabel(null);
        if (wasPlaying && isPlayingRef.current) {
          playRadio();
        }
      }
    },
    [playRadio]
  );

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        currentTrackTitle,
        isAnnouncing,
        announcementLabel,
        announcementError,
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
