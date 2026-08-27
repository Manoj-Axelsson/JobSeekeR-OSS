import { describe, it, expect } from "vitest";
import { assessOpportunity } from "../evaluator";
import { createCandidateEvidenceModel } from "../evidence";
import { enrichOpportunity } from "../enrichmentEngine";
import { generateCandidatePositioning } from "../candidatePositioning";
import { extractJobRequirements } from "../requirements";

describe("Phase 9 Enrichment & Phase 10 Candidate Positioning Engines", () => {
  it("should enforce Post-Qualification Enrichment Rule (suppressed jobs return null enrichment)", () => {
    const jobAd = {
      id: "job-nurse",
      title: "Legitimerad Sjuksköterska",
      company: "Region Östergötland",
      location: "Linköping",
      description: "Krav: Sjuksköterskeexamen, Legitimation från Socialstyrelsen, C++.",
    };
    const candidate = createCandidateEvidenceModel({ skills: ["React", "TypeScript"] });
    const reqs = extractJobRequirements(jobAd.title, jobAd.description);
    const assessment = assessOpportunity(jobAd, candidate);

    // Suppressed job must return null for enrichment
    const enrichment = enrichOpportunity(jobAd, reqs, assessment);
    expect(assessment.recommendation.type).toBe("SUPPRESS");
    expect(enrichment).toBeNull();
  });

  it("should generate two-layer enrichment for qualified Primary opportunities without altering assessment scores", () => {
    const jobAd = {
      id: "job-fullstack",
      title: "Fullstack Developer",
      company: "TechCorp AB",
      location: "Stockholm",
      description: "React, TypeScript, Node.js. Lön: 55 000 kr/månad.",
    };
    const candidate = createCandidateEvidenceModel({
      skills: ["React", "TypeScript", "Node.js"],
      targetRoles: ["Fullstack Developer"],
      preferredLocations: ["Stockholm"],
    });
    const reqs = extractJobRequirements(jobAd.title, jobAd.description);
    const assessment = assessOpportunity(jobAd, candidate);

    const initialScore = assessment.match.score;
    const initialStatus = assessment.eligibility.status;

    const enrichment = enrichOpportunity(jobAd, reqs, assessment);

    expect(enrichment).not.toBeNull();
    expect(enrichment?.deterministic.employerName).toBe("TechCorp AB");
    expect(enrichment?.deterministic.salaryParsed.min).toBe(55000);
    expect(enrichment?.research.marketSalaryBenchmark).toBeDefined();

    // Verify assessment was NOT altered by enrichment
    expect(assessment.match.score).toBe(initialScore);
    expect(assessment.eligibility.status).toBe(initialStatus);
  });

  it("should generate evidence-driven candidate positioning with confidenceLevel on concerns and structured coverLetterHook", () => {
    const jobAd = {
      id: "job-fullstack-2",
      title: "Fullstack Developer",
      company: "Fintech Startup",
      location: "Stockholm",
      description: "React, TypeScript, Node.js, C++.",
    };
    const candidate = createCandidateEvidenceModel({
      skills: ["React", "TypeScript", "Node.js"],
      targetRoles: ["Fullstack Developer"],
      preferredLocations: ["Stockholm"],
    });
    const reqs = extractJobRequirements(jobAd.title, jobAd.description);
    const assessment = assessOpportunity(jobAd, candidate);
    const enrichment = enrichOpportunity(jobAd, reqs, assessment);

    const positioning = generateCandidatePositioning(jobAd, candidate, assessment, enrichment);

    expect(positioning.opportunityId).toBe("job-fullstack-2");
    expect(positioning.strongestEvidence.length).toBeGreaterThan(0);

    // Verify potentialConcern contains confidenceLevel
    expect(positioning.potentialConcern).not.toBeNull();
    expect(positioning.potentialConcern?.confidenceLevel).toBe("HIGH"); // Missing C++ direct evidence

    // Verify coverLetterHook is structured & evidence-driven (Facts & Reasoning, NO prose)
    expect(positioning.coverLetterHook.theme).toContain("Fintech Startup");
    expect(Array.isArray(positioning.coverLetterHook.supportingEvidence)).toBe(true);
  });
});
