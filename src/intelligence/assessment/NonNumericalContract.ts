/**
 * Behavioral Contract Domain Types & Interfaces (v3.1.1)
 *
 * Implements the domain contract for the JobSeekeR Non-Numerical Evidence-Based Opportunity Assessment Engine.
 * Purges all numerical percentage weights, score calculations, letter grades, and ratio thresholds.
 */

/** Tri-state requirement status semantics */
export type RequirementState =
  | "DEMONSTRATED_PRESENCE"
  | "DEMONSTRATED_ABSENCE"
  | "UNKNOWN_INSUFFICIENT_EVIDENCE";

/** Structural verifiability / provenance classification for candidate evidence */
export type VerifiabilityClass =
  | "ANCHORED_EVIDENCE"
  | "BARE_KEYWORD_ASSERTION"
  | "NO_MATCH";

/** Aggregate structural evidence condition for essential competencies */
export type StructuralEvidenceCondition =
  | "ALL_ESSENTIAL_ANCHORED"
  | "UNVERIFIED_ESSENTIALS_PRESENT"
  | "EVIDENCE_PROVENANCE_INSUFFICIENT";

/** Individual mandatory statutory gate evaluation status */
export type GateStatus =
  | "SATISFIED"
  | "UNSATISFIED"
  | "VERIFICATION_REQUIRED";

/** Aggregate status across all mandatory statutory gates */
export type AggregateGateStatus =
  | "ELIGIBLE"
  | "INELIGIBLE"
  | "VERIFICATION_REQUIRED";

/** Qualitative opportunity assessment verdicts */
export type OpportunityVerdict =
  | "STRONG_OPPORTUNITY_VERIFIED"
  | "OPPORTUNITY_VERIFY_BEFORE_APPLYING"
  | "STRETCH_OPPORTUNITY_GROWTH"
  | "INELIGIBLE_REQUIREMENT_UNSATISFIED";

/** Candidate decision ownership action contexts (AI assists, Candidate decides) */
export type CandidateActionContext =
  | "CONSIDER_APPLICATION"
  | "VERIFY_REQUIREMENTS_BEFORE_DECIDING"
  | "EVALUATE_GROWTH_STRETCH"
  | "NO_ACTION_INELIGIBLE";

/** Individual mandatory statutory gate evaluation result */
export interface MandatoryGateEvaluation {
  name: string;
  gateStatus: GateStatus;
  explanation: string;
}

/** Essential core competency fit diagnostic */
export interface EssentialCompetencyFit {
  competency: string;
  status: RequirementState;
  depthRating: "ANCHORED_EVIDENCE" | "BARE_KEYWORD_ASSERTION" | "UNVERIFIED";
  provenance: VerifiabilityClass;
  demonstratedIn?: string[];
  escoUri?: string;
}

/** Optional / preferred competency fit diagnostic */
export interface OptionalCompetencyFit {
  competency: string;
  priority: "PREFERRED" | "NICE_TO_HAVE";
  isMatched: boolean;
  demonstratedIn?: string[];
}

/** Transferable capability narrative diagnostic (cannot satisfy unmet core requirements) */
export interface TransferableCapabilityFit {
  targetRequirement: string;
  sourceCapability: string;
  transferRationale: string;
  escoRelationship: "DIRECT_ESCO_TRANSITION" | "CROSS_DOMAIN_TRANSFER";
}

/** EQF Autonomy & Responsibility alignment context */
export interface EQFAutonomyAlignment {
  requiredLevel: string;
  candidateLevel: string;
  alignmentStatus: "MATCHED" | "AUTONOMY_STEP_UP" | "EXCEEDS_REQUIREMENT" | "UNSPECIFIED";
  autonomyDescriptor: string;
}

/** Explicit candidate action notice for unverified or unanchored requirements */
export interface UnverifiedRequirementNotice {
  requirementName: string;
  category: "TECHNICAL_SPECIALTY" | "LANGUAGE" | "CERTIFICATION" | "LEGAL_AUTHORIZATION" | "EXPERIENCE_SCOPE";
  userActionPrompt: string;
}

/** Diagnostic recommendation output */
export interface QualitativeRecommendation {
  verdict: OpportunityVerdict;
  headline: string;
  candidateActionContext: CandidateActionContext;
  summaryRationale: string[];
}

/** Root non-numerical opportunity assessment diagnostic payload */
export interface NonNumericalOpportunityAssessment {
  assessmentVersion: "3.1.1-non-numerical";
  jobTitle: string;
  company: string;
  canonicalLocation?: string;
  mandatoryGates: {
    overallStatus: AggregateGateStatus;
    evaluations: MandatoryGateEvaluation[];
    blockers: string[];
  };
  competencyFit: {
    essentialCompetencies: EssentialCompetencyFit[];
    optionalCompetencies: OptionalCompetencyFit[];
    transferableCapabilities: TransferableCapabilityFit[];
  };
  autonomyAlignment: EQFAutonomyAlignment;
  unverifiedNotices: UnverifiedRequirementNotice[];
  decisionSupport: {
    recommendation: QualitativeRecommendation;
    coverLetterHookTheme: string;
    interviewTalkingPoints: string[];
  };
}
