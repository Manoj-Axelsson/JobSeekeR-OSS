/**
 * Phase 4 — Eligibility Engine
 * JobSeekR Intelligence Framework v3.0
 *
 * Evaluates Hard Requirements BEFORE calculating Match.
 * CRUCIAL RULE: Eligibility is a gate, NOT another component of the match score.
 *
 * Decoupled Architecture:
 * - Citizenship Requirement -> Citizenship Evidence (e.g. SE, US, DE)
 * - Security Clearance Requirement -> Active Clearance Evidence (e.g. Säkerhetsprövning)
 * - Swedish citizenship NEVER automatically infers passing security clearance.
 * - Unrecorded active clearance results in state: UNKNOWN (which does NOT declare INELIGIBLE,
 *   since security vetting is typically conducted by the employer post-offer).
 */

import { EligibilityAssessment, HardRequirementEvaluation } from "./contract";
import { StructuredJobRequirementModel } from "./requirements";
import { CandidateEvidenceModel, findEvidence } from "./evidence";
import { resolveLocationAlignment } from "./locationResolver";

function isCitizenshipSatisfied(candidateCitizenships: string[], reqCitizenship: string): boolean {
  const reqUpper = reqCitizenship.toUpperCase().trim();
  return candidateCitizenships.some(c => {
    const cUpper = c.toUpperCase().trim();
    if (cUpper === reqUpper) return true;
    if (reqUpper === "SE" && (cUpper === "SWEDISH" || cUpper === "SWEDEN" || cUpper === "SE")) return true;
    if (reqUpper === "US" && (cUpper === "AMERICAN" || cUpper === "USA" || cUpper === "US")) return true;
    if (reqUpper === "DE" && (cUpper === "GERMAN" || cUpper === "GERMANY" || cUpper === "DE")) return true;
    if (reqUpper === "EU" && (cUpper === "SE" || cUpper === "DE" || cUpper === "FR" || cUpper === "EU")) return true;
    return false;
  });
}

export function evaluateEligibility(
  jobReqs: StructuredJobRequirementModel,
  candidate: CandidateEvidenceModel
): EligibilityAssessment {
  const hardRequirements: HardRequirementEvaluation[] = [];
  const blockers: string[] = [];
  const reasons: string[] = [];

  // 1. Generic Citizenship Requirements Evaluation (Decoupled from Security Clearance)
  for (const reqCitizenship of jobReqs.citizenshipRequirements.required) {
    if (!candidate.citizenships || candidate.citizenships.length === 0) {
      hardRequirements.push({
        id: `eval-cit-${reqCitizenship}`,
        name: `${reqCitizenship} Citizenship Requirement`,
        category: "CITIZENSHIP_WORK_AUTH",
        priority: "REQUIRED",
        state: "UNKNOWN",
        reason: `Mandatory ${reqCitizenship} citizenship requirement requires verification (candidate citizenship unlisted).`,
      });
      reasons.push(`Unknown status for mandatory ${reqCitizenship} citizenship.`);
    } else if (isCitizenshipSatisfied(candidate.citizenships, reqCitizenship)) {
      hardRequirements.push({
        id: `eval-cit-${reqCitizenship}`,
        name: `${reqCitizenship} Citizenship Requirement`,
        category: "CITIZENSHIP_WORK_AUTH",
        priority: "REQUIRED",
        state: "SATISFIED",
        evidenceText: `Verified ${candidate.citizenships.join(", ")} citizenship`,
        reason: `Candidate holds ${candidate.citizenships.join(", ")} citizenship satisfying ${reqCitizenship} requirement.`,
      });
      reasons.push(`Satisfies mandatory ${reqCitizenship} citizenship requirement.`);
    } else {
      hardRequirements.push({
        id: `eval-cit-${reqCitizenship}`,
        name: `${reqCitizenship} Citizenship Requirement`,
        category: "CITIZENSHIP_WORK_AUTH",
        priority: "REQUIRED",
        state: "UNSATISFIED",
        evidenceText: `Candidate Citizenship: ${candidate.citizenships.join(", ")}`,
        reason: `Role mandates ${reqCitizenship} citizenship; candidate evidence establishes ${candidate.citizenships.join(", ")} citizenship.`,
      });
      blockers.push(`Missing mandatory ${reqCitizenship} citizenship requirement (candidate holds ${candidate.citizenships.join(", ")}).`);
    }
  }

  // 2. Decoupled Security Clearance Requirement Evaluation
  // Evaluated strictly against active clearance evidence (NOT inferred from citizenship)
  if (jobReqs.securityClearanceRequired) {
    const clearanceEvidence =
      findEvidence(candidate, "security clearance") ||
      findEvidence(candidate, "säkerhetsprövning") ||
      findEvidence(candidate, "registerkontroll");

    if (clearanceEvidence) {
      hardRequirements.push({
        id: "eval-sec-clearance",
        name: "Security Clearance / Registerkontroll",
        category: "SECURITY",
        priority: "REQUIRED",
        state: "SATISFIED",
        evidenceText: clearanceEvidence.demonstratedIn.join(", "),
        reason: "Active security clearance verified on candidate profile.",
      });
      reasons.push("Verified active security clearance.");
    } else {
      // Unrecorded active clearance is UNKNOWN, NOT INELIGIBLE
      hardRequirements.push({
        id: "eval-sec-clearance",
        name: "Security Clearance / Registerkontroll",
        category: "SECURITY",
        priority: "REQUIRED",
        state: "UNKNOWN",
        evidenceText: "No active security clearance recorded on profile",
        reason: "Employer conducts security vetting (Säkerhetsprövning) post-offer; active clearance unrecorded on profile.",
      });
      reasons.push("Security clearance vetting required post-offer.");
    }
  }

  // 3. Evaluate Mandatory Language Requirements
  for (const lang of jobReqs.languages.required) {
    const hasExplicitLang = candidate.languages.some(
      l => l.toLowerCase().includes(lang.toLowerCase()) || (lang.toLowerCase() === "swedish" && l.toLowerCase().includes("svenska"))
    );
    const hasCapabilityEvidence = findEvidence(candidate, lang) !== null;

    if (hasExplicitLang || hasCapabilityEvidence) {
      hardRequirements.push({
        id: `eval-lang-${lang}`,
        name: `Mandatory Language: ${lang}`,
        category: "LANGUAGE",
        priority: "REQUIRED",
        state: "SATISFIED",
        evidenceText: `Verified ${lang} language capability`,
      });
      reasons.push(`Satisfies mandatory ${lang} language requirement.`);
    } else {
      hardRequirements.push({
        id: `eval-lang-${lang}`,
        name: `Mandatory Language: ${lang}`,
        category: "LANGUAGE",
        priority: "REQUIRED",
        state: "UNKNOWN",
        evidenceText: "Language proficiency not explicitly declared on profile",
        reason: `Mandatory language ${lang} verification required before interview.`,
      });
      reasons.push(`Unknown status for mandatory language: ${lang} (requires confirmation).`);
    }
  }

  // 4. Evaluate Required Technologies (REQUIRED priority tech)
  for (const tech of jobReqs.technologies.required) {
    const evidence = findEvidence(candidate, tech);
    if (evidence) {
      hardRequirements.push({
        id: `eval-tech-${tech}`,
        name: `Required Tech: ${tech}`,
        category: "TECHNOLOGY",
        priority: "REQUIRED",
        state: evidence.isTransferable ? "TRANSFERABLE" : "SATISFIED",
        evidenceText: evidence.demonstratedIn.join(", "),
        reason: evidence.isTransferable ? `Satisfied via transferable competency: ${evidence.capability}` : `Direct evidence of ${tech}`,
      });
    } else {
      hardRequirements.push({
        id: `eval-tech-${tech}`,
        name: `Required Tech: ${tech}`,
        category: "TECHNOLOGY",
        priority: "REQUIRED",
        state: "UNSATISFIED",
        reason: `No evidence found for required technology: ${tech}`,
      });
      blockers.push(`Missing mandatory technical requirement: ${tech}`);
    }
  }

  // 5. Hierarchical Location & Territory Constraints Evaluation
  const geoResult = resolveLocationAlignment(
    jobReqs.location,
    candidate.preferredLocations,
    jobReqs.workingModel === "REMOTE"
  );

  if (geoResult.level !== "NONE" || jobReqs.workingModel === "REMOTE") {
    hardRequirements.push({
      id: "eval-location",
      name: `Location Alignment (${jobReqs.location})`,
      category: "LOCATION",
      priority: "REQUIRED",
      state: "SATISFIED",
      evidenceText: `In-territory location match (${geoResult.matchedPreference || jobReqs.location}, level: ${geoResult.level})`,
    });
  } else if (jobReqs.workingModel === "ON_SITE" && geoResult.level === "NONE") {
    hardRequirements.push({
      id: "eval-location",
      name: `Location Alignment (${jobReqs.location})`,
      category: "LOCATION",
      priority: "REQUIRED",
      state: "UNSATISFIED",
      reason: `Mandatory 100% on-site role in ${jobReqs.location} is outside candidate's target territory.`,
    });
    blockers.push(`Out-of-territory 100% on-site location constraint (${jobReqs.location}).`);
  } else {
    hardRequirements.push({
      id: "eval-location",
      name: `Location Alignment (${jobReqs.location})`,
      category: "LOCATION",
      priority: "REQUIRED",
      state: "TRANSFERABLE",
      reason: `Location ${jobReqs.location} outside primary city, but hybrid working model may support travel.`,
    });
  }

  // 6. Final Status Determination
  let status: EligibilityAssessment["status"] = "ELIGIBLE";
  if (blockers.length > 0) {
    status = "INELIGIBLE";
  }

  return {
    status,
    hardRequirements,
    blockers,
    reasons,
  };
}
