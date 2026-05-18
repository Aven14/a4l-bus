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
import { playAudioFile } from "@/lib/play-audio";
import { fetchRadioTracks } from "@/lib/radio-tracks";
import {
  getSyncedPosition,
  loadTracksWithDurations,
  type RadioTrackWithDuration,
} from "@/lib/radio-sync";
import { getPendingAnnouncements } from "@/actions/announcements";

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
  announcementError: string | null;
  radioReady: boolean;
  togglePlay: () => void;
  setVolume: (v: number) => void;
  queueAnnouncement: (audioPath: string, label: string) => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);

const MUSIC_FADE_MS = 500;
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
  const [announcementError, setAnnouncementError] = useState<string | null>(null);
  const [radioReady, setRadioReady] = useState(false);

  const queueRef = useRef<AnnouncementItem[]>([]);
  const processingRef = useRef(false);
  const volumeRef = useRef(0.6);
  const isPlayingRef = useRef(false);
  const audioUnlockedRef = useRef(false);
  const lastAnnouncementCheckRef = useRef<Date | null>(null);

  /** Débloque la lecture audio (politique navigateur — doit être appelé au clic) */
  const unlockAudio = useCallback(() => {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;
    for (const el of [musicRef.current, chimeRef.current, announceRef.current]) {
      if (!el) continue;
      const vol = el.volume;
      el.volume = 0.001;
      void el
        .play()
        .then(() => {
          el.pause();
          el.currentTime = 0;
          el.volume = el === musicRef.current ? volumeRef.current : vol;
        })
        .catch(() => {});
    }
  }, []);

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
    if (!music || tracks.length === 0 || processingRef.current) return;

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
    chimeRef.current.preload = "auto";
    announceRef.current = new Audio();
    announceRef.current.preload = "auto";
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
          if (tracks.length > 0 && isPlayingRef.current && !processingRef.current) {
            void applySyncPosition(true);
          }
        });
      }, PLAYLIST_REFRESH_MS);
    })();

    // Écouter les annonces broadcast via BroadcastChannel
    const channel = new BroadcastChannel("crossbus-announcements");
    
    channel.onmessage = (event) => {
      const { audioPath, label } = event.data;
      
      if (!audioUnlockedRef.current) {
        return;
      }
      
      // Ajouter à la file
      queueRef.current.push({ audioPath, label });
      
      // Traiter la file
      if (!processingRef.current) {
        processQueue();
      }
    };

    return () => {
      clearInterval(syncTimer);
      clearInterval(refreshTimer);
      channel.close();
      musicRef.current?.removeEventListener("ended", onEnded);
      musicRef.current?.pause();
      chimeRef.current?.pause();
      announceRef.current?.pause();
    };
  }, [applySyncPosition, loadPlaylist]);

  const togglePlay = useCallback(() => {
    unlockAudio();
    const music = musicRef.current;
    if (!music || isAnnouncing || tracksRef.current.length === 0) return;

    if (isPlayingRef.current) {
      music.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
    } else {
      void applySyncPosition(true);
    }
  }, [isAnnouncing, applySyncPosition, unlockAudio]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    volumeRef.current = clamped;
    setVolumeState(clamped);
    if (musicRef.current && !isAnnouncing) {
      musicRef.current.volume = clamped;
    }
    if (chimeRef.current) chimeRef.current.volume = clamped;
    if (announceRef.current) announceRef.current.volume = clamped;
  }, [isAnnouncing]);

  const processQueue = useCallback(() => {
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
    setAnnouncementError(null);

    const wasPlaying = isPlayingRef.current;
    const userVolume = volumeRef.current;

    // Lecture déclenchée sans await avant .play() (sinon le navigateur bloque après le clic)
    chime.src = CHIME_PATH;
    chime.currentTime = 0;
    chime.volume = userVolume;
    announce.src = item.audioPath;
    announce.load();
    announce.volume = userVolume;

    const chimePlay = chime.play();

    void (async () => {
      if (wasPlaying && !music.paused) {
        const fromVol = music.volume > 0 ? music.volume : userVolume;
        await fadeVolume(music, fromVol, 0, MUSIC_FADE_MS);
        music.pause();
      } else if (wasPlaying) {
        music.pause();
      }

      const chimeResult = await chimePlay
        .then(() => ({ ok: true as const }))
        .catch((err) => ({
          ok: false as const,
          error:
            err instanceof Error
              ? err.message
              : "Lecture du signal refusée — cliquez sur la radio puis réessayez",
        }));

      if (!chimeResult.ok) {
        // Signal optionnel : on continue quand même vers la voix
        console.warn("Chime:", chimeResult.error);
      } else {
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 3000);
          chime.onended = () => {
            clearTimeout(timer);
            resolve();
          };
          chime.onerror = () => {
            clearTimeout(timer);
            resolve();
          };
        });
        await new Promise((r) => setTimeout(r, CHIME_GAP_MS));
      }

      const announceResult = await playAudioFile(
        announce,
        item.audioPath,
        userVolume,
        60_000
      );

      if (!announceResult.ok) {
        setAnnouncementError(
          announceResult.error ??
            `Impossible de lire ${item.audioPath}. Ajoutez le MP3 dans public/audio/.`
        );
      }

      if (wasPlaying) {
        await applySyncPosition(true);
        const restored = musicRef.current;
        if (restored) {
          restored.volume = 0;
          await fadeVolume(restored, 0, userVolume, MUSIC_FADE_MS);
        }
      }

      setIsAnnouncing(false);
      setAnnouncementLabel(null);
      processingRef.current = false;

      if (queueRef.current.length > 0) processQueue();
    })();
  }, [applySyncPosition]);

  const queueAnnouncement = useCallback(
    (audioPath: string, label: string) => {
      unlockAudio();

      const announce = announceRef.current;
      const chime = chimeRef.current;
      if (announce) {
        announce.src = audioPath;
        announce.load();
      }
      if (chime) {
        chime.src = CHIME_PATH;
        chime.load();
      }

      queueRef.current.push({ audioPath, label });
      processQueue();
    },
    [processQueue, unlockAudio]
  );

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        volume,
        currentTrackTitle,
        isAnnouncing,
        announcementLabel,
        announcementError,
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
