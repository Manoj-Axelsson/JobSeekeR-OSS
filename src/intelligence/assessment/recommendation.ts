/**
 * Phase 7 — Recommendation Engine
 * JobSeekR Intelligence Framework v3.0
 *
 * Enforces Constitutional Rules:
 * Primary:
 * - Must be ELIGIBLE
 * - All mandatory requirements must be SATISFIED (No UNKNOWN mandatory requirements in Primary)
 * - Strong capability match (Match >= 60)
 * - Meaningful intent alignment (Intent >= 50)
 * - Sufficient confidence (Confidence != LOW)
 * - Max 15 items (If only 11 defensible, show 11 — NEVER fill with rubbish)
 *
 * Discovery:
 * - Includes positions with UNKNOWN mandatory requirements (flagged for candidate review)
 * - Transferable roles, stretch opportunities, startups, lower confidence
 * - Max 5 items
 *
 * Suppress:
 * - Everything else (Ineligible, low match/intent, application history conflicts)
 */

import {
  RecommendationAssessment,
  EligibilityAssessment,
  MatchAssessment,
  IntentAssessment,
  ConfidenceAssessment,
} from "./contract";

export function evaluateRecommendation(
  eligibility: EligibilityAssessment,
  match: MatchAssessment,
  intent: IntentAssessment,
  confidence: ConfidenceAssessment
): RecommendationAssessment {
  const reasons: string[] = [];

  // 1. Eligibility Check Gate
  if (eligibility.status !== "ELIGIBLE") {
    return {
      type: "SUPPRESS",
      primaryFit: false,
      discoveryFit: false,
      suppressReason: `Ineligible: ${eligibility.blockers.join("; ") || "Failed hard requirement gate."}`,
      reasons: eligibility.reasons,
    };
  }

  // 2. Check for UNKNOWN Mandatory Requirements
  // Product Rule: UNKNOWN mandatory requirements do NOT declare INELIGIBLE,
  // but cannot enter PRIMARY without verification (routed to DISCOVERY for review).
  const unverifiedMandatoryReqs = eligibility.hardRequirements.filter(
    req => req.priority === "REQUIRED" && req.state === "UNKNOWN"
  );

  if (unverifiedMandatoryReqs.length > 0) {
    const unverifiedNames = unverifiedMandatoryReqs.map(r => r.name).join(", ");
    reasons.push(`Routed to Discovery Feed for review: Unverified mandatory requirement (${unverifiedNames}).`);
    return {
      type: "DISCOVERY",
      primaryFit: false,
      discoveryFit: true,
      suppressReason: `Unresolved mandatory requirement (${unverifiedNames}) requires verification before Primary placement.`,
      reasons,
    };
  }

  // 3. Primary Recommendation Criteria
  // Must satisfy: eligible, no unverified mandatory reqs, match >= 60, intent >= 50, confidence != LOW
  const isStrongMatch = match.score >= 60;
  const isMeaningfulIntent = intent.score >= 50;
  const hasSufficientConfidence = confidence.assessmentConfidence !== "LOW" || match.score >= 75;

  if (isStrongMatch && isMeaningfulIntent && hasSufficientConfidence) {
    reasons.push(`Primary recommendation: Strong match (${match.score}%), solid intent (${intent.score}%), grade ${match.grade}.`);
    return {
      type: "PRIMARY",
      primaryFit: true,
      discoveryFit: false,
      reasons,
    };
  }

  // 4. Discovery Recommendation Criteria
  // Start-ups, stretch opportunities, lower confidence, or high match with lower intent
  const isStretchOpportunity = match.score >= 45 || match.transferability >= 75;
  const isDiscoveryEligible = isStretchOpportunity && match.score >= 40;

  if (isDiscoveryEligible) {
    if (intent.score < 50 && match.score >= 70) {
      reasons.push(`Discovery recommendation: High technical match (${match.score}%) but lower intent alignment (${intent.score}%).`);
    } else {
      reasons.push(`Discovery recommendation: Stretch opportunity with high transferable capability (${match.transferability}%).`);
    }
    return {
      type: "DISCOVERY",
      primaryFit: false,
      discoveryFit: true,
      reasons,
    };
  }

  // 5. Suppress Everything Else
  return {
    type: "SUPPRESS",
    primaryFit: false,
    discoveryFit: false,
    suppressReason: `Low overall match (${match.score}%) and intent (${intent.score}%) fit below delivery thresholds.`,
    reasons: [`Match score ${match.score}% below minimum threshold.`],
  };
}
