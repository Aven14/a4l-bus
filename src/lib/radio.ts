import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export const RADIO_STATE_ID = "default-radio-state";
export const DEFAULT_TRACK_DURATION = 180;

export type ComputedRadioState = {
  trackIndex: number;
  position: number;
  track: string | null;
  tracks: string[];
  isPlaying: boolean;
  revision: number;
};

export function getMusicTracks(): string[] {
  const musicDir = path.join(process.cwd(), "public", "audio", "music");
  if (!fs.existsSync(musicDir)) return [];

  return fs
    .readdirSync(musicDir)
    .filter((file) => file.endsWith(".mp3") && file !== ".gitkeep")
    .sort((a, b) => a.localeCompare(b, "fr"));
}

export function getTrackDuration(): number {
  return DEFAULT_TRACK_DURATION;
}

function advanceTrack(
  trackIndex: number,
  position: number,
  totalTracks: number,
  duration: number
) {
  let idx = trackIndex;
  let pos = position;

  while (totalTracks > 0 && pos >= duration) {
    pos -= duration;
    idx = (idx + 1) % totalTracks;
  }

  return { trackIndex: idx, position: pos };
}

function computeFromRawState(
  trackIndex: number,
  position: number,
  isPlaying: boolean,
  startedAt: bigint | null,
  tracks: string[]
): { trackIndex: number; position: number } {
  if (tracks.length === 0) {
    return { trackIndex: 0, position: 0 };
  }

  const idx = trackIndex % tracks.length;
  let pos = position;
  const duration = getTrackDuration();

  if (isPlaying && startedAt != null) {
    const elapsed = (Date.now() - Number(startedAt)) / 1000;
    pos += elapsed;
  }

  return advanceTrack(idx, pos, tracks.length, duration);
}

export async function ensureRadioState() {
  const existing = await prisma.radioState.findUnique({
    where: { id: RADIO_STATE_ID },
  });

  if (existing) return existing;

  const now = BigInt(Date.now());
  return prisma.radioState.create({
    data: {
      id: RADIO_STATE_ID,
      trackIndex: 0,
      position: 0,
      isPlaying: true,
      startedAt: now,
      lastSync: new Date(),
    },
  });
}

export async function getComputedRadioState(): Promise<ComputedRadioState> {
  const tracks = getMusicTracks();
  const state = await ensureRadioState();

  if (tracks.length === 0) {
    return {
      trackIndex: 0,
      position: 0,
      track: null,
      tracks,
      isPlaying: false,
      revision: state.lastSync.getTime(),
    };
  }

  const computed = computeFromRawState(
    state.trackIndex,
    state.position,
    state.isPlaying,
    state.startedAt,
    tracks
  );

  return {
    trackIndex: computed.trackIndex,
    position: computed.position,
    track: tracks[computed.trackIndex] ?? null,
    tracks,
    isPlaying: state.isPlaying,
    revision: state.lastSync.getTime(),
  };
}

export async function persistComputedState() {
  const tracks = getMusicTracks();
  const state = await ensureRadioState();
  const computed = computeFromRawState(
    state.trackIndex,
    state.position,
    state.isPlaying,
    state.startedAt,
    tracks
  );

  await prisma.radioState.update({
    where: { id: RADIO_STATE_ID },
    data: {
      trackIndex: computed.trackIndex,
      position: computed.position,
      startedAt: state.isPlaying ? BigInt(Date.now()) : null,
      lastSync: new Date(),
    },
  });
}

export async function pauseRadioForAnnouncement() {
  const tracks = getMusicTracks();
  const state = await ensureRadioState();
  const computed = computeFromRawState(
    state.trackIndex,
    state.position,
    state.isPlaying,
    state.startedAt,
    tracks
  );

  await prisma.radioState.update({
    where: { id: RADIO_STATE_ID },
    data: {
      trackIndex: computed.trackIndex,
      position: computed.position,
      isPlaying: false,
      startedAt: null,
      lastSync: new Date(),
    },
  });
}

export async function resumeRadioAfterAnnouncement() {
  await ensureRadioState();

  await prisma.radioState.update({
    where: { id: RADIO_STATE_ID },
    data: {
      isPlaying: true,
      startedAt: BigInt(Date.now()),
      lastSync: new Date(),
    },
  });
}

export async function setRadioState(data: {
  trackIndex?: number;
  position?: number;
  isPlaying?: boolean;
}) {
  const tracks = getMusicTracks();
  if (tracks.length === 0) return;

  const trackIndex =
    data.trackIndex !== undefined
      ? ((data.trackIndex % tracks.length) + tracks.length) % tracks.length
      : undefined;

  const isPlaying = data.isPlaying ?? true;

  await prisma.radioState.update({
    where: { id: RADIO_STATE_ID },
    data: {
      ...(trackIndex !== undefined ? { trackIndex } : {}),
      ...(data.position !== undefined ? { position: data.position } : {}),
      isPlaying,
      startedAt: isPlaying ? BigInt(Date.now()) : null,
      lastSync: new Date(),
    },
  });
}

export async function recoverStuckRadio() {
  const stale = await prisma.liveAnnouncement.findFirst({
    where: {
      played: false,
      createdAt: { lt: new Date(Date.now() - 90_000) },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!stale) return;

  await prisma.liveAnnouncement.updateMany({
    where: { played: false, createdAt: { lt: new Date(Date.now() - 90_000) } },
    data: { played: true },
  });

  const pending = await prisma.liveAnnouncement.count({
    where: { played: false },
  });

  if (pending === 0) {
    await resumeRadioAfterAnnouncement();
  }
}
