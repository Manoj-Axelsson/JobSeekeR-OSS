/**
 * JobSeekR Intelligence Framework v2.0
 * Phase 2: Opportunity Intelligence Types ("Should Anna pursue this?")
 */

export type MatchTier =
  | "EXCELLENT_MATCH"   // 🌟 Excellent Match (90-100%)
  | "STRONG_MATCH"      // 🟢 Strong Match (75-89%)
  | "POTENTIAL_MATCH"   // 🟡 Potential Match (60-74%)
  | "STRETCH_OPPORTUNITY" // 🚀 Stretch Opportunity (45-59%)
  | "LOW_PRIORITY";     // ⚪ Low Priority (<45%)

export interface EmployerEntity {
  name: string;
  industry: string;
  stabilityRating: "STABLE_ENTERPRISE" | "HIGH_GROWTH_SCALEUP" | "EARLY_STAGE" | "PUBLIC_SECTOR";
}

export interface OpportunityEntity {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  workingModel: "REMOTE" | "HYBRID" | "ON_SITE";
  salaryRange?: { min: number; max: number; currency: string };
  employer?: EmployerEntity;
}

export interface OpportunityEvaluationResult {
  opportunity: OpportunityEntity;
  tier: MatchTier;
  tierLabel: string;
  score: number;
  pursuitRecommendation: string; // Plain language response to "Should Anna pursue this?"
  keyAdvantages: string[];
  considerations: string[];
  rationale: string;
}
