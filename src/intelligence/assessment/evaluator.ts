/**
 * Unified Independent Opportunity Assessment Engine
 * JobSeekR Intelligence Framework v3.0
 *
 * Evaluates raw job ads independently using the new assessment architecture:
 * Eligibility Gate -> Match Engine -> Intent Engine -> Confidence Evaluator -> Recommendation Engine.
 */

import { OpportunityAssessment } from "./contract";
import { extractJobRequirements, StructuredJobRequirementModel } from "./requirements";
import { createCandidateEvidenceModel, CandidateEvidenceModel } from "./evidence";
import { evaluateEligibility } from "./eligibility";
import { evaluateMatch } from "./match";
import { evaluateIntent } from "./intent";
import { evaluateConfidence } from "./confidence";
import { evaluateRecommendation } from "./recommendation";

export function assessOpportunity(
  jobAd: {
    title: string;
    description: string;
    location?: string;
    company?: string;
  },
  candidateProfile?: {
    name?: string;
    headline?: string;
    citizenship?: string;
    skills?: string[];
    targetRoles?: string[];
    preferredLocations?: string[];
    workingModelPreference?: "REMOTE" | "HYBRID" | "ON_SITE";
  }
): OpportunityAssessment {
  // 1. Extract Structured Job Requirement Model
  const jobReqs = extractJobRequirements(
    jobAd.title,
    jobAd.description,
    jobAd.location || "Sweden",
    jobAd.company || "Employer"
  );

  // 2. Build Candidate Evidence Model
  const candidate = createCandidateEvidenceModel(candidateProfile || {});

  // 3. Evaluate Eligibility Gate (Hard requirements)
  const eligibility = evaluateEligibility(jobReqs, candidate);

  // 4. Evaluate Match Engine (5 weighted capability dimensions)
  const match = evaluateMatch(jobReqs, candidate);

  // 5. Evaluate Intent Engine (Separately calculated)
  const intent = evaluateIntent(jobReqs, candidate);

  // 6. Evaluate Confidence Assessment
  const confidence = evaluateConfidence(jobReqs, candidate, match);

  // 7. Evaluate Recommendation Engine (Primary vs Discovery vs Suppress)
  const recommendation = evaluateRecommendation(eligibility, match, intent, confidence);

  return {
    eligibility,
    match,
    intent,
    confidence,
    recommendation,
  };
}
