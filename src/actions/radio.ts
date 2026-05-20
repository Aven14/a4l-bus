import { prisma } from "@/lib/prisma";

// Obtenir l'état actuel de la radio
export async function getRadioState() {
  const state = await prisma.radioState.findFirst();
  
  if (!state) {
    // Créer un état par défaut
    return prisma.radioState.create({
      data: {
        trackIndex: 0,
        position: 0,
        isPlaying: false,
        lastSync: new Date(),
      },
    });
  }
  
  return state;
}

// Mettre à jour l'état de la radio (play, pause, skip)
export async function updateRadioState(data: {
  trackIndex?: number;
  position?: number;
  isPlaying?: boolean;
  startedAt?: number | null;
}) {
  const state = await getRadioState();
  
  return prisma.radioState.update({
    where: { id: state.id },
    data: {
      ...(data.trackIndex !== undefined && { trackIndex: data.trackIndex }),
      ...(data.position !== undefined && { position: data.position }),
      ...(data.isPlaying !== undefined && { isPlaying: data.isPlaying }),
      ...(data.startedAt !== undefined && { startedAt: data.startedAt }),
      lastSync: new Date(),
    },
  });
}

// Calculer la position actuelle basée sur le startedAt et les durées des pistes
export function calculateServerState(state: { isPlaying: boolean; startedAt: number | null; trackIndex: number; position: number }, trackDurations: number[], now: number = Date.now()) {
  if (!state.isPlaying || state.startedAt === null) {
    return {
      trackIndex: state.trackIndex,
      position: state.position,
      isPlaying: false,
    };
  }
  
  const elapsedSeconds = (now - state.startedAt) / 1000;
  
  // Calculer la position actuelle dans la playlist
  let remaining = elapsedSeconds;
  let currentTrackIndex = state.trackIndex;
  
  // Avancer dans les pistes selon le temps écoulé
  while (remaining > 0 && currentTrackIndex < trackDurations.length) {
    const trackDuration = trackDurations[currentTrackIndex] || 180; // 180s par défaut
    if (remaining < trackDuration) {
      // On est dans cette piste
      return {
        trackIndex: currentTrackIndex,
        position: remaining,
        isPlaying: true,
      };
    }
    remaining -= trackDuration;
    currentTrackIndex++;
  }
  
  // Si on a dépassé toutes les pistes, revenir au début (boucle)
  const totalDuration = trackDurations.reduce((sum, d) => sum + d, 0) || (trackDurations.length * 180);
  if (totalDuration > 0) {
    const loopElapsed = elapsedSeconds % totalDuration;
    
    remaining = loopElapsed;
    currentTrackIndex = 0;
    
    while (remaining > 0 && currentTrackIndex < trackDurations.length) {
      const trackDuration = trackDurations[currentTrackIndex] || 180;
      if (remaining < trackDuration) {
        return {
          trackIndex: currentTrackIndex,
          position: remaining,
          isPlaying: true,
        };
      }
      remaining -= trackDuration;
      currentTrackIndex++;
    }
  }
  
  return {
    trackIndex: 0,
    position: 0,
    isPlaying: true,
  };
}

// Sync client - retourne l'état actuel calculé
export async function syncRadioClient(trackDurations: number[] = []) {
  const state = await getRadioState();
  
  if (trackDurations.length > 0 && state.isPlaying && state.startedAt !== null) {
    return calculateServerState(state, trackDurations);
  }
  
  return {
    trackIndex: state.trackIndex,
    position: state.position,
    isPlaying: state.isPlaying,
  };
}
