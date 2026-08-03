import { describe, it, expect } from "vitest";
import { decisionSupportEngine } from "../decisionSupport";

describe("Phase 5: Decision Support Engine", () => {
  it("synthesizes all 5 stages into a unified Decision Support context", () => {
    const opp = {
      id: "job-1",
      title: "Senior Quality Systems Specialist",
      company: "AstraZeneca",
      location: "Södertälje",
      description: "Requires expertise in Lean Six Sigma, DMAIC, root cause analysis, and pharmaceutical ISO standards.",
      workingModel: "HYBRID" as const,
    };

    const candidateProfile = {
      name: "Anna",
      targetRoleTitle: "Quality Specialist",
      superpowers: ["DMAIC problem solving", "ISO compliance"],
      verifiedEvidence: [
        {
          id: "ev-1",
          achievementText: "Reduced process variability by 30% using DMAIC and SPC",
          associatedCompetency: "DMAIC",
        },
      ],
    };

    const preferences = {
      targetRoles: ["Quality Specialist", "Quality Systems"],
      preferredLocations: ["Södertälje", "Stockholm"],
      skills: ["DMAIC", "Lean Six Sigma", "ISO 9001"],
      workingModelPreference: "HYBRID" as const,
    };

    const result = decisionSupportEngine.evaluateDecisionSupport(opp, candidateProfile, preferences);

    expect(result.stage1Opportunity.tier).toBe("EXCELLENT_MATCH");
    expect(result.stage2Competencies.matchedTransferableSkills.length).toBeGreaterThan(0);
    expect(result.stage3Positioning.cvEmphasisOrder.length).toBeGreaterThan(0);
    expect(result.stage4Coaching.nonFabricationGuarantee).toBe(true);
    expect(result.stage5UserDecisionPrompt.decisionQuestion).toContain("Anna");
    expect(result.stage5UserDecisionPrompt.actionOptions.length).toBe(4);
  });
});
