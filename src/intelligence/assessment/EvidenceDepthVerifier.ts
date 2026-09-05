/**
 * Structural Evidence Verifiability Engine (v3.1.1)
 *
 * Implements structural evidence verifiability checking without arbitrary month-count formulas.
 * Evaluates whether candidate capability evidence is backed by attributable role/project/certification anchors,
 * listed as a standalone skill keyword tag (BARE_KEYWORD_ASSERTION), or completely absent (NO_MATCH).
 */

import {
  RequirementState,
  VerifiabilityClass,
  EssentialCompetencyFit,
} from "./NonNumericalContract";

export interface CandidateProfilePayload {
  skills?: string[] | Record<string, string[]>;
  experiences?: Array<{
    title: string;
    company?: string;
    description?: string;
    skillsUsed?: string[];
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    skillsUsed?: string[];
  }>;
  certifications?: string[];
  declaredAbsences?: string[];
}

export interface EvidenceDepthVerificationResult {
  competency: string;
  status: RequirementState;
  provenance: VerifiabilityClass;
  depthRating: "ANCHORED_EVIDENCE" | "BARE_KEYWORD_ASSERTION" | "UNVERIFIED";
  demonstratedIn: string[];
}

/**
 * Extracts a flat array of skill keywords from candidate profile skills field.
 */
function extractFlatSkills(skills?: string[] | Record<string, string[]>): string[] {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  return Object.values(skills).flat();
}

/**
 * Normalizes text for case-insensitive substring matching.
 */
function normalize(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Checks whether target capability matches text token.
 */
function isMatch(target: string, text: string): boolean {
  const normTarget = normalize(target);
  const normText = normalize(text);
  if (!normTarget || !normText) return false;
  return normText.includes(normTarget) || normTarget.includes(normText);
}

/**
 * Verifies structural evidence depth and provenance for a single requirement.
 */
export function verifyEvidenceDepth(
  requirement: string,
  profile: CandidateProfilePayload
): EvidenceDepthVerificationResult {
  const demonstratedIn: string[] = [];

  // 1. Check for explicit negative declaration / declared absence
  if (profile.declaredAbsences && profile.declaredAbsences.some((abs) => isMatch(requirement, abs))) {
    return {
      competency: requirement,
      status: "DEMONSTRATED_ABSENCE",
      provenance: "NO_MATCH",
      depthRating: "UNVERIFIED",
      demonstratedIn: [],
    };
  }

  // 2. Check for attributable experience history anchors
  if (profile.experiences && profile.experiences.length > 0) {
    for (const exp of profile.experiences) {
      const titleMatch = exp.title && isMatch(requirement, exp.title);
      const descMatch = exp.description && isMatch(requirement, exp.description);
      const skillsMatch = exp.skillsUsed && exp.skillsUsed.some((s) => isMatch(requirement, s));

      if (titleMatch || descMatch || skillsMatch) {
        const anchorName = exp.company ? `${exp.title} at ${exp.company}` : exp.title;
        demonstratedIn.push(anchorName);
      }
    }
  }

  // 3. Check for project deliverable anchors
  if (profile.projects && profile.projects.length > 0) {
    for (const proj of profile.projects) {
      const nameMatch = proj.name && isMatch(requirement, proj.name);
      const descMatch = proj.description && isMatch(requirement, proj.description);
      const skillsMatch = proj.skillsUsed && proj.skillsUsed.some((s) => isMatch(requirement, s));

      if (nameMatch || descMatch || skillsMatch) {
        demonstratedIn.push(`Project: ${proj.name}`);
      }
    }
  }

  // 4. Check for certification anchors
  if (profile.certifications && profile.certifications.length > 0) {
    for (const cert of profile.certifications) {
      if (isMatch(requirement, cert)) {
        demonstratedIn.push(`Certification: ${cert}`);
      }
    }
  }

  // ANCHORED_EVIDENCE: Attributable work history / project / certification anchor exists
  if (demonstratedIn.length > 0) {
    return {
      competency: requirement,
      status: "DEMONSTRATED_PRESENCE",
      provenance: "ANCHORED_EVIDENCE",
      depthRating: "ANCHORED_EVIDENCE",
      demonstratedIn,
    };
  }

  // 5. If no attributable anchor, check standalone skill keyword tags
  const flatSkills = extractFlatSkills(profile.skills);
  const isBareKeyword = flatSkills.some((s) => isMatch(requirement, s));

  if (isBareKeyword) {
    return {
      competency: requirement,
      status: "UNKNOWN_INSUFFICIENT_EVIDENCE",
      provenance: "BARE_KEYWORD_ASSERTION",
      depthRating: "BARE_KEYWORD_ASSERTION",
      demonstratedIn: [],
    };
  }

  // 6. NO_MATCH: Skill is completely unrecorded in candidate profile
  return {
    competency: requirement,
    status: "UNKNOWN_INSUFFICIENT_EVIDENCE",
    provenance: "NO_MATCH",
    depthRating: "UNVERIFIED",
    demonstratedIn: [],
  };
}

/**
 * Maps verification result to EssentialCompetencyFit output interface.
 */
export function toEssentialCompetencyFit(
  result: EvidenceDepthVerificationResult,
  escoUri?: string
): EssentialCompetencyFit {
  return {
    competency: result.competency,
    status: result.status,
    depthRating: result.depthRating,
    provenance: result.provenance,
    demonstratedIn: result.demonstratedIn.length > 0 ? result.demonstratedIn : undefined,
    escoUri,
  };
}
