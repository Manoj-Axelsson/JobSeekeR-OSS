import { describe, it, expect } from "vitest";
import { generateExecutiveCareerOverview } from "../analytics";
import type { JobAd, Application } from "@/types/domain";

function createMockJob(overrides: Partial<JobAd> = {}): JobAd {
  return {
    id: "job-1",
    externalId: "ext-1",
    title: "Fullstack Engineer",
    company: "Tech Corp",
    location: "Stockholm",
    description: "Developing apps.",
    webpageUrl: null,
    source: "Platsbanken",
    publishedAt: "2026-10-01T10:00:00.000Z",
    deadline: null,
    matchScore: 80,
    matchedSkills: "[]",
    missingSkills: "[]",
    domainScores: "{}",
    status: "NEW",
    ...overrides,
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

describe("Executive Analytics Intelligence", () => {
  it("derives mostValuableSkill from serialized matchedSkills", () => {
    const jobs: JobAd[] = [
      createMockJob({ id: "j1", matchedSkills: JSON.stringify(["TypeScript", "React"]) }),
      createMockJob({ id: "j2", matchedSkills: JSON.stringify(["TypeScript", "Node.js"]) }),
      createMockJob({ id: "j3", matchedSkills: JSON.stringify(["React"]) }),
    ];
    const apps: Application[] = [
      createMockApp({
        id: "a1",
        job: createMockJob({ id: "j1", company: "Spotify" }),
        status: "INTERVIEWING",
      }),
    ];

    const overview = generateExecutiveCareerOverview(jobs, apps);
    expect(overview.mostValuableSkill).toBe("TypeScript");
    expect(overview.mostResponsiveCompany).toBe("Spotify");
    expect(overview.recruiters.length).toBe(1);
    expect(overview.recruiters[0].company).toBe("Spotify");
  });

  it("falls back to Competence Fit when no valid matched skills exist", () => {
    const jobs: JobAd[] = [
      createMockJob({ id: "j1", matchedSkills: "[]" }),
      createMockJob({ id: "j2", matchedSkills: "{ malformed" }),
    ];

    const overview = generateExecutiveCareerOverview(jobs, []);
    expect(overview.mostValuableSkill).toBe("Competence Fit");
  });

  it("handles canonical applications array without errors", () => {
    const overview = generateExecutiveCareerOverview([], []);
    expect(overview.overallCareerScore).toBeDefined();
    expect(overview.mostValuableSkill).toBe("Competence Fit");
    expect(overview.mostResponsiveCompany).toBe("No Applications Logged");
  });
});
