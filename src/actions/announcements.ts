"use server";

import { prisma } from "@/lib/prisma";
import {
  pauseRadioForAnnouncement,
  resumeRadioAfterAnnouncement,
} from "@/lib/radio";

export async function createLiveAnnouncement(data: {
  audioUrl: string;
  label: string;
  lineId: string;
}) {
  await pauseRadioForAnnouncement();

  return prisma.liveAnnouncement.create({
    data: {
      audioUrl: data.audioUrl,
      label: data.label,
      lineId: data.lineId,
    },
  });
}

export async function completeAnnouncement(id: string) {
  const announcement = await prisma.liveAnnouncement.findUnique({
    where: { id },
  });

  if (!announcement || announcement.played) {
    return { success: true };
  }

  await prisma.liveAnnouncement.update({
    where: { id },
    data: { played: true },
  });

  const pending = await prisma.liveAnnouncement.count({
    where: { played: false },
  });

  if (pending === 0) {
    await resumeRadioAfterAnnouncement();
  }

  return { success: true };
}

export async function getPendingAnnouncements(after: string | null) {
  try {
    const announcements = await prisma.liveAnnouncement.findMany({
      where: {
        played: false,
        ...(after ? { createdAt: { gt: new Date(after) } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    return announcements;
  } catch {
    return [];
  }
}
