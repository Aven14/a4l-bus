import { NextResponse } from "next/server";
import { getRadioState, updateRadioState } from "@/actions/radio";

// Cette route est appelée toutes les secondes pour maintenir la radio "vivante"
// Elle calcule la position actuelle basée sur le temps écoulé

export async function GET() {
  const state = await getRadioState();
  
  if (!state.isPlaying || !state.startedAt) {
    return NextResponse.json({ playing: false });
  }

  // Calculer la position actuelle basée sur le temps écoulé depuis le start
  const elapsed = (Date.now() - state.startedAt) / 1000;
  
  // On suppose une durée moyenne de 3min par track (180 secondes)
  const avgTrackDuration = 180;
  const currentTrackTime = elapsed % avgTrackDuration;
  const tracksElapsed = Math.floor(elapsed / avgTrackDuration);
  const currentTrackIndex = (state.trackIndex + tracksElapsed) % 10; // 10 tracks max

  return NextResponse.json({
    playing: true,
    trackIndex: currentTrackIndex,
    position: currentTrackTime,
    startedAt: state.startedAt,
  });
}

// PLUS BESOIN DE POST - La radio se lance via playRadio
