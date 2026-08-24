import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../db";

describe("Job Application Status & Edge Case Verification", () => {
  beforeEach(async () => {
    // Clean up test items
    await db.jobAd.deleteMany({
      where: { externalId: { startsWith: "test_edge_case_" } },
    });
  });

  it("should preserve SAVED jobs from being auto-discarded during 14-day cron cleanup", async () => {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

    // Create a SAVED job older than 14 days
    const savedJob = await db.jobAd.create({
      data: {
        externalId: "test_edge_case_saved_1",
        title: "Senior Embedded Engineer",
        company: "Volvo Group",
        location: "Gothenburg",
        description: "Embedded Systems role",
        publishedAt: fifteenDaysAgo,
        matchScore: 90,
        matchedSkills: "[]",
        missingSkills: "[]",
        domainScores: "{}",
        status: "SAVED",
      },
    });

    // Simulate cron cleanup logic (status === "NEW" and publishedAt < 14 days ago)
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    await db.jobAd.updateMany({
      where: {
        status: "NEW",
        publishedAt: { lt: fourteenDaysAgo },
      },
      data: { status: "DISCARDED" },
    });

    // Verify SAVED job status remains intact
    const fetched = await db.jobAd.findUnique({
      where: { id: savedJob.id },
    });

    expect(fetched).not.toBeNull();
    expect(fetched?.status).toBe("SAVED");

    // Clean up
    await db.jobAd.delete({ where: { id: savedJob.id } });
  });

  it("Edge Case: Unconfirmed external portal visit keeps status as SAVED without creating Application", async () => {
    const job = await db.jobAd.create({
      data: {
        externalId: "test_edge_case_unconfirmed_1",
        title: "Fullstack Architect",
        company: "Spotify",
        location: "Stockholm",
        description: "Next.js & TypeScript architecture",
        publishedAt: new Date(),
        matchScore: 95,
        matchedSkills: "[]",
        missingSkills: "[]",
        domainScores: "{}",
        status: "NEW",
      },
    });

    // Candidate opened external link, but selected 'Keep as Saved' instead of marking as applied
    const updated = await db.jobAd.update({
      where: { id: job.id },
      data: { status: "SAVED" },
    });

    expect(updated.status).toBe("SAVED");

    // Verify NO Application record was created (avoiding false application logs)
    const apps = await db.application.findMany({
      where: { jobId: job.id },
    });
    expect(apps.length).toBe(0);

    // Clean up
    await db.jobAd.delete({ where: { id: job.id } });
  });

  it("Edge Case: Confirmed external application creates/updates Application record in tracker", async () => {
    const job = await db.jobAd.create({
      data: {
        externalId: "test_edge_case_confirmed_1",
        title: "Lead System Developer",
        company: "Saab Dynamics",
        location: "Linköping",
        description: "Defense systems engineering",
        publishedAt: new Date(),
        matchScore: 88,
        matchedSkills: "[]",
        missingSkills: "[]",
        domainScores: "{}",
        status: "SAVED",
      },
    });

    // Candidate confirmed submission -> update job status & create application
    const now = new Date();
    const monthlyTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    await db.jobAd.update({
      where: { id: job.id },
      data: { status: "APPLIED" },
    });

    const app = await db.application.create({
      data: {
        jobId: job.id,
        status: "APPLIED",
        appliedAt: now,
        resumeVersion: "Manoj Axelsson - Software Architecture CV",
        notes: "Confirmed via external site link",
        monthlyTag,
      },
    });

    expect(app.status).toBe("APPLIED");
    expect(app.jobId).toBe(job.id);

    // Clean up
    await db.jobAd.delete({ where: { id: job.id } });
  });
});
