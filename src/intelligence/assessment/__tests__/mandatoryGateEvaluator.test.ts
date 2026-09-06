import { describe, it, expect } from "vitest";
import { evaluateMandatoryGates } from "../MandatoryGateEvaluator";

describe("MandatoryGateEvaluator (v3.1.1 Unit Tests)", () => {
  it("should evaluate all satisfied statutory gates as ELIGIBLE", () => {
    const job = {
      location: "Stockholm",
      requiredLanguages: ["Swedish"],
      requiresCitizenship: true,
      targetCitizenship: "SE",
    };

    const candidate = {
      preferredLocations: ["Stockholm"],
      languages: ["Swedish", "English"],
      citizenship: "SE",
      hasWorkAuthorization: true,
    };

    const result = evaluateMandatoryGates(job, candidate);
    expect(result.overallStatus).toBe("ELIGIBLE");
    expect(result.evaluations).toHaveLength(3);
    expect(result.evaluations.every((e) => e.gateStatus === "SATISFIED")).toBe(true);
  });

  it("should evaluate unmentioned statutory requirements as VERIFICATION_REQUIRED", () => {
    const job = {
      requiredLanguages: ["Swedish"],
      requiresCitizenship: true,
      targetCitizenship: "SE",
    };

    const incompleteCandidate = {}; // Omits language & citizenship

    const result = evaluateMandatoryGates(job, incompleteCandidate);
    expect(result.overallStatus).toBe("VERIFICATION_REQUIRED");
    expect(result.overallStatus).not.toBe("ELIGIBLE");
    expect(result.overallStatus).not.toBe("INELIGIBLE");
  });

  it("should evaluate explicitly unsatisfied gate as INELIGIBLE", () => {
    const job = {
      securityClearanceRequired: true,
    };

    const candidate = {
      securityClearance: false, // Explicitly declared false
    };

    const result = evaluateMandatoryGates(job, candidate);
    expect(result.overallStatus).toBe("INELIGIBLE");
    expect(result.blockers).toContain("Security Clearance UNSATISFIED");
  });
});
