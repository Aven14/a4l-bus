import { prisma } from "@/lib/prisma";
import {
  advanceTrackPosition,
  durationsToRecord,
  ensureTrackDurations,
  getMusicTracks,
} from "@/lib/track-durations";

export const RADIO_STATE_ID = "default-radio-state";

export type ComputedRadioState = {
  trackIndex: number;
  position: number;
  track: string | null;
  tracks: string[];
  trackDurations: Record<string, number>;
  isPlaying: boolean;
  revision: number;
};

async function computeFromRawState(
  trackIndex: number,
  position: number,
  isPlaying: boolean,
  startedAt: bigint | null,
  tracks: string[]
): Promise<{ trackIndex: number; position: number }> {
  if (tracks.length === 0) {
    return { trackIndex: 0, position: 0 };
  }

  const durations = await ensureTrackDurations();
  let pos = position;

  if (isPlaying && startedAt != null) {
    const elapsed = (Date.now() - Number(startedAt)) / 1000;
    pos += elapsed;
  }

  return advanceTrackPosition(trackIndex, pos, tracks, durations);
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
  const durations = await ensureTrackDurations();
  const state = await ensureRadioState();

  if (tracks.length === 0) {
    return {
      trackIndex: 0,
      position: 0,
      track: null,
      tracks,
      trackDurations: {},
      isPlaying: false,
      revision: state.lastSync.getTime(),
    };
  }

  const computed = await computeFromRawState(
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
    trackDurations: durationsToRecord(durations),
    isPlaying: state.isPlaying,
    revision: state.lastSync.getTime(),
  };
}

export async function pauseRadioForAnnouncement() {
  const tracks = getMusicTracks();
  const state = await ensureRadioState();
  const computed = await computeFromRawState(
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

export { getMusicTracks, invalidateTrackDurationsCache } from "@/lib/track-durations";
