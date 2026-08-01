import { describe, it, expect, beforeEach } from "vitest";
import { pruneExpiredData } from "../retention";
import { db } from "../../db";

describe("12-Month Retention Policy Service", () => {
  beforeEach(async () => {
    // Clean up test items
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
    const oldDate = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000); // 400 days old
    const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days old

    // Create old job ad
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

    // Create recent job ad
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

    // Run pruning
    const result = await pruneExpiredData(365);
    expect(result.purgedAdsCount).toBeGreaterThanOrEqual(1);

    // Verify old job ad was deleted
    const oldFound = await db.jobAd.findUnique({
      where: { externalId: "test_retention_old_1" },
    });
    expect(oldFound).toBeNull();

    // Verify recent job ad was preserved
    const recentFound = await db.jobAd.findUnique({
      where: { externalId: "test_retention_recent_1" },
    });
    expect(recentFound).not.toBeNull();

    // Clean up test item
    await db.jobAd.deleteMany({
      where: { externalId: "test_retention_recent_1" },
    });
  });
});
