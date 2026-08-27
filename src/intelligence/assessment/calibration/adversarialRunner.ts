/**
 * Phase 1B — Adversarial / Boundary Calibration Runner
 * JobSeekR Intelligence Framework v3.0
 *
 * Runs 18 edge-case & boundary scenarios designed to stress-test the abstractions:
 * - Dual citizenship
 * - Preferred vs required citizenship
 * - Decoupled security clearance vs citizenship
 * - Unverified languages with listed skill
 * - Remote vs Hybrid vs 100% Onsite commuting limits
 * - Seniority overqualification / underqualification
 * - Rejection window boundaries (< 7 months vs > 7 months + 1 day)
 * - Same employer different roles (no naive blacklist)
 * - Transferable capability with zero direct coding keywords
 */

import { assessOpportunity } from "../evaluator";
import { evaluateHistoryIntelligence, ApplicationRecord } from "../historyIntelligence";

export interface AdversarialTestCase {
  id: string;
  caseName: string;
  boundaryType: string;
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
    citizenship?: string;
    citizenships?: string[];
    languages?: string[];
    skills?: string[];
    targetRoles?: string[];
    preferredLocations?: string[];
    workingModelPreference?: "REMOTE" | "HYBRID" | "ON_SITE";
    experience?: Array<{ title: string; company?: string; description?: string }>;
  };
  history?: ApplicationRecord[];
  expectedOutcome: {
    eligibilityStatus: "ELIGIBLE" | "INELIGIBLE" | "DISCARDED";
    recommendationType: "PRIMARY" | "DISCOVERY" | "SUPPRESS";
    historyConflictExpected: boolean;
    keyAssertionReason: string;
  };
}

export interface AdversarialResult {
  caseId: string;
  caseName: string;
  boundaryType: string;
  actualEligibility: string;
  actualRecommendation: string;
  historyConflict?: string;
  passed: boolean;
  notes: string;
}

export const ADVERSARIAL_DATASET: AdversarialTestCase[] = [
  // 1. Swedish + US dual citizenship
  {
    id: "adv-1",
    caseName: "1. Swedish + US dual citizenship candidate",
    boundaryType: "CITIZENSHIP_DUAL",
    jobAd: {
      id: "adv-job-1",
      title: "US Defense Software Engineer",
      company: "US Defense Corp",
      location: "Stockholm",
      description: "MANDATORY REQUIREMENT: Active US Citizenship required. React, TypeScript.",
    },
    candidateProfile: {
      name: "Dual Citizen Candidate",
      headline: "Engineer",
      citizenships: ["SE", "US"],
      skills: ["React", "TypeScript"],
      targetRoles: ["Software Engineer"],
      preferredLocations: ["Stockholm"],
    },
    expectedOutcome: {
      eligibilityStatus: "ELIGIBLE",
      recommendationType: "PRIMARY",
      historyConflictExpected: false,
      keyAssertionReason: "US citizenship requirement is satisfied because candidate explicitly holds US dual citizenship.",
    },
  },

  // 2. "US citizenship preferred" rather than required
  {
    id: "adv-2",
    caseName: "2. US citizenship preferred rather than required",
    boundaryType: "CITIZENSHIP_PREFERENCE",
    jobAd: {
      id: "adv-job-2",
      title: "Global Systems Engineer",
      company: "AeroTech AB",
      location: "Stockholm",
      description: "React, TypeScript. Meriterande: US citizenship preferred for transatlantic projects.",
    },
    candidateProfile: {
      name: "Manoj Axelsson",
      headline: "Engineer",
      citizenships: ["SE"],
      skills: ["React", "TypeScript"],
      targetRoles: ["Systems Engineer"],
      preferredLocations: ["Stockholm"],
    },
    expectedOutcome: {
      eligibilityStatus: "ELIGIBLE",
      recommendationType: "PRIMARY",
      historyConflictExpected: false,
      keyAssertionReason: "Citizenship listed under preferences does not trigger INELIGIBLE for SE citizen.",
    },
  },

  // 3. Security clearance required but citizenship unspecified (Decoupled model)
  {
    id: "adv-3",
    caseName: "3. Security clearance required but citizenship unspecified",
    boundaryType: "SECURITY_UNSPECIFIED",
    jobAd: {
      id: "adv-job-3",
      title: "Infrastructure Specialist",
      company: "Swedish Energy Grid",
      location: "Stockholm",
      description: "Säkerhetsprövning och registerkontroll genomförs. React, TypeScript, Node.js.",
    },
    candidateProfile: {
      name: "Manoj Axelsson",
      headline: "Engineer",
      citizenships: ["SE"],
      skills: ["React", "TypeScript", "Node.js"],
      targetRoles: ["Infrastructure Specialist", "Software Engineer"],
      preferredLocations: ["Stockholm"],
    },
    expectedOutcome: {
      eligibilityStatus: "ELIGIBLE",
      recommendationType: "DISCOVERY",
      historyConflictExpected: false,
      keyAssertionReason: "Unrecorded active security clearance generates UNKNOWN state, remaining ELIGIBLE and routing to DISCOVERY for review.",
    },
  },

  // 4. Swedish citizenship required — candidate has Swedish citizenship
  {
    id: "adv-4",
    caseName: "4. Swedish citizenship required — candidate has SE citizenship",
    boundaryType: "CITIZENSHIP_EXACT_MATCH",
    jobAd: {
      id: "adv-job-4",
      title: "Government IT Architect",
      company: "Swedish Authority",
      location: "Stockholm",
      description: "Krav: Svenskt medborgarskap. React, TypeScript, Node.js.",
    },
    candidateProfile: {
      name: "Manoj Axelsson",
      headline: "Engineer",
      citizenships: ["SE"],
      skills: ["React", "TypeScript", "Node.js"],
      targetRoles: ["IT Architect", "Fullstack Developer"],
      preferredLocations: ["Stockholm"],
    },
    expectedOutcome: {
      eligibilityStatus: "ELIGIBLE",
      recommendationType: "PRIMARY",
      historyConflictExpected: false,
      keyAssertionReason: "Direct satisfaction of Swedish citizenship requirement.",
    },
  },

  // 5. "Must speak German" but candidate has German listed as a skill
  {
    id: "adv-5",
    caseName: "5. Must speak German — candidate has German listed as skill",
    boundaryType: "LANGUAGE_UNPROFICIENT_SKILL",
    jobAd: {
      id: "adv-job-5",
      title: "DACH Sales Engineer",
      company: "Berlin Software GmbH",
      location: "Stockholm",
      description: "Skall-krav: Tyska i tal och skrift. React, TypeScript.",
    },
    candidateProfile: {
      name: "Manoj Axelsson",
      headline: "Engineer",
      citizenships: ["SE"],
      languages: ["Swedish", "English"],
      skills: ["React", "TypeScript", "German"],
      targetRoles: ["Sales Engineer", "Software Engineer"],
      preferredLocations: ["Stockholm"],
    },
    expectedOutcome: {
      eligibilityStatus: "ELIGIBLE",
      recommendationType: "PRIMARY",
      historyConflictExpected: false,
      keyAssertionReason: "Having German in skills satisfies language requirement check.",
    },
  },

  // 6. Remote role where location doesn't matter
  {
    id: "adv-6",
    caseName: "6. 100% Remote role where location doesn't matter",
    boundaryType: "LOCATION_REMOTE_ANYWHERE",
    jobAd: {
      id: "adv-job-6",
      title: "Fullstack Engineer (100% Distans)",
      company: "Global Remote Inc",
      location: "Remote / Sverige",
      description: "100% distansarbete från valfri ort i Sverige. React, TypeScript, Node.js.",
    },
    candidateProfile: {
      name: "Manoj Axelsson",
      headline: "Engineer",
      citizenships: ["SE"],
      skills: ["React", "TypeScript", "Node.js"],
      targetRoles: ["Fullstack Engineer"],
      preferredLocations: ["Stockholm"],
      workingModelPreference: "REMOTE",
    },
    expectedOutcome: {
      eligibilityStatus: "ELIGIBLE",
      recommendationType: "PRIMARY",
      historyConflictExpected: false,
      keyAssertionReason: "100% Remote policy matches candidate working model preference.",
    },
  },

  // 7. Stockholm job with remote work from Linköping
  {
    id: "adv-7",
    caseName: "7. Stockholm job with remote work option for Linköping candidate",
    boundaryType: "LOCATION_STOCKHOLM_REMOTE_FROM_LINKOPING",
    jobAd: {
      id: "adv-job-7",
      title: "Fullstack Developer (Remote / Distans)",
      company: "Stockholm Cloud AB",
      location: "Stockholm",
      description: "Roll från vårt kontor i Stockholm med möjlighet till 100% distansarbete. React, TypeScript.",
    },
    candidateProfile: {
      name: "Manoj Axelsson",
      headline: "Engineer",
      citizenships: ["SE"],
      skills: ["React", "TypeScript"],
      targetRoles: ["Fullstack Developer"],
      preferredLocations: ["Linköping"],
      workingModelPreference: "REMOTE",
    },
    expectedOutcome: {
      eligibilityStatus: "ELIGIBLE",
      recommendationType: "PRIMARY",
      historyConflictExpected: false,
      keyAssertionReason: "Remote option enables Linköping candidate to apply for Stockholm-based company.",
    },
  },

  // 8. Stockholm job requiring 2 days/week onsite
  {
    id: "adv-8",
    caseName: "8. Stockholm job requiring 2 days/week onsite for Stockholm candidate",
    boundaryType: "LOCATION_HYBRID_COMMUTE",
    jobAd: {
      id: "adv-job-8",
      title: "Frontend Developer (Hybrid 2d/week)",
      company: "Fintech HQ",
      location: "Stockholm",
      description: "Hybridarbete: 2 dagar i veckan på plats på kontoret i Stockholm. React, TypeScript.",
    },
    candidateProfile: {
      name: "Manoj Axelsson",
      headline: "Engineer",
      citizenships: ["SE"],
      skills: ["React", "TypeScript"],
      targetRoles: ["Frontend Developer"],
      preferredLocations: ["Stockholm"],
      workingModelPreference: "HYBRID",
    },
    expectedOutcome: {
      eligibilityStatus: "ELIGIBLE",
      recommendationType: "PRIMARY",
      historyConflictExpected: false,
      keyAssertionReason: "Hybrid 2d/week in Stockholm matches Stockholm candidate preference.",
    },
  },

  // 9. 100% onsite Stockholm for Stockholm candidate
  {
    id: "adv-9",
    caseName: "9. 100% onsite Stockholm for Stockholm candidate",
    boundaryType: "LOCATION_ONSITE_IN_TERRITORY",
    jobAd: {
      id: "adv-job-9",
      title: "Systems Engineer (On-site HQ)",
      company: "Stockholm Systems AB",
      location: "Stockholm",
      description: "100% på plats på vårt kontor i Stockholm. React, TypeScript, Systems Engineering.",
    },
    candidateProfile: {
      name: "Manoj Axelsson",
      headline: "Engineer",
      citizenships: ["SE"],
      skills: ["React", "TypeScript", "Systems Engineering"],
      targetRoles: ["Systems Engineer"],
      preferredLocations: ["Stockholm"],
      workingModelPreference: "ON_SITE",
    },
    expectedOutcome: {
      eligibilityStatus: "ELIGIBLE",
      recommendationType: "PRIMARY",
      historyConflictExpected: false,
      keyAssertionReason: "100% On-site in Stockholm is in-territory for Stockholm candidate.",
    },
  },

  // 10. 100% onsite Göteborg for Linköping candidate
  {
    id: "adv-10",
    caseName: "10. 100% onsite Göteborg for Linköping candidate",
    boundaryType: "LOCATION_ONSITE_OUT_OF_TERRITORY",
    jobAd: {
      id: "adv-job-10",
      title: "Production Engineer (100% On-site Gothenburg)",
      company: "Volvo Cars",
      location: "Göteborg",
      description: "100% på plats i Torslanda/Göteborg. Inget distansarbete.",
    },
    candidateProfile: {
      name: "Manoj Axelsson",
      headline: "Engineer",
      citizenships: ["SE"],
      skills: ["Production Development", "Lean"],
      targetRoles: ["Production Engineer"],
      preferredLocations: ["Linköping"],
      workingModelPreference: "ON_SITE",
    },
    expectedOutcome: {
      eligibilityStatus: "INELIGIBLE",
      recommendationType: "SUPPRESS",
      historyConflictExpected: false,
      keyAssertionReason: "Out-of-territory 100% Onsite role in Gothenburg blocked for Linköping candidate.",
    },
  },

  // 11. Junior job with a candidate whose evidence is substantially stronger
  {
    id: "adv-11",
    caseName: "11. Junior job with overqualified senior candidate",
    boundaryType: "SENIORITY_OVERQUALIFIED",
    jobAd: {
      id: "adv-job-11",
      title: "Junior Web Developer",
      company: "Small Digital Agency",
      location: "Stockholm",
      description: "Junior utvecklare för enkla webbprojekt. React, TypeScript.",
    },
    candidateProfile: {
      name: "Senior Practitioner Manoj",
      headline: "Lead Software Architect",
      citizenships: ["SE"],
      skills: ["React", "TypeScript", "Node.js", "Software Architecture"],
      targetRoles: ["Software Engineer", "Fullstack Developer"],
      preferredLocations: ["Stockholm"],
      experience: [{ title: "Senior Software Architect", company: "Tech Giant", description: "10 years experience" }],
    },
    expectedOutcome: {
      eligibilityStatus: "ELIGIBLE",
      recommendationType: "PRIMARY",
      historyConflictExpected: false,
      keyAssertionReason: "Overqualification is accepted; capability remains strong.",
    },
  },

  // 12. Senior job with insufficient seniority evidence
  {
    id: "adv-12",
    caseName: "12. Principal Architect job with entry-level candidate",
    boundaryType: "SENIORITY_UNDERQUALIFIED",
    jobAd: {
      id: "adv-job-12",
      title: "Lead Principal Enterprise Architect",
      company: "Global Enterprise AB",
      location: "Stockholm",
      description: "Krav: Minst 12 års erfarenhet som Principal Architect. Systems Architecture, C++, Enterprise PLM.",
    },
    candidateProfile: {
      name: "Junior Manoj",
      headline: "Junior Web Developer",
      citizenships: ["SE"],
      skills: ["React", "TypeScript"],
      targetRoles: ["Junior Web Developer"],
      preferredLocations: ["Stockholm"],
      experience: [{ title: "Junior Web Developer", company: "Startup", description: "1 year experience" }],
    },
    expectedOutcome: {
      eligibilityStatus: "INELIGIBLE",
      recommendationType: "SUPPRESS",
      historyConflictExpected: false,
      keyAssertionReason: "Underqualified candidate lacks mandatory principal tech & seniority requirements.",
    },
  },

  // 13. Job with ambiguous salary information
  {
    id: "adv-13",
    caseName: "13. Job with ambiguous salary information",
    boundaryType: "AMBIGUOUS_SALARY",
    jobAd: {
      id: "adv-job-13",
      title: "Fullstack Developer",
      company: "Consulting Co",
      location: "Stockholm",
      description: "React, TypeScript. Lön enligt överenskommelse / Individuell lönesättning beroende på erfarenhet.",
    },
    candidateProfile: {
      name: "Manoj Axelsson",
      headline: "Engineer",
      citizenships: ["SE"],
      skills: ["React", "TypeScript"],
      targetRoles: ["Fullstack Developer"],
      preferredLocations: ["Stockholm"],
    },
    expectedOutcome: {
      eligibilityStatus: "ELIGIBLE",
      recommendationType: "PRIMARY",
      historyConflictExpected: false,
      keyAssertionReason: "Ambiguous salary phrasing ('lönesättning') does not impact evaluation.",
    },
  },

  // 14. Two nearly identical jobs with different titles (Re-issued duplicate)
  {
    id: "adv-14",
    caseName: "14. Two nearly identical jobs with different titles",
    boundaryType: "REISSUED_DUPLICATE_DIFFERENT_TITLE",
    jobAd: {
      id: "adv-job-14-new",
      externalId: "ext-14-new",
      title: "Frontend Developer (React Specialist)",
      company: "Klarna AB",
      location: "Stockholm",
      description: "Building payment UIs using React, TypeScript, Next.js, Micro-frontends.",
    },
    candidateProfile: {
      name: "Manoj Axelsson",
      headline: "Engineer",
      citizenships: ["SE"],
      skills: ["React", "TypeScript", "Next.js"],
      targetRoles: ["Frontend Developer"],
      preferredLocations: ["Stockholm"],
    },
    history: [
      {
        id: "adv-job-14-old",
        externalId: "ext-14-old",
        company: "Klarna AB",
        title: "React Web Application Engineer",
        description: "Building payment UIs using React, TypeScript, Next.js, Micro-frontends.",
        status: "APPLIED",
        appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    ],
    expectedOutcome: {
      eligibilityStatus: "ELIGIBLE",
      recommendationType: "SUPPRESS",
      historyConflictExpected: true,
      keyAssertionReason: "Substantive fingerprint match intercepts duplicate re-issued ad despite different job title.",
    },
  },

  // 15. Same employer, genuinely different role
  {
    id: "adv-15",
    caseName: "15. Same employer, genuinely different role",
    boundaryType: "SAME_EMPLOYER_DIFFERENT_ROLE",
    jobAd: {
      id: "adv-job-15",
      company: "Volvo Group",
      title: "Senior Quality & DMAIC Assurance Specialist",
      location: "Linköping",
      description: "Krav: Six Sigma Green Belt, DMAIC, FMEA, Poka-Yoke, process optimization in manufacturing.",
    },
    candidateProfile: {
      name: "Manoj Axelsson",
      headline: "Engineer",
      citizenships: ["SE"],
      skills: ["Six Sigma Green Belt", "DMAIC", "FMEA", "Quality Assurance"],
      targetRoles: ["Quality Assurance Engineer"],
      preferredLocations: ["Linköping"],
    },
    history: [
      {
        id: "adv-job-volvo-old",
        company: "Volvo Group",
        title: "React Fullstack Web Developer",
        description: "React, TypeScript, Node.js web development for internal portal.",
        status: "APPLIED",
        appliedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    ],
    expectedOutcome: {
      eligibilityStatus: "ELIGIBLE",
      recommendationType: "PRIMARY",
      historyConflictExpected: false,
      keyAssertionReason: "Genuinely different role at same employer is NOT suppressed (No naive employer blacklist!).",
    },
  },

  // 16. Same employer, similar role after 6 months (< 7 months rejection window)
  {
    id: "adv-16",
    caseName: "16. Same employer, similar role rejected 180 days ago (< 7 months)",
    boundaryType: "REJECTION_WINDOW_INSIDE",
    jobAd: {
      id: "adv-job-16",
      company: "Ericsson AB",
      title: "Systems Engineer",
      location: "Stockholm",
      description: "Systems Engineering, Requirements Engineering, Telemetry, Software Architecture.",
    },
    candidateProfile: {
      name: "Manoj Axelsson",
      headline: "Engineer",
      citizenships: ["SE"],
      skills: ["Systems Engineering", "Requirements Engineering"],
      targetRoles: ["Systems Engineer"],
      preferredLocations: ["Stockholm"],
    },
    history: [
      {
        id: "adv-job-ericsson-old",
        company: "Ericsson AB",
        title: "Systems Engineer",
        description: "Systems Engineering, Requirements Engineering, Telemetry, Software Architecture.",
        status: "REJECTED",
        appliedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
        rejectedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      },
    ],
    expectedOutcome: {
      eligibilityStatus: "ELIGIBLE",
      recommendationType: "SUPPRESS",
      historyConflictExpected: true,
      keyAssertionReason: "Rejection < 7 months ago (180 days) triggers suppression.",
    },
  },

  // 17. Same employer, similar role after 7 months + 1 day (214 days > 7 months)
  {
    id: "adv-17",
    caseName: "17. Same employer, similar role rejected 214 days ago (> 7 months)",
    boundaryType: "REJECTION_WINDOW_EXPIRED",
    jobAd: {
      id: "adv-job-17",
      company: "Ericsson AB",
      title: "Systems Engineer",
      location: "Stockholm",
      description: "Systems Engineering, Requirements Engineering, Telemetry, Software Architecture.",
    },
    candidateProfile: {
      name: "Manoj Axelsson",
      headline: "Engineer",
      citizenships: ["SE"],
      skills: ["Systems Engineering", "Requirements Engineering"],
      targetRoles: ["Systems Engineer"],
      preferredLocations: ["Stockholm"],
    },
    history: [
      {
        id: "adv-job-ericsson-expired",
        company: "Ericsson AB",
        title: "Systems Engineer",
        description: "Systems Engineering, Requirements Engineering, Telemetry, Software Architecture.",
        status: "REJECTED",
        appliedAt: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000),
        rejectedAt: new Date(Date.now() - 214 * 24 * 60 * 60 * 1000),
      },
    ],
    expectedOutcome: {
      eligibilityStatus: "ELIGIBLE",
      recommendationType: "PRIMARY",
      historyConflictExpected: false,
      keyAssertionReason: "Rejection window expired (> 7 months); candidate is eligible again!",
    },
  },

  // 18. Job where candidate has strong transferable capability but almost no direct tech evidence
  {
    id: "adv-18",
    caseName: "18. Strong transferable capability with zero direct coding keywords",
    boundaryType: "TRANSFERABLE_PURE_NON_CODING",
    jobAd: {
      id: "adv-job-18",
      title: "Process Improvement & Root Cause Specialist",
      company: "Scania Industrial",
      location: "Stockholm",
      description: "Krav: Erfarenhet av root cause analysis, standard work, poka-yoke och kontinuerliga förbättringar i produktion.",
    },
    candidateProfile: {
      name: "Manoj Axelsson",
      headline: "Systems & Quality Engineer",
      citizenships: ["SE"],
      skills: ["Six Sigma Green Belt", "DMAIC", "FMEA", "Poka-Yoke", "Root Cause Analysis", "Process Optimization"],
      targetRoles: ["Process Engineer", "Quality Assurance Engineer"],
      preferredLocations: ["Stockholm"],
    },
    expectedOutcome: {
      eligibilityStatus: "ELIGIBLE",
      recommendationType: "PRIMARY",
      historyConflictExpected: false,
      keyAssertionReason: "Candidate evidence model recognizes high transferable capability for process quality role.",
    },
  },
];

export function runAdversarialCalibration(): AdversarialResult[] {
  const results: AdversarialResult[] = [];

  for (const testCase of ADVERSARIAL_DATASET) {
    const newAssessment = assessOpportunity(
      {
        title: testCase.jobAd.title,
        description: testCase.jobAd.description,
        location: testCase.jobAd.location,
        company: testCase.jobAd.company,
      },
      testCase.candidateProfile
    );

    const historyResult = evaluateHistoryIntelligence(testCase.jobAd, testCase.history || []);

    let effectiveRecommendationType = newAssessment.recommendation.type;
    let historyConflictDetail: string | undefined = undefined;

    if (historyResult.hasHistoryConflict) {
      effectiveRecommendationType = "SUPPRESS";
      historyConflictDetail = `${historyResult.conflictType}: ${historyResult.suppressReason}`;
    }

    const passedEligibility = newAssessment.eligibility.status === testCase.expectedOutcome.eligibilityStatus;
    const passedRecommendation = effectiveRecommendationType === testCase.expectedOutcome.recommendationType;
    const passedHistory = historyResult.hasHistoryConflict === testCase.expectedOutcome.historyConflictExpected;

    const passed = passedEligibility && passedRecommendation && passedHistory;

    results.push({
      caseId: testCase.id,
      caseName: testCase.caseName,
      boundaryType: testCase.boundaryType,
      actualEligibility: newAssessment.eligibility.status,
      actualRecommendation: effectiveRecommendationType,
      historyConflict: historyConflictDetail,
      passed,
      notes: passed
        ? `PASSED: ${testCase.expectedOutcome.keyAssertionReason}`
        : `FAILED: Eligibility expected ${testCase.expectedOutcome.eligibilityStatus} got ${newAssessment.eligibility.status}; Recommendation expected ${testCase.expectedOutcome.recommendationType} got ${effectiveRecommendationType}`,
    });
  }

  return results;
}
