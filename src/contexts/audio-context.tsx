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
import { CHIME_PATH } from "@/lib/transport-data";
import { fetchRadioTracks } from "@/lib/radio-tracks";
import {
  getSyncedPosition,
  loadTracksWithDurations,
  type RadioTrackWithDuration,
} from "@/lib/radio-sync";

type AnnouncementItem = {
  audioPath: string;
  label: string;
};

type AudioContextValue = {
  isPlaying: boolean;
  volume: number;
  currentTrackTitle: string;
  isAnnouncing: boolean;
  announcementLabel: string | null;
  radioReady: boolean;
  togglePlay: () => void;
  setVolume: (v: number) => void;
  queueAnnouncement: (audioPath: string, label: string) => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);

const FADE_MS = 800;
const CHIME_GAP_MS = 200;
const SYNC_INTERVAL_MS = 8000;
const PLAYLIST_REFRESH_MS = 60_000;

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
  const tracksRef = useRef<RadioTrackWithDuration[]>([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.6);
  const [trackIndex, setTrackIndex] = useState(0);
  const [currentTrackTitle, setCurrentTrackTitle] = useState("Cross Track Bus Radio");
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [announcementLabel, setAnnouncementLabel] = useState<string | null>(null);
  const [radioReady, setRadioReady] = useState(false);

  const queueRef = useRef<AnnouncementItem[]>([]);
  const processingRef = useRef(false);
  const volumeRef = useRef(0.6);
  const isPlayingRef = useRef(false);

  const loadPlaylist = useCallback(async () => {
    const config = await fetchRadioTracks();
    const loaded = await loadTracksWithDurations(config);
    tracksRef.current = loaded;
    setRadioReady(loaded.length > 0);
    if (loaded.length > 0) {
      const { trackIndex: idx } = getSyncedPosition(loaded);
      setCurrentTrackTitle(loaded[idx]?.title ?? loaded[0].title);
    }
    return loaded;
  }, []);

  const applySyncPosition = useCallback(async (play = false) => {
    const music = musicRef.current;
    const tracks = tracksRef.current;
    if (!music || tracks.length === 0) return;

    const { trackIndex: idx, offsetSeconds } = getSyncedPosition(tracks);
    const track = tracks[idx];
    if (!track) return;

    if (!music.src.endsWith(track.src)) {
      music.src = track.src;
      music.load();
    }

    const seek = () => {
      if (offsetSeconds > 0 && offsetSeconds < track.duration - 1) {
        music.currentTime = offsetSeconds;
      }
      setTrackIndex(idx);
      setCurrentTrackTitle(track.title);
      if (play) {
        music.volume = volumeRef.current;
        music.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
        isPlayingRef.current = true;
      }
    };

    if (music.readyState >= 1) seek();
    else music.onloadedmetadata = seek;
  }, []);

  useEffect(() => {
    musicRef.current = new Audio();
    musicRef.current.loop = false;
    chimeRef.current = new Audio(CHIME_PATH);
    announceRef.current = new Audio();
    musicRef.current.volume = volume;
    volumeRef.current = volume;

    const onEnded = () => {
      if (isPlayingRef.current && !processingRef.current) {
        void applySyncPosition(true);
      }
    };
    musicRef.current.addEventListener("ended", onEnded);

    let syncTimer: ReturnType<typeof setInterval>;
    let refreshTimer: ReturnType<typeof setInterval>;

    (async () => {
      const loaded = await loadPlaylist();
      if (loaded.length > 0) {
        await applySyncPosition(false);
        syncTimer = setInterval(() => {
          if (isPlayingRef.current && !processingRef.current) {
            void applySyncPosition(true);
          }
        }, SYNC_INTERVAL_MS);
      }

      refreshTimer = setInterval(() => {
        void loadPlaylist().then((tracks) => {
          if (tracks.length > 0 && isPlayingRef.current) {
            void applySyncPosition(true);
          }
        });
      }, PLAYLIST_REFRESH_MS);
    })();

    return () => {
      clearInterval(syncTimer);
      clearInterval(refreshTimer);
      musicRef.current?.removeEventListener("ended", onEnded);
      musicRef.current?.pause();
      chimeRef.current?.pause();
      announceRef.current?.pause();
    };
  }, [applySyncPosition, loadPlaylist]);

  const togglePlay = useCallback(() => {
    const music = musicRef.current;
    if (!music || isAnnouncing || tracksRef.current.length === 0) return;

    if (isPlayingRef.current) {
      music.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
    } else {
      void applySyncPosition(true);
    }
  }, [isAnnouncing, applySyncPosition]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    volumeRef.current = clamped;
    setVolumeState(clamped);
    if (musicRef.current && !isAnnouncing) {
      musicRef.current.volume = clamped;
    }
  }, [isAnnouncing]);

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

    const wasPlaying = isPlayingRef.current;
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
      /* optional */
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
      /* optional */
    }

    if (wasPlaying) {
      await applySyncPosition(true);
      await fadeVolume(music, 0.05, savedVolume, FADE_MS);
    }

    setIsAnnouncing(false);
    setAnnouncementLabel(null);
    processingRef.current = false;

    if (queueRef.current.length > 0) void processQueue();
  }, [applySyncPosition]);

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
        currentTrackTitle,
        isAnnouncing,
        announcementLabel,
        radioReady,
        togglePlay,
        setVolume,
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
