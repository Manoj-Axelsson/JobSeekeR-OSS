/**
 * Phase 1A — Calibration Dataset Runner
 * JobSeekR Intelligence Framework v3.0
 *
 * Runs the Legacy Engine vs New Opportunity Assessment Engine side-by-side across
 * 12 representative Jobseeker calibration cases to evaluate Primary Feed trust.
 */

import { evaluateJobMatch as evaluateLegacyMatch } from "../../../lib/services/matcher";
import { assessOpportunity } from "../evaluator";
import { evaluateHistoryIntelligence, ApplicationRecord } from "../historyIntelligence";

export interface CalibrationTestCase {
  id: string;
  caseName: string;
  categoryDescription: string;
  jobAd: {
    id: string;
    externalId?: string;
    title: string;
    company: string;
    location: string;
    description: string;
  };
  candidateProfile: {
    name: string;
    headline: string;
    citizenship: string;
    languages: string[];
    skills: string[];
    targetRoles: string[];
    preferredLocations: string[];
    workingModelPreference?: "REMOTE" | "HYBRID" | "ON_SITE";
  };
  history?: ApplicationRecord[];
  primaryFeedTrustQuestion: string;
}

export interface SideBySideComparisonResult {
  caseId: string;
  caseName: string;
  categoryDescription: string;
  legacyResult: {
    matchScore: number;
    feedType: "PRIMARY" | "DISCOVERY";
    eligibilityStatus: "ELIGIBLE" | "INELIGIBLE" | "DISCARDED";
    whyMatched: string[];
  };
  newResult: {
    eligibilityStatus: string;
    matchScore: number;
    matchGrade: string;
    intentScore: number;
    confidenceQuality: string;
    assessmentConfidence: string;
    recommendationType: string;
    historyConflict?: string;
    reasons: string[];
  };
  primaryFeedTrustVerdict: {
    legacyWouldPutInPrimary: boolean;
    newWouldPutInPrimary: boolean;
    trustVerdict: "AGREE_PRIMARY" | "NEW_CORRECTLY_SUPPRESSES" | "NEW_CORRECTLY_PROMOTES" | "AGREE_SUPPRESS";
    analysis: string;
  };
}

export const CALIBRATION_DATASET: CalibrationTestCase[] = [
  // 1. Excellent genuine match
  {
    id: "case-1",
    caseName: "1. Excellent genuine match",
    categoryDescription: "Direct alignment on role, tech stack, location, language, and working model.",
    jobAd: {
      id: "job-001",
      title: "Fullstack Utvecklare (React & Node.js)",
      company: "TechNova AB",
      location: "Stockholm (Hybrid)",
      description: "Vi söker en Fullstack-utvecklare med goda kunskaper i React, TypeScript, Node.js och PostgreSQL. Krav: Svenska i tal och skrift. Hybridarbete från vårt kontor i Stockholm.",
    },
    candidateProfile: {
      name: "Manoj John Axelsson",
      headline: "Software & Systems Engineer",
      citizenship: "SE",
      languages: ["Swedish", "English"],
      skills: ["React", "TypeScript", "Next.js", "Node.js", "Express", "PostgreSQL", "SQL"],
      targetRoles: ["Fullstack Developer", "Software Engineer"],
      preferredLocations: ["Stockholm", "Linköping"],
      workingModelPreference: "HYBRID",
    },
    primaryFeedTrustQuestion: "Should this genuine top match enter Primary Feed?",
  },

  // 2. Good technical match but eligibility failure
  {
    id: "case-2",
    caseName: "2. Good technical match but eligibility failure",
    categoryDescription: "Strong technical skill alignment but fails a mandatory hard requirement (US Citizenship & Security Clearance).",
    jobAd: {
      id: "job-002",
      title: "Defense Software Engineer (US Citizen Required)",
      company: "Global Defense Corp",
      location: "Stockholm",
      description: "Building defense software. Skills required: React, TypeScript, Node.js, C++. MANDATORY REQUIREMENT: Must hold active US Citizenship and active US DoD Secret Security Clearance.",
    },
    candidateProfile: {
      name: "Manoj John Axelsson",
      headline: "Software & Systems Engineer",
      citizenship: "SE",
      languages: ["Swedish", "English"],
      skills: ["React", "TypeScript", "Node.js", "C++"],
      targetRoles: ["Software Engineer"],
      preferredLocations: ["Stockholm"],
      workingModelPreference: "HYBRID",
    },
    primaryFeedTrustQuestion: "Does the model block this position due to citizenship/clearance eligibility failure?",
  },

  // 3. Good technical match but poor career intent
  {
    id: "case-3",
    caseName: "3. Good technical match but poor career intent",
    categoryDescription: "High technical skill overlap but candidate does not want this legacy role / 100% on-site Kiruna location.",
    jobAd: {
      id: "job-003",
      title: "Senior Mainframe & Legacy COBOL Maintenance Developer",
      company: "Mining Legacy Systems",
      location: "Kiruna",
      description: "Krav: React, TypeScript, Node.js, Systems Engineering. Mandatory 100% on-site in Kiruna. Main task: Maintaining legacy 1980s COBOL mainframe banking software.",
    },
    candidateProfile: {
      name: "Manoj John Axelsson",
      headline: "Software & Systems Engineer",
      citizenship: "SE",
      languages: ["Swedish", "English"],
      skills: ["React", "TypeScript", "Node.js", "Systems Engineering"],
      targetRoles: ["Fullstack Developer", "React Developer"],
      preferredLocations: ["Stockholm", "Linköping"],
      workingModelPreference: "HYBRID",
    },
    primaryFeedTrustQuestion: "Does the model prevent putting a high-capability / poor-intent job into Primary Feed?",
  },

  // 4. Transferable-capability opportunity
  {
    id: "case-4",
    caseName: "4. Transferable-capability opportunity",
    categoryDescription: "Title isn't software developer, but candidate's Lean/Quality/Process background satisfies requirements.",
    jobAd: {
      id: "job-004",
      title: "Technical Project & Quality Coordinator",
      company: "Industrial Tech Solutions",
      location: "Linköping",
      description: "Krav: Erfarenhet av stakeholder collaboration, kvalitetsarbete, tillverkningsprocesser, DMAIC och agilt samarbete.",
    },
    candidateProfile: {
      name: "Manoj John Axelsson",
      headline: "Software & Systems Engineer",
      citizenship: "SE",
      languages: ["Swedish", "English"],
      skills: ["Six Sigma Green Belt", "DMAIC", "FMEA", "Quality Assurance", "Lean Manufacturing", "Production Development"],
      targetRoles: ["Quality Assurance Engineer", "Technical Project Coordinator", "Systems Engineer"],
      preferredLocations: ["Linköping", "Stockholm"],
      workingModelPreference: "HYBRID",
    },
    primaryFeedTrustQuestion: "Does the engine recognize transferable capability and route appropriately?",
  },

  // 5. Startup / unconventional role
  {
    id: "case-5",
    caseName: "5. Startup / unconventional role",
    categoryDescription: "Early-stage Cleantech startup looking for an agile founding engineer.",
    jobAd: {
      id: "job-005",
      title: "Founding Fullstack Engineer",
      company: "GreenGrid Cleantech AB",
      location: "Linköping (Hybrid)",
      description: "Söker en mångsidig utvecklare för att bygga nästa generations energisystem. React, TypeScript, Node.js, IoT, snabbt tempo i Cleantech.",
    },
    candidateProfile: {
      name: "Manoj John Axelsson",
      headline: "Software & Systems Engineer",
      citizenship: "SE",
      languages: ["Swedish", "English"],
      skills: ["React", "TypeScript", "Next.js", "Node.js", "IoT"],
      targetRoles: ["Fullstack Developer"],
      preferredLocations: ["Linköping"],
      workingModelPreference: "HYBRID",
    },
    primaryFeedTrustQuestion: "Does the engine surface this valuable startup opportunity correctly?",
  },

  // 6. Obvious poor match
  {
    id: "case-6",
    caseName: "6. Obvious poor match",
    categoryDescription: "Completely unrelated healthcare role (Nurse / Sjuksköterska).",
    jobAd: {
      id: "job-006",
      title: "Legitimerad Sjuksköterska till Akutmottagningen",
      company: "Region Östergötland",
      location: "Linköping",
      description: "Krav: Legitimerad sjuksköterska med minst 3 års erfarenhet inom akutsjukvård och triagering.",
    },
    candidateProfile: {
      name: "Manoj John Axelsson",
      headline: "Software & Systems Engineer",
      citizenship: "SE",
      languages: ["Swedish", "English"],
      skills: ["React", "TypeScript", "Node.js", "Systems Engineering"],
      targetRoles: ["Software Engineer"],
      preferredLocations: ["Linköping"],
      workingModelPreference: "HYBRID",
    },
    primaryFeedTrustQuestion: "Does the model immediately suppress completely irrelevant roles?",
  },

  // 7. Strong match with missing explicit terminology
  {
    id: "case-7",
    caseName: "7. Strong match with missing explicit terminology",
    categoryDescription: "Describes component web frameworks and typed code without writing literal words 'React' or 'TypeScript'.",
    jobAd: {
      id: "job-007",
      title: "Web Frontend Specialist",
      company: "Modern Web Media",
      location: "Stockholm",
      description: "Vi söker en frontend-specialist för att bygga moderna webbgränssnitt med komponentbaserad källkod, typsäker programmering och REST API:er. Svenska i tal och skrift.",
    },
    candidateProfile: {
      name: "Manoj John Axelsson",
      headline: "Software & Systems Engineer",
      citizenship: "SE",
      languages: ["Swedish", "English"],
      skills: ["React", "TypeScript", "Next.js", "REST APIs", "Git"],
      targetRoles: ["Frontend Developer", "Software Engineer"],
      preferredLocations: ["Stockholm"],
      workingModelPreference: "HYBRID",
    },
    primaryFeedTrustQuestion: "Does the evidence model recognize concept alignment when exact keywords are missing?",
  },

  // 8. Unknown mandatory requirement
  {
    id: "case-8",
    caseName: "8. Unknown mandatory requirement",
    categoryDescription: "Job specifies mandatory German language requirement ('Tyska i tal och skrift'), unverified in profile.",
    jobAd: {
      id: "job-008",
      title: "Fullstack Developer (DACH Market)",
      company: "EuroTech Consulting",
      location: "Stockholm",
      description: "Krav: Skall-krav: Tyska i tal och skrift. React, TypeScript, Node.js.",
    },
    candidateProfile: {
      name: "Manoj John Axelsson",
      headline: "Software & Systems Engineer",
      citizenship: "SE",
      languages: ["Swedish", "English"], // German not listed
      skills: ["React", "TypeScript", "Node.js"],
      targetRoles: ["Fullstack Developer"],
      preferredLocations: ["Stockholm"],
      workingModelPreference: "HYBRID",
    },
    primaryFeedTrustQuestion: "Does UNKNOWN state flag requirement for review without erroneously auto-declaring INELIGIBLE?",
  },

  // 9. Location mismatch
  {
    id: "case-9",
    caseName: "9. Location mismatch",
    categoryDescription: "100% on-site role in Gothenburg while candidate specifically targets Stockholm.",
    jobAd: {
      id: "job-009",
      title: "Fullstack Developer (100% On-site Gothenburg)",
      company: "West Coast Automotive AB",
      location: "Göteborg",
      description: "Krav: React, TypeScript, Node.js. Obetvingligt krav: 100% på plats på kontoret i Göteborg. Inget distansarbete.",
    },
    candidateProfile: {
      name: "Manoj John Axelsson",
      headline: "Software & Systems Engineer",
      citizenship: "SE",
      languages: ["Swedish", "English"],
      skills: ["React", "TypeScript", "Node.js"],
      targetRoles: ["Fullstack Developer"],
      preferredLocations: ["Stockholm"], // Explicitly Stockholm
      workingModelPreference: "HYBRID",
    },
    primaryFeedTrustQuestion: "Does geographic hierarchy correctly suppress or route out-of-territory on-site roles?",
  },

  // 10. A role you have actually applied for
  {
    id: "case-10",
    caseName: "10. A role you have actually applied for",
    categoryDescription: "Candidate has already submitted an application to this exact position ID.",
    jobAd: {
      id: "job-100",
      externalId: "ext-100",
      title: "Senior Fullstack Engineer",
      company: "Spotify AB",
      location: "Stockholm",
      description: "React, TypeScript, Node.js, Distributed Systems.",
    },
    candidateProfile: {
      name: "Manoj John Axelsson",
      headline: "Software & Systems Engineer",
      citizenship: "SE",
      languages: ["Swedish", "English"],
      skills: ["React", "TypeScript", "Node.js"],
      targetRoles: ["Fullstack Developer"],
      preferredLocations: ["Stockholm"],
      workingModelPreference: "HYBRID",
    },
    history: [
      {
        id: "job-100",
        externalId: "ext-100",
        company: "Spotify AB",
        title: "Senior Fullstack Engineer",
        description: "React, TypeScript, Node.js, Distributed Systems.",
        status: "APPLIED",
        appliedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      },
    ],
    primaryFeedTrustQuestion: "Does history intelligence prevent showing an already applied job as a fresh Primary opportunity?",
  },

  // 11. A substantially similar re-issued advertisement
  {
    id: "case-11",
    caseName: "11. A substantially similar re-issued advertisement",
    categoryDescription: "Re-posted job listing with a new external ID but 90%+ identical requirement fingerprint.",
    jobAd: {
      id: "job-101-reissue",
      externalId: "ext-999-new",
      title: "Senior Fullstack Engineer (Re-issued)",
      company: "Spotify AB",
      location: "Stockholm",
      description: "React, TypeScript, Node.js, Distributed Systems. Join our core web infrastructure team.",
    },
    candidateProfile: {
      name: "Manoj John Axelsson",
      headline: "Software & Systems Engineer",
      citizenship: "SE",
      languages: ["Swedish", "English"],
      skills: ["React", "TypeScript", "Node.js"],
      targetRoles: ["Fullstack Developer"],
      preferredLocations: ["Stockholm"],
      workingModelPreference: "HYBRID",
    },
    history: [
      {
        id: "job-101-original",
        externalId: "ext-100-old",
        company: "Spotify AB",
        title: "Senior Fullstack Engineer",
        description: "React, TypeScript, Node.js, Distributed Systems. Join our core web infrastructure team.",
        status: "APPLIED",
        appliedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
    ],
    primaryFeedTrustQuestion: "Does history intelligence suppress re-issued duplicate ads by substantive fingerprint?",
  },

  // 12. A previously rejected similar role
  {
    id: "case-12",
    caseName: "12. A previously rejected similar role",
    categoryDescription: "Similar role at Employer X where candidate was rejected < 7 months ago.",
    jobAd: {
      id: "job-102",
      title: "Frontend Architect",
      company: "Klarna AB",
      location: "Stockholm",
      description: "React, TypeScript, Micro-frontends, Payment UI architecture.",
    },
    candidateProfile: {
      name: "Manoj John Axelsson",
      headline: "Software & Systems Engineer",
      citizenship: "SE",
      languages: ["Swedish", "English"],
      skills: ["React", "TypeScript", "Next.js"],
      targetRoles: ["Frontend Developer"],
      preferredLocations: ["Stockholm"],
      workingModelPreference: "HYBRID",
    },
    history: [
      {
        id: "job-old-klarna",
        company: "Klarna AB",
        title: "Frontend Architect",
        description: "React, TypeScript, Micro-frontends, Payment UI architecture.",
        status: "REJECTED",
        appliedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
        rejectedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      },
    ],
    primaryFeedTrustQuestion: "Does history intelligence suppress role fingerprints matching recent rejections (< 7 months)?",
  },
];

export function runCalibrationSideBySide(): SideBySideComparisonResult[] {
  const results: SideBySideComparisonResult[] = [];

  for (const testCase of CALIBRATION_DATASET) {
    // 1. Run Legacy Engine
    const legacy = evaluateLegacyMatch(
      testCase.jobAd.title,
      testCase.jobAd.description,
      testCase.candidateProfile.skills,
      testCase.candidateProfile.name,
      testCase.candidateProfile.headline,
      testCase.jobAd.company,
      testCase.jobAd.location
    );

    // 2. Run New Opportunity Assessment Engine
    const newAssessment = assessOpportunity(
      {
        title: testCase.jobAd.title,
        description: testCase.jobAd.description,
        location: testCase.jobAd.location,
        company: testCase.jobAd.company,
      },
      testCase.candidateProfile
    );

    // 3. Evaluate History Intelligence (Phase 8)
    const historyResult = evaluateHistoryIntelligence(testCase.jobAd, testCase.history || []);

    let effectiveRecommendationType = newAssessment.recommendation.type;
    let historyConflictDetail: string | undefined = undefined;

    if (historyResult.hasHistoryConflict) {
      effectiveRecommendationType = "SUPPRESS";
      historyConflictDetail = `${historyResult.conflictType}: ${historyResult.suppressReason}`;
    }

    const legacyWouldPutInPrimary = legacy.feedType === "PRIMARY" && legacy.eligibilityStatus === "ELIGIBLE";
    const newWouldPutInPrimary = effectiveRecommendationType === "PRIMARY" && newAssessment.eligibility.status === "ELIGIBLE";

    let trustVerdict: SideBySideComparisonResult["primaryFeedTrustVerdict"]["trustVerdict"] = "AGREE_PRIMARY";
    let analysis = "";

    if (legacyWouldPutInPrimary && newWouldPutInPrimary) {
      trustVerdict = "AGREE_PRIMARY";
      analysis = "Both engines agree this belongs in the Primary feed.";
    } else if (legacyWouldPutInPrimary && !newWouldPutInPrimary) {
      trustVerdict = "NEW_CORRECTLY_SUPPRESSES";
      analysis = `Legacy engine placed this in Primary feed (Score: ${legacy.matchScore}%), but New Engine correctly suppressed/routed it (${effectiveRecommendationType}, Reason: ${historyConflictDetail || newAssessment.eligibility.blockers.join("; ") || newAssessment.recommendation.suppressReason}).`;
    } else if (!legacyWouldPutInPrimary && newWouldPutInPrimary) {
      trustVerdict = "NEW_CORRECTLY_PROMOTES";
      analysis = "New Engine correctly identified high-quality capability and intent fit for Primary feed.";
    } else {
      trustVerdict = "AGREE_SUPPRESS";
      analysis = "Both engines agree this opportunity should be suppressed or routed away from Primary feed.";
    }

    results.push({
      caseId: testCase.id,
      caseName: testCase.caseName,
      categoryDescription: testCase.categoryDescription,
      legacyResult: {
        matchScore: legacy.matchScore,
        feedType: legacy.feedType,
        eligibilityStatus: legacy.eligibilityStatus,
        whyMatched: legacy.analysis.whyMatched,
      },
      newResult: {
        eligibilityStatus: newAssessment.eligibility.status,
        matchScore: newAssessment.match.score,
        matchGrade: newAssessment.match.grade,
        intentScore: newAssessment.intent.score,
        confidenceQuality: newAssessment.confidence.evidenceQuality,
        assessmentConfidence: newAssessment.confidence.assessmentConfidence,
        recommendationType: effectiveRecommendationType,
        historyConflict: historyConflictDetail,
        reasons: newAssessment.recommendation.reasons,
      },
      primaryFeedTrustVerdict: {
        legacyWouldPutInPrimary,
        newWouldPutInPrimary,
        trustVerdict,
        analysis,
      },
    });
  }

  return results;
}
