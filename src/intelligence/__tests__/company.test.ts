import { describe, it, expect } from "vitest";
import { getMostResponsiveCompany } from "../company";
import type { Application, JobAd } from "@/types/domain";

function createMockJob(company: string): JobAd {
  return {
    id: `job-${company}`,
    externalId: `ext-${company}`,
    title: "Developer",
    company,
    location: "Stockholm",
    description: "Job desc",
    webpageUrl: null,
    source: "Platsbanken",
    publishedAt: "2026-10-01T10:00:00.000Z",
    deadline: null,
    matchScore: 80,
    matchedSkills: "[]",
    missingSkills: "[]",
    domainScores: "{}",
    status: "APPLIED",
  };
}

function createMockApp(overrides: Partial<Application> = {}): Application {
  return {
    id: "app-1",
    jobId: "job-1",
    status: "APPLIED",
    appliedAt: "2026-10-02T10:00:00.000Z",
    resumeVersion: "v1",
    notes: null,
    monthlyTag: "2026-10",
    ...overrides,
  };
}

describe("Company Intelligence", () => {
  it("returns fallback when applications list is empty", () => {
    const result = getMostResponsiveCompany([]);
    expect(result.companyName).toBe("No Applications Logged");
    expect(result.replyRatePct).toBe(0);
    expect(result.avgResponseDays).toBe(0);
  });

  it("correctly groups applications by app.job.company across multiple employers", () => {
    const apps: Application[] = [
      // Spotify: 2 applications, 2 responses (100% reply rate)
      createMockApp({
        id: "a1",
        job: createMockJob("Spotify"),
        status: "INTERVIEWING",
      }),
      createMockApp({
        id: "a2",
        job: createMockJob("Spotify"),
        status: "OFFER",
      }),
      // Volvo: 2 applications, 1 response (50% reply rate)
      createMockApp({
        id: "a3",
        job: createMockJob("Volvo"),
        status: "REJECTED",
      }),
      createMockApp({
        id: "a4",
        job: createMockJob("Volvo"),
        status: "APPLIED", // pending
      }),
    ];

    const result = getMostResponsiveCompany(apps);
    expect(result.companyName).toBe("Spotify");
    expect(result.replyRatePct).toBe(100);
    expect(result.avgResponseDays).toBe(4.5);
  });

  it("falls back to Direct Employer when app.job is missing or company is empty", () => {
    const apps: Application[] = [
      createMockApp({
        id: "a1",
        job: undefined, // Missing job relation
        status: "INTERVIEWING",
      }),
      createMockApp({
        id: "a2",
        job: createMockJob(""), // Empty company string
        status: "APPLIED",
      }),
    ];

    const result = getMostResponsiveCompany(apps);
    expect(result.companyName).toBe("Direct Employer");
    expect(result.replyRatePct).toBe(50); // 1 response out of 2
  });
});
