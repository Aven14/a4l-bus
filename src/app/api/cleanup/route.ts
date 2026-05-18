import { NextResponse } from "next/server";
import { cleanupExpiredTickets } from "@/actions/tickets";

export async function POST() {
  try {
    const result = await cleanupExpiredTickets();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, count: 0 },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} billets expirés supprimés`,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors du nettoyage" },
      { status: 500 }
    );
  }
}
