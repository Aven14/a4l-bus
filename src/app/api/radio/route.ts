import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    
    // Calculer la position actuelle si la radio joue
    let calculatedPosition = state.position;
    let calculatedTrackIndex = state.trackIndex;
    
    if (state.isPlaying && state.startedAt !== null) {
      const elapsedSeconds = (Date.now() - Number(state.startedAt)) / 1000;
      // Durée moyenne d'une piste = 180 secondes
      const trackDuration = 180;
      const totalTracks = 15; // Nombre de pistes
      
      const totalDuration = trackDuration * totalTracks;
      const loopElapsed = elapsedSeconds % totalDuration;
      
      calculatedTrackIndex = Math.floor(loopElapsed / trackDuration) % totalTracks;
      calculatedPosition = loopElapsed % trackDuration;
    }
    
    return NextResponse.json({
      trackIndex: calculatedTrackIndex,
      position: calculatedPosition,
      isPlaying: state.isPlaying,
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
    
    const updatedState = await prisma.radioState.update({
      where: { id: state.id },
      data: {
        isPlaying: isPlaying ?? state.isPlaying,
        startedAt: isPlaying ? Date.now() : null,
        trackIndex: isPlaying ? 0 : state.trackIndex,
        position: isPlaying ? 0 : state.position,
        lastSync: new Date(),
      },
    });
    
    return NextResponse.json({
      trackIndex: updatedState.trackIndex,
      position: updatedState.position,
      isPlaying: updatedState.isPlaying,
    });
  } catch (error) {
    console.error("[Radio POST error]:", error);
    return NextResponse.json({ error: "Failed to update radio state" }, { status: 500 });
  }
}
