import { NextRequest, NextResponse } from "next/server";
import { syncRadioClient } from "@/actions/radio";

// Cette route est appelée pour vérifier l'état de la radio
// Elle calcule la position actuelle basée sur le temps écoulé et les durées des pistes

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const durationsParam = searchParams.get("durations");
    const trackDurations = durationsParam ? JSON.parse(durationsParam) : [];
    
    const state = await syncRadioClient(trackDurations);
    return NextResponse.json(state);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to get radio state" }, { status: 500 });
  }
}
