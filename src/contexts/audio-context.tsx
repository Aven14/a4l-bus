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
  const broadcastRef = useRef<BroadcastChannel | null>(null);

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

  // Listen for master commands
  useEffect(() => {
    broadcastRef.current = new BroadcastChannel("crossbus-radio-master");
    
    broadcastRef.current.onmessage = (event) => {
      const { action, trackIndex, position, timestamp } = event.data;
      
      if (action === "master-started" && !isPlayingRef.current) {
        // Another tab is master, sync to it
        const music = musicRef.current;
        const tracks = tracksRef.current;
        
        if (music && tracks[trackIndex]) {
          const elapsed = (Date.now() - timestamp) / 1000;
          music.src = tracks[trackIndex].src;
          music.currentTime = elapsed;
          music.play().catch(() => {});
          setIsPlaying(true);
          isPlayingRef.current = true;
          setCurrentTrackTitle(tracks[trackIndex].title);
          trackIndexRef.current = trackIndex;
        }
      }
    };

    return () => {
      broadcastRef.current?.close();
    };
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
      } catch (error) {
        console.error("[Radio] Failed to load tracks:", error);
      }
    };

    loadTracks();
    return () => {
      mounted = false;
    };
  }, []);

  // NO polling - use BroadcastChannel for sync

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
      const track = tracks[0];
      music.src = track.src;
      music.currentTime = 0;
      setCurrentTrackTitle(track.title);

      await music.play();
      setIsPlaying(true);
      isPlayingRef.current = true;

      // Announce to other tabs that we're the master
      broadcastRef.current?.postMessage({
        action: "master-started",
        trackIndex: 0,
        position: 0,
        timestamp: Date.now(),
      });
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
