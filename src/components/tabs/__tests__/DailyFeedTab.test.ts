import { describe, it, expect } from "vitest";
import { filterEligibleJobs, partitionFeeds } from "../DailyFeedTab";
import type { JobAd } from "@/types/domain";

describe("DailyFeedTab Helpers", () => {
  const createMockJob = (overrides: Partial<JobAd>): JobAd => ({
    id: "job-default",
    externalId: "ext-default",
    title: "Software Engineer",
    company: "Tech Corp",
    location: "Stockholm",
    description: "Build robust systems",
    webpageUrl: "https://example.com/job",
    source: "JobTech",
    publishedAt: "2026-07-01T10:00:00.000Z",
    deadline: null,
    matchScore: 80,
    matchedSkills: "[\"TypeScript\", \"React\"]",
    missingSkills: "[]",
    domainScores: "{\"software\": 90}",
    status: "NEW",
    feedType: "PRIMARY",
    ...overrides,
  });

  describe("filterEligibleJobs", () => {
    const jobs: JobAd[] = [
      createMockJob({ id: "1", title: "Frontend Developer", company: "Alpha AB", location: "Stockholm", matchScore: 85, status: "NEW" }),
      createMockJob({ id: "2", title: "Backend Engineer", company: "Beta AB", location: "Göteborg", matchScore: 70, status: "SAVED" }),
      createMockJob({ id: "3", title: "DevOps Engineer", company: "Gamma AB", location: "Malmö", matchScore: 40, status: "NEW" }),
      createMockJob({ id: "4", title: "Fullstack Architect", company: "SpamCorp", location: "Stockholm", matchScore: 95, status: "NEW" }),
      createMockJob({ id: "5", title: "Mobile Developer", company: "Alpha AB", location: "Stockholm", matchScore: 90, status: "APPLIED" }),
      createMockJob({ id: "6", title: "QA Engineer", company: "Delta AB", location: "Uppsala", matchScore: 80, status: "DISCARDED" }),
    ];

    it("filters out APPLIED and DISCARDED jobs when statusFilter is ALL", () => {
      const result = filterEligibleJobs(jobs, "", "ALL", 0, []);
      const ids = result.map((j) => j.id);
      expect(ids).toContain("1");
      expect(ids).toContain("2");
      expect(ids).toContain("3");
      expect(ids).toContain("4");
      expect(ids).not.toContain("5"); // APPLIED
      expect(ids).not.toContain("6"); // DISCARDED
    });

    it("filters strictly by specific status", () => {
      const savedOnly = filterEligibleJobs(jobs, "", "SAVED", 0, []);
      expect(savedOnly.map((j) => j.id)).toEqual(["2"]);

      const appliedOnly = filterEligibleJobs(jobs, "", "APPLIED", 0, []);
      expect(appliedOnly.map((j) => j.id)).toEqual(["5"]);
    });

    it("filters by text search across title, company, and location", () => {
      const byTitle = filterEligibleJobs(jobs, "Backend", "ALL", 0, []);
      expect(byTitle.map((j) => j.id)).toEqual(["2"]);

      const byCompany = filterEligibleJobs(jobs, "Beta", "ALL", 0, []);
      expect(byCompany.map((j) => j.id)).toEqual(["2"]);

      const byLocation = filterEligibleJobs(jobs, "Göteborg", "ALL", 0, []);
      expect(byLocation.map((j) => j.id)).toEqual(["2"]);
    });

    it("filters out jobs below minScore threshold", () => {
      const result = filterEligibleJobs(jobs, "", "ALL", 75, []);
      const ids = result.map((j) => j.id);
      expect(ids).toContain("1");
      expect(ids).toContain("4");
      expect(ids).not.toContain("2"); // 70 < 75
      expect(ids).not.toContain("3"); // 40 < 75
    });

    it("filters out jobs from excluded companies (case-insensitive substring)", () => {
      const result = filterEligibleJobs(jobs, "", "ALL", 0, ["SpamCorp"]);
      const ids = result.map((j) => j.id);
      expect(ids).not.toContain("4");
      expect(ids).toContain("1");
    });
  });

  describe("partitionFeeds", () => {
    it("partitions jobs into Primary (up to 15) and Discovery (up to 10) sorted newest first", () => {
      const jobs: JobAd[] = [];
      for (let i = 1; i <= 30; i++) {
        jobs.push(
          createMockJob({
            id: `job-${i}`,
            publishedAt: `2026-07-${String(i).padStart(2, "0")}T10:00:00.000Z`,
            feedType: i <= 20 ? "PRIMARY" : "DISCOVERY",
          })
        );
      }

      const { primaryJobs, discoveryJobs } = partitionFeeds(jobs, "ALL");

      // Up to 15 primary jobs
      expect(primaryJobs.length).toBe(15);
      // Newest publishedAt first
      expect(primaryJobs[0].id).toBe("job-20");
      expect(primaryJobs[14].id).toBe("job-6");

      // Up to 10 discovery jobs (remaining jobs not in primary)
      expect(discoveryJobs.length).toBe(10);
      expect(discoveryJobs[0].id).toBe("job-30");

      // Primary and Discovery sets must have zero overlap
      const primarySet = new Set(primaryJobs.map((j) => j.id));
      for (const dj of discoveryJobs) {
        expect(primarySet.has(dj.id)).toBe(false);
      }
    });

    it("evaluates specific search profile when selectedProfileId is provided", () => {
      const jobA = createMockJob({
        id: "job-A",
        publishedAt: "2026-07-10T10:00:00.000Z",
        feedType: "DISCOVERY",
        profileEvaluations: [
          {
            id: "eval-1",
            jobId: "job-A",
            searchProfileId: "sp-systems",
            feedType: "PRIMARY",
            eligibilityStatus: "ELIGIBLE",
            capabilityScore: 90,
            intentScore: 85,
            totalMatchScore: 88,
          },
        ],
      });

      const { primaryJobs } = partitionFeeds([jobA], "sp-systems");
      expect(primaryJobs.map((j) => j.id)).toContain("job-A");

      const { primaryJobs: defaultPrimary } = partitionFeeds([jobA], "ALL");
      expect(defaultPrimary.map((j) => j.id)).not.toContain("job-A");
    });
  });
});
