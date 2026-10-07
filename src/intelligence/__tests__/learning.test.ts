import { describe, it, expect } from "vitest";
import { calculateHighestRoiCourse, calculateUpskillingRoadmap } from "../learning";
import type { JobAd } from "@/types/domain";

function createMockJob(overrides: Partial<JobAd> = {}): JobAd {
  return {
    id: "job-1",
    externalId: "ext-1",
    title: "Software Engineer",
    company: "Acme AB",
    location: "Stockholm",
    description: "Developing systems.",
    webpageUrl: null,
    source: "Platsbanken",
    publishedAt: "2026-10-01T10:00:00.000Z",
    deadline: null,
    matchScore: 75,
    matchedSkills: "[]",
    missingSkills: "[]",
    domainScores: "{}",
    status: "NEW",
    ...overrides,
  };
}

describe("Learning Intelligence", () => {
  describe("calculateHighestRoiCourse", () => {
    it("returns fallback Core Competence Mastery when jobs array is empty", () => {
      const result = calculateHighestRoiCourse([]);
      expect(result.highestRoiCourse).toBe("Core Competence Mastery");
      expect(result.courseProvider).toBe("Self-Paced Learning");
      expect(result.projectedScoreBoostPct).toBe(15);
      expect(result.unlockedPositionCount).toBe(5);
    });

    it("activates dynamic course recommendation when valid serialized missingSkills exist", () => {
      const jobs: JobAd[] = [
        createMockJob({ id: "j1", missingSkills: JSON.stringify(["Kubernetes", "Docker"]) }),
        createMockJob({ id: "j2", missingSkills: JSON.stringify(["Kubernetes", "Terraform"]) }),
        createMockJob({ id: "j3", missingSkills: JSON.stringify(["Docker"]) }),
      ];

      const result = calculateHighestRoiCourse(jobs);
      expect(result.highestRoiCourse).toBe("Kubernetes Fundamentals & Mastery");
      expect(result.courseProvider).toBe("Industry Certification / Docs");
      expect(result.unlockedPositionCount).toBe(2);
      expect(result.projectedScoreBoostPct).toBeGreaterThanOrEqual(10);
    });

    it("handles malformed JSON missingSkills safely without throwing", () => {
      const jobs: JobAd[] = [
        createMockJob({ id: "j1", missingSkills: "{ malformed json" }),
        createMockJob({ id: "j2", missingSkills: "invalid" }),
      ];

      const result = calculateHighestRoiCourse(jobs);
      expect(result.highestRoiCourse).toBe("Core Competence Mastery");
      expect(result.courseProvider).toBe("Self-Paced Learning");
      expect(result.projectedScoreBoostPct).toBe(15);
    });

    it("handles empty string, whitespace, and empty array missingSkills safely", () => {
      const jobs: JobAd[] = [
        createMockJob({ id: "j1", missingSkills: "" }),
        createMockJob({ id: "j2", missingSkills: "   " }),
        createMockJob({ id: "j3", missingSkills: "[]" }),
      ];

      const result = calculateHighestRoiCourse(jobs);
      expect(result.highestRoiCourse).toBe("Core Competence Mastery");
    });
  });

  describe("calculateUpskillingRoadmap", () => {
    it("returns default roadmap when jobs array is empty or lacks skills", () => {
      const result = calculateUpskillingRoadmap([]);
      expect(result.length).toBe(2);
      expect(result[0].skill).toBe("Software & Systems Architecture");
      expect(result[1].skill).toBe("Quality Assurance & Compliance");
    });

    it("computes live upskilling roadmap using serialized matchedSkills and missingSkills", () => {
      const jobs: JobAd[] = [
        createMockJob({
          id: "j1",
          matchedSkills: JSON.stringify(["React", "TypeScript"]),
          missingSkills: JSON.stringify(["Docker"]),
        }),
        createMockJob({
          id: "j2",
          matchedSkills: JSON.stringify(["React"]),
          missingSkills: JSON.stringify(["Docker", "AWS"]),
        }),
      ];

      const result = calculateUpskillingRoadmap(jobs);
      expect(result.length).toBeGreaterThan(0);
      const skillNames = result.map((r) => r.skill);
      expect(skillNames).toContain("React");
      expect(skillNames).toContain("Docker");
      expect(result.find((r) => r.skill === "React")?.count).toBe(2);
      expect(result.find((r) => r.skill === "Docker")?.count).toBe(2);
      expect(result.find((r) => r.skill === "AWS")?.count).toBe(1);
    });
  });
});
