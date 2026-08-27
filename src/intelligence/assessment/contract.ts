/**
 * Opportunity Assessment Domain Contract
 * JobSeekR Intelligence Framework v3.0
 */

export type RequirementStatus = "SATISFIED" | "UNSATISFIED" | "UNKNOWN" | "TRANSFERABLE" | "NOT_APPLICABLE";
export type RequirementPriority = "REQUIRED" | "PREFERRED" | "DESIRED" | "ACCEPTED";
export type EvidenceStrength = "HIGH" | "MEDIUM" | "LOW";
export type AssessmentConfidence = "HIGH" | "MEDIUM" | "LOW";
export type AssessmentGrade = "A" | "B" | "C" | "D" | "F";
export type RecommendationType = "PRIMARY" | "DISCOVERY" | "SUPPRESS";

export interface HardRequirementEvaluation {
  id: string;
  name: string;
  category:
    | "CITIZENSHIP_WORK_AUTH"
    | "EDUCATION"
    | "CERTIFICATION"
    | "LANGUAGE"
    | "LOCATION"
    | "EXPERIENCE"
    | "SECURITY"
    | "TECHNOLOGY"
    | "SENIORITY"
    | "ROLE"
    | "OTHER";
  priority: RequirementPriority;
  state: RequirementStatus;
  evidenceText?: string;
  reason?: string;
}

export interface EligibilityAssessment {
  status: "ELIGIBLE" | "INELIGIBLE" | "DISCARDED";
  hardRequirements: HardRequirementEvaluation[];
  blockers: string[];
  reasons: string[];
}

export interface MatchAssessment {
  score: number; // 0 to 100
  grade: AssessmentGrade;
  coreCapability: number; // 0 to 100
  requirementCoverage: number; // 0 to 100
  transferability: number; // 0 to 100
  seniorityAlignment: number; // 0 to 100
  domainAlignment: number; // 0 to 100
  matchedRequirements: string[];
  missingRequirements: string[];
  evidenceRationale: string[];
}

export interface IntentAssessment {
  score: number; // 0 to 100
  roleAlignment: number; // 0 to 100
  careerTrajectory: number; // 0 to 100
  workingConditions: number; // 0 to 100
  strategicValue: number; // 0 to 100
  intentHighlights: string[];
}

export interface ConfidenceAssessment {
  evidenceQuality: EvidenceStrength;
  assessmentConfidence: AssessmentConfidence;
  confidenceScore: number; // 0 to 100
  factors: string[];
}

export interface RecommendationAssessment {
  type: RecommendationType;
  primaryFit: boolean;
  discoveryFit: boolean;
  suppressReason?: string;
  reasons: string[];
}

export interface OpportunityAssessment {
  eligibility: EligibilityAssessment;
  match: MatchAssessment;
  intent: IntentAssessment;
  confidence: ConfidenceAssessment;
  recommendation: RecommendationAssessment;
}
