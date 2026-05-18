"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hasAdminAccess, requireUser } from "@/lib/session";

export async function getMyActiveShift() {
  const auth = await requireUser(["DRIVER", "ADMIN"]);
  if ("error" in auth) return null;

  return prisma.driverShift.findFirst({
    where: { userId: auth.user.id, endedAt: null },
    include: {
      line: {
        include: { stops: { orderBy: { order: "asc" } } },
      },
    },
  });
}

export async function getLinesWithAvailability() {
  const auth = await requireUser(["DRIVER", "ADMIN"]);
  if ("error" in auth) return { error: auth.error, lines: [], myShift: null };

  const [lines, occupied] = await Promise.all([
    prisma.transportLine.findMany({
      include: { stops: { orderBy: { order: "asc" } } },
      orderBy: { number: "asc" },
    }),
    prisma.driverShift.findMany({
      where: { endedAt: null },
      include: {
        user: { select: { firstname: true, lastname: true } },
        line: { select: { id: true, number: true, name: true } },
      },
    }),
  ]);

  const occupiedIds = new Set(occupied.map((s) => s.lineId));

  return {
    lines: lines.map((line) => ({
      ...line,
      isOccupied: occupiedIds.has(line.id),
      occupiedBy: occupied.find((s) => s.lineId === line.id)?.user ?? null,
    })),
    myShift: await getMyActiveShift(),
  };
}

export async function startShift(lineId: string) {
  const auth = await requireUser(["DRIVER", "ADMIN"]);
  if ("error" in auth) return { success: false, error: auth.error };

  const existing = await prisma.driverShift.findFirst({
    where: { userId: auth.user.id, endedAt: null },
  });
  if (existing) {
    return { success: false, error: "Vous avez déjà un service en cours." };
  }

  const lineTaken = await prisma.driverShift.findFirst({
    where: { lineId, endedAt: null },
    include: { user: { select: { firstname: true, lastname: true } } },
  });
  if (lineTaken) {
    return {
      success: false,
      error: `Ligne déjà prise par ${lineTaken.user.firstname} ${lineTaken.user.lastname}.`,
    };
  }

  const line = await prisma.transportLine.findUnique({ where: { id: lineId } });
  if (!line) {
    return { success: false, error: "Ligne introuvable." };
  }

  try {
    await prisma.driverShift.create({
      data: { userId: auth.user.id, lineId },
    });
    revalidatePath("/chauffeur");
    revalidatePath("/chauffeur/annonces");
    return { success: true };
  } catch {
    return { success: false, error: "Impossible de démarrer le service." };
  }
}

export async function endShift() {
  const auth = await requireUser(["DRIVER", "ADMIN"]);
  if ("error" in auth) return { success: false, error: auth.error };

  const shift = await prisma.driverShift.findFirst({
    where: { userId: auth.user.id, endedAt: null },
  });
  if (!shift) {
    return { success: false, error: "Aucun service en cours." };
  }

  const now = new Date();

  try {
    const { count: cancelledTickets } = await prisma.ticket.updateMany({
      where: {
        issuedById: auth.user.id,
        ticketType: "Single Trip",
        createdAt: { gte: shift.startedAt },
        expiresAt: { gt: now },
      },
      data: { expiresAt: now },
    });

    await prisma.driverShift.update({
      where: { id: shift.id },
      data: { endedAt: now },
    });

    revalidatePath("/chauffeur");
    revalidatePath("/chauffeur/annonces");
    revalidatePath("/chauffeur/billets");
    revalidatePath("/controleur");
    revalidatePath("/admin");

    return {
      success: true,
      cancelledTickets,
    };
  } catch {
    return { success: false, error: "Impossible de terminer le service." };
  }
}

export async function getActiveShiftsOverview() {
  if (!(await hasAdminAccess())) return [];
  return prisma.driverShift.findMany({
    where: { endedAt: null },
    include: {
      user: { select: { firstname: true, lastname: true, email: true } },
      line: { select: { number: true, name: true, color: true } },
    },
    orderBy: { startedAt: "desc" },
  });
}
