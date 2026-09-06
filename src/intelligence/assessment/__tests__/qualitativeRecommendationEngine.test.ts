import { describe, it, expect } from "vitest";
import { routeQualitativeRecommendation } from "../QualitativeRecommendationEngine";

describe("QualitativeRecommendationEngine (v3.1.1 Unit Tests)", () => {
  it("P1: should route INELIGIBLE statutory gate to INELIGIBLE_REQUIREMENT_UNSATISFIED", () => {
    const result = routeQualitativeRecommendation({
      jobTitle: "Firmware Developer",
      company: "Tech Corp",
      mandatoryGates: {
        overallStatus: "INELIGIBLE",
        evaluations: [{ name: "Security Clearance", gateStatus: "UNSATISFIED", explanation: "Lacks clearance" }],
        blockers: ["Security Clearance UNSATISFIED"],
      },
      matchDiagnostics: {
        essentialCompetencies: [{ competency: "C++", status: "DEMONSTRATED_PRESENCE", depthRating: "ANCHORED_EVIDENCE", provenance: "ANCHORED_EVIDENCE" }],
        optionalCompetencies: [],
        transferableCapabilities: [],
        autonomyAlignment: { requiredLevel: "EQF_LEVEL_7", candidateLevel: "EQF_LEVEL_7", alignmentStatus: "MATCHED", autonomyDescriptor: "" },
        unverifiedNotices: [],
        aggregateEvidenceCondition: "ALL_ESSENTIAL_ANCHORED",
      },
    });

    expect(result.verdict).toBe("INELIGIBLE_REQUIREMENT_UNSATISFIED");
    expect(result.candidateActionContext).toBe("NO_ACTION_INELIGIBLE");
  });

  it("P2: should route VERIFICATION_REQUIRED gate or unverified essential skills to OPPORTUNITY_VERIFY_BEFORE_APPLYING", () => {
    const result = routeQualitativeRecommendation({
      jobTitle: "Fullstack Engineer",
      company: "Nordic AB",
      mandatoryGates: {
        overallStatus: "VERIFICATION_REQUIRED",
        evaluations: [{ name: "Work Authorization", gateStatus: "VERIFICATION_REQUIRED", explanation: "Unmentioned" }],
        blockers: [],
      },
      matchDiagnostics: {
        essentialCompetencies: [{ competency: "React", status: "DEMONSTRATED_PRESENCE", depthRating: "ANCHORED_EVIDENCE", provenance: "ANCHORED_EVIDENCE" }],
        optionalCompetencies: [],
        transferableCapabilities: [],
        autonomyAlignment: { requiredLevel: "EQF_LEVEL_7", candidateLevel: "EQF_LEVEL_7", alignmentStatus: "MATCHED", autonomyDescriptor: "" },
        unverifiedNotices: [],
        aggregateEvidenceCondition: "ALL_ESSENTIAL_ANCHORED",
      },
    });

    expect(result.verdict).toBe("OPPORTUNITY_VERIFY_BEFORE_APPLYING");
    expect(result.candidateActionContext).toBe("VERIFY_REQUIREMENTS_BEFORE_DECIDING");
  });

  it("P3: should route autonomy step-up with anchored skills to STRETCH_OPPORTUNITY_GROWTH", () => {
    const result = routeQualitativeRecommendation({
      jobTitle: "Lead Architect",
      company: "Enterprise Corp",
      mandatoryGates: { overallStatus: "ELIGIBLE", evaluations: [], blockers: [] },
      matchDiagnostics: {
        essentialCompetencies: [{ competency: "Software Architecture", status: "DEMONSTRATED_PRESENCE", depthRating: "ANCHORED_EVIDENCE", provenance: "ANCHORED_EVIDENCE" }],
        optionalCompetencies: [],
        transferableCapabilities: [],
        autonomyAlignment: { requiredLevel: "EQF_LEVEL_8", candidateLevel: "EQF_LEVEL_7", alignmentStatus: "AUTONOMY_STEP_UP", autonomyDescriptor: "Step up to EQF Level 8" },
        unverifiedNotices: [],
        aggregateEvidenceCondition: "ALL_ESSENTIAL_ANCHORED",
      },
    });

    expect(result.verdict).toBe("STRETCH_OPPORTUNITY_GROWTH");
    expect(result.candidateActionContext).toBe("EVALUATE_GROWTH_STRETCH");
  });

  it("P4: should route all essential anchored skills to STRONG_OPPORTUNITY_VERIFIED", () => {
    const result = routeQualitativeRecommendation({
      jobTitle: "Full Stack Engineer",
      company: "Nordic Tech",
      mandatoryGates: { overallStatus: "ELIGIBLE", evaluations: [], blockers: [] },
      matchDiagnostics: {
        essentialCompetencies: [{ competency: "React", status: "DEMONSTRATED_PRESENCE", depthRating: "ANCHORED_EVIDENCE", provenance: "ANCHORED_EVIDENCE" }],
        optionalCompetencies: [],
        transferableCapabilities: [],
        autonomyAlignment: { requiredLevel: "EQF_LEVEL_7", candidateLevel: "EQF_LEVEL_7", alignmentStatus: "MATCHED", autonomyDescriptor: "" },
        unverifiedNotices: [],
        aggregateEvidenceCondition: "ALL_ESSENTIAL_ANCHORED",
      },
    });

    expect(result.verdict).toBe("STRONG_OPPORTUNITY_VERIFIED");
    expect(result.candidateActionContext).toBe("CONSIDER_APPLICATION");
  });
});
