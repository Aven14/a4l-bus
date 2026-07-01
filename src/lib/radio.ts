import { prisma } from "@/lib/prisma";
import {
  advanceTrackPosition,
  durationsToRecord,
  ensureTrackDurations,
  getMusicTracks,
  normalizePlaylist,
  shuffleTracks,
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

async function ensurePlaylistOrder(
  tracks: string[],
  existingOrder: string[] = []
): Promise<string[]> {
  return normalizePlaylist(tracks, existingOrder);
}

async function computeFromRawState(
  trackIndex: number,
  position: number,
  isPlaying: boolean,
  startedAt: bigint | null,
  playlist: string[]
): Promise<{
  trackIndex: number;
  position: number;
  playlist: string[];
  needsReshuffle: boolean;
}> {
  if (playlist.length === 0) {
    return { trackIndex: 0, position: 0, playlist, needsReshuffle: false };
  }

  const durations = await ensureTrackDurations();
  let pos = position;

  if (isPlaying && startedAt != null) {
    const elapsed = (Date.now() - Number(startedAt)) / 1000;
    pos += elapsed;
  }

  const advanced = advanceTrackPosition(trackIndex, pos, playlist, durations);

  if (!advanced.needsReshuffle) {
    return {
      trackIndex: advanced.trackIndex,
      position: advanced.position,
      playlist,
      needsReshuffle: false,
    };
  }

  const reshuffled = shuffleTracks(playlist);
  return {
    trackIndex: 0,
    position: 0,
    playlist: reshuffled,
    needsReshuffle: true,
  };
}

export async function ensureRadioState() {
  const tracks = getMusicTracks();
  const existing = await prisma.radioState.findUnique({
    where: { id: RADIO_STATE_ID },
  });

  if (existing) {
    const playlist = await ensurePlaylistOrder(tracks, existing.playlistOrder);

    if (
      playlist.length !== existing.playlistOrder.length ||
      playlist.some((track, index) => track !== existing.playlistOrder[index])
    ) {
      return prisma.radioState.update({
        where: { id: RADIO_STATE_ID },
        data: {
          playlistOrder: playlist,
          trackIndex: Math.min(existing.trackIndex, Math.max(playlist.length - 1, 0)),
          lastSync: new Date(),
        },
      });
    }

    return existing;
  }

  const playlist = shuffleTracks(tracks);
  const now = BigInt(Date.now());

  return prisma.radioState.create({
    data: {
      id: RADIO_STATE_ID,
      trackIndex: 0,
      position: 0,
      isPlaying: true,
      startedAt: now,
      playlistOrder: playlist,
      lastSync: new Date(),
    },
  });
}

export async function getComputedRadioState(): Promise<ComputedRadioState> {
  const tracks = getMusicTracks();
  const durations = await ensureTrackDurations();
  let state = await ensureRadioState();

  if (tracks.length === 0) {
    return {
      trackIndex: 0,
      position: 0,
      track: null,
      tracks: [],
      trackDurations: {},
      isPlaying: false,
      revision: state.lastSync.getTime(),
    };
  }

  let computed = await computeFromRawState(
    state.trackIndex,
    state.position,
    state.isPlaying,
    state.startedAt,
    state.playlistOrder
  );

  if (computed.needsReshuffle) {
    state = await prisma.radioState.update({
      where: { id: RADIO_STATE_ID },
      data: {
        playlistOrder: computed.playlist,
        trackIndex: 0,
        position: 0,
        startedAt: state.isPlaying ? BigInt(Date.now()) : null,
        lastSync: new Date(),
      },
    });
    computed = {
      trackIndex: 0,
      position: 0,
      playlist: computed.playlist,
      needsReshuffle: false,
    };
  } else if (
    state.isPlaying &&
    (computed.trackIndex !== state.trackIndex ||
      Math.abs(computed.position - state.position) > 2)
  ) {
    await prisma.radioState.update({
      where: { id: RADIO_STATE_ID },
      data: {
        trackIndex: computed.trackIndex,
        position: computed.position,
        startedAt: BigInt(Date.now()),
        lastSync: new Date(),
      },
    });
  }

  const playlist =
    computed.playlist.length > 0 ? computed.playlist : state.playlistOrder;

  return {
    trackIndex: computed.trackIndex,
    position: computed.position,
    track: playlist[computed.trackIndex] ?? null,
    tracks: playlist,
    trackDurations: durationsToRecord(durations),
    isPlaying: state.isPlaying,
    revision: state.lastSync.getTime(),
  };
}

export async function pauseRadioForAnnouncement() {
  const state = await ensureRadioState();
  const computed = await computeFromRawState(
    state.trackIndex,
    state.position,
    state.isPlaying,
    state.startedAt,
    state.playlistOrder
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

  const state = await ensureRadioState();
  const playlist = state.playlistOrder.length > 0 ? state.playlistOrder : tracks;

  const trackIndex =
    data.trackIndex !== undefined
      ? ((data.trackIndex % playlist.length) + playlist.length) % playlist.length
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
