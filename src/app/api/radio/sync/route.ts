import { NextRequest, NextResponse } from "next/server";
import { updateRadioState, syncRadioClient } from "@/actions/radio";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const state = await updateRadioState(body);
    return NextResponse.json(state);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to update radio state" }, { status: 500 });
  }
}
