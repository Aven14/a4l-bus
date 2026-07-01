"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { fadeInAudio, fadeOutAudio } from "@/lib/audio-fade";
import {
  readStoredVolume,
  writeStoredVolume,
} from "@/lib/radio-preferences";

type SyncedRadioState = {
  trackIndex: number;
  position: number;
  track: string | null;
  tracks: string[];
  isPlaying: boolean;
  revision: number;
};

type LiveAnnouncementPayload = {
  id: string;
  audioUrl: string;
  label: string;
  createdAt: string;
};

interface AudioContextType {
  isPlaying: boolean;
  currentTrackTitle: string | null;
  playbackCurrent: number;
  playbackDuration: number;
  volume: number;
  setVolume: (vol: number) => void;
  playRadio: () => void;
  pauseRadio: () => void;
  playAnnouncement: (audioUrl: string, label: string) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

const SYNC_INTERVAL_MS = 2000;
const ANNOUNCEMENT_POLL_MS = 1500;
const DRIFT_THRESHOLD_S = 1.5;
const FADE_MS = 500;

function trackTitle(filename: string | null) {
  return filename ? filename.replace(/\.mp3$/i, "") : null;
}

function trackSrc(filename: string) {
  return `/audio/music/${encodeURIComponent(filename)}`;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackTitle, setCurrentTrackTitle] = useState<string | null>(
    null
  );
  const [volume, setVolumeState] = useState(() => readStoredVolume(0.5));
  const [playbackCurrent, setPlaybackCurrent] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const musicRef = useRef<HTMLAudioElement | null>(null);
  const announcementRef = useRef<HTMLAudioElement | null>(null);
  const chimeRef = useRef<HTMLAudioElement | null>(null);

  const userWantsRadioRef = useRef(false);
  const lastRevisionRef = useRef<number | null>(null);
  const syncInFlightRef = useRef(false);
  const isFadingRef = useRef(false);
  const shouldFadeInRef = useRef(false);
  const musicPausedForAnnouncementRef = useRef(false);

  const announcementQueueRef = useRef<LiveAnnouncementPayload[]>([]);
  const playedAnnouncementIdsRef = useRef<Set<string>>(new Set());
  const isPlayingAnnouncementRef = useRef(false);
  const lastPollAfterRef = useRef(new Date(0).toISOString());

  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const syncWithServerRef = useRef<() => Promise<void>>(async () => {});

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.min(1, Math.max(0, vol));
    setVolumeState(clamped);
    writeStoredVolume(clamped);
  }, []);

  const updatePlaybackProgress = useCallback(() => {
    const music = musicRef.current;
    if (!music) return;

    setPlaybackCurrent(music.currentTime || 0);

    if (music.duration && Number.isFinite(music.duration)) {
      setPlaybackDuration(music.duration);
    }
  }, []);

  useEffect(() => {
    const music = musicRef.current;
    const announcement = announcementRef.current;
    const chime = chimeRef.current;

    if (music && !isFadingRef.current && !isPlayingAnnouncementRef.current) {
      music.volume = volume;
    }
    if (announcement) announcement.volume = volume;
    if (chime) chime.volume = volume;
  }, [volume]);

  const pauseMusicWithFade = useCallback(async () => {
    const music = musicRef.current;
    if (!music || music.paused || !music.src) return;

    if (isFadingRef.current) return;

    isFadingRef.current = true;
    musicPausedForAnnouncementRef.current = true;

    try {
      await fadeOutAudio(music, FADE_MS);
    } finally {
      isFadingRef.current = false;
    }
  }, []);

  const playAnnouncementSequence = useCallback(
    (audioUrl: string) =>
      new Promise<void>((resolve) => {
        const chime = chimeRef.current;
        const announcement = announcementRef.current;
        if (!announcement) {
          resolve();
          return;
        }

        const playAnnouncementAudio = async () => {
          announcement.src = audioUrl;
          announcement.volume = 0;

          try {
            await announcement.play();
            await fadeInAudio(announcement, volumeRef.current, FADE_MS);
          } catch {
            resolve();
            return;
          }

          announcement.onended = async () => {
            await fadeOutAudio(announcement, FADE_MS);
            resolve();
          };
        };

        if (!chime) {
          void playAnnouncementAudio();
          return;
        }

        chime.src = "/audio/sfx/chime.mp3";
        chime.volume = volumeRef.current;
        chime.onended = () => {
          void playAnnouncementAudio();
        };
        chime.play().catch(() => {
          void playAnnouncementAudio();
        });
      }),
    []
  );

  const processAnnouncementQueue = useCallback(async () => {
    if (isPlayingAnnouncementRef.current) return;

    const next = announcementQueueRef.current.shift();
    if (!next) return;

    isPlayingAnnouncementRef.current = true;

    try {
      await pauseMusicWithFade();
      await playAnnouncementSequence(next.audioUrl);

      if (!next.id.startsWith("local-")) {
        await fetch(`/api/announcements/${next.id}/complete`, {
          method: "POST",
        });
      }

      playedAnnouncementIdsRef.current.add(next.id);
    } catch (error) {
      console.error("[Announcement queue error]:", error);
    } finally {
      isPlayingAnnouncementRef.current = false;

      if (announcementQueueRef.current.length > 0) {
        void processAnnouncementQueue();
      } else {
        shouldFadeInRef.current = true;
        void syncWithServerRef.current();
      }
    }
  }, [pauseMusicWithFade, playAnnouncementSequence]);

  const pollAnnouncements = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/announcements?after=${encodeURIComponent(lastPollAfterRef.current)}`,
        { cache: "no-store" }
      );
      if (!response.ok) return;

      const data = await response.json();
      const announcements: LiveAnnouncementPayload[] = data.announcements ?? [];

      for (const announcement of announcements) {
        if (playedAnnouncementIdsRef.current.has(announcement.id)) continue;

        announcementQueueRef.current.push(announcement);

        if (announcement.createdAt > lastPollAfterRef.current) {
          lastPollAfterRef.current = announcement.createdAt;
        }
      }

      void processAnnouncementQueue();
    } catch (error) {
      console.error("[Announcement poll error]:", error);
    }
  }, [processAnnouncementQueue]);

  const applySyncedState = useCallback(async (state: SyncedRadioState) => {
    const music = musicRef.current;
    if (!music || isFadingRef.current) return;

    if (state.track) {
      setCurrentTrackTitle(trackTitle(state.track));
    }

    if (!userWantsRadioRef.current) {
      setIsPlaying(false);
      return;
    }

    const announcementActive =
      isPlayingAnnouncementRef.current ||
      announcementQueueRef.current.length > 0;

    if (!state.isPlaying || !state.track || announcementActive) {
      if (!music.paused && music.src) {
        await pauseMusicWithFade();
      } else if (!music.paused) {
        music.pause();
      }
      setIsPlaying(false);
      return;
    }

    const expectedSrc = trackSrc(state.track);
    const currentFilename = decodeURIComponent(
      music.src.split("/").pop() || ""
    );

    if (currentFilename !== state.track || !music.src) {
      music.src = expectedSrc;
      music.load();
    }

    const drift = Math.abs(music.currentTime - state.position);
    if (drift > DRIFT_THRESHOLD_S) {
      music.currentTime = state.position;
    }

    updatePlaybackProgress();

    if (music.paused) {
      const useFadeIn =
        shouldFadeInRef.current || musicPausedForAnnouncementRef.current;

      shouldFadeInRef.current = false;
      musicPausedForAnnouncementRef.current = false;

      if (useFadeIn) {
        isFadingRef.current = true;
        try {
          await fadeInAudio(music, volumeRef.current, FADE_MS);
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        } finally {
          isFadingRef.current = false;
        }
        return;
      }

      music.volume = volumeRef.current;
      try {
        await music.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    } else {
      music.volume = volumeRef.current;
      setIsPlaying(true);
    }
  }, [pauseMusicWithFade, updatePlaybackProgress]);

  const syncWithServer = useCallback(async () => {
    if (syncInFlightRef.current || isFadingRef.current) return;
    syncInFlightRef.current = true;

    try {
      const response = await fetch("/api/radio/sync", { cache: "no-store" });
      if (!response.ok) return;

      const state: SyncedRadioState = await response.json();
      const revisionChanged =
        lastRevisionRef.current !== null &&
        lastRevisionRef.current !== state.revision;

      lastRevisionRef.current = state.revision;
      await applySyncedState(state);

      if (revisionChanged && userWantsRadioRef.current) {
        await applySyncedState(state);
      }
    } catch (error) {
      console.error("[Radio sync error]:", error);
    } finally {
      syncInFlightRef.current = false;
    }
  }, [applySyncedState]);

  syncWithServerRef.current = syncWithServer;

  useEffect(() => {
    let music = musicRef.current;

    if (!music) {
      music = new Audio();
      music.preload = "auto";
      musicRef.current = music;

      music.addEventListener("ended", () => {
        void syncWithServer();
      });

      music.addEventListener("timeupdate", updatePlaybackProgress);
      music.addEventListener("loadedmetadata", updatePlaybackProgress);
      music.addEventListener("durationchange", updatePlaybackProgress);
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

    void syncWithServer();
    void pollAnnouncements();

    const syncInterval = setInterval(() => {
      void syncWithServer();
    }, SYNC_INTERVAL_MS);

    const announcementInterval = setInterval(() => {
      void pollAnnouncements();
    }, ANNOUNCEMENT_POLL_MS);

    return () => {
      clearInterval(syncInterval);
      clearInterval(announcementInterval);
    };
  }, [syncWithServer, pollAnnouncements, updatePlaybackProgress]);

  const playRadio = useCallback(async () => {
    userWantsRadioRef.current = true;
    await syncWithServer();
  }, [syncWithServer]);

  const pauseRadio = useCallback(() => {
    userWantsRadioRef.current = false;
    shouldFadeInRef.current = false;
    musicPausedForAnnouncementRef.current = false;

    const music = musicRef.current;
    if (music) {
      music.pause();
      updatePlaybackProgress();
    }
    setIsPlaying(false);
  }, [updatePlaybackProgress]);

  const playAnnouncement = useCallback(
    (audioUrl: string, _label: string) => {
      announcementQueueRef.current.push({
        id: `local-${Date.now()}`,
        audioUrl,
        label: _label,
        createdAt: new Date().toISOString(),
      });
      void processAnnouncementQueue();
    },
    [processAnnouncementQueue]
  );

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        currentTrackTitle,
        playbackCurrent,
        playbackDuration,
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
