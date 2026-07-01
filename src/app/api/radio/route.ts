import { NextResponse } from "next/server";
import { getComputedRadioState, recoverStuckRadio } from "@/lib/radio";

export async function GET() {
  try {
    await recoverStuckRadio();
    const state = await getComputedRadioState();
    return NextResponse.json(state);
  } catch (error) {
    console.error("[Radio GET error]:", error);
    return NextResponse.json(
      { error: "Failed to get radio state" },
      { status: 500 }
    );
  }
}
