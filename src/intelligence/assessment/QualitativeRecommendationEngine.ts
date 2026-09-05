/**
 * Single Authoritative Qualitative Recommendation Router (v3.1.1)
 *
 * Implements the single authoritative policy boundary for qualitative opportunity assessment routing.
 * Evaluates the deterministic 4-tier routing precedence:
 * P1: INELIGIBLE -> INELIGIBLE_REQUIREMENT_UNSATISFIED (NO_ACTION_INELIGIBLE)
 * P2: VERIFICATION_REQUIRED / Unverified Essentials -> OPPORTUNITY_VERIFY_BEFORE_APPLYING (VERIFY_REQUIREMENTS_BEFORE_DECIDING)
 * P3: Autonomy Step-Up + Anchored -> STRETCH_OPPORTUNITY_GROWTH (EVALUATE_GROWTH_STRETCH)
 * P4: All Essential Anchored -> STRONG_OPPORTUNITY_VERIFIED (CONSIDER_APPLICATION)
 */

import {
  OpportunityVerdict,
  CandidateActionContext,
  QualitativeRecommendation,
  NonNumericalOpportunityAssessment,
} from "./NonNumericalContract";
import { MandatoryGateEvaluationResult } from "./MandatoryGateEvaluator";
import { MatchDiagnosticResult } from "./NonNumericalMatchEngine";

export interface RecommendationEngineInput {
  jobTitle: string;
  company: string;
  canonicalLocation?: string;
  mandatoryGates: MandatoryGateEvaluationResult;
  matchDiagnostics: MatchDiagnosticResult;
}

/**
 * Single Authoritative Policy Boundary: Route assessment diagnostics to qualitative verdict and action context.
 */
export function routeQualitativeRecommendation(
  input: RecommendationEngineInput
): QualitativeRecommendation {
  const { mandatoryGates, matchDiagnostics } = input;
  const { essentialCompetencies, aggregateEvidenceCondition, autonomyAlignment } = matchDiagnostics;

  // 1. Priority 1 (Ineligibility & Direct Statutory / Core Conflict)
  const isGateIneligible = mandatoryGates.overallStatus === "INELIGIBLE";
  const hasDemonstratedAbsence = essentialCompetencies.some((c) => c.status === "DEMONSTRATED_ABSENCE");

  if (isGateIneligible || hasDemonstratedAbsence) {
    const rationale: string[] = [];
    if (mandatoryGates.blockers.length > 0) {
      rationale.push(...mandatoryGates.blockers);
    }
    const absentSkills = essentialCompetencies.filter((c) => c.status === "DEMONSTRATED_ABSENCE");
    for (const absent of absentSkills) {
      rationale.push(`Mandatory core requirement "${absent.competency}" is unsatisfied (DEMONSTRATED_ABSENCE).`);
    }

    return {
      verdict: "INELIGIBLE_REQUIREMENT_UNSATISFIED",
      headline: "INELIGIBLE — REQUIREMENT UNSATISFIED: A mandatory statutory requirement or essential core capability is unsatisfied.",
      candidateActionContext: "NO_ACTION_INELIGIBLE",
      summaryRationale: rationale.length > 0 ? rationale : ["Statutory gate or core requirement unsatisfied."],
    };
  }

  // 2. Priority 2 (Unresolved Eligibility or Unverified Core Essentials)
  const isGateVerificationRequired = mandatoryGates.overallStatus === "VERIFICATION_REQUIRED";
  const hasUnverifiedEssentials = essentialCompetencies.some(
    (c) => c.status === "UNKNOWN_INSUFFICIENT_EVIDENCE" || c.provenance === "BARE_KEYWORD_ASSERTION"
  );
  const isEvidenceConditionUnverified =
    aggregateEvidenceCondition === "UNVERIFIED_ESSENTIALS_PRESENT" ||
    aggregateEvidenceCondition === "EVIDENCE_PROVENANCE_INSUFFICIENT";

  if (isGateVerificationRequired || hasUnverifiedEssentials || isEvidenceConditionUnverified) {
    const rationale: string[] = [];
    const verifiedSkills = essentialCompetencies.filter((c) => c.status === "DEMONSTRATED_PRESENCE");
    const unverifiedSkills = essentialCompetencies.filter((c) => c.status === "UNKNOWN_INSUFFICIENT_EVIDENCE");

    if (verifiedSkills.length > 0) {
      rationale.push(`${verifiedSkills.map((c) => c.competency).join(", ")} demonstrated in profile experience.`);
    }
    if (unverifiedSkills.length > 0) {
      rationale.push(`${unverifiedSkills.map((c) => c.competency).join(", ")} requirement unrecorded in profile (UNKNOWN_INSUFFICIENT_EVIDENCE).`);
    }
    if (isGateVerificationRequired) {
      rationale.push("One or more statutory eligibility gates require candidate verification.");
    }

    return {
      verdict: "OPPORTUNITY_VERIFY_BEFORE_APPLYING",
      headline: "OPPORTUNITY — VERIFY BEFORE APPLYING: One or more relevant requirements cannot currently be verified from your profile. Check these items before deciding whether to apply.",
      candidateActionContext: "VERIFY_REQUIREMENTS_BEFORE_DECIDING",
      summaryRationale: rationale.length > 0 ? rationale : ["One or more requirements require candidate verification."],
    };
  }

  // 3. Priority 3 (Autonomy Growth Stretch)
  if (autonomyAlignment.alignmentStatus === "AUTONOMY_STEP_UP") {
    const rationale = [
      `${essentialCompetencies.map((c) => c.competency).join(", ")} verified in profile history.`,
      autonomyDescriptorText(autonomyAlignment),
    ];

    return {
      verdict: "STRETCH_OPPORTUNITY_GROWTH",
      headline: "STRETCH OPPORTUNITY — AUTONOMY / SCOPE STEP-UP: This role represents an increase in autonomy or strategic scope compared to your recorded experience history.",
      candidateActionContext: "EVALUATE_GROWTH_STRETCH",
      summaryRationale: rationale,
    };
  }

  // 4. Priority 4 (Verified Strong Opportunity)
  const rationale = [
    `${essentialCompetencies.map((c) => c.competency).join(", ")} verified in profile work history.`,
    "Location and working model preferences satisfied.",
  ];

  return {
    verdict: "STRONG_OPPORTUNITY_VERIFIED",
    headline: "STRONG OPPORTUNITY — VERIFIED EVIDENCE: Your profile provides strong, attributable evidence for this position's core requirements. This opportunity appears worthy of your consideration.",
    candidateActionContext: "CONSIDER_APPLICATION",
    summaryRationale: rationale,
  };
}

function autonomyDescriptorText(autonomy: RecommendationEngineInput["matchDiagnostics"]["autonomyAlignment"]): string {
  return autonomy.autonomyDescriptor || `Requires ${autonomy.requiredLevel} autonomy scope.`;
}

/**
 * Root assembly function constructing the complete NonNumericalOpportunityAssessment payload.
 */
export function evaluateNonNumericalAssessmentPayload(
  input: RecommendationEngineInput
): NonNumericalOpportunityAssessment {
  const recommendation = routeQualitativeRecommendation(input);

  const coverLetterHookTheme = deriveCoverLetterHookTheme(input.matchDiagnostics.essentialCompetencies);
  const interviewTalkingPoints = deriveInterviewTalkingPoints(input.matchDiagnostics.essentialCompetencies);

  return {
    assessmentVersion: "3.1.1-non-numerical",
    jobTitle: input.jobTitle,
    company: input.company,
    canonicalLocation: input.canonicalLocation,
    mandatoryGates: input.mandatoryGates,
    competencyFit: {
      essentialCompetencies: input.matchDiagnostics.essentialCompetencies,
      optionalCompetencies: input.matchDiagnostics.optionalCompetencies,
      transferableCapabilities: input.matchDiagnostics.transferableCapabilities,
    },
    autonomyAlignment: input.matchDiagnostics.autonomyAlignment,
    unverifiedNotices: input.matchDiagnostics.unverifiedNotices,
    decisionSupport: {
      recommendation,
      coverLetterHookTheme,
      interviewTalkingPoints,
    },
  };
}

function deriveCoverLetterHookTheme(competencies: RecommendationEngineInput["matchDiagnostics"]["essentialCompetencies"]): string {
  const verifiedNames = competencies.filter((c) => c.status === "DEMONSTRATED_PRESENCE").map((c) => c.competency);
  if (verifiedNames.length > 0) {
    return `${verifiedNames.slice(0, 2).join(" & ")} Engineering Excellence`;
  }
  return "Software Architecture & Systems Engineering Excellence";
}

function deriveInterviewTalkingPoints(competencies: RecommendationEngineInput["matchDiagnostics"]["essentialCompetencies"]): string[] {
  const points: string[] = [];
  const verified = competencies.filter((c) => c.status === "DEMONSTRATED_PRESENCE");
  if (verified.length > 0) {
    points.push(`Lead with your verified ${verified.map((c) => c.competency).join(", ")} experience.`);
  }
  points.push("Discuss your systems engineering background for technical context.");
  return points;
}
