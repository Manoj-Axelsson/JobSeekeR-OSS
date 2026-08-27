/**
 * Phase 11 — Controlled Side-by-Side Parallel Integration Engine
 * JobSeekR Intelligence Framework v3.0
 *
 * NON-DESTRUCTIVE: Keeps legacy matcher.ts and feed 100% unchanged in production.
 * Evaluates raw job ads simultaneously using both legacy and new assessment engines
 * to allow A/B performance auditing, precision/recall measurement, and comparison.
 */

import { evaluateJobMatch as evaluateLegacyMatch, MatchResult as LegacyMatchResult } from "../../../lib/services/matcher";
import { assessOpportunity } from "../evaluator";
import { enrichOpportunity, JobEnrichment } from "../enrichmentEngine";
import { generateCandidatePositioning, CandidatePositioning } from "../candidatePositioning";
import { evaluateHistoryIntelligence, ApplicationRecord } from "../historyIntelligence";
import { extractJobRequirements } from "../requirements";
import { OpportunityAssessment } from "../contract";
import { CandidateEvidenceModel, createCandidateEvidenceModel } from "../evidence";

export interface SideBySideEvaluation {
  jobId: string;
  jobTitle: string;
  companyName: string;
  location: string;

  // Legacy Production Engine Output
  legacy: {
    matchScore: number;
    feedType: "PRIMARY" | "DISCOVERY";
    eligibilityStatus: "ELIGIBLE" | "INELIGIBLE" | "DISCARDED";
    whyMatched: string[];
  };

  // New Opportunity Assessment Engine Output
  newEngine: {
    assessment: OpportunityAssessment;
    enrichment: JobEnrichment | null;
    positioning: CandidatePositioning | null;
    effectiveRecommendation: "PRIMARY" | "DISCOVERY" | "SUPPRESS";
    historyConflict?: string;
  };

  // Material Difference Audit
  comparison: {
    isMaterialDifference: boolean;
    legacyWouldPutInPrimary: boolean;
    newWouldPutInPrimary: boolean;
    materialDifferenceReason?: string;
  };
}

export function evaluateOpportunitySideBySide(
  jobAd: {
    id: string;
    externalId?: string;
    title: string;
    company: string;
    location: string;
    description: string;
  },
  candidateProfile?: {
    name?: string;
    headline?: string;
    citizenship?: string;
    citizenships?: string[];
    languages?: string[];
    skills?: string[];
    targetRoles?: string[];
    preferredLocations?: string[];
    workingModelPreference?: "REMOTE" | "HYBRID" | "ON_SITE";
  },
  history: ApplicationRecord[] = []
): SideBySideEvaluation {
  const profileInput = candidateProfile || {};

  // 1. Run Legacy Production Matcher (Non-destructive)
  const legacy = evaluateLegacyMatch(
    jobAd.title,
    jobAd.description,
    profileInput.skills || [],
    profileInput.name || "JobseekeR Candidate",
    profileInput.headline || "Software & Systems Engineer",
    jobAd.company,
    jobAd.location
  );

  // 2. Run New Opportunity Assessment Engine (Isolated)
  const candidateModel = createCandidateEvidenceModel(profileInput);
  const newAssessment = assessOpportunity(jobAd, profileInput);

  // Evaluate Application History Intelligence
  const historyResult = evaluateHistoryIntelligence(jobAd, history);

  let effectiveRecommendation = newAssessment.recommendation.type;
  let historyConflictDetail: string | undefined = undefined;

  if (historyResult.hasHistoryConflict) {
    effectiveRecommendation = "SUPPRESS";
    historyConflictDetail = `${historyResult.conflictType}: ${historyResult.suppressReason}`;
  }

  // Run Post-Qualification Enrichment & Positioning (Only if not suppressed)
  const reqs = extractJobRequirements(jobAd.title, jobAd.description, jobAd.location);
  const enrichment = enrichOpportunity(
    jobAd,
    reqs,
    { ...newAssessment, recommendation: { ...newAssessment.recommendation, type: effectiveRecommendation } }
  );

  const positioning = effectiveRecommendation === "PRIMARY"
    ? generateCandidatePositioning(jobAd, candidateModel, newAssessment, enrichment)
    : null;

  // 3. Compare Legacy vs New Outcomes
  const legacyWouldPutInPrimary = legacy.feedType === "PRIMARY" && legacy.eligibilityStatus === "ELIGIBLE";
  const newWouldPutInPrimary = effectiveRecommendation === "PRIMARY" && newAssessment.eligibility.status === "ELIGIBLE";
  const isMaterialDifference = legacyWouldPutInPrimary !== newWouldPutInPrimary;

  let materialDifferenceReason: string | undefined = undefined;
  if (isMaterialDifference) {
    if (legacyWouldPutInPrimary && !newWouldPutInPrimary) {
      materialDifferenceReason = `Legacy placed in Primary (Score: ${legacy.matchScore}%), but New Engine suppressed/routed away (${effectiveRecommendation}, Reason: ${historyConflictDetail || newAssessment.eligibility.blockers.join("; ") || newAssessment.recommendation.suppressReason}).`;
    } else {
      materialDifferenceReason = `New Engine promoted position to Primary (Match: ${newAssessment.match.score}%, Grade: ${newAssessment.match.grade}) via Candidate Evidence Model, while Legacy scored it in Discovery (${legacy.matchScore}%).`;
    }
  }

  return {
    jobId: jobAd.id,
    jobTitle: jobAd.title,
    companyName: jobAd.company,
    location: jobAd.location,
    legacy: {
      matchScore: legacy.matchScore,
      feedType: legacy.feedType,
      eligibilityStatus: legacy.eligibilityStatus,
      whyMatched: legacy.analysis.whyMatched,
    },
    newEngine: {
      assessment: newAssessment,
      enrichment,
      positioning,
      effectiveRecommendation,
      historyConflict: historyConflictDetail,
    },
    comparison: {
      isMaterialDifference,
      legacyWouldPutInPrimary,
      newWouldPutInPrimary,
      materialDifferenceReason,
    },
  };
}
