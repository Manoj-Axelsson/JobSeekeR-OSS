import { describe, it, expect } from "vitest";
import { selectFeedJobs, selectPrimaryFeedJobs, PrimaryFeedItem } from "../feedSelection";

describe("User-Centred Feed Selection Engine (selectFeedJobs)", () => {
  it("partitions eligible jobs into Primary (<= 15) and Discovery (<= 10) with zero overlap, both newest-first", () => {
    const jobs: PrimaryFeedItem[] = Array.from({ length: 30 }, (_, i) => ({
      id: `job_${i + 1}`,
      matchScore: 50 + (i % 40),
      publishedAt: new Date(2026, 8, i + 1), // Sept 1 to Sept 30
      eligibilityStatus: "ELIGIBLE",
    }));

    const { primaryJobs, discoveryJobs } = selectFeedJobs(jobs, 15, 10);

    // Primary contains <= 15
    expect(primaryJobs).toHaveLength(15);
    // Discovery contains <= 10 additional
    expect(discoveryJobs).toHaveLength(10);

    // Both feeds are newest-first
    expect(primaryJobs[0].id).toBe("job_30");
    expect(primaryJobs[14].id).toBe("job_16");
    expect(discoveryJobs[0].id).toBe("job_15");
    expect(discoveryJobs[9].id).toBe("job_6");

    // Zero overlap between feeds
    const primaryIds = new Set(primaryJobs.map((j) => j.id));
    const discoveryIds = new Set(discoveryJobs.map((j) => j.id));
    for (const id of primaryIds) {
      expect(discoveryIds.has(id)).toBe(false);
    }
  });

  it("protects newly published eligible jobs from demotion by older high-scoring jobs (production audit regression scenario)", () => {
    const olderSeptemberJobs: PrimaryFeedItem[] = Array.from({ length: 16 }, (_, i) => ({
      id: `sept_job_${i + 1}`,
      feedType: "PRIMARY",
      eligibilityStatus: "ELIGIBLE",
      matchScore: 90,
      publishedAt: new Date("2026-09-17T10:00:00Z"),
    }));

    const newOctoberJob: PrimaryFeedItem = {
      id: "oct_job_schneider_59",
      title: "Senior Software Engineer",
      company: "Schneider Electric",
      feedType: "PRIMARY",
      eligibilityStatus: "ELIGIBLE",
      matchScore: 59,
      publishedAt: new Date("2026-10-01T08:00:00Z"),
    };

    const allJobs = [newOctoberJob, ...olderSeptemberJobs];

    const { primaryJobs, surplusToDemote } = selectFeedJobs(allJobs, 15, 10);

    expect(primaryJobs).toHaveLength(15);
    expect(primaryJobs.some((j) => j.id === "oct_job_schneider_59")).toBe(true);
    expect(primaryJobs[0].id).toBe("oct_job_schneider_59");
    expect(surplusToDemote).toHaveLength(2);
  });

  it("preserves matchScore relevance ordering when publication dates are identical", () => {
    const pubDate = new Date("2026-10-01T10:00:00Z");
    const jobs: PrimaryFeedItem[] = [
      { id: "job_low", matchScore: 50, publishedAt: pubDate, eligibilityStatus: "ELIGIBLE" },
      { id: "job_high", matchScore: 95, publishedAt: pubDate, eligibilityStatus: "ELIGIBLE" },
      { id: "job_mid", matchScore: 75, publishedAt: pubDate, eligibilityStatus: "ELIGIBLE" },
    ];

    const { primaryJobs } = selectFeedJobs(jobs, 15, 10);

    expect(primaryJobs.map((j) => j.id)).toEqual(["job_high", "job_mid", "job_low"]);
  });

  it("produces 100% deterministic ordering for identical dates and matchScores via id tie-breaking", () => {
    const pubDate = new Date("2026-10-01T12:00:00Z");
    const jobs: PrimaryFeedItem[] = [
      { id: "charlie", matchScore: 60, publishedAt: pubDate, eligibilityStatus: "ELIGIBLE" },
      { id: "alpha", matchScore: 60, publishedAt: pubDate, eligibilityStatus: "ELIGIBLE" },
      { id: "bravo", matchScore: 60, publishedAt: pubDate, eligibilityStatus: "ELIGIBLE" },
    ];

    const run1 = selectFeedJobs(jobs, 15, 10);
    const run2 = selectFeedJobs([...jobs].reverse(), 15, 10);

    expect(run1.primaryJobs.map((j) => j.id)).toEqual(["alpha", "bravo", "charlie"]);
    expect(run2.primaryJobs.map((j) => j.id)).toEqual(["alpha", "bravo", "charlie"]);
  });

  it("safely handles missing, invalid date strings, and null timestamps", () => {
    const jobs: PrimaryFeedItem[] = [
      {
        id: "valid_date",
        matchScore: 50,
        publishedAt: "2026-10-01T10:00:00Z",
        eligibilityStatus: "ELIGIBLE",
      },
      {
        id: "invalid_date",
        matchScore: 80,
        publishedAt: "not-a-date",
        createdAt: "2026-09-01T00:00:00Z",
        eligibilityStatus: "ELIGIBLE",
      },
      {
        id: "null_date",
        matchScore: 90,
        publishedAt: null as any,
        createdAt: null as any,
        eligibilityStatus: "ELIGIBLE",
      },
    ];

    const { primaryJobs } = selectFeedJobs(jobs, 15, 10);

    expect(primaryJobs[0].id).toBe("valid_date");
  });

  it("includes eligible jobs regardless of low matchScore (candidate-led non-blocking feed visibility)", () => {
    const jobs: PrimaryFeedItem[] = [
      {
        id: "low_score_job",
        title: "Junior Developer",
        matchScore: 15,
        publishedAt: new Date("2026-10-01T14:00:00Z"),
        eligibilityStatus: "ELIGIBLE",
      },
      {
        id: "high_score_job",
        title: "Senior Developer",
        matchScore: 95,
        publishedAt: new Date("2026-09-30T10:00:00Z"),
        eligibilityStatus: "ELIGIBLE",
      },
    ];

    const { primaryJobs } = selectFeedJobs(jobs, 15, 10);

    expect(primaryJobs).toHaveLength(2);
    expect(primaryJobs[0].id).toBe("low_score_job");
    expect(primaryJobs[1].id).toBe("high_score_job");
  });
});
