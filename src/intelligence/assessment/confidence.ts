/**
 * Phase 1 — Confidence Engine Component
 * JobSeekR Intelligence Framework v3.0
 *
 * Evaluates evidence quality and assessment confidence based on quantity and clarity
 * of extracted evidence and requirement match completeness.
 */

import { ConfidenceAssessment, EvidenceStrength, AssessmentConfidence } from "./contract";
import { MatchAssessment } from "./contract";
import { StructuredJobRequirementModel } from "./requirements";
import { CandidateEvidenceModel } from "./evidence";

export function evaluateConfidence(
  jobReqs: StructuredJobRequirementModel,
  candidate: CandidateEvidenceModel,
  match: MatchAssessment
): ConfidenceAssessment {
  const factors: string[] = [];

  // 1. Evidence Quality
  let highStrengthCount = 0;
  for (const matchedReq of match.matchedRequirements) {
    const ev = candidate.capabilities.get(matchedReq.toLowerCase());
    if (ev && ev.strength === "HIGH") {
      highStrengthCount++;
    }
  }

  let evidenceQuality: EvidenceStrength = "MEDIUM";
  if (highStrengthCount >= 3 || match.matchedRequirements.length >= 4) {
    evidenceQuality = "HIGH";
    factors.push("High quality direct evidence available across key competencies.");
  } else if (match.matchedRequirements.length === 0) {
    evidenceQuality = "LOW";
    factors.push("Limited direct evidence recorded for specified job requirements.");
  }

  // 2. Assessment Confidence
  let confidenceScore = 80;
  if (jobReqs.technologies.required.length > 0) {
    confidenceScore += 10;
    factors.push("Explicit required technologies specified in job ad.");
  }

  if (candidate.capabilities.size >= 10) {
    confidenceScore += 10;
    factors.push("Rich candidate evidence profile.");
  }

  confidenceScore = Math.min(100, Math.max(30, confidenceScore));

  let assessmentConfidence: AssessmentConfidence = "MEDIUM";
  if (confidenceScore >= 85) assessmentConfidence = "HIGH";
  else if (confidenceScore < 60) assessmentConfidence = "LOW";

  return {
    evidenceQuality,
    assessmentConfidence,
    confidenceScore,
    factors,
  };
}
