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

// Mettre à jour l'état de la radio (skip, pause, play)
export async function updateRadioState(data: {
  trackIndex?: number;
  position?: number;
  isPlaying?: boolean;
}) {
  const state = await getRadioState();
  
  return prisma.radioState.update({
    where: { id: state.id },
    data: {
      ...(data.trackIndex !== undefined && { trackIndex: data.trackIndex }),
      ...(data.position !== undefined && { position: data.position }),
      ...(data.isPlaying !== undefined && { isPlaying: data.isPlaying }),
      lastSync: new Date(),
    },
  });
}

// Sync client - retourne l'état actuel
export async function syncRadioClient() {
  return getRadioState();
}
