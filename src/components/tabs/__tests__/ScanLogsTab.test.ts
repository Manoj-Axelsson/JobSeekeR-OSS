import { describe, it, expect } from "vitest";
import { ScanLogsTab, type ScanLog } from "../ScanLogsTab";

describe("ScanLogsTab Component", () => {
  const mockScanLogs: ScanLog[] = [
    {
      id: "scan-1",
      scannedAt: "2026-10-06T12:00:00.000Z",
      totalFound: 45,
      totalMatched: 12,
      newAdded: 3,
      status: "COMPLETED",
      message: "Successfully scanned Platsbanken & LinkedIn feeds",
    },
    {
      id: "scan-2",
      scannedAt: "2026-10-05T12:00:00.000Z",
      totalFound: 38,
      totalMatched: 8,
      newAdded: 2,
      status: "COMPLETED",
      message: null,
    },
  ];

  it("renders populated scan log list without errors", () => {
    const result = ScanLogsTab({ scanLogs: mockScanLogs, isDark: false });

    expect(result).toBeDefined();
    expect(result.type).toBe("div");
    expect(result.props.className).toContain("space-y-6");
  });

  it("renders empty state message when scanLogs array is empty", () => {
    const result = ScanLogsTab({ scanLogs: [], isDark: false });

    expect(result).toBeDefined();
    expect(result.type).toBe("div");
  });

  it("handles null or non-array scanLogs input gracefully", () => {
    // Defensive check: ensure non-array input falls back to empty list without crashing
    const result = ScanLogsTab({ scanLogs: null as unknown as ScanLog[], isDark: true });

    expect(result).toBeDefined();
    expect(result.type).toBe("div");
  });

  it("applies dark mode styling classes when isDark is true", () => {
    const darkResult = ScanLogsTab({ scanLogs: mockScanLogs, isDark: true });
    const lightResult = ScanLogsTab({ scanLogs: mockScanLogs, isDark: false });

    // The inner container div holds the dark vs light conditional class
    const darkContainer = darkResult.props.children;
    const lightContainer = lightResult.props.children;

    expect(darkContainer.props.className).toContain("bg-slate-900/80");
    expect(lightContainer.props.className).toContain("bg-white");
  });
});
