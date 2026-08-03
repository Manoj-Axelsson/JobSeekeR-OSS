import { describe, it, expect } from "vitest";
import { applicationCoachingAdvisor } from "../advisor";

describe("Phase 4: Application Coaching Engine", () => {
  it("provides authentic coaching advice and enforces non-fabrication guarantee", () => {
    const opp = {
      id: "job-1",
      title: "Systems Quality Engineer",
      company: "SAAB Aeronautics",
      location: "Linköping",
      description: "Looking for a systems engineer focused on ISO 9001 and root cause analysis.",
      workingModel: "HYBRID" as const,
    };

    const candidate = {
      name: "Anna",
      targetRoleTitle: "Quality Engineer",
      superpowers: ["Systems engineering", "ISO 9001 compliance"],
      verifiedEvidence: [
        {
          id: "ev-1",
          achievementText: "Led ISO 9001 compliance audit passing with 100% score",
          associatedCompetency: "ISO 9001",
        },
      ],
    };

    const result = applicationCoachingAdvisor.generateCoaching(opp, candidate);

    expect(result.nonFabricationGuarantee).toBe(true);
    expect(result.keyInterviewTalkingPoints.length).toBeGreaterThan(0);
    expect(result.coachingGuidance[0]).toContain("authentic motivation");
    expect(result.coverLetterHook).toContain("SAAB Aeronautics");
  });
});
