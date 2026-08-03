import { describe, it, expect } from "vitest";
import { competencyGraph } from "../graph";

describe("Phase 1: Competency Intelligence Engine", () => {
  it("resolves canonical competency nodes from aliases and synonyms", () => {
    const dmaic = competencyGraph.findCompetency("define measure analyze improve control");
    expect(dmaic).not.toBeNull();
    expect(dmaic?.id).toBe("dmaic");

    const rca = competencyGraph.findCompetency("5 whys");
    expect(rca).not.toBeNull();
    expect(rca?.id).toBe("root_cause_analysis");
  });

  it("calculates direct competency transferability", () => {
    const result = competencyGraph.evaluateTransferability("Lean Six Sigma", "Lean Six Sigma");
    expect(result).not.toBeNull();
    expect(result?.transferWeight).toBe(1.0);
    expect(result?.relationshipType).toBe("DIRECT");
    expect(result?.rationale).toContain("directly matches");
  });

  it("calculates multi-hop relationship transferability (DMAIC -> Operational Excellence)", () => {
    const result = competencyGraph.evaluateTransferability("DMAIC", "Operational Excellence");
    expect(result).not.toBeNull();
    expect(result?.transferWeight).toBeGreaterThan(0.6);
    expect(result?.rationale).toContain("DMAIC");
    expect(result?.rationale).toContain("Operational Excellence");
  });
});
