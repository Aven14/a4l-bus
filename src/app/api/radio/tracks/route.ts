import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const musicDir = path.join(process.cwd(), "public", "audio", "music");
    
    // Vérifier si le dossier existe
    if (!fs.existsSync(musicDir)) {
      return NextResponse.json({ tracks: [] });
    }
    
    // Lire les fichiers
    const files = fs.readdirSync(musicDir);
    
    // Filtrer uniquement les fichiers MP3
    const mp3Files = files.filter(file => file.endsWith(".mp3") && file !== ".gitkeep");
    
    // Créer la liste des pistes
    const tracks = mp3Files.map(file => ({
      title: file.replace(".mp3", ""),
      src: `/audio/music/${file}`,
    }));
    
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("[Radio tracks error]:", error);
    return NextResponse.json({ tracks: [] });
  }
}
