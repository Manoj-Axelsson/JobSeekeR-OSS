import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: any = {};
  if (status && status !== "ALL") {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { company: { contains: search } },
      { location: { contains: search } },
    ];
  }

  try {
    const jobs = await db.jobAd.findMany({
      where,
      orderBy: [
        { matchScore: "desc" },
        { publishedAt: "desc" },
      ],
      include: {
        applications: true,
      },
    });

    return NextResponse.json({ success: true, jobs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, notes } = body;

    const updatedJob = await db.jobAd.update({
      where: { id },
      data: { status },
    });

    // If status changed to APPLIED, create or update Application record for current month
    if (status === "APPLIED") {
      const now = new Date();
      const monthlyTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      const existingApp = await db.application.findFirst({
        where: { jobId: id },
      });

      if (!existingApp) {
        await db.application.create({
          data: {
            jobId: id,
            status: "APPLIED",
            appliedAt: now,
            resumeVersion: "Manoj John Axelsson- CV",
            notes: notes || "Applied via job portal",
            monthlyTag,
          },
        });
      }
    }

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
