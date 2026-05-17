"use server";

import { prisma } from "@/lib/prisma";

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
