/**
 * Mandatory Statutory Gate Evaluator Engine (v3.1.1)
 *
 * Evaluates mandatory statutory gates (Location/Working Model, Work Authorization, Language Fluency, Security Clearance)
 * adhering strictly to pure tri-state semantics (SATISFIED, UNSATISFIED, VERIFICATION_REQUIRED).
 *
 * Incomplete Profile Safety Rule: If a statutory requirement is unmentioned in an incomplete candidate profile,
 * the gate evaluates to VERIFICATION_REQUIRED and overallStatus evaluates to VERIFICATION_REQUIRED (never ELIGIBLE or INELIGIBLE).
 */

import {
  GateStatus,
  AggregateGateStatus,
  MandatoryGateEvaluation,
} from "./NonNumericalContract";

export interface CandidateGateInput {
  location?: string;
  preferredLocations?: string[];
  workingModelPreference?: "REMOTE" | "HYBRID" | "ON_SITE";
  languages?: string[];
  citizenship?: string;
  citizenships?: string[];
  hasWorkAuthorization?: boolean;
  securityClearance?: boolean;
  declaredIneligibilities?: string[];
}

export interface JobGateInput {
  location?: string;
  workingModel?: "REMOTE" | "HYBRID" | "ON_SITE";
  requiredLanguages?: string[];
  requiresCitizenship?: boolean;
  targetCitizenship?: string;
  securityClearanceRequired?: boolean;
}

export interface MandatoryGateEvaluationResult {
  overallStatus: AggregateGateStatus;
  evaluations: MandatoryGateEvaluation[];
  blockers: string[];
}

/**
 * Evaluates mandatory statutory gates for a job against candidate profile.
 */
export function evaluateMandatoryGates(
  job: JobGateInput,
  candidate: CandidateGateInput
): MandatoryGateEvaluationResult {
  const evaluations: MandatoryGateEvaluation[] = [];
  const blockers: string[] = [];

  // 1. Location & Working Model Gate
  if (job.location || job.workingModel) {
    const candidateLocs = candidate.preferredLocations || (candidate.location ? [candidate.location] : []);
    if (candidateLocs.length === 0 && !candidate.workingModelPreference) {
      evaluations.push({
        name: "Location & Working Model",
        gateStatus: "VERIFICATION_REQUIRED",
        explanation: "Candidate location and working model preferences are unmentioned in profile.",
      });
    } else {
      const targetLoc = (job.location || "").toLowerCase();
      const locMatched = candidateLocs.some(
        (loc) => loc.toLowerCase().includes("remote") || targetLoc.includes(loc.toLowerCase()) || loc.toLowerCase().includes("sweden")
      );

      if (locMatched) {
        evaluations.push({
          name: "Location & Working Model",
          gateStatus: "SATISFIED",
          explanation: `Location matches profile preference (${candidateLocs.join(", ")}).`,
        });
      } else {
        evaluations.push({
          name: "Location & Working Model",
          gateStatus: "VERIFICATION_REQUIRED",
          explanation: `Job location "${job.location}" requires candidate verification.`,
        });
      }
    }
  }

  // 2. Language Requirement Gate
  if (job.requiredLanguages && job.requiredLanguages.length > 0) {
    if (!candidate.languages || candidate.languages.length === 0) {
      evaluations.push({
        name: "Language Requirement",
        gateStatus: "VERIFICATION_REQUIRED",
        explanation: "Language skills are unmentioned in candidate profile.",
      });
    } else {
      const candLangs = candidate.languages.map((l) => l.toLowerCase());
      let allSatisfied = true;
      let anyUncertain = false;

      for (const reqLang of job.requiredLanguages) {
        const normLang = reqLang.toLowerCase();
        const found = candLangs.some((cl) => cl.includes(normLang) || normLang.includes(cl));
        if (!found) {
          allSatisfied = false;
          anyUncertain = true;
        }
      }

      if (allSatisfied) {
        evaluations.push({
          name: "Language Requirement",
          gateStatus: "SATISFIED",
          explanation: `Languages (${job.requiredLanguages.join(", ")}) demonstrated in profile.`,
        });
      } else if (anyUncertain) {
        evaluations.push({
          name: "Language Requirement",
          gateStatus: "VERIFICATION_REQUIRED",
          explanation: `Required languages (${job.requiredLanguages.join(", ")}) unmentioned in candidate profile.`,
        });
      }
    }
  }

  // 3. Work Authorization & Citizenship Gate
  if (job.requiresCitizenship || job.targetCitizenship) {
    if (candidate.hasWorkAuthorization === undefined && !candidate.citizenship && (!candidate.citizenships || candidate.citizenships.length === 0)) {
      evaluations.push({
        name: "Work Authorization",
        gateStatus: "VERIFICATION_REQUIRED",
        explanation: "Work authorization and citizenship details are unmentioned in profile.",
      });
    } else {
      const userCitizenships = candidate.citizenships || (candidate.citizenship ? [candidate.citizenship] : []);
      const targetCit = (job.targetCitizenship || "SE").toLowerCase();

      const hasDirectCitizenship = userCitizenships.some(
        (c) => c.toLowerCase() === targetCit || c.toLowerCase() === "swedish" || c.toLowerCase() === "se"
      );

      if (hasDirectCitizenship || candidate.hasWorkAuthorization) {
        evaluations.push({
          name: "Work Authorization",
          gateStatus: "SATISFIED",
          explanation: "Work authorization / citizenship verified in profile.",
        });
      } else {
        evaluations.push({
          name: "Work Authorization",
          gateStatus: "VERIFICATION_REQUIRED",
          explanation: `Work authorization for target region (${job.targetCitizenship || "SE"}) requires candidate verification.`,
        });
      }
    }
  }

  // 4. Security Clearance Gate
  if (job.securityClearanceRequired) {
    if (candidate.securityClearance === true) {
      evaluations.push({
        name: "Security Clearance",
        gateStatus: "SATISFIED",
        explanation: "Security clearance verified in candidate profile.",
      });
    } else if (candidate.securityClearance === false) {
      evaluations.push({
        name: "Security Clearance",
        gateStatus: "UNSATISFIED",
        explanation: "Candidate profile explicitly indicates lack of required security clearance.",
      });
      blockers.push("Security Clearance UNSATISFIED");
    } else {
      evaluations.push({
        name: "Security Clearance",
        gateStatus: "VERIFICATION_REQUIRED",
        explanation: "Security clearance eligibility unmentioned in candidate profile.",
      });
    }
  }

  // Determine overall aggregate gate status
  let overallStatus: AggregateGateStatus = "ELIGIBLE";

  const hasUnsatisfied = evaluations.some((e) => e.gateStatus === "UNSATISFIED");
  const hasVerificationRequired = evaluations.some((e) => e.gateStatus === "VERIFICATION_REQUIRED");

  if (hasUnsatisfied) {
    overallStatus = "INELIGIBLE";
  } else if (hasVerificationRequired) {
    overallStatus = "VERIFICATION_REQUIRED";
  }

  return {
    overallStatus,
    evaluations,
    blockers,
  };
}
