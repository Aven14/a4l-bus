"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CHIME_PATH, RADIO_TRACKS } from "@/lib/transport-data";

type AnnouncementItem = {
  audioPath: string;
  label: string;
};

type AudioContextValue = {
  isPlaying: boolean;
  volume: number;
  currentTrackIndex: number;
  currentTrackTitle: string;
  isAnnouncing: boolean;
  announcementLabel: string | null;
  togglePlay: () => void;
  setVolume: (v: number) => void;
  nextTrack: () => void;
  queueAnnouncement: (audioPath: string, label: string) => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);

const FADE_MS = 800;
const CHIME_GAP_MS = 200;

function fadeVolume(
  audio: HTMLAudioElement,
  from: number,
  to: number,
  durationMs: number
): Promise<void> {
  return new Promise((resolve) => {
    const steps = 20;
    const stepTime = durationMs / steps;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      audio.volume = from + (to - from) * progress;
      if (step >= steps) {
        clearInterval(interval);
        audio.volume = to;
        resolve();
      }
    }, stepTime);
  });
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const chimeRef = useRef<HTMLAudioElement | null>(null);
  const announceRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.6);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [announcementLabel, setAnnouncementLabel] = useState<string | null>(null);

  const queueRef = useRef<AnnouncementItem[]>([]);
  const processingRef = useRef(false);
  const volumeRef = useRef(0.6);

  useEffect(() => {
    musicRef.current = new Audio(RADIO_TRACKS[0].src);
    musicRef.current.loop = false;
    chimeRef.current = new Audio(CHIME_PATH);
    announceRef.current = new Audio();

    musicRef.current.volume = volume;
    volumeRef.current = volume;

    const onEnded = () => nextTrackInternal();
    musicRef.current.addEventListener("ended", onEnded);

    return () => {
      musicRef.current?.removeEventListener("ended", onEnded);
      musicRef.current?.pause();
      chimeRef.current?.pause();
      announceRef.current?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playTrack = useCallback((index: number) => {
    const music = musicRef.current;
    if (!music) return;
    music.src = RADIO_TRACKS[index].src;
    music.volume = volumeRef.current;
    music.play().catch(() => setIsPlaying(false));
    setIsPlaying(true);
  }, []);

  const nextTrackInternal = useCallback(() => {
    setTrackIndex((prev) => {
      const next = (prev + 1) % RADIO_TRACKS.length;
      playTrack(next);
      return next;
    });
  }, [playTrack]);

  const togglePlay = useCallback(() => {
    const music = musicRef.current;
    if (!music || isAnnouncing) return;

    if (isPlaying) {
      music.pause();
      setIsPlaying(false);
    } else {
      if (!music.src) playTrack(trackIndex);
      else {
        music.volume = volumeRef.current;
        music.play().catch(() => {});
      }
      setIsPlaying(true);
    }
  }, [isPlaying, isAnnouncing, playTrack, trackIndex]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    volumeRef.current = clamped;
    setVolumeState(clamped);
    if (musicRef.current && !isAnnouncing) {
      musicRef.current.volume = clamped;
    }
  }, [isAnnouncing]);

  const nextTrack = useCallback(() => {
    if (isAnnouncing) return;
    nextTrackInternal();
  }, [isAnnouncing, nextTrackInternal]);

  const processQueue = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) return;
    processingRef.current = true;

    const item = queueRef.current.shift()!;
    const music = musicRef.current;
    const chime = chimeRef.current;
    const announce = announceRef.current;

    if (!music || !chime || !announce) {
      processingRef.current = false;
      return;
    }

    setIsAnnouncing(true);
    setAnnouncementLabel(item.label);

    const wasPlaying = !music.paused;
    const savedVolume = volumeRef.current;

    if (wasPlaying) {
      await fadeVolume(music, savedVolume, 0.05, FADE_MS);
      music.pause();
    }

    try {
      chime.currentTime = 0;
      chime.volume = 0.9;
      await chime.play();
      await new Promise<void>((res) => {
        chime.onended = () => res();
        setTimeout(res, 2500);
      });
    } catch {
      /* chime optional */
    }

    await new Promise((r) => setTimeout(r, CHIME_GAP_MS));

    try {
      announce.src = item.audioPath;
      announce.volume = 1;
      await announce.play();
      await new Promise<void>((res) => {
        announce.onended = () => res();
        setTimeout(res, 15000);
      });
    } catch {
      /* announcement file may be missing */
    }

    if (wasPlaying) {
      music.volume = 0.05;
      music.play().catch(() => {});
      await fadeVolume(music, 0.05, savedVolume, FADE_MS);
    }

    setIsAnnouncing(false);
    setAnnouncementLabel(null);
    processingRef.current = false;

    if (queueRef.current.length > 0) {
      void processQueue();
    }
  }, []);

  const queueAnnouncement = useCallback(
    (audioPath: string, label: string) => {
      queueRef.current.push({ audioPath, label });
      void processQueue();
    },
    [processQueue]
  );

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        volume,
        currentTrackIndex: trackIndex,
        currentTrackTitle: RADIO_TRACKS[trackIndex]?.title ?? "Cross Track Bus Radio",
        isAnnouncing,
        announcementLabel,
        togglePlay,
        setVolume,
        nextTrack,
        queueAnnouncement,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}
