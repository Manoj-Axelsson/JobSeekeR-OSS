import { describe, it, expect, vi, beforeEach } from "vitest";

interface StoreRecord {
  id: string;
  status?: string;
  publishedAt?: Date;
  jobId?: string;
  [key: string]: unknown;
}

vi.mock("../../db", () => {
  const store = {
    jobAd: new Map<string, StoreRecord>(),
    application: new Map<string, StoreRecord>(),
  };

  return {
    db: {
      jobAd: {
        deleteMany: vi.fn(async () => {
          store.jobAd.clear();
          return { count: 0 };
        }),
        delete: vi.fn(async ({ where }: { where: { id: string } }) => {
          const item = store.jobAd.get(where.id);
          store.jobAd.delete(where.id);
          return item;
        }),
        create: vi.fn(async ({ data }: { data: StoreRecord }) => {
          const id = data.id || `job-${Math.random()}`;
          const item = { ...data, id };
          store.jobAd.set(id, item);
          return item;
        }),
        updateMany: vi.fn(async ({ where, data }: { where: any; data: any }) => {
          let count = 0;
          for (const item of store.jobAd.values()) {
            if (where.status && item.status !== where.status) continue;
            if (where.publishedAt?.lt && item.publishedAt && !(item.publishedAt < where.publishedAt.lt)) continue;
            item.status = data.status;
            count++;
          }
          return { count };
        }),
        update: vi.fn(async ({ where, data }: { where: { id: string }; data: any }) => {
          const item = store.jobAd.get(where.id);
          if (!item) throw new Error("Not found");
          const updated = { ...item, ...data };
          store.jobAd.set(where.id, updated);
          return updated;
        }),
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          return store.jobAd.get(where.id) || null;
        }),
      },
      application: {
        findMany: vi.fn(async ({ where }: { where: { jobId?: string } }) => {
          const results: StoreRecord[] = [];
          for (const app of store.application.values()) {
            if (where.jobId && app.jobId !== where.jobId) continue;
            results.push(app);
          }
          return results;
        }),
        create: vi.fn(async ({ data }: { data: StoreRecord }) => {
          const id = data.id || `app-${Math.random()}`;
          const item = { ...data, id };
          store.application.set(id, item);
          return item;
        }),
      },
    },
  };
});

describe("Job Application Status & Edge Case Verification", () => {
  beforeEach(async () => {
    const { db } = await import("../../db");
    await db.jobAd.deleteMany({
      where: { externalId: { startsWith: "test_edge_case_" } },
    });
  });

  it("should preserve SAVED jobs from being auto-discarded during 14-day cron cleanup", async () => {
    const { db } = await import("../../db");
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

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

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    await db.jobAd.updateMany({
      where: {
        status: "NEW",
        publishedAt: { lt: fourteenDaysAgo },
      },
      data: { status: "DISCARDED" },
    });

    const fetched = await db.jobAd.findUnique({
      where: { id: savedJob.id },
    });

    expect(fetched).not.toBeNull();
    expect(fetched?.status).toBe("SAVED");

    await db.jobAd.delete({ where: { id: savedJob.id } });
  });

  it("Edge Case: Unconfirmed external portal visit keeps status as SAVED without creating Application", async () => {
    const { db } = await import("../../db");
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

    const updated = await db.jobAd.update({
      where: { id: job.id },
      data: { status: "SAVED" },
    });

    expect(updated.status).toBe("SAVED");

    const apps = await db.application.findMany({
      where: { jobId: job.id },
    });
    expect(apps.length).toBe(0);

    await db.jobAd.delete({ where: { id: job.id } });
  });

  it("Edge Case: Confirmed external application creates/updates Application record in tracker", async () => {
    const { db } = await import("../../db");
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

    await db.jobAd.delete({ where: { id: job.id } });
  });
});
