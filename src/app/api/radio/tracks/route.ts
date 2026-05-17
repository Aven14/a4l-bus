import { readdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.mp3$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  try {
    const musicDir = path.join(process.cwd(), "public", "audio", "music");
    const entries = await readdir(musicDir, { withFileTypes: true });

    const tracks = entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".mp3"))
      .map((e) => ({
        title: titleFromFilename(e.name) || "Cross Track Bus Radio",
        src: `/audio/music/${encodeURIComponent(e.name)}`,
        filename: e.name,
      }))
      .sort((a, b) => a.filename.localeCompare(b.filename));

    return NextResponse.json(tracks);
  } catch {
    return NextResponse.json([]);
  }
}
