import { describe, it, expect } from "vitest";
import { opportunityEvaluator } from "../evaluator";

describe("Phase 2: Opportunity Intelligence Engine", () => {
  it("classifies an opportunity into 5 tiers with pursuit recommendation", () => {
    const opp = {
      id: "job-1",
      title: "Quality Assurance & Continuous Improvement Specialist",
      company: "Volvo Group",
      location: "Göteborg",
      description: "We are seeking a specialist with Lean Six Sigma, DMAIC, and Root Cause Analysis experience.",
      workingModel: "HYBRID" as const,
    };

    const candidateProfile = {
      targetRoles: ["Quality Assurance", "Continuous Improvement"],
      preferredLocations: ["Göteborg"],
      skills: ["Lean Six Sigma", "DMAIC", "5 Whys"],
      workingModelPreference: "HYBRID" as const,
    };

    const result = opportunityEvaluator.evaluateOpportunity(opp, candidateProfile);

    expect(result.tier).toBe("EXCELLENT_MATCH");
    expect(result.tierLabel).toContain("🌟 Excellent Match");
    expect(result.score).toBeGreaterThanOrEqual(88);
    expect(result.pursuitRecommendation).toContain("Strongly Recommended");
    expect(result.keyAdvantages.length).toBeGreaterThan(0);
  });
});
