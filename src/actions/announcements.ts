"use server";

import { prisma } from "@/lib/prisma";

export async function getPendingAnnouncements(_lastCheckAt: Date | null) {
  try {
    const announcements = await prisma.liveAnnouncement.findMany({
      where: {
        played: false,
      },
      orderBy: { createdAt: "asc" },
    });

    // Marquer comme joué
    if (announcements.length > 0) {
      await prisma.liveAnnouncement.updateMany({
        where: {
          id: { in: announcements.map((a: { id: string }) => a.id) },
        },
        data: { played: true },
      });
    }

    return announcements;
  } catch {
    return [];
  }
}
