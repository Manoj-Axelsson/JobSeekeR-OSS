import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const scanLogs = await db.scanLog.findMany({
      orderBy: { scannedAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ success: true, scanLogs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load scan logs";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
