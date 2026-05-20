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
import { loadTracksWithDurations } from "@/lib/radio-sync";
import type { RadioTrackConfig, RadioTrackWithDuration } from "@/lib/radio-sync";

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
  const tracksRef = useRef<RadioTrackWithDuration[]>([]);
  const trackIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const isAnnouncingRef = useRef(false);
  const processingRef = useRef(false);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const trackDurationsRef = useRef<number[]>([]);

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

      const onEnded = () => {
        // Track ended - wait for server sync to update track
        // The server will calculate the new position based on time
      };

      audio.addEventListener("ended", onEnded);
    }
  }, []);

  // Sync with server periodically
  const syncToServer = useCallback(async () => {
    if (processingRef.current || isAnnouncingRef.current) return;

    try {
      const durations = trackDurationsRef.current;
      const durationsParam = durations.length > 0 ? JSON.stringify(durations) : "";
      
      const response = await fetch(`/api/radio/sync?durations=${encodeURIComponent(durationsParam)}`);
      if (!response.ok) return;

      const state = await response.json();
      const music = musicRef.current;
      const tracks = tracksRef.current;

      if (!music || tracks.length === 0) return;

      // Sync to server state
      if (state.isPlaying) {
        const targetTrack = tracks[state.trackIndex];
        if (targetTrack && music.src !== targetTrack.src) {
          music.src = targetTrack.src;
          setCurrentTrackTitle(targetTrack.title);
          trackIndexRef.current = state.trackIndex;
        }
        
        // Sync position (with tolerance to avoid jitter)
        if (Math.abs(music.currentTime - state.position) > 1) {
          music.currentTime = state.position;
        }
        
        if (music.paused && isPlayingRef.current) {
          music.play().catch(() => {});
        } else if (!music.paused && !isPlayingRef.current) {
          music.pause();
        }
        
        setIsPlaying(true);
        isPlayingRef.current = true;
      } else {
        // Server says paused
        music.pause();
        setIsPlaying(false);
        isPlayingRef.current = false;
      }
    } catch (error) {
      console.error("[Radio] Sync error:", error);
    }
  }, []);

  // Load tracks with durations
  useEffect(() => {
    let mounted = true;

    const loadTracks = async () => {
      try {
        const tracks = await fetchRadioTracks();
        if (!mounted || tracks.length === 0) return;

        const tracksWithDurations = await loadTracksWithDurations(tracks);
        if (!mounted) return;

        tracksRef.current = tracksWithDurations;
        trackDurationsRef.current = tracksWithDurations.map(t => t.duration);
        console.log(`[Radio] ${tracksWithDurations.length} tracks loaded with durations`);
        
        // After loading tracks, sync with server
        syncToServer();
      } catch (error) {
        console.error("[Radio] Failed to load tracks:", error);
      }
    };

    loadTracks();
    return () => {
      mounted = false;
    };
  }, [syncToServer]);

  // Start polling for sync
  useEffect(() => {
    // Poll every 2 seconds
    syncIntervalRef.current = setInterval(() => {
      syncToServer();
    }, 2000);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncToServer]);

  const playRadio = useCallback(async () => {
    const music = musicRef.current;
    const tracks = tracksRef.current;

    if (!music || tracks.length === 0) {
      console.warn("[Radio] No tracks loaded yet");
      return;
    }

    processingRef.current = true;

    try {
      // Tell server to start playing
      await fetch("/api/radio/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackIndex: 0,
          position: 0,
          isPlaying: true,
          startedAt: Date.now(),
        }),
      });

      // Sync immediately to get the correct state
      await syncToServer();
    } catch (error) {
      console.error("[Radio] Failed to play:", error);
    } finally {
      processingRef.current = false;
    }
  }, [syncToServer]);

  const pauseRadio = useCallback(async () => {
    const music = musicRef.current;
    if (!music) return;

    processingRef.current = true;
    isPlayingRef.current = false;

    music.pause();
    setIsPlaying(false);

    // Tell server to pause
    await fetch("/api/radio/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        position: music.currentTime,
        isPlaying: false,
        startedAt: null,
      }),
    }).catch(() => {});

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

        // Tell server to pause
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
            if (wasPlaying) {
              playRadio();
            }
          }
        }, { once: true });

        tempAudio.addEventListener("ended", async () => {
          isAnnouncingRef.current = false;
          setIsAnnouncing(false);
          setAnnouncementLabel(null);
          callback?.();

          if (wasPlaying) {
            await playRadio();
          }
        }, { once: true });
      } catch (error) {
        console.error("[Announcement] Error:", error);
        isAnnouncingRef.current = false;
        setIsAnnouncing(false);
        setAnnouncementError("Erreur lors de l'annonce");
        setAnnouncementLabel(null);
        if (wasPlaying) {
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
