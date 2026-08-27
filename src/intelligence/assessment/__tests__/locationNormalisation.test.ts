import { describe, it, expect } from "vitest";
import { resolveCanonicalLocation } from "../locationResolver";
import { extractJobRequirements } from "../requirements";
import { assessOpportunity } from "../evaluator";

describe("Location Normalisation Gate", () => {
  it("should correctly resolve Tullverket regression case (Title Luleå vs Metadata Stockholm)", () => {
    const title = "Tullverket söker systemutvecklare, IT, Luleå";
    const rawMetadataLocation = "Stockholm";
    const description = "Utvecklare platform engineering med passion för verktyg och CI/CD till team i Luleå.";

    const resolution = resolveCanonicalLocation(title, description, rawMetadataLocation);

    // 1. Original metadata must be preserved untouched!
    expect(resolution.sourceLocation).toBe("Stockholm");

    // 2. Resolved canonical location must be Luleå
    expect(resolution.canonicalLocation).toBe("Luleå");

    // 3. Must detect conflict and record resolution source
    expect(resolution.hasConflict).toBe(true);
    expect(resolution.resolutionSource).toBe("TITLE");
    expect(resolution.confidence).toBe("HIGH");
    expect(resolution.conflictDetails).toContain("Job title explicitly specifies 'Luleå'");
  });

  it("should handle title vs metadata vs description location conflicts", () => {
    const title = "Frontend Engineer (Göteborg)";
    const rawMetadataLocation = "Malmö";
    const description = "Join our main engineering hub in Göteborg.";

    const resolution = resolveCanonicalLocation(title, description, rawMetadataLocation);

    expect(resolution.sourceLocation).toBe("Malmö");
    expect(resolution.canonicalLocation).toBe("Göteborg");
    expect(resolution.hasConflict).toBe(true);
    expect(resolution.resolutionSource).toBe("TITLE");
  });

  it("should handle harmonious locations with no conflicts", () => {
    const title = "Fullstack Web Developer";
    const rawMetadataLocation = "Stockholm";
    const description = "Vårt kontor ligger i Stockholm.";

    const resolution = resolveCanonicalLocation(title, description, rawMetadataLocation);

    expect(resolution.sourceLocation).toBe("Stockholm");
    expect(resolution.canonicalLocation).toBe("Stockholm");
    expect(resolution.hasConflict).toBe(false);
    expect(resolution.resolutionSource).toBe("METADATA");
  });

  it("should feed canonical location into Eligibility Engine to block out-of-territory on-site roles", () => {
    const jobAd = {
      id: "tullverket-1",
      title: "Tullverket söker systemutvecklare, IT, Luleå",
      company: "TULLVERKET",
      location: "Stockholm", // Metadata is Stockholm, but title/canonical is Luleå!
      description: "100% på plats på vårt kontor i Luleå. Inget distansarbete. React, TypeScript, Node.js.",
    };

    const candidateProfile = {
      name: "Stockholm Candidate",
      headline: "Engineer",
      citizenships: ["SE"],
      skills: ["React", "TypeScript", "Node.js"],
      targetRoles: ["Software Engineer", "Fullstack Developer"],
      preferredLocations: ["Stockholm"],
      workingModelPreference: "ON_SITE" as const,
    };

    const reqs = extractJobRequirements(jobAd.title, jobAd.description, jobAd.location);

    // Canonical location must be Luleå, while sourceLocation remains Stockholm
    expect(reqs.locationResolution.canonicalLocation).toBe("Luleå");
    expect(reqs.locationResolution.sourceLocation).toBe("Stockholm");

    const assessment = assessOpportunity(jobAd, candidateProfile);

    // Because canonical location is Luleå and candidate wants Stockholm on-site, eligibility must trigger location blocker!
    expect(assessment.eligibility.status).toBe("INELIGIBLE");
    expect(assessment.recommendation.type).toBe("SUPPRESS");
  });
});
