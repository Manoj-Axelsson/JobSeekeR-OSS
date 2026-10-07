import { describe, it, expect } from "vitest";
import { calculateMarketTrends } from "../market";
import type { JobAd } from "@/types/domain";

function createMockJob(overrides: Partial<JobAd> = {}): JobAd {
  return {
    id: "job-1",
    externalId: "ext-1",
    title: "Fullstack Developer",
    company: "Tech AB",
    location: "Stockholm",
    description: "Developing services.",
    webpageUrl: null,
    source: "Platsbanken",
    publishedAt: "2026-10-01T10:00:00.000Z",
    deadline: null,
    matchScore: 80,
    matchedSkills: "[]",
    missingSkills: "[]",
    domainScores: "{}",
    status: "NEW",
    ...overrides,
  };
}

describe("Market Intelligence", () => {
  it("returns default market trends on empty input", () => {
    const trends = calculateMarketTrends([]);
    expect(trends.length).toBe(4);
    expect(trends.map((t) => t.technology)).toContain("TypeScript");
    expect(trends.map((t) => t.technology)).toContain("React");
  });

  it("extracts actual technology names from serialized matchedSkills and missingSkills", () => {
    const jobs: JobAd[] = [
      createMockJob({
        id: "j1",
        matchedSkills: JSON.stringify(["TypeScript", "React"]),
        missingSkills: JSON.stringify(["GraphQL"]),
      }),
      createMockJob({
        id: "j2",
        matchedSkills: JSON.stringify(["TypeScript", "PostgreSQL"]),
        missingSkills: JSON.stringify(["React"]),
      }),
    ];

    const trends = calculateMarketTrends(jobs);
    const techNames = trends.map((t) => t.technology);

    // Verifies actual technology tokens appear
    expect(techNames).toContain("TypeScript");
    expect(techNames).toContain("React");

    // Strictly verifies that character tokens NEVER appear (the previous spreading bug)
    const forbiddenChars = ["[", "]", '"', ",", "e", "a", "c", "t", "T", "y", "p"];
    for (const token of techNames) {
      expect(forbiddenChars).not.toContain(token);
      expect(token.length).toBeGreaterThan(1);
    }
  });

  it("handles malformed JSON safely without throwing", () => {
    const jobs: JobAd[] = [
      createMockJob({
        id: "j1",
        matchedSkills: "{ not json",
        missingSkills: "[ broken",
      }),
    ];

    const trends = calculateMarketTrends(jobs);
    expect(trends.length).toBeGreaterThan(0);
    // Returns default fallback trends rather than crashing
    expect(trends.map((t) => t.technology)).toContain("TypeScript");
  });
});
