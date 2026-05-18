"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function createLog(data: {
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
}) {
  try {
    const user = await getCurrentUser();
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || null;

    await prisma.activityLog.create({
      data: {
        userId: user?.id || null,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details,
        ip,
      },
    });
  } catch (err) {
    console.error("Erreur création log:", err);
  }
}

export async function getAdminLogs(limit: number = 200) {
  const { requireUser } = await import("@/lib/session");
  const auth = await requireUser(["ADMIN"]);
  if ("error" in auth) return [];

  try {
    return await prisma.activityLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
      },
    });
  } catch {
    return [];
  }
}

export async function getLogStats() {
  const { requireUser } = await import("@/lib/session");
  const auth = await requireUser(["ADMIN"]);
  if ("error" in auth) return null;

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Stats pour les graphiques
    const [
      loginsByDay,
      ticketsByDay,
      ticketsByType,
      usersByRole,
      radioActivations,
    ] = await Promise.all([
      // Connexions par jour (7 derniers jours)
      prisma.$queryRaw`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM "ActivityLog"
        WHERE "action" = 'LOGIN' AND "createdAt" >= ${sevenDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      // Billets créés par jour
      prisma.$queryRaw`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM "Ticket"
        WHERE "createdAt" >= ${sevenDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      // Billets par type
      prisma.ticket.groupBy({
        by: ["ticketType"],
        _count: true,
      }),
      // Utilisateurs par rôle
      prisma.user.groupBy({
        by: ["roles"],
        _count: true,
      }),
      // Activations radio
      prisma.activityLog.count({
        where: {
          action: "RADIO_ACTIVATED",
          createdAt: { gte: sevenDaysAgo },
        },
      }),
    ]);

    return {
      loginsByDay,
      ticketsByDay,
      ticketsByType,
      usersByRole,
      radioActivations,
    };
  } catch (err) {
    console.error("Erreur stats logs:", err);
    return null;
  }
}
