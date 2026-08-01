import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // e.g. "2026-07"

  const where: Prisma.ApplicationWhereInput = {};
  if (month) {
    where.monthlyTag = month;
  }

  try {
    const applications = await db.application.findMany({
      where,
      orderBy: { appliedAt: "desc" },
      include: {
        job: true,
      },
    });

    // Get distinct months for filter tabs
    const allApps = await db.application.findMany({
      select: { monthlyTag: true },
    });
    const months = Array.from(new Set(allApps.map((a) => a.monthlyTag))).sort().reverse();

    return NextResponse.json({ success: true, applications, months });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load applications";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, notes, resumeVersion } = body;

    const updatedApp = await db.application.update({
      where: { id },
      data: {
        status,
        notes,
        resumeVersion,
      },
      include: { job: true },
    });

    return NextResponse.json({ success: true, application: updatedApp });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update application";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
