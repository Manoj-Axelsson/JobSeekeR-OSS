import { describe, it, expect } from "vitest";
import { positioningAnalyzer } from "../analyzer";

describe("Phase 3: Positioning Intelligence Engine", () => {
  it("analyzes existing evidence and advises structural layout order without content fabrication", () => {
    const opp = {
      id: "job-1",
      title: "Operational Excellence & Quality Manager",
      company: "Scania CV AB",
      location: "Södertälje",
      description: "Requires expertise in Lean Six Sigma, DMAIC, and Root Cause Analysis for heavy vehicle manufacturing.",
      workingModel: "ON_SITE" as const,
    };

    const candidate = {
      name: "Anna",
      targetRoleTitle: "Quality Specialist",
      superpowers: ["Data-driven problem solving", "Process optimization"],
      verifiedEvidence: [
        {
          id: "ev-1",
          achievementText: "Reduced factory defect rate by 22% using DMAIC methodology",
          associatedCompetency: "DMAIC",
          quantifiableMetric: "22% defect reduction",
        },
      ],
    };

    const result = positioningAnalyzer.analyzePositioning(opp, candidate);

    expect(result.strongestCompetencies.length).toBeGreaterThan(0);
    expect(result.cvEmphasisOrder[0]).toContain("Move higher");
    expect(result.rationale).toContain("Positioning strategy prioritizes");
  });
});
