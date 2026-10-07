import { describe, it, expect } from "vitest";
import { calculateRecruiterAnalytics } from "../recruiter";
import type { Application, JobAd } from "@/types/domain";

function createMockJob(company: string): JobAd {
  return {
    id: `job-${company}`,
    externalId: `ext-${company}`,
    title: "Engineer",
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

describe("Recruiter Intelligence", () => {
  it("returns empty array when applications list is empty", () => {
    const metrics = calculateRecruiterAnalytics([]);
    expect(metrics).toEqual([]);
  });

  it("produces distinct recruiter metrics for multiple employers with accurate reply-rate and interview count", () => {
    const apps: Application[] = [
      // Ericsson: 2 applications, 1 interview
      createMockApp({
        id: "a1",
        job: createMockJob("Ericsson"),
        status: "INTERVIEWING",
      }),
      createMockApp({
        id: "a2",
        job: createMockJob("Ericsson"),
        status: "APPLIED",
      }),
      // Klarna: 1 application, 1 offer
      createMockApp({
        id: "a3",
        job: createMockJob("Klarna"),
        status: "OFFER",
      }),
    ];

    const metrics = calculateRecruiterAnalytics(apps);

    // Verifies distinct recruiter metrics per company (not collapsed into Direct Employer)
    expect(metrics.length).toBe(2);

    const ericsson = metrics.find((m) => m.company === "Ericsson");
    expect(ericsson).toBeDefined();
    expect(ericsson?.name).toBe("Talent Acquisition (Ericsson)");
    expect(ericsson?.totalApplications).toBe(2);
    expect(ericsson?.totalInterviews).toBe(1);
    expect(ericsson?.replyRate).toBe(50);

    const klarna = metrics.find((m) => m.company === "Klarna");
    expect(klarna).toBeDefined();
    expect(klarna?.name).toBe("Talent Acquisition (Klarna)");
    expect(klarna?.totalApplications).toBe(1);
    expect(klarna?.totalInterviews).toBe(1);
    expect(klarna?.replyRate).toBe(100);
  });

  it("falls back to Direct Employer when app.job is missing or company is empty", () => {
    const apps: Application[] = [
      createMockApp({
        id: "a1",
        job: undefined,
        status: "INTERVIEWING",
      }),
      createMockApp({
        id: "a2",
        job: createMockJob(""),
        status: "APPLIED",
      }),
    ];

    const metrics = calculateRecruiterAnalytics(apps);
    expect(metrics.length).toBe(1);
    expect(metrics[0].company).toBe("Direct Employer");
    expect(metrics[0].name).toBe("Talent Acquisition (Direct Employer)");
    expect(metrics[0].totalApplications).toBe(2);
    expect(metrics[0].totalInterviews).toBe(1);
  });
});
