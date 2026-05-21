import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Fonction pour récupérer les pistes depuis le système de fichiers
function getTracks() {
  try {
    const musicDir = path.join(process.cwd(), "public", "audio", "music");
    
    if (!fs.existsSync(musicDir)) {
      return [];
    }
    
    const files = fs.readdirSync(musicDir);
    const mp3Files = files.filter(file => file.endsWith(".mp3") && file !== ".gitkeep");
    
    return mp3Files.map(file => ({
      title: file.replace(".mp3", ""),
      src: `/audio/music/${file}`,
    }));
  } catch (error) {
    console.error("[Get tracks error]:", error);
    return [];
  }
}

// GET - Obtenir l'état actuel de la radio (contenu global)
export async function GET() {
  try {
    let state = await prisma.radioState.findFirst();
    
    if (!state) {
      state = await prisma.radioState.create({
        data: {
          trackIndex: 0,
          position: 0,
          isPlaying: true, // La radio est toujours "en cours" côté serveur
          startedAt: Date.now(),
          lastSync: new Date(),
        },
      });
    }
    
    // Si la radio n'est pas démarrée, la démarrer
    if (!state.startedAt) {
      state = await prisma.radioState.update({
        where: { id: state.id },
        data: {
          startedAt: Date.now(),
          isPlaying: true,
        },
      });
    }
    
    // Récupérer la liste des pistes directement
    const tracks = getTracks();
    
    // Calculer la position actuelle (la radio continue toujours)
    let calculatedPosition = state.position;
    let calculatedTrackIndex = state.trackIndex;
    
    if (state.startedAt !== null && tracks.length > 0) {
      const elapsedSeconds = (Date.now() - Number(state.startedAt)) / 1000;
      // Durée moyenne d'une piste = 180 secondes
      const trackDuration = 180;
      const totalTracks = tracks.length;
      
      const totalDuration = trackDuration * totalTracks;
      const loopElapsed = elapsedSeconds % totalDuration;
      
      calculatedTrackIndex = Math.floor(loopElapsed / trackDuration) % totalTracks;
      calculatedPosition = loopElapsed % trackDuration;
    }
    
    return NextResponse.json({
      trackIndex: calculatedTrackIndex,
      position: calculatedPosition,
      tracks,
    });
  } catch (error) {
    console.error("[Radio GET error]:", error);
    return NextResponse.json({ error: "Failed to get radio state" }, { status: 500 });
  }
}

// POST - Démarrer/arrêter la radio (action globale, rarement utilisée)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body; // 'start' ou 'stop'
    
    // Récupérer la liste des pistes directement
    const tracks = getTracks();
    
    let state = await prisma.radioState.findFirst();
    
    if (!state) {
      state = await prisma.radioState.create({
        data: {
          trackIndex: 0,
          position: 0,
          isPlaying: true,
          startedAt: Date.now(),
          lastSync: new Date(),
        },
      });
    }
    
    if (action === 'stop') {
      // Arrêter la radio globalement
      const updatedState = await prisma.radioState.update({
        where: { id: state.id },
        data: {
          isPlaying: false,
          startedAt: null,
          lastSync: new Date(),
        },
      });
      
      return NextResponse.json({
        trackIndex: updatedState.trackIndex,
        position: updatedState.position,
        tracks,
      });
    }
    
    // Par défaut, démarrer ou redémarrer
    const randomTrackIndex = tracks.length > 0 ? Math.floor(Math.random() * tracks.length) : 0;
    
    const updatedState = await prisma.radioState.update({
      where: { id: state.id },
      data: {
        isPlaying: true,
        startedAt: Date.now(),
        trackIndex: randomTrackIndex,
        position: 0,
        lastSync: new Date(),
      },
    });
    
    return NextResponse.json({
      trackIndex: updatedState.trackIndex,
      position: updatedState.position,
      tracks,
    });
  } catch (error) {
    console.error("[Radio POST error]:", error);
    return NextResponse.json({ error: "Failed to update radio state" }, { status: 500 });
  }
}
