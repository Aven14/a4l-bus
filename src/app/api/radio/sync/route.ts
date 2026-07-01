import { NextResponse } from "next/server";
import {
  getComputedRadioState,
  recoverStuckRadio,
  setRadioState,
} from "@/lib/radio";
import { hasAdminAccess } from "@/lib/session";

export async function GET() {
  try {
    await recoverStuckRadio();
    const state = await getComputedRadioState();
    return NextResponse.json(state);
  } catch (error) {
    console.error("[Radio sync GET error]:", error);
    return NextResponse.json(
      { error: "Failed to sync radio state" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await hasAdminAccess())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    await setRadioState({
      trackIndex: body.trackIndex,
      position: body.position,
      isPlaying: body.isPlaying,
    });

    const state = await getComputedRadioState();
    return NextResponse.json(state);
  } catch (error) {
    console.error("[Radio sync POST error]:", error);
    return NextResponse.json(
      { error: "Failed to update radio state" },
      { status: 500 }
    );
  }
}
