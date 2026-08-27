import { describe, it, expect } from "vitest";
import { runPhase11MasterBenchmark } from "../calibration/phase11MasterRunner";

describe("Phase 11 Master Calibration & Precision/Recall Benchmark", () => {
  it("should execute full 30-case benchmark and demonstrate superior precision without sacrificing recall", () => {
    const result = runPhase11MasterBenchmark();

    expect(result.metrics.totalCasesEvaluated).toBe(30);

    // 1. Precision Test: New Engine Primary Precision should be >= 90%
    expect(result.metrics.newEngineMetrics.precisionPct).toBeGreaterThanOrEqual(90);

    // 2. Recall Test: New Engine Primary Recall should be >= 90% (verifying legitimate opportunities are NOT suppressed!)
    expect(result.metrics.newEngineMetrics.recallPct).toBeGreaterThanOrEqual(90);

    // 3. Zero False Positives in New Engine Primary Output
    expect(result.metrics.newEngineMetrics.falsePositiveCount).toBe(0);

    // 4. Legacy Engine should exhibit multiple false positives
    expect(result.metrics.legacyMetrics.falsePositiveCount).toBeGreaterThan(0);
  });
});
