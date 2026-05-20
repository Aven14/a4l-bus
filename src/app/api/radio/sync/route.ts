import { NextRequest, NextResponse } from "next/server";
import { updateRadioState, getRadioState } from "@/actions/radio";

export async function GET() {
  try {
    const state = await getRadioState();
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json({ error: "Failed to get radio state" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const state = await updateRadioState(body);
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update radio state" }, { status: 500 });
  }
}
