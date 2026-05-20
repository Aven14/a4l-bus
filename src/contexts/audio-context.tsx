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
  playRadio: () => void;
  pauseRadio: () => void;
  playAnnouncement: (
    audioUrl: string,
    label: string,
    callback?: () => void
  ) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

let globalMusic: HTMLAudioElement | null = null;
let globalTracks: RadioTrackConfig[] = [];
let globalIsPlaying = false;
let globalIsAnnouncing = false;

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackTitle, setCurrentTrackTitle] = useState<string | null>(
    null
  );
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "error">(
    "idle"
  );

  const musicRef = useRef<HTMLAudioElement | null>(null);
  const tracksRef = useRef<RadioTrackConfig[]>([]);
  const trackIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const processingRef = useRef(false);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (!musicRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      musicRef.current = audio;
      globalMusic = audio;

      audio.addEventListener("ended", handleTrackEnded);
    }

    return () => {
      if (musicRef.current) {
        musicRef.current.removeEventListener("ended", handleTrackEnded);
      }
    };
  }, []);

  // Load tracks
  useEffect(() => {
    let mounted = true;

    const loadTracks = async () => {
      try {
        const tracks = await fetchRadioTracks();
        if (!mounted || tracks.length === 0) return;

        tracksRef.current = tracks;
        globalTracks = tracks;

        console.log(`[Radio] ${tracks.length} tracks loaded`);
      } catch (error) {
        console.error("[Radio] Failed to load tracks:", error);
      }
    };

    loadTracks();
    return () => {
      mounted = false;
    };
  }, []);

  // Server sync - check radio state every 2 seconds
  useEffect(() => {
    if (!isPlaying) {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      return;
    }

    setSyncStatus("syncing");

    syncIntervalRef.current = setInterval(async () => {
      if (processingRef.current || globalIsAnnouncing) return;

      try {
        const res = await fetch("/api/radio/sync", { cache: "no-store" });
        if (!res.ok) return;

        const serverState = await res.json();
        const music = musicRef.current;
        const tracks = tracksRef.current;

        if (!music || tracks.length === 0) return;

        // If server track is different, switch
        if (serverState.trackIndex !== trackIndexRef.current) {
          const newTrack = tracks[serverState.trackIndex];
          if (newTrack) {
            trackIndexRef.current = serverState.trackIndex;
            music.src = newTrack.src;
            music.currentTime = 0;
            if (isPlayingRef.current) {
              music.play().catch(() => {});
            }
            setCurrentTrackTitle(newTrack.title);
          }
          return;
        }

        // Sync position if difference > 3 seconds
        const timeDiff = Math.abs(music.currentTime - serverState.position);
        if (timeDiff > 3 && serverState.position > 0) {
          music.currentTime = serverState.position;
        }

        setSyncStatus("idle");
      } catch (error) {
        console.error("[Radio] Sync error:", error);
        setSyncStatus("error");
      }
    }, 2000);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [isPlaying]);

  const handleTrackEnded = useCallback(() => {
    if (processingRef.current || globalIsAnnouncing) return;

    const tracks = tracksRef.current;
    const music = musicRef.current;
    if (!music || tracks.length === 0) return;

    const nextIndex = (trackIndexRef.current + 1) % tracks.length;
    trackIndexRef.current = nextIndex;

    const nextTrack = tracks[nextIndex];
    music.src = nextTrack.src;

    // Update server state
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
  }, []);

  const playRadio = useCallback(async () => {
    const music = musicRef.current;
    const tracks = tracksRef.current;

    if (!music || tracks.length === 0) {
      console.warn("[Radio] No tracks loaded yet");
      return;
    }

    processingRef.current = true;
    isPlayingRef.current = true;
    globalIsPlaying = true;

    try {
      // Get current server state
      const res = await fetch("/api/radio/sync", { cache: "no-store" });
      if (res.ok) {
        const serverState = await res.json();
        trackIndexRef.current = serverState.trackIndex || 0;

        const track = tracks[trackIndexRef.current];
        if (track) {
          music.src = track.src;
          music.currentTime = serverState.position || 0;
          setCurrentTrackTitle(track.title);
        }

        // Mark as playing on server
        await fetch("/api/radio/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPlaying: true }),
        });
      } else {
        // Fallback: start from beginning
        const track = tracks[0];
        music.src = track.src;
        music.currentTime = 0;
        setCurrentTrackTitle(track.title);
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
    globalIsPlaying = false;

    // Save position to server
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

      globalIsAnnouncing = true;
      setIsAnnouncing(true);

      // Save current position
      const currentPosition = music.currentTime;
      const wasPlaying = !music.paused;

      try {
        music.pause();

        // Pause on server
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
            globalIsAnnouncing = false;
            setIsAnnouncing(false);
            if (wasPlaying && globalIsPlaying) {
              playRadio();
            }
          }
        }, { once: true });

        tempAudio.addEventListener(
          "ended",
          async () => {
            globalIsAnnouncing = false;
            setIsAnnouncing(false);
            callback?.();

            // Resume music if it was playing
            if (wasPlaying && globalIsPlaying) {
              await playRadio();
            }
          },
          { once: true }
        );
      } catch (error) {
        console.error("[Announcement] Error:", error);
        globalIsAnnouncing = false;
        setIsAnnouncing(false);
        if (wasPlaying && globalIsPlaying) {
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
