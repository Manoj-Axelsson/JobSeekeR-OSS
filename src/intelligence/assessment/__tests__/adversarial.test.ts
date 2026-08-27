import { describe, it, expect } from "vitest";
import { runAdversarialCalibration, ADVERSARIAL_DATASET } from "../calibration/adversarialRunner";

describe("Phase 1B Adversarial & Boundary Calibration Suite", () => {
  it("should pass all 18 boundary stress-test scenarios cleanly", () => {
    const results = runAdversarialCalibration();
    expect(results).toHaveLength(18);

    const failedCases = results.filter(r => !r.passed);
    if (failedCases.length > 0) {
      console.error("Adversarial Failures:", failedCases);
    }

    expect(failedCases).toHaveLength(0);
  });
});
