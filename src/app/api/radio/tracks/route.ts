import { NextResponse } from "next/server";
import { getMusicTracks } from "@/lib/radio";

export async function GET() {
  try {
    const tracks = getMusicTracks().map((filename) => ({
      title: filename.replace(/\.mp3$/i, ""),
      src: `/audio/music/${encodeURIComponent(filename)}`,
      filename,
    }));

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("[Radio tracks GET error]:", error);
    return NextResponse.json(
      { error: "Failed to list tracks" },
      { status: 500 }
    );
  }
}
