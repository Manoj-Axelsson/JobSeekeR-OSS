/**
 * Phase 3 — Candidate Evidence Model Engine
 * JobSeekR Intelligence Framework v3.0
 *
 * Prevents the "word wasn't there, therefore candidate doesn't have it" issue.
 * Maps Capabilities to Evidence, Evidence Strength, and Evidence Source.
 */

import { EvidenceStrength } from "./contract";

export interface CapabilityEvidence {
  capability: string;
  category: "SOFTWARE" | "SYSTEMS" | "QUALITY" | "INDUSTRIAL" | "TRANSFERABLE" | "GENERAL";
  demonstratedIn: string[];
  strength: EvidenceStrength;
  source: "CV_EXPERIENCE" | "PROJECT" | "EDUCATION" | "CERTIFICATION" | "TRANSFERABLE_MAPPING";
  isTransferable?: boolean;
}

export interface CandidateEvidenceModel {
  name: string;
  headline: string;
  citizenship: string; // Primary citizenship e.g. "SE"
  citizenships: string[]; // List of held citizenships e.g. ["SE"]
  hasWorkAuthorization: boolean;
  languages: string[];
  targetRoles: string[];
  preferredLocations: string[];
  workingModelPreference?: "REMOTE" | "HYBRID" | "ON_SITE";
  capabilities: Map<string, CapabilityEvidence>;
}

const TRANSFERABLE_MAPPINGS: Record<string, string[]> = {
  "Stakeholder Collaboration": ["Project Management", "Production Development", "Lean", "Requirements Engineering"],
  "Problem Solving": ["Software Architecture", "Systems Engineering", "DMAIC", "Root Cause Analysis"],
  "Quality Assurance": ["Verification", "Validation", "Six Sigma", "FMEA", "Testing"],
  "System Architecture": ["Fullstack Developer", "Systems Engineer", "Backend", "API Design"],
  "Continuous Improvement": ["Lean Manufacturing", "Standard Work", "Poka-Yoke", "Agile"],
};

export function createCandidateEvidenceModel(
  rawProfile: {
    name?: string;
    headline?: string;
    citizenship?: string;
    citizenships?: string[];
    languages?: string[];
    skills?: string[];
    targetRoles?: string[];
    preferredLocations?: string[];
    workingModelPreference?: "REMOTE" | "HYBRID" | "ON_SITE";
    experience?: Array<{ title: string; company?: string; description?: string }>;
    certifications?: string[];
  }
): CandidateEvidenceModel {
  const capabilities = new Map<string, CapabilityEvidence>();

  const name = rawProfile.name || "Manoj John Axelsson";
  const headline = rawProfile.headline || "Software & Systems Engineer";
  const primaryCitizenship = rawProfile.citizenship || "SE";
  const citizenships = rawProfile.citizenships || [primaryCitizenship];
  const hasWorkAuthorization = true;
  const languages = rawProfile.languages || ["Swedish", "English", "Malayalam"];
  const targetRoles = rawProfile.targetRoles || ["Fullstack Developer", "Systems Engineer", "Production Developer"];
  const preferredLocations = rawProfile.preferredLocations || ["Stockholm", "Linköping", "Norrköping", "Göteborg", "Sweden", "Remote"];

  const explicitSkills = rawProfile.skills || [
    "React", "TypeScript", "Next.js", "Node.js", "Express", "PostgreSQL", "SQL", "REST APIs", "Git", "GitHub", "Tailwind CSS",
    "Systems Engineering", "Software Architecture", "Requirements Engineering", "Validation & Verification", "PLM",
    "Six Sigma Green Belt", "DMAIC", "FMEA", "Poka-Yoke", "Root Cause Analysis", "Quality Assurance", "Process Optimization",
    "Manufacturing Engineering", "Production Development", "Lean Manufacturing", "Automation", "CAD/CAM"
  ];

  for (const skill of explicitSkills) {
    const sKey = skill.toLowerCase();
    capabilities.set(sKey, {
      capability: skill,
      category: classifyCategory(skill),
      demonstratedIn: ["Verified Profile Competency", "Engineering Practice"],
      strength: "HIGH",
      source: "CV_EXPERIENCE",
    });
  }

  if (rawProfile.experience && rawProfile.experience.length > 0) {
    for (const exp of rawProfile.experience) {
      const titleKey = exp.title.toLowerCase();
      if (!capabilities.has(titleKey)) {
        capabilities.set(titleKey, {
          capability: exp.title,
          category: "GENERAL",
          demonstratedIn: [exp.company ? `Role at ${exp.company}` : "Professional Experience"],
          strength: "HIGH",
          source: "CV_EXPERIENCE",
        });
      }
    }
  }

  for (const [transferableSkill, requiredPrereqs] of Object.entries(TRANSFERABLE_MAPPINGS)) {
    const sKey = transferableSkill.toLowerCase();
    if (!capabilities.has(sKey)) {
      const matchedPrereq = requiredPrereqs.find(prereq => capabilities.has(prereq.toLowerCase()));
      if (matchedPrereq) {
        capabilities.set(sKey, {
          capability: transferableSkill,
          category: "TRANSFERABLE",
          demonstratedIn: [`Transferable capability derived from ${matchedPrereq}`],
          strength: "HIGH",
          source: "TRANSFERABLE_MAPPING",
          isTransferable: true,
        });
      }
    }
  }

  return {
    name,
    headline,
    citizenship: primaryCitizenship,
    citizenships,
    hasWorkAuthorization,
    languages,
    targetRoles,
    preferredLocations,
    workingModelPreference: rawProfile.workingModelPreference || "HYBRID",
    capabilities,
  };
}

function classifyCategory(skill: string): CapabilityEvidence["category"] {
  const sLower = skill.toLowerCase();
  if (sLower.includes("react") || sLower.includes("typescript") || sLower.includes("node") || sLower.includes("sql") || sLower.includes("git")) {
    return "SOFTWARE";
  }
  if (sLower.includes("system") || sLower.includes("requirement") || sLower.includes("architecture")) {
    return "SYSTEMS";
  }
  if (sLower.includes("six sigma") || sLower.includes("dmaic") || sLower.includes("fmea") || sLower.includes("quality")) {
    return "QUALITY";
  }
  if (sLower.includes("manufacturing") || sLower.includes("production") || sLower.includes("automation") || sLower.includes("cad")) {
    return "INDUSTRIAL";
  }
  return "GENERAL";
}

export function findEvidence(
  candidate: CandidateEvidenceModel,
  requirement: string
): CapabilityEvidence | null {
  const reqLower = requirement.toLowerCase().trim();

  if (candidate.capabilities.has(reqLower)) {
    return candidate.capabilities.get(reqLower)!;
  }

  for (const [key, ev] of candidate.capabilities.entries()) {
    if (key.includes(reqLower) || reqLower.includes(key)) {
      return ev;
    }
  }

  if (reqLower === "nextjs" && candidate.capabilities.has("next.js")) return candidate.capabilities.get("next.js")!;
  if (reqLower === "nodejs" && candidate.capabilities.has("node.js")) return candidate.capabilities.get("node.js")!;
  if (reqLower === "postgres" && candidate.capabilities.has("postgresql")) return candidate.capabilities.get("postgresql")!;
  if (reqLower === "swedish" && candidate.languages.some(l => l.toLowerCase().includes("swedish") || l.toLowerCase().includes("svenska"))) {
    return {
      capability: "Swedish Language",
      category: "GENERAL",
      demonstratedIn: ["Fluent Swedish speaker"],
      strength: "HIGH",
      source: "CV_EXPERIENCE",
    };
  }

  return null;
}
