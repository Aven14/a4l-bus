import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// GET - Obtenir le timestamp de référence de la radio
export async function GET() {
  try {
    // Timestamp de démarrage de la radio (fixe)
    const radioStartTime = 1704067200000; // 1er janvier 2024 00:00 UTC
    
    // Récupérer les pistes
    const musicDir = path.join(process.cwd(), "public", "audio", "music");
    let tracks: string[] = [];
    
    if (fs.existsSync(musicDir)) {
      const files = fs.readdirSync(musicDir);
      tracks = files.filter(file => file.endsWith(".mp3") && file !== ".gitkeep");
    }
    
    // Calculer la position actuelle basée sur le timestamp
    const now = Date.now();
    const elapsedSeconds = (now - radioStartTime) / 1000;
    const trackDuration = 180; // 3 minutes par piste
    const totalTracks = tracks.length;
    
    if (totalTracks === 0) {
      return NextResponse.json({
        trackIndex: 0,
        position: 0,
        track: null,
        tracks: [],
      });
    }
    
    const totalDuration = trackDuration * totalTracks;
    const loopElapsed = elapsedSeconds % totalDuration;
    
    const trackIndex = Math.floor(loopElapsed / trackDuration) % totalTracks;
    const position = loopElapsed % trackDuration;
    
    return NextResponse.json({
      trackIndex,
      position,
      track: tracks[trackIndex],
      tracks,
    });
  } catch (error) {
    console.error("[Radio GET error]:", error);
    return NextResponse.json({ error: "Failed to get radio state" }, { status: 500 });
  }
}
