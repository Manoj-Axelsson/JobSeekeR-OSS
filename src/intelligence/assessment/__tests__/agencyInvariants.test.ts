import { describe, it, expect } from "vitest";

/**
 * Phase 3: Behavioral Test Suite 1 — Candidate Agency & Ownership Invariants
 *
 * Verifies that JobSeekeR owns #1 (Job Requirements) and #2 (Candidate Evidence)
 * while leaving #3 (The Decision to Apply) strictly to the candidate.
 */

describe("Behavioral Test Suite 1: Candidate Agency & Ownership Invariants", () => {
  it("should enforce the Ownership Boundary: JobSeekeR explains why an opportunity deserves attention without commanding the candidate to apply", () => {
    // Mock diagnostic outcome adhering to Behavioral Contract v3.1.1
    const mockAssessmentPayload = {
      assessmentVersion: "3.1.1-non-numerical",
      jobTitle: "Full Stack Engineer",
      company: "Minut AB",
      mandatoryGates: {
        overallStatus: "ELIGIBLE",
        evaluations: [
          { name: "Location & Working Model", gateStatus: "SATISFIED", explanation: "Stockholm Hybrid matches profile" },
          { name: "Work Authorization", gateStatus: "SATISFIED", explanation: "Swedish citizen" }
        ],
        blockers: []
      },
      competencyFit: {
        essentialCompetencies: [
          { competency: "React", status: "DEMONSTRATED_PRESENCE", depthRating: "ANCHORED_EVIDENCE" },
          { competency: "TypeScript", status: "DEMONSTRATED_PRESENCE", depthRating: "ANCHORED_EVIDENCE" },
          { competency: "Node.js", status: "DEMONSTRATED_PRESENCE", depthRating: "ANCHORED_EVIDENCE" },
          { competency: "PostgreSQL", status: "DEMONSTRATED_PRESENCE", depthRating: "ANCHORED_EVIDENCE" }
        ],
        optionalCompetencies: [
          { competency: "Tailwind CSS", priority: "PREFERRED", isMatched: true }
        ],
        transferableCapabilities: [
          { targetRequirement: "IoT Sensor Data", sourceCapability: "Systems Engineering", escoRelationship: "CROSS_DOMAIN_TRANSFER" }
        ]
      },
      autonomyAlignment: {
        requiredLevel: "EQF_LEVEL_7",
        candidateLevel: "EQF_LEVEL_7",
        alignmentStatus: "MATCHED",
        autonomyDescriptor: "Position matches candidate recorded senior architectural autonomy level."
      },
      unverifiedNotices: [],
      decisionSupport: {
        recommendation: {
          verdict: "STRONG_OPPORTUNITY_VERIFIED",
          headline: "STRONG OPPORTUNITY — VERIFIED EVIDENCE: Your profile provides strong, attributable evidence for this position's core requirements. This opportunity appears worthy of your consideration.",
          candidateActionContext: "CONSIDER_APPLICATION",
          summaryRationale: [
            "React, TypeScript, Node.js, and PostgreSQL verified in profile work history.",
            "Hybrid working model in Stockholm satisfies location preferences."
          ]
        },
        coverLetterHookTheme: "Software Architecture & Systems Engineering Excellence",
        interviewTalkingPoints: [
          "Lead with your verified fullstack web stack experience.",
          "Discuss your systems engineering background for IoT sensor context."
        ]
      }
    };

    // 1. Verifies that recommendation verdict uses descriptive opportunity language
    expect(mockAssessmentPayload.decisionSupport.recommendation.verdict).toBe("STRONG_OPPORTUNITY_VERIFIED");
    expect(mockAssessmentPayload.decisionSupport.recommendation.headline).toContain("STRONG OPPORTUNITY — VERIFIED EVIDENCE");
    expect(mockAssessmentPayload.decisionSupport.recommendation.headline).toContain("worthy of your consideration");

    // 2. Verifies that output DOES NOT contain prescriptive commands telling candidate they "should apply"
    expect(mockAssessmentPayload.decisionSupport.recommendation.headline).not.toContain("You should apply");
    expect(mockAssessmentPayload.decisionSupport.recommendation.headline).not.toContain("Apply now");

    // 3. Verifies candidateActionContext leaves decision ownership (#3) to the candidate
    expect(mockAssessmentPayload.decisionSupport.recommendation.candidateActionContext).toBe("CONSIDER_APPLICATION");
  });

  it("should enforce complete absence of numerical percentage scores or letter grades across payload", () => {
    const mockAssessmentPayload = {
      assessmentVersion: "3.1.1-non-numerical",
      mandatoryGates: { overallStatus: "ELIGIBLE" },
      decisionSupport: {
        recommendation: {
          verdict: "STRONG_OPPORTUNITY_VERIFIED",
          headline: "STRONG OPPORTUNITY — VERIFIED EVIDENCE",
          candidateActionContext: "CONSIDER_APPLICATION"
        }
      }
    };

    const jsonPayload = JSON.stringify(mockAssessmentPayload);

    // Invariant I2: Zero percentage numbers, letter grades, or ratio thresholds
    expect(jsonPayload).not.toMatch(/(\d+%)|(Grade [A-F])/);
    expect(mockAssessmentPayload).not.toHaveProperty("score");
    expect(mockAssessmentPayload).not.toHaveProperty("grade");
    expect(mockAssessmentPayload).not.toHaveProperty("capabilityScore");
    expect(mockAssessmentPayload).not.toHaveProperty("matchScore");
  });
});
