import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { evaluateOpportunityAssessment } from "../../../lib/services/matcher";

describe("Matcher Feature Flag Integration (v3.1.1)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return undefined nonNumericalAssessment when feature flag is unset", () => {
    delete process.env.USE_NON_NUMERICAL_ASSESSMENT_ENGINE;
    delete process.env.SHADOW_MODE_NON_NUMERICAL;
    delete process.env.USE_NEW_ASSESSMENT_ENGINE;

    const result = evaluateOpportunityAssessment(
      { id: "1", title: "Fullstack Developer", company: "Tech AB", location: "Stockholm", description: "React, Node.js" },
      { skills: ["React", "Node.js"] }
    );

    expect(result.nonNumericalAssessment).toBeUndefined();
    expect(result.matchScore).toBeDefined();
  });

  it("should compute nonNumericalAssessment when USE_NON_NUMERICAL_ASSESSMENT_ENGINE is true", () => {
    process.env.USE_NEW_ASSESSMENT_ENGINE = "true";
    process.env.USE_NON_NUMERICAL_ASSESSMENT_ENGINE = "true";

    const result = evaluateOpportunityAssessment(
      { id: "1", title: "Fullstack Developer", company: "Tech AB", location: "Stockholm", description: "React, Node.js" },
      { skills: ["React", "Node.js"] }
    );

    expect(result.nonNumericalAssessment).toBeDefined();
    expect(result.nonNumericalAssessment?.assessmentVersion).toBe("3.1.1-non-numerical");
    expect(result.nonNumericalAssessment?.decisionSupport.recommendation.verdict).toBeDefined();
  });

  it("should compute nonNumericalAssessment in shadow mode without altering legacy output fields", () => {
    delete process.env.USE_NEW_ASSESSMENT_ENGINE;
    process.env.SHADOW_MODE_NON_NUMERICAL = "true";

    const result = evaluateOpportunityAssessment(
      { id: "1", title: "Fullstack Developer", company: "Tech AB", location: "Stockholm", description: "React, Node.js" },
      { skills: ["React", "Node.js"] }
    );

    expect(result.nonNumericalAssessment).toBeDefined();
    expect(result.nonNumericalAssessment?.assessmentVersion).toBe("3.1.1-non-numerical");
    expect(result.matchScore).toBeDefined();
  });
});
