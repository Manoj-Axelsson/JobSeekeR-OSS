import { describe, it, expect, vi, beforeEach } from "vitest";
import { pruneExpiredData } from "../retention";

interface StoreRecord {
  id: string;
  externalId?: string;
  publishedAt?: Date;
  status?: string;
  scannedAt?: Date;
  [key: string]: unknown;
}

vi.mock("../../db", () => {
  const store = {
    jobAd: new Map<string, StoreRecord>(),
    scanLog: new Map<string, StoreRecord>(),
  };

  return {
    db: {
      jobAd: {
        deleteMany: vi.fn(async ({ where }: { where?: any }) => {
          let count = 0;
          if (where?.externalId?.startsWith) {
            const prefix = where.externalId.startsWith;
            for (const [id, job] of store.jobAd.entries()) {
              if (job.externalId && (job.externalId as string).startsWith(prefix)) {
                store.jobAd.delete(id);
                count++;
              }
            }
          } else if (where?.publishedAt?.lt) {
            for (const [id, job] of store.jobAd.entries()) {
              if (job.publishedAt && job.publishedAt < where.publishedAt.lt) {
                if (where.status?.in && where.status.in.includes(job.status)) {
                  store.jobAd.delete(id);
                  count++;
                }
              }
            }
          } else {
            store.jobAd.clear();
          }
          return { count };
        }),
        create: vi.fn(async ({ data }: { data: StoreRecord }) => {
          const id = data.id || `job-${Math.random()}`;
          const item = { ...data, id };
          store.jobAd.set(id, item);
          return item;
        }),
        findFirst: vi.fn(async ({ where }: { where: { externalId?: string; id?: string } }) => {
          for (const item of store.jobAd.values()) {
            if (where.externalId && item.externalId === where.externalId) return item;
            if (where.id && item.id === where.id) return item;
          }
          return null;
        }),
        findUnique: vi.fn(async ({ where }: { where: { externalId?: string; id?: string } }) => {
          for (const item of store.jobAd.values()) {
            if (where.externalId && item.externalId === where.externalId) return item;
            if (where.id && item.id === where.id) return item;
          }
          return null;
        }),
      },
      scanLog: {
        deleteMany: vi.fn(async ({ where }: { where?: any }) => {
          let count = 0;
          if (where?.scannedAt?.lt) {
            for (const [id, log] of store.scanLog.entries()) {
              if (log.scannedAt && log.scannedAt < where.scannedAt.lt) {
                store.scanLog.delete(id);
                count++;
              }
            }
          } else {
            store.scanLog.clear();
          }
          return { count };
        }),
      },
    },
  };
});

describe("12-Month Retention Policy Service", () => {
  beforeEach(async () => {
    const { db } = await import("../../db");
    await db.jobAd.deleteMany({
      where: { externalId: { startsWith: "test_retention_" } },
    });
  });

  it("should calculate cutoff date correctly for 365 days", async () => {
    const result = await pruneExpiredData(365);
    const expectedCutoffApprox = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).getTime();
    
    expect(result.cutoffDate.getTime()).toBeCloseTo(expectedCutoffApprox, -3);
    expect(typeof result.purgedAdsCount).toBe("number");
    expect(typeof result.purgedLogsCount).toBe("number");
  });

  it("should delete job ads older than 365 days with status NEW or DISCARDED", async () => {
    const { db } = await import("../../db");
    const oldDate = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
    const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    await db.jobAd.create({
      data: {
        externalId: "test_retention_old_1",
        title: "Old Senior Developer",
        company: "Legacy Systems",
        location: "Stockholm",
        description: "Old job ad description",
        publishedAt: oldDate,
        matchScore: 80,
        matchedSkills: "[]",
        missingSkills: "[]",
        domainScores: "{}",
        status: "NEW",
      },
    });

    await db.jobAd.create({
      data: {
        externalId: "test_retention_recent_1",
        title: "Recent Developer",
        company: "Modern Tech",
        location: "Stockholm",
        description: "Recent job ad description",
        publishedAt: recentDate,
        matchScore: 85,
        matchedSkills: "[]",
        missingSkills: "[]",
        domainScores: "{}",
        status: "NEW",
      },
    });

    const result = await pruneExpiredData(365);
    expect(result.purgedAdsCount).toBeGreaterThanOrEqual(1);

    const oldFound = await db.jobAd.findFirst({
      where: { externalId: "test_retention_old_1" },
    });
    expect(oldFound).toBeNull();

    const recentFound = await db.jobAd.findFirst({
      where: { externalId: "test_retention_recent_1" },
    });
    expect(recentFound).not.toBeNull();
  });
});
