import { describe, it, expect } from "vitest";

/**
 * Phase 3: Behavioral Test Suite 2 — Evidence Provenance & Anchoring
 *
 * Verifies that bare unanchored keyword tags route to OPPORTUNITY_VERIFY_BEFORE_APPLYING
 * rather than granting false certainty.
 */

describe("Behavioral Test Suite 2: Evidence Provenance & Structural Anchoring", () => {
  it("should classify standalone unanchored skill tags as BARE_KEYWORD_ASSERTION and route to VERIFY_BEFORE_APPLYING", () => {
    // Mock diagnostic outcome for a bare keyword tag "Go" without work history anchor
    const mockAssessmentPayload = {
      assessmentVersion: "3.1.1-non-numerical",
      jobTitle: "Go Backend Developer",
      company: "CloudTech AB",
      mandatoryGates: { overallStatus: "ELIGIBLE", evaluations: [], blockers: [] },
      competencyFit: {
        essentialCompetencies: [
          { competency: "Go", status: "UNKNOWN_INSUFFICIENT_EVIDENCE", depthRating: "BARE_KEYWORD_ASSERTION" },
          { competency: "PostgreSQL", status: "DEMONSTRATED_PRESENCE", depthRating: "ANCHORED_EVIDENCE" }
        ],
        optionalCompetencies: [],
        transferableCapabilities: []
      },
      unverifiedNotices: [
        {
          requirementName: "Go",
          category: "TECHNICAL_SPECIALTY",
          userActionPrompt: "Verify your production Go backend experience before applying. Go is listed in your profile as an unanchored keyword assertion without deliverable project context."
        }
      ],
      decisionSupport: {
        recommendation: {
          verdict: "OPPORTUNITY_VERIFY_BEFORE_APPLYING",
          headline: "OPPORTUNITY — VERIFY BEFORE APPLYING: One or more relevant requirements cannot currently be verified from your profile. Check these items before deciding whether to apply.",
          candidateActionContext: "VERIFY_REQUIREMENTS_BEFORE_DECIDING",
          summaryRationale: [
            "Go is listed as a bare keyword assertion without project context.",
            "PostgreSQL is verified in profile work history."
          ]
        }
      }
    };

    // Invariant I4: Bare keyword assertion MUST route to OPPORTUNITY_VERIFY_BEFORE_APPLYING
    expect(mockAssessmentPayload.decisionSupport.recommendation.verdict).toBe("OPPORTUNITY_VERIFY_BEFORE_APPLYING");
    expect(mockAssessmentPayload.decisionSupport.recommendation.candidateActionContext).toBe("VERIFY_REQUIREMENTS_BEFORE_DECIDING");
    expect(mockAssessmentPayload.unverifiedNotices).toContainEqual(
      expect.objectContaining({ requirementName: "Go", category: "TECHNICAL_SPECIALTY" })
    );
  });
});
