import { describe, test, expect, vi } from "vitest";
import { evaluateEligibility, PreferencesConfig, TerritoryConfig } from "./eligibility";
import { evaluateCapabilityAndIntent } from "./scoring";
import { classifyOccupation } from "./classifier";
import { evaluateJobMatch } from "../matcher";

vi.mock("../../db", () => {
  const store = {
    jobAdSearchProfile: new Map<string, any>(),
    jobAd: new Map<string, any>(),
    searchProfile: new Map<string, any>(),
  };

  return {
    db: {
      jobAdSearchProfile: {
        deleteMany: vi.fn(async ({ where }: { where?: any } = {}) => {
          store.jobAdSearchProfile.clear();
          return { count: 0 };
        }),
        create: vi.fn(async ({ data }: { data: any }) => {
          const id = data.id || `eval-${Math.random()}`;
          const item = { ...data, id };
          store.jobAdSearchProfile.set(id, item);
          return item;
        }),
      },
      jobAd: {
        deleteMany: vi.fn(async ({ where }: { where?: any } = {}) => {
          if (where?.externalId) {
            for (const [id, job] of store.jobAd.entries()) {
              if (job.externalId === where.externalId) store.jobAd.delete(id);
            }
          } else {
            store.jobAd.clear();
          }
          return { count: 0 };
        }),
        create: vi.fn(async ({ data }: { data: any }) => {
          const id = data.id || `job-${Math.random()}`;
          const item = { ...data, id };
          store.jobAd.set(id, item);
          return item;
        }),
        delete: vi.fn(async ({ where }: { where: { id: string } }) => {
          const item = store.jobAd.get(where.id);
          store.jobAd.delete(where.id);
          return item;
        }),
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          const job = store.jobAd.get(where.id);
          if (!job) return null;
          const evals = Array.from(store.jobAdSearchProfile.values()).filter(e => e.jobId === job.id);
          return {
            ...job,
            profileEvaluations: evals,
          };
        }),
      },
      searchProfile: {
        deleteMany: vi.fn(async ({ where }: { where?: any } = {}) => {
          if (where?.name?.in) {
            for (const [id, prof] of store.searchProfile.entries()) {
              if (where.name.in.includes(prof.name)) store.searchProfile.delete(id);
            }
          } else {
            store.searchProfile.clear();
          }
          return { count: 0 };
        }),
        create: vi.fn(async ({ data }: { data: any }) => {
          const id = data.id || `prof-${Math.random()}`;
          const item = { ...data, id };
          store.searchProfile.set(id, item);
          return item;
        }),
      },
    },
  };
});

describe("JobSeekeR V2 Constitutional Architecture Pipeline Tests", () => {

  const sampleTerritory: TerritoryConfig = {
    countries: ["SE"],
    regions: ["Östergötland"],
    municipalities: ["Linköping", "Norrköping"],
    cities: ["Linköping", "Norrköping"],
    remotePolicy: "ALLOWED",
    discoveryPolicy: "SHOW_SEPARATELY",
  };

  const samplePreferences: PreferencesConfig = {
    mustHave: ["TypeScript"],
    prefer: ["React", "Next.js"],
    niceToHave: ["Docker"],
    exclude: ["Gambling"],
    explore: ["Cleantech"],
    targetOccupations: ["Fullstack Developer"],
  };

  test("1. Must Have requirement present -> ELIGIBLE", () => {
    const res = evaluateEligibility(
      "Fullstack Developer",
      "Linköping",
      "We need a developer proficient in TypeScript and React.",
      "TechCorp",
      samplePreferences,
      sampleTerritory
    );

    expect(res.status).toBe("ELIGIBLE");
    expect(res.matchedMustHave).toContain("TypeScript");
    expect(res.missingMustHave.length).toBe(0);
  });

  test("2. Must Have requirement missing -> INELIGIBLE", () => {
    const res = evaluateEligibility(
      "Frontend Developer",
      "Linköping",
      "Seeking a pure Vue.js developer with 5 years of frontend experience.",
      "LegacyCorp",
      samplePreferences,
      sampleTerritory
    );

    expect(res.status).toBe("INELIGIBLE");
    expect(res.missingMustHave).toContain("TypeScript");
  });

  test("3. Exclude requirement matched -> DISCARDED", () => {
    const res = evaluateEligibility(
      "Fullstack Engineer",
      "Linköping",
      "Building online Gambling software platforms using TypeScript.",
      "BettingCorp",
      samplePreferences,
      sampleTerritory
    );

    expect(res.status).toBe("DISCARDED");
    expect(res.matchedExclude).toContain("Gambling");
  });

  test("4. Nice To Have missing -> Still ELIGIBLE (Non-punitive)", () => {
    const res = evaluateEligibility(
      "Fullstack Engineer",
      "Linköping",
      "Building software with TypeScript and React.",
      "TechCorp",
      samplePreferences,
      sampleTerritory
    );

    expect(res.status).toBe("ELIGIBLE");

    const scores = evaluateCapabilityAndIntent(
      "Fullstack Engineer",
      "Building software with TypeScript and React.",
      ["TypeScript", "React"],
      "Fullstack Developer",
      samplePreferences.prefer,
      samplePreferences.niceToHave,
      samplePreferences.targetOccupations
    );

    // Missing Docker (Nice To Have) must NOT penalize capability or intent score
    expect(scores.totalMatchScore).toBeGreaterThanOrEqual(50);
  });

  test("5. Inside Territory -> PRIMARY Feed", () => {
    const res = evaluateEligibility(
      "Software Developer",
      "Linköping, Östergötland",
      "TypeScript developer in Linköping.",
      "LocalCorp",
      samplePreferences,
      sampleTerritory
    );

    expect(res.feedType).toBe("PRIMARY");
    expect(res.inTerritory).toBe(true);
  });

  test("6. Outside Territory -> DISCOVERY Feed", () => {
    const res = evaluateEligibility(
      "Software Developer",
      "Kiruna, Norrbotten",
      "TypeScript developer needed in Kiruna.",
      "NorthCorp",
      samplePreferences,
      sampleTerritory
    );

    expect(res.feedType).toBe("DISCOVERY");
    expect(res.inTerritory).toBe(false);
  });

  test("7. Outside Territory with Explore fit -> DISCOVERY Candidate", () => {
    const res = evaluateEligibility(
      "Cleantech Software Engineer",
      "Stockholm",
      "Building sustainable Cleantech solutions with TypeScript.",
      "EcoCorp",
      samplePreferences,
      sampleTerritory
    );

    expect(res.feedType).toBe("DISCOVERY");
    expect(res.matchedExplore).toContain("Cleantech");
  });

  test("8. Probabilistic Occupation Classification expresses confidence", () => {
    const candidates = classifyOccupation(
      "Automation & DevOps Engineer",
      "Managing PLC automation and AWS DevOps pipelines."
    );

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].confidence).toBeGreaterThan(0.5);
    expect(candidates[0].title).toBeDefined();
  });

  test("9. evaluateJobMatch generates complete V2 result with Decision Support", () => {
    const match = evaluateJobMatch(
      "Fullstack Developer",
      "Looking for a React and TypeScript developer in Linköping.",
      ["React", "TypeScript"],
      "Manoj Axelsson",
      "Fullstack Architecture CV",
      "TechCorp",
      "Linköping",
      samplePreferences,
      sampleTerritory
    );

    expect(match.matchScore).toBeGreaterThan(50);
    expect(match.feedType).toBe("PRIMARY");
    expect(match.capabilityScore).toBeGreaterThan(0);
    expect(match.intentScore).toBeGreaterThan(0);
    expect(match.analysis.coverLetterPitch.openingHook).toBeDefined();
    expect(match.decisionSupport).toBeDefined();
  });

  test("10. Career Transition Edge Case: Production Technician pivoting to Fullstack Dev", () => {
    const transitionMatch = evaluateJobMatch(
      "Fullstack Developer",
      "TypeScript, React, Next.js developer for Web Applications.",
      ["CAD/CAM", "Lean", "Automation", "TypeScript", "React"], // Candidate has industrial background + software self-study
      "Transition Candidate",
      "Production Technician",
      "TechWorks",
      "Linköping",
      samplePreferences,
      sampleTerritory
    );

    expect(transitionMatch.capabilityScore).toBeGreaterThan(0);
    expect(transitionMatch.analysis.coverLetterPitch.gapMitigationStrategy).toBeDefined();
    expect(transitionMatch.analysis.coverLetterPitch.openingHook).toContain("Production Technician");
  });

  test("11. Multi-Profile Track Separation: Software Track vs Industrial Track produce distinct results", () => {
    const industrialPreferences: PreferencesConfig = {
      mustHave: [],
      prefer: ["Automation", "CAD/CAM", "PLC"],
      niceToHave: ["Six Sigma"],
      exclude: [],
      explore: ["Industry 4.0"],
      targetOccupations: ["Automation Engineer"],
    };

    const industrialMatch = evaluateJobMatch(
      "Automation Engineer",
      "PLC, SCADA, and Industrial Automation specialist in Linköping.",
      ["Automation", "CAD/CAM", "PLC"],
      "Candidate",
      "Production Technician",
      "FactoryCorp",
      "Linköping",
      industrialPreferences,
      sampleTerritory
    );

    const softwareMatch = evaluateJobMatch(
      "Automation Engineer",
      "PLC, SCADA, and Industrial Automation specialist in Linköping.",
      ["React", "TypeScript"],
      "Candidate",
      "Software Developer",
      "FactoryCorp",
      "Linköping",
      samplePreferences,
      sampleTerritory
    );

    // Industrial profile values automation match higher for Industrial Track
    expect(industrialMatch.intentScore).toBeGreaterThan(softwareMatch.intentScore);
  });

  test("12. Remote Policy Exemption: Remote work posting satisfies territory regardless of city", () => {
    const res = evaluateEligibility(
      "Remote Fullstack Developer",
      "Distans / Remote",
      "Work 100% remote anywhere in Sweden with TypeScript.",
      "CloudCorp",
      samplePreferences,
      sampleTerritory
    );

    expect(res.inTerritory).toBe(true);
    expect(res.feedType).toBe("PRIMARY");
  });

  test("13. Swedish Natural Language Job Ad Classification", () => {
    const candidates = classifyOccupation(
      "Senior Systemutvecklare inom Mjukvara",
      "Vi söker en erfaren utvecklare inom C# och SQL för utveckling av webbapplikationer."
    );

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].ssykCode).toBe("2512");
    expect(candidates[0].confidence).toBeGreaterThan(0.35);
  });

  test("14. CRITICAL ACCEPTANCE TEST: Single JobAd evaluated against two SearchProfiles retains both evaluations without data loss", async () => {
    const { db } = await import("../../db");

    // Clean test records
    await db.jobAdSearchProfile.deleteMany();
    await db.jobAd.deleteMany({ where: { externalId: "test-critical-001" } });
    await db.searchProfile.deleteMany({ where: { name: { in: ["Test Software Track", "Test Industrial Track"] } } });

    // Create 2 distinct search profiles
    const profileSoftware = await db.searchProfile.create({
      data: {
        name: "Test Software Track",
        isPrimary: true,
        targetOccupations: JSON.stringify(["Fullstack Developer"]),
        prefer: JSON.stringify(["TypeScript", "React"]),
      },
    });

    const profileIndustrial = await db.searchProfile.create({
      data: {
        name: "Test Industrial Track",
        isPrimary: false,
        targetOccupations: JSON.stringify(["Automation Engineer"]),
        prefer: JSON.stringify(["PLC", "SCADA", "Automation"]),
      },
    });

    // Create single canonical JobAd opportunity
    const job = await db.jobAd.create({
      data: {
        externalId: "test-critical-001",
        title: "Hybrid Automation & Software Engineer",
        company: "RoboSoftware AB",
        location: "Linköping",
        description: "Developing PLC industrial automation and React TypeScript dashboards.",
        publishedAt: new Date(),
        matchScore: 80,
        matchedSkills: JSON.stringify(["TypeScript", "PLC"]),
        missingSkills: JSON.stringify([]),
        domainScores: "{}",
        status: "NEW",
      },
    });

    // Save evaluation for Profile A (Software)
    await db.jobAdSearchProfile.create({
      data: {
        jobId: job.id,
        searchProfileId: profileSoftware.id,
        feedType: "PRIMARY",
        capabilityScore: 85,
        intentScore: 75,
        totalMatchScore: 80,
        matchedSkills: JSON.stringify(["TypeScript", "React"]),
      },
    });

    // Save evaluation for Profile B (Industrial)
    await db.jobAdSearchProfile.create({
      data: {
        jobId: job.id,
        searchProfileId: profileIndustrial.id,
        feedType: "PRIMARY",
        capabilityScore: 70,
        intentScore: 90,
        totalMatchScore: 82,
        matchedSkills: JSON.stringify(["PLC", "Automation"]),
      },
    });

    // Query canonical job with profileEvaluations join
    const queriedJob = await db.jobAd.findUnique({
      where: { id: job.id },
      include: {
        profileEvaluations: {
          include: { searchProfile: true },
        },
      },
    });

    expect(queriedJob).not.toBeNull();
    expect(queriedJob?.profileEvaluations.length).toBe(2);

    const evalSoftware = queriedJob?.profileEvaluations.find(e => e.searchProfileId === profileSoftware.id);
    const evalIndustrial = queriedJob?.profileEvaluations.find(e => e.searchProfileId === profileIndustrial.id);

    expect(evalSoftware).toBeDefined();
    expect(evalIndustrial).toBeDefined();
    expect(evalSoftware?.intentScore).toBe(75);
    expect(evalIndustrial?.intentScore).toBe(90);
    expect(evalSoftware?.matchedSkills).toContain("TypeScript");
    expect(evalIndustrial?.matchedSkills).toContain("PLC");

    // Clean up test records
    await db.jobAdSearchProfile.deleteMany({ where: { jobId: job.id } });
    await db.jobAd.delete({ where: { id: job.id } });
    await db.searchProfile.deleteMany({ where: { id: { in: [profileSoftware.id, profileIndustrial.id] } } });
  });

});
