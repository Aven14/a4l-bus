import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const after = searchParams.get("after");

    const announcements = await prisma.liveAnnouncement.findMany({
      where: {
        played: false,
        ...(after ? { createdAt: { gt: new Date(after) } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("[Announcements GET error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}
