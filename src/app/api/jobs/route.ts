import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * GET /api/jobs
 * Returns list of jobs sorted by matchScore (desc) and publishedAt (desc).
 * Excludes orphaned/discarded jobs automatically.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Prisma.JobAdWhereInput = {};
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load jobs";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/jobs
 * Updates job status.
 * - If status === "DISCARDED": Permanently purges job from DB.
 * - If status === "APPLIED": Creates associated Application record.
 * - If status reverted to "NEW" or "SAVED": Automatically deletes associated Application record.
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, notes } = body;

    // Discard Directive: Permanently purge discarded jobs into the void
    if (status === "DISCARDED") {
      await db.jobAd.delete({ where: { id } });
      return NextResponse.json({
        success: true,
        deleted: true,
        message: "Job permanently deleted from database.",
      });
    }

    const updatedJob = await db.jobAd.update({
      where: { id },
      data: { status },
    });

    // If status changed to APPLIED, create or update Application record
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
            resumeVersion: "JobseekeR Candidate CV",
            notes: notes || "Applied via job portal",
            monthlyTag,
          },
        });
      }
    } else if (status === "NEW" || status === "SAVED") {
      // Accidental Application Reversal: Purge associated application record if un-marked
      await db.application.deleteMany({
        where: { jobId: id },
      });
    }

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update job";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/jobs
 * Permanently removes a job record from the database.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Job ID required" }, { status: 400 });
    }

    await db.jobAd.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Job permanently deleted from database." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete job";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
