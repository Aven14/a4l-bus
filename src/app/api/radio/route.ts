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

// GET - Obtenir l'état actuel de la radio
export async function GET() {
  try {
    let state = await prisma.radioState.findFirst();
    
    if (!state) {
      state = await prisma.radioState.create({
        data: {
          trackIndex: 0,
          position: 0,
          isPlaying: false,
          lastSync: new Date(),
        },
      });
    }
    
    // Récupérer la liste des pistes directement
    const tracks = getTracks();
    
    // Calculer la position actuelle si la radio joue
    let calculatedPosition = state.position;
    let calculatedTrackIndex = state.trackIndex;
    
    if (state.isPlaying && state.startedAt !== null && tracks.length > 0) {
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
      isPlaying: state.isPlaying,
      tracks,
    });
  } catch (error) {
    console.error("[Radio GET error]:", error);
    return NextResponse.json({ error: "Failed to get radio state" }, { status: 500 });
  }
}

// POST - Mettre à jour l'état de la radio (play/pause)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { isPlaying } = body;
    
    // Récupérer la liste des pistes directement
    const tracks = getTracks();
    
    let state = await prisma.radioState.findFirst();
    
    if (!state) {
      state = await prisma.radioState.create({
        data: {
          trackIndex: 0,
          position: 0,
          isPlaying: false,
          lastSync: new Date(),
        },
      });
    }
    
    // Choisir une piste au hasard si on démarre
    const randomTrackIndex = tracks.length > 0 ? Math.floor(Math.random() * tracks.length) : 0;
    
    const updatedState = await prisma.radioState.update({
      where: { id: state.id },
      data: {
        isPlaying: isPlaying ?? state.isPlaying,
        startedAt: isPlaying ? Date.now() : null,
        trackIndex: isPlaying ? randomTrackIndex : state.trackIndex,
        position: isPlaying ? 0 : state.position,
        lastSync: new Date(),
      },
    });
    
    return NextResponse.json({
      trackIndex: updatedState.trackIndex,
      position: updatedState.position,
      isPlaying: updatedState.isPlaying,
      tracks,
    });
  } catch (error) {
    console.error("[Radio POST error]:", error);
    return NextResponse.json({ error: "Failed to update radio state" }, { status: 500 });
  }
}
