"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function getHomeNetworkData() {
  try {
    const [lineCount, activeShifts] = await Promise.all([
      prisma.transportLine.count(),
      prisma.driverShift.findMany({
        where: { endedAt: null },
        include: {
          line: true,
          user: { select: { firstname: true, lastname: true } },
        },
        orderBy: { line: { number: "asc" } },
      }),
    ]);

    const activeLines = activeShifts.map((shift) => ({
      id: shift.line.id,
      number: shift.line.number,
      name: shift.line.name,
      color: shift.line.color,
      driver: `${shift.user.firstname} ${shift.user.lastname}`,
    }));

    return { lineCount, activeLines };
  } catch {
    return { lineCount: 0, activeLines: [] };
  }
}

/** Réseau complet (lignes + arrêts) — page publique civils */
export async function getPublicNetworkLines() {
  try {
    return await prisma.transportLine.findMany({
      include: { stops: { orderBy: { order: "asc" } } },
      orderBy: { number: "asc" },
    });
  } catch {
    return [];
  }
}

export async function getPublicLineById(lineId: string) {
  try {
    return await prisma.transportLine.findUnique({
      where: { id: lineId },
      include: { stops: { orderBy: { order: "asc" } } },
    });
  } catch {
    return null;
  }
}

export async function getPublicLineByNumber(lineNumber: number) {
  try {
    return await prisma.transportLine.findUnique({
      where: { number: lineNumber },
      include: { stops: { orderBy: { order: "asc" } } },
    });
  } catch {
    return null;
  }
}

export async function getActiveLineWithTracking(lineNumber: number) {
  try {
    // Trouver le shift actif pour cette ligne
    const shift = await prisma.driverShift.findFirst({
      where: {
        line: { number: lineNumber },
        endedAt: null,
      },
      include: {
        line: {
          include: { stops: { orderBy: { order: "asc" } } },
        },
        user: { select: { firstname: true, lastname: true } },
      },
    });

    if (!shift) return null;

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
      currentStopId: shift.currentStopId,
      destinationStopId: shift.destinationStopId,
    };
  } catch {
    return null;
  }
}

export async function updateDriverPosition(shiftId: string, stopId: string) {
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

    // Ici on pourrait stocker la position dans une table séparée
    // Pour l'instant, on retourne juste un succès
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erreur serveur" };
  }
}

