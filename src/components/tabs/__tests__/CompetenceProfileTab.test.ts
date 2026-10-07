import { describe, it, expect } from "vitest";
import { toggleExcludedCompany } from "../CompetenceProfileTab";

describe("CompetenceProfileTab — toggleExcludedCompany helper", () => {
  it("adds a new company to an empty list", () => {
    const result = toggleExcludedCompany([], "Acme Corp");
    expect(result).toEqual(["Acme Corp"]);
  });

  it("adds a trimmed new company to an existing list", () => {
    const initial = ["First Company AB"];
    const result = toggleExcludedCompany(initial, "  Second Company HB  ");
    expect(result).toEqual(["First Company AB", "Second Company HB"]);
  });

  it("removes an existing company when toggled (exact match)", () => {
    const initial = ["Acme Corp", "Beta AB", "Gamma Systems"];
    const result = toggleExcludedCompany(initial, "Beta AB");
    expect(result).toEqual(["Acme Corp", "Gamma Systems"]);
  });

  it("removes an existing company case-insensitively when toggled", () => {
    const initial = ["Acme Corp", "Beta AB"];
    const result = toggleExcludedCompany(initial, "beta ab");
    expect(result).toEqual(["Acme Corp"]);
  });

  it("handles whitespace-padded input when toggling off existing company", () => {
    const initial = ["Acme Corp", "Beta AB"];
    const result = toggleExcludedCompany(initial, "  Beta AB  ");
    expect(result).toEqual(["Acme Corp"]);
  });

  it("returns the original list unmodified when company string is empty or only whitespace", () => {
    const initial = ["Acme Corp"];
    expect(toggleExcludedCompany(initial, "")).toEqual(initial);
    expect(toggleExcludedCompany(initial, "   ")).toEqual(initial);
  });
});
