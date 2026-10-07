import { describe, it, expect } from "vitest";
import { generateTodaysRecommendations } from "../recommendations";
import type { JobAd, Application } from "@/types/domain";

function createMockJob(overrides: Partial<JobAd> = {}): JobAd {
  return {
    id: "job-1",
    externalId: "ext-1",
    title: "Senior Cloud Architect",
    company: "CloudTech AB",
    location: "Gothenburg",
    description: "Cloud systems.",
    webpageUrl: "https://example.com/job/1",
    source: "Platsbanken",
    publishedAt: "2026-10-01T10:00:00.000Z",
    deadline: null,
    matchScore: 85,
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

describe("Recommendations Intelligence", () => {
  it("activates dynamic rec_skill_demand recommendation when valid missing skills exist", () => {
    const jobs: JobAd[] = [
      createMockJob({
        id: "j1",
        missingSkills: JSON.stringify(["Terraform", "Kubernetes"]),
      }),
      createMockJob({
        id: "j2",
        missingSkills: JSON.stringify(["Terraform"]),
      }),
    ];

    const recs = generateTodaysRecommendations(jobs, []);
    const skillRec = recs.find((r) => r.type === "UPSKILLING");

    expect(skillRec).toBeDefined();
    expect(skillRec?.id).toBe("rec_skill_demand");
    expect(skillRec?.title).toContain('Add "Terraform"');
    expect(skillRec?.rationale).toContain('"Terraform" is requested in 2 open position(s)');
    expect(skillRec?.priorityBadge).toBe("🎓 In-Demand Competence");
    expect(skillRec?.actionType).toBe("NAVIGATE_TAB");
  });

  it("falls back to rec_skill_profile when no missing skills exist", () => {
    const jobs: JobAd[] = [
      createMockJob({
        id: "j1",
        missingSkills: "[]",
      }),
    ];

    const recs = generateTodaysRecommendations(jobs, []);
    const skillRec = recs.find((r) => r.type === "UPSKILLING");

    expect(skillRec).toBeDefined();
    expect(skillRec?.id).toBe("rec_skill_profile");
    expect(skillRec?.title).toBe("Customize Target Roles & Competences");
    expect(skillRec?.actionType).toBe("NAVIGATE_TAB");
  });

  it("retains priority action for top matched opportunity and application tracker navigation", () => {
    const jobs: JobAd[] = [
      createMockJob({ id: "j1", matchScore: 92, title: "Principal Architect", status: "NEW" }),
    ];
    const apps: Application[] = [createMockApp({ id: "a1" })];

    const recs = generateTodaysRecommendations(jobs, apps);

    // Job Recommendation
    const jobRec = recs.find((r) => r.type === "JOB_APPLICATION");
    expect(jobRec?.id).toBe("rec_job_top");
    expect(jobRec?.title).toContain("Principal Architect");
    expect(jobRec?.targetJobId).toBe("j1");
    expect(jobRec?.actionType).toBe("OPEN_JOB_MODAL");

    // CV Tracker Recommendation
    const cvRec = recs.find((r) => r.type === "CV_OPTIMIZATION");
    expect(cvRec?.id).toBe("rec_cv_tracker");
    expect(cvRec?.title).toContain("1 Positions Logged");
    expect(cvRec?.actionType).toBe("NAVIGATE_TAB");
  });
});
