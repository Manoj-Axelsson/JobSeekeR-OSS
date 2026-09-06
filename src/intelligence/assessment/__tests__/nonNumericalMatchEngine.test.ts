import { describe, it, expect } from "vitest";
import { computeMatchDiagnostics } from "../NonNumericalMatchEngine";

describe("NonNumericalMatchEngine (v3.1.1 Unit Tests)", () => {
  it("should compute ALL_ESSENTIAL_ANCHORED when all essential skills are demonstrated with anchored evidence", () => {
    const job = {
      title: "Fullstack Developer",
      company: "Nordic Tech AB",
      requirements: ["React", "TypeScript", "Node.js"],
    };

    const profile = {
      skills: ["React", "TypeScript", "Node.js"],
      experiences: [
        {
          title: "Fullstack Developer",
          company: "Nordic Tech AB",
          description: "Developed web apps using React, TypeScript, Node.js",
          skillsUsed: ["React", "TypeScript", "Node.js"],
        },
      ],
    };

    const result = computeMatchDiagnostics(job, profile);
    expect(result.aggregateEvidenceCondition).toBe("ALL_ESSENTIAL_ANCHORED");
    expect(result.essentialCompetencies.every((c) => c.status === "DEMONSTRATED_PRESENCE")).toBe(true);
    expect(result.unverifiedNotices).toHaveLength(0);
  });

  it("should compute UNVERIFIED_ESSENTIALS_PRESENT and generate notices when essential skill is unrecorded or bare keyword", () => {
    const minutJob = {
      title: "Full Stack Engineer",
      company: "Minut AB",
      requirements: ["React", "TypeScript", "Node.js", "PostgreSQL", "Python"],
    };

    const maaxProfile = {
      skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
      experiences: [
        {
          title: "Fullstack Developer",
          company: "Tech AB",
          description: "Built React and Node.js web services with PostgreSQL",
          skillsUsed: ["React", "TypeScript", "Node.js", "PostgreSQL"],
        },
      ],
    };

    const result = computeMatchDiagnostics(minutJob, maaxProfile);
    expect(result.aggregateEvidenceCondition).toBe("UNVERIFIED_ESSENTIALS_PRESENT");

    const pythonReq = result.essentialCompetencies.find((c) => c.competency === "Python");
    expect(pythonReq?.status).toBe("UNKNOWN_INSUFFICIENT_EVIDENCE");
    expect(pythonReq?.provenance).toBe("NO_MATCH");

    expect(result.unverifiedNotices).toHaveLength(1);
    expect(result.unverifiedNotices[0].requirementName).toBe("Python");
  });
});
