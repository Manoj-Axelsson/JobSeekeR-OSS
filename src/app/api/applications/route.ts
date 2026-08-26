import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/authHelper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // e.g. "2026-07"

    const where: Prisma.ApplicationWhereInput = {
      OR: [
        { userAccountId: user.id },
        { userAccount: { email: user.email } },
        { userAccountId: null }, // Support legacy unassigned applications during migration phase
      ],
    };
    if (month) {
      where.monthlyTag = month;
    }

    const applications = await db.application.findMany({
      where,
      orderBy: { appliedAt: "desc" },
      include: {
        job: true,
      },
    });

    // Get distinct months for filter tabs for authenticated user
    const allApps = await db.application.findMany({
      where: {
        OR: [
          { userAccountId: user.id },
          { userAccount: { email: user.email } },
          { userAccountId: null },
        ],
      },
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
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, notes, resumeVersion } = body;

    const existingApp = await db.application.findFirst({
      where: {
        id,
        OR: [
          { userAccountId: user.id },
          { userAccountId: null },
        ],
      },
    });

    if (!existingApp) {
      return NextResponse.json({ success: false, error: "Application not found or unauthorized" }, { status: 404 });
    }

    const updatedApp = await db.application.update({
      where: { id: existingApp.id },
      data: {
        userAccountId: user.id,
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
