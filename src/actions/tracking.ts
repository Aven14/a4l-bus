"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function updateTrackingPosition(shiftId: string, stopId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Non authentifié" };

    // Vérifier que le shift existe et appartient à l'utilisateur
    const shift = await prisma.driverShift.findUnique({
      where: { id: shiftId },
    });

    if (!shift || shift.userId !== user.id) {
      return { success: false, error: "Shift non valide" };
    }

    if (shift.endedAt) {
      return { success: false, error: "Shift terminé" };
    }

    // Vérifier que l'arrêt existe
    const stop = await prisma.stop.findUnique({
      where: { id: stopId },
    });

    if (!stop || stop.lineId !== shift.lineId) {
      return { success: false, error: "Arrêt non valide pour cette ligne" };
    }

    // TODO: Stocker la position actuelle dans une table DriverPosition
    // Pour l'instant, on revalide juste le path pour refresh
    revalidatePath("/lignes");
    
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erreur serveur" };
  }
}

export async function getTrackingData(shiftId: string) {
  try {
    const shift = await prisma.driverShift.findUnique({
      where: { id: shiftId },
      include: {
        line: {
          include: { stops: { orderBy: { order: "asc" } } },
        },
        user: { select: { firstname: true, lastname: true } },
      },
    });

    if (!shift || shift.endedAt) return null;

    return {
      line: {
        id: shift.line.id,
        number: shift.line.number,
        name: shift.line.name,
        color: shift.line.color,
        driver: `${shift.user.firstname} ${shift.user.lastname}`,
        stops: shift.line.stops,
      },
      shiftId: shift.id,
    };
  } catch {
    return null;
  }
}
