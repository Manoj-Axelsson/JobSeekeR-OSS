import { describe, it, expect } from "vitest";
import { runCalibrationSideBySide, CALIBRATION_DATASET } from "../calibration/calibrationRunner";

describe("Phase 1A Calibration — Legacy Engine vs New Assessment Engine", () => {
  it("should execute side-by-side calibration across all 12 representative cases", () => {
    const results = runCalibrationSideBySide();
    expect(results).toHaveLength(12);

    // Verify key trust outcomes across the 12 cases:

    // Case 1: Genuine Match -> Primary
    const case1 = results.find(r => r.caseId === "case-1")!;
    expect(case1.newResult.recommendationType).toBe("PRIMARY");
    expect(case1.newResult.eligibilityStatus).toBe("ELIGIBLE");

    // Case 2: Good Tech / Defense Clearance Gate -> Ineligible / Suppress
    const case2 = results.find(r => r.caseId === "case-2")!;
    expect(case2.newResult.eligibilityStatus).toBe("INELIGIBLE");
    expect(case2.newResult.recommendationType).toBe("SUPPRESS");

    // Case 3: Good Tech / Poor Intent (Kiruna COBOL Mainframe) -> Not Primary
    const case3 = results.find(r => r.caseId === "case-3")!;
    expect(case3.newResult.recommendationType).not.toBe("PRIMARY");

    // Case 4: Transferable Capability Coordinator -> Discovery or Primary fit
    const case4 = results.find(r => r.caseId === "case-4")!;
    expect(case4.newResult.eligibilityStatus).toBe("ELIGIBLE");

    // Case 6: Healthcare Nurse -> Suppress
    const case6 = results.find(r => r.caseId === "case-6")!;
    expect(case6.newResult.recommendationType).toBe("SUPPRESS");

    // Case 9: Location Mismatch (100% On-site Gothenburg) -> Suppress / Discovery
    const case9 = results.find(r => r.caseId === "case-9")!;
    expect(case9.newResult.recommendationType).not.toBe("PRIMARY");

    // Case 10: Already Applied -> History Suppress
    const case10 = results.find(r => r.caseId === "case-10")!;
    expect(case10.newResult.recommendationType).toBe("SUPPRESS");
    expect(case10.newResult.historyConflict).toContain("ALREADY_APPLIED");

    // Case 11: Re-issued Ad -> History Suppress
    const case11 = results.find(r => r.caseId === "case-11")!;
    expect(case11.newResult.recommendationType).toBe("SUPPRESS");
    expect(case11.newResult.historyConflict).toContain("REISSUED_AD");

    // Case 12: Rejected Role < 7 months -> History Suppress
    const case12 = results.find(r => r.caseId === "case-12")!;
    expect(case12.newResult.recommendationType).toBe("SUPPRESS");
    expect(case12.newResult.historyConflict).toContain("RECENT_REJECTION");
  });
});
