import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/authHelper";

/**
 * GET /api/jobs
 * Returns list of jobs for the authenticated user sorted by matchScore (desc) and publishedAt (desc).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Prisma.JobAdWhereInput = {
      OR: [
        { userAccountId: user.id },
        { userAccountId: null }, // Support legacy unassigned jobs during migration phase
      ],
    };

    if (status && status !== "ALL") {
      where.status = status;
    }
    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search } },
            { company: { contains: search } },
            { location: { contains: search } },
          ],
        },
      ];
    }

    const jobs = await db.jobAd.findMany({
      where,
      orderBy: [
        { matchScore: "desc" },
        { publishedAt: "desc" },
      ],
      include: {
        applications: true,
        profileEvaluations: {
          include: {
            searchProfile: true,
          },
        },
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
 * Updates job status for authenticated user.
 */
export async function PATCH(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, notes } = body;

    // Verify job belongs to authenticated user or is unassigned legacy job
    const existingJob = await db.jobAd.findFirst({
      where: {
        id,
        OR: [{ userAccountId: user.id }, { userAccountId: null }],
      },
    });

    if (!existingJob) {
      return NextResponse.json({ success: false, error: "Job not found or unauthorized" }, { status: 404 });
    }

    // Discard Directive: Permanently purge discarded jobs
    if (status === "DISCARDED") {
      await db.jobAd.delete({ where: { id: existingJob.id } });
      return NextResponse.json({
        success: true,
        deleted: true,
        message: "Job permanently deleted from database.",
      });
    }

    const updatedJob = await db.jobAd.update({
      where: { id: existingJob.id },
      data: { status, userAccountId: user.id },
    });

    // If status changed to APPLIED, create or update Application record
    if (status === "APPLIED") {
      const now = new Date();
      const monthlyTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      const existingApp = await db.application.findFirst({
        where: { jobId: existingJob.id, OR: [{ userAccountId: user.id }, { userAccountId: null }] },
      });

      if (!existingApp) {
        await db.application.create({
          data: {
            userAccountId: user.id,
            jobId: existingJob.id,
            status: "APPLIED",
            appliedAt: now,
            resumeVersion: "JobseekeR Candidate CV",
            notes: notes || "Applied via job portal",
            monthlyTag,
          },
        });
      } else {
        await db.application.update({
          where: { id: existingApp.id },
          data: {
            userAccountId: user.id,
            status: "APPLIED",
            appliedAt: now,
            notes: notes || existingApp.notes || "Applied via job portal",
          },
        });
      }
    } else if (status === "NEW" || status === "SAVED") {
      // Accidental Application Reversal: Purge associated application record if un-marked
      await db.application.deleteMany({
        where: { jobId: existingJob.id, OR: [{ userAccountId: user.id }, { userAccountId: null }] },
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
 * Permanently removes a job record from the database for authenticated user.
 */
export async function DELETE(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Job ID required" }, { status: 400 });
    }

    const existingJob = await db.jobAd.findFirst({
      where: {
        id,
        OR: [{ userAccountId: user.id }, { userAccountId: null }],
      },
    });

    if (!existingJob) {
      return NextResponse.json({ success: false, error: "Job not found or unauthorized" }, { status: 404 });
    }

    await db.jobAd.delete({ where: { id: existingJob.id } });
    return NextResponse.json({ success: true, message: "Job permanently deleted from database." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete job";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
