import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const musicDir = path.join(process.cwd(), "public", "audio", "music");
    
    if (!fs.existsSync(musicDir)) {
      return NextResponse.json({ tracks: [] });
    }

    const files = fs.readdirSync(musicDir);
    const tracks = files
      .filter((file) => file.endsWith(".mp3") && file !== ".gitkeep")
      .map((file) => {
        const filePath = path.join(musicDir, file);
        const stats = fs.statSync(filePath);
        const name = file.replace(".mp3", "").replace(/_/g, " ").replace(/-/g, " ");
        
        return {
          title: name,
          src: `/audio/music/${file}`,
          filename: file,
          name: name,
          path: `/audio/music/${file}`,
          size: stats.size,
          lastModified: stats.mtime,
        };
      });

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Error reading music directory:", error);
    return NextResponse.json({ error: "Failed to read music files" }, { status: 500 });
  }
}
