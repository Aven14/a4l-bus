import { NextResponse } from "next/server";
import { completeAnnouncement } from "@/actions/announcements";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await completeAnnouncement(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Announcement complete error]:", error);
    return NextResponse.json(
      { error: "Failed to complete announcement" },
      { status: 500 }
    );
  }
}
