import { decisionSupportEngine, DecisionSupportContext } from "../../intelligence";
import { classifyOccupation, OccupationCandidate } from "./pipeline/classifier";
import { evaluateEligibility, EligibilityResult, PreferencesConfig, TerritoryConfig } from "./pipeline/eligibility";
import { evaluateCapabilityAndIntent, DualScoreResult } from "./pipeline/scoring";

export interface MatchResult {
  matchScore: number;
  capabilityScore: number;
  intentScore: number;
  feedType: "PRIMARY" | "DISCOVERY";
  eligibilityStatus: "ELIGIBLE" | "INELIGIBLE" | "DISCARDED";
  probableOccupations: OccupationCandidate[];
  matchedSkills: string[];
  missingSkills: string[];
  matchedNiceToHave: string[];
  domainScores: {
    software: number;
    systems: number;
    quality: number;
    industrial: number;
  };
  analysis: {
    whyMatched: string[];
    whatLacking: string[];
    coverLetterPitch: {
      openingHook: string;
      keyStrengthsToLeadWith: string[];
      gapMitigationStrategy: string;
      suggestedBulletPoints: string[];
    };
  };
  decisionSupport?: DecisionSupportContext;
  eligibilityDetails: EligibilityResult;
}

const TAXONOMY = {
  software: [
    "react", "typescript", "next.js", "nextjs", "node.js", "nodejs", "express", 
    "postgresql", "postgres", "sql", "rest", "api", "git", "github", "frontend", 
    "fullstack", "web", "tailwind", "vercel", "render", "javascript", "developer",
    "software engineer", "frontend developer", "backend", "cloud", "aws", "azure", 
    "gcp", "kubernetes", "docker", "python", "terraform", "devops", "infrastructure"
  ],
  systems: [
    "systems engineering", "systems engineer", "systems thinking", "software architecture", 
    "system architecture", "requirements engineering", "requirement engineer", 
    "requirements management", "validation", "verification", "technical documentation", 
    "plm", "business analyst", "system analyst", "lifecycle", "specification", "solutions engineer"
  ],
  quality: [
    "six sigma", "lean", "dmaic", "fmea", "poka-yoke", "root cause", "quality assurance", 
    "qa", "process optimization", "standard work", "continuous improvement", "validation", 
    "quality engineer", "test engineer", "verification engineer", "iso 9001", "audit"
  ],
  industrial: [
    "manufacturing", "manufacturing engineer", "production developer", "production engineer", 
    "industrial digitalization", "industry 4.0", "automation", "automation engineer", 
    "cnc", "cad", "cam", "cad/cam", "preventive maintenance", "uptime", "plant", "factory", "assembly"
  ]
};

export function evaluateJobMatch(
  title: string, 
  description: string, 
  customProfileSkills: string[] = [],
  userName: string = "JobseekeR Candidate",
  userHeadline: string = "Software & Systems Engineer",
  companyName: string = "Employer Posting",
  jobLocation: string = "Sweden",
  searchProfilePreferences?: PreferencesConfig,
  searchTerritoryConfig?: TerritoryConfig
): MatchResult {
  const text = `${title} ${description}`.toLowerCase();

  // 1. Probabilistic Occupation Classification (SSYK/ISCO metadata)
  const probableOccupations = classifyOccupation(title, description);

  // Default Preferences & Territory if omitted
  const prefs: PreferencesConfig = searchProfilePreferences || {
    mustHave: [],
    prefer: ["React", "TypeScript", "Systems Engineering", "Automation"],
    niceToHave: ["Docker", "AWS"],
    exclude: [],
    explore: ["Cleantech", "Sustainability"],
    targetOccupations: [title],
  };

  const territory: TerritoryConfig = searchTerritoryConfig || {
    countries: ["SE"],
    regions: ["Östergötland", "Stockholm", "Västra Götaland"],
    municipalities: ["Linköping", "Norrköping", "Stockholm", "Göteborg", "Skellefteå"],
    cities: ["Linköping", "Norrköping", "Stockholm", "Göteborg"],
    remotePolicy: "ALLOWED",
    discoveryPolicy: "SHOW_SEPARATELY",
  };

  // 2. Evaluate Eligibility & Feed Routing (Must Have, Exclude, Territory, Primary vs Discovery)
  const eligibility = evaluateEligibility(title, jobLocation, description, companyName, prefs, territory);

  // 3. Separate Capability Fit Score from Intent Fit Score
  const dualScores = evaluateCapabilityAndIntent(
    title,
    description,
    customProfileSkills,
    userHeadline,
    prefs.prefer,
    prefs.niceToHave,
    prefs.targetOccupations
  );

  // 4. Calculate legacy domain scores for backwards compatibility
  const matchedSet = new Set<string>(dualScores.matchedSkills);
  const missingSet = new Set<string>(dualScores.missingSkills);

  const domainScores = {
    software: calculateDomainScore(text, TAXONOMY.software, matchedSet, missingSet),
    systems: calculateDomainScore(text, TAXONOMY.systems, matchedSet, missingSet),
    quality: calculateDomainScore(text, TAXONOMY.quality, matchedSet, missingSet),
    industrial: calculateDomainScore(text, TAXONOMY.industrial, matchedSet, missingSet),
  };

  // 5. Synthesize 5-Stage Decision Support Engine
  const oppEntity = {
    id: "opp-live",
    title,
    company: companyName,
    location: jobLocation,
    description,
    workingModel: (text.includes("remote") ? "REMOTE" : text.includes("hybrid") ? "HYBRID" : "ON_SITE") as "REMOTE" | "HYBRID" | "ON_SITE",
  };

  const candidateProfile = {
    name: userName || "Anna",
    targetRoleTitle: userHeadline || "Engineer",
    superpowers: dualScores.transferableStrengths.slice(0, 3),
    verifiedEvidence: dualScores.matchedSkills.map((s, idx) => ({
      id: `ev-${idx}`,
      achievementText: `Demonstrated capability in ${s}`,
      associatedCompetency: s,
    })),
  };

  const decisionPreferences = {
    targetRoles: [title],
    preferredLocations: [jobLocation],
    skills: dualScores.matchedSkills,
    workingModelPreference: oppEntity.workingModel,
  };

  const decisionSupport = decisionSupportEngine.evaluateDecisionSupport(oppEntity, candidateProfile, decisionPreferences);

  // 6. Generate Narrative Analysis for Cover Letter & Pitch Strategy
  const whyMatched: string[] = [
    `[${eligibility.feedType} FEED] ${decisionSupport.stage1Opportunity.pursuitRecommendation}`,
    ...eligibility.reasons,
  ];

  const whatLacking: string[] = decisionSupport.stage3Positioning.missingEvidenceWarnings.length > 0
    ? decisionSupport.stage3Positioning.missingEvidenceWarnings
    : ["No critical skill gaps identified. Profile covers the core requirements."];

  return {
    matchScore: dualScores.totalMatchScore,
    capabilityScore: dualScores.capabilityScore,
    intentScore: dualScores.intentScore,
    feedType: eligibility.feedType,
    eligibilityStatus: eligibility.status,
    probableOccupations,
    matchedSkills: dualScores.matchedSkills,
    missingSkills: dualScores.missingSkills,
    matchedNiceToHave: dualScores.matchedNiceToHave,
    domainScores,
    analysis: {
      whyMatched,
      whatLacking,
      coverLetterPitch: {
        openingHook: decisionSupport.stage4Coaching.coverLetterHook,
        keyStrengthsToLeadWith: decisionSupport.stage3Positioning.strongestCompetencies.slice(0, 3),
        gapMitigationStrategy: decisionSupport.stage3Positioning.transferableHighlight || "Highlight your technical adaptability and transferable engineering foundations.",
        suggestedBulletPoints: decisionSupport.stage4Coaching.keyInterviewTalkingPoints.slice(0, 3),
      },
    },
    decisionSupport,
    eligibilityDetails: eligibility,
  };
}

function calculateDomainScore(
  text: string, 
  keywords: string[], 
  matchedSet: Set<string>, 
  missingSet: Set<string>
): number {
  let count = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) {
      count++;
      matchedSet.add(capitalize(kw));
    }
  }
  
  const ratio = count / Math.min(keywords.length, 8);
  return Math.min(100, Math.round(ratio * 100));
}

function capitalize(str: string): string {
  return str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
