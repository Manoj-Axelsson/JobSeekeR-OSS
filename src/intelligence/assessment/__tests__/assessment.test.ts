import { describe, it, expect } from "vitest";
import { assessOpportunity } from "../evaluator";
import { extractJobRequirements } from "../requirements";
import { createCandidateEvidenceModel } from "../evidence";
import { evaluateEligibility } from "../eligibility";
import { resolveLocationAlignment } from "../locationResolver";

describe("Opportunity Assessment Engine v3.0", () => {
  it("should parse REQUIRED vs PREFERRED vs DESIRED requirements correctly", () => {
    const title = "Junior Full-Stack Developer";
    const description = `
      Krav: React, TypeScript, Svenska i tal och skrift.
      Meriterande: Node.js, SQL, Docker.
    `;
    const reqs = extractJobRequirements(title, description);

    expect(reqs.seniority).toBe("Junior");
    expect(reqs.languages.required).toContain("Swedish");
    expect(reqs.technologies.required).toContain("React");
    expect(reqs.technologies.required).toContain("TypeScript");
    expect(reqs.technologies.desired).toContain("Node.js");
  });

  it("should recognize Swedish citizenship as SATISFIED for security clearance requirements", () => {
    const title = "Systems Engineer";
    const description = "Rollen kräver svenskt medborgarskap och säkerhetsprövning.";
    const candidate = createCandidateEvidenceModel({ citizenship: "SE" });
    const reqs = extractJobRequirements(title, description);

    const eligibility = evaluateEligibility(reqs, candidate);

    expect(eligibility.status).toBe("ELIGIBLE");
    const citizenshipEval = eligibility.hardRequirements.find(r => r.name.includes("Citizenship"));
    expect(citizenshipEval).toBeDefined();
    expect(citizenshipEval?.state).toBe("SATISFIED");
  });

  it("should produce an UNKNOWN candidate state for an unverified generic language requirement", () => {
    const title = "Fullstack Developer";
    const description = "Skall-krav: Tyska i tal och skrift.";
    const candidate = createCandidateEvidenceModel({ languages: ["Swedish", "English"] });
    const reqs = extractJobRequirements(title, description);

    const eligibility = evaluateEligibility(reqs, candidate);

    const germanEval = eligibility.hardRequirements.find(r => r.name.toLowerCase().includes("german") || r.name.toLowerCase().includes("tyska"));
    expect(germanEval).toBeDefined();
    expect(germanEval?.category).toBe("LANGUAGE");
    expect(germanEval?.state).toBe("UNKNOWN");
    // CRUCIAL RULE: UNKNOWN does NOT automatically declare INELIGIBLE
    expect(eligibility.status).not.toBe("INELIGIBLE");
  });

  it("should evaluate hierarchical location alignment correctly (Stockholm vs Kiruna)", () => {
    // Candidate targeting Stockholm specifically
    const candidatePrefs = ["Stockholm"];

    // Job in Kiruna (Norrbotten) vs Job in Stockholm
    const kirunaResult = resolveLocationAlignment("Kiruna", candidatePrefs, false);
    const stockholmResult = resolveLocationAlignment("Stockholm", candidatePrefs, false);

    expect(stockholmResult.isExactCityMatch).toBe(true);
    expect(stockholmResult.alignmentScore).toBe(100);

    expect(kirunaResult.isExactCityMatch).toBe(false);
    expect(kirunaResult.isRegionMatch).toBe(false);
    expect(kirunaResult.alignmentScore).toBe(0);
  });

  it("should declare INELIGIBLE when a mandatory technology hard requirement is UNSATISFIED", () => {
    const title = "Embedded C++ Developer";
    const description = "Krav: C++, Embedded Linux, Assembly.";
    const candidate = createCandidateEvidenceModel({ skills: ["React", "TypeScript"] });
    const reqs = extractJobRequirements(title, description);

    const eligibility = evaluateEligibility(reqs, candidate);

    expect(eligibility.status).toBe("INELIGIBLE");
    expect(eligibility.blockers.length).toBeGreaterThan(0);
  });

  it("should enforce product contract: High capability match with poor intent MUST NOT be a Primary recommendation", () => {
    const jobAd = {
      title: "Senior Legacy Architect",
      description: "Krav: React, TypeScript, Node.js, Systems Engineering. Mandatory on-site in Kiruna.",
      location: "Kiruna",
    };
    const candidate = createCandidateEvidenceModel({
      skills: ["React", "TypeScript", "Node.js", "Systems Engineering"],
      targetRoles: ["Junior Fullstack Developer"],
      preferredLocations: ["Stockholm", "Linköping"],
      workingModelPreference: "REMOTE",
    });

    const assessment = assessOpportunity(jobAd, candidate);

    // Capability match is high because required skills are matched
    expect(assessment.match.score).toBeGreaterThan(60);

    // Product Contract: Poor role & location intent prevents Primary recommendation
    expect(assessment.recommendation.type).not.toBe("PRIMARY");
  });

  it("should correctly assess a strong candidate as a PRIMARY recommendation", () => {
    const jobAd = {
      title: "Fullstack Developer",
      description: "Krav: React, TypeScript, Next.js. Meriterande: PostgreSQL, Tailwind. Hybrid i Stockholm.",
      location: "Stockholm",
    };
    const candidate = createCandidateEvidenceModel({
      skills: ["React", "TypeScript", "Next.js", "PostgreSQL", "Tailwind CSS"],
      targetRoles: ["Fullstack Developer"],
      preferredLocations: ["Stockholm"],
      workingModelPreference: "HYBRID",
    });

    const assessment = assessOpportunity(jobAd, candidate);

    expect(assessment.eligibility.status).toBe("ELIGIBLE");
    expect(assessment.match.score).toBeGreaterThanOrEqual(75);
    expect(assessment.match.grade).toBe("A");
    expect(assessment.intent.score).toBeGreaterThanOrEqual(70);
    expect(assessment.recommendation.type).toBe("PRIMARY");
  });
});
