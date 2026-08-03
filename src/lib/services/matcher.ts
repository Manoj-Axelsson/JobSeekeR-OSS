import { decisionSupportEngine, DecisionSupportContext } from "../../intelligence";

export interface MatchResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
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

// Common tech keywords to detect missing skills
const EXTERNAL_TECH = [
  "docker", "kubernetes", "k8s", "aws", "azure", "gcp", "cloud", "python", "c++", "c#", 
  "java", "go", "rust", "graphql", "kafka", "redis", "mongodb", "jira", "confluence", 
  "scrum", "agile", "devops", "ci/cd", "microservices", "cybersecurity", "iso 13485", 
  "sap", "embedded", "linux", "autosar", "plc", "scada", "robotics"
];

export function evaluateJobMatch(
  title: string, 
  description: string, 
  customProfileSkills: string[] = [],
  userName: string = "JobseekeR Candidate",
  userHeadline: string = "Software & Systems Engineer"
): MatchResult {
  const text = `${title} ${description}`.toLowerCase();
  
  const matchedSet = new Set<string>();
  const missingSet = new Set<string>();
  
  const domainScores = {
    software: calculateDomainScore(text, TAXONOMY.software, matchedSet, missingSet),
    systems: calculateDomainScore(text, TAXONOMY.systems, matchedSet, missingSet),
    quality: calculateDomainScore(text, TAXONOMY.quality, matchedSet, missingSet),
    industrial: calculateDomainScore(text, TAXONOMY.industrial, matchedSet, missingSet),
  };

  // Evaluate any custom skills uploaded via CV or user profile
  let customSkillsMatchedCount = 0;
  if (customProfileSkills && customProfileSkills.length > 0) {
    for (const skill of customProfileSkills) {
      const sLower = skill.toLowerCase().trim();
      if (sLower && text.includes(sLower)) {
        customSkillsMatchedCount++;
        matchedSet.add(capitalize(skill));
      }
    }
  }

  // Detect external missing skills mentioned in description
  for (const tech of EXTERNAL_TECH) {
    if (text.includes(tech)) {
      const isMatched = Array.from(matchedSet).some(m => m.toLowerCase() === tech);
      if (!isMatched) {
        missingSet.add(capitalize(tech));
      }
    }
  }

  const matchedSkills = Array.from(matchedSet).slice(0, 10);
  const missingSkills = Array.from(missingSet).slice(0, 6);

  // Synthesize 5-Stage Decision Support Engine
  const oppEntity = {
    id: "opp-live",
    title,
    company: "Employer Posting",
    location: "Sweden",
    description,
    workingModel: (text.includes("remote") ? "REMOTE" : text.includes("hybrid") ? "HYBRID" : "ON_SITE") as "REMOTE" | "HYBRID" | "ON_SITE",
  };

  const candidateProfile = {
    name: userName || "Anna",
    targetRoleTitle: userHeadline || "Engineer",
    superpowers: Array.from(matchedSet).slice(0, 3),
    verifiedEvidence: matchedSkills.map((s, idx) => ({
      id: `ev-${idx}`,
      achievementText: `Demonstrated capability in ${s}`,
      associatedCompetency: s,
    })),
  };

  const preferences = {
    targetRoles: [title],
    preferredLocations: ["Sweden"],
    skills: matchedSkills,
    workingModelPreference: oppEntity.workingModel,
  };

  const decisionSupport = decisionSupportEngine.evaluateDecisionSupport(oppEntity, candidateProfile, preferences);

  // Generate Narrative Analysis for Cover Letter & Pitch Strategy
  const whyMatched: string[] = [decisionSupport.stage1Opportunity.pursuitRecommendation];
  const whatLacking: string[] = decisionSupport.stage3Positioning.missingEvidenceWarnings.length > 0
    ? decisionSupport.stage3Positioning.missingEvidenceWarnings
    : ["No critical skill gaps identified. Your profile covers the core requirements for this position."];

  const openingHook = decisionSupport.stage4Coaching.coverLetterHook;
  const gapMitigationStrategy = decisionSupport.stage3Positioning.transferableHighlight || "Highlight your rapid technical adaptability and transferable engineering foundations.";
  const suggestedBulletPoints = decisionSupport.stage4Coaching.keyInterviewTalkingPoints.slice(0, 3);

  return {
    matchScore: decisionSupport.stage1Opportunity.score,
    matchedSkills,
    missingSkills,
    domainScores,
    analysis: {
      whyMatched,
      whatLacking,
      coverLetterPitch: {
        openingHook,
        keyStrengthsToLeadWith: decisionSupport.stage3Positioning.strongestCompetencies.slice(0, 3),
        gapMitigationStrategy,
        suggestedBulletPoints,
      },
    },
    decisionSupport,
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
