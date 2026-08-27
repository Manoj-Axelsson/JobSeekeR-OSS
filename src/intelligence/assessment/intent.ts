/**
 * Phase 6 — Intent Engine
 * JobSeekR Intelligence Framework v3.0
 *
 * Answers: "Is this where the candidate actually wants to go?"
 * Evaluates:
 * - Target role alignment
 * - Hierarchical location alignment & Working conditions
 * - Technology interest
 * - Career trajectory
 * - Strategic career value
 *
 * CRUCIAL RULE: A job can have high capability match and low intent,
 * and MUST NOT automatically become a Primary recommendation.
 */

import { IntentAssessment } from "./contract";
import { StructuredJobRequirementModel } from "./requirements";
import { CandidateEvidenceModel } from "./evidence";
import { resolveLocationAlignment } from "./locationResolver";

export function evaluateIntent(
  jobReqs: StructuredJobRequirementModel,
  candidate: CandidateEvidenceModel
): IntentAssessment {
  const intentHighlights: string[] = [];

  // 1. Target Role Alignment (35%)
  let roleAlignment = 30;
  const matchesTargetRole = candidate.targetRoles.some(
    r => jobReqs.title.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(jobReqs.title.toLowerCase())
  );
  if (matchesTargetRole) {
    roleAlignment = 95;
    intentHighlights.push(`Direct alignment with target role title preference (${jobReqs.title}).`);
  } else {
    intentHighlights.push(`Role title (${jobReqs.title}) differs from primary target role preferences.`);
  }

  // 2. Hierarchical Geographic Location & Working Conditions Alignment (30%)
  const geoResult = resolveLocationAlignment(
    jobReqs.location,
    candidate.preferredLocations,
    jobReqs.workingModel === "REMOTE"
  );

  let workingConditions = geoResult.alignmentScore;

  if (geoResult.isExactCityMatch) {
    intentHighlights.push(`Exact city location alignment for ${geoResult.matchedPreference || jobReqs.location}.`);
  } else if (geoResult.isRegionMatch) {
    intentHighlights.push(`Regional location alignment for ${jobReqs.location}.`);
  } else if (geoResult.isCountryMatchOnly) {
    intentHighlights.push(`Location ${jobReqs.location} matches country preference but not target city.`);
  } else {
    intentHighlights.push(`Location ${jobReqs.location} is outside candidate's target cities/regions.`);
  }

  // Working model bonus
  if (candidate.workingModelPreference && jobReqs.workingModel === candidate.workingModelPreference) {
    workingConditions = Math.min(100, workingConditions + 15);
    intentHighlights.push(`Matches preferred ${jobReqs.workingModel} working model.`);
  }

  // 3. Technology Interest (20%)
  let techInterest = 60;
  const preferredTechs = ["react", "typescript", "next.js", "node.js", "systems engineering", "quality"];
  let matchedTechInterests = 0;
  for (const tech of [...jobReqs.technologies.required, ...jobReqs.technologies.preferred]) {
    if (preferredTechs.includes(tech.toLowerCase())) {
      matchedTechInterests++;
    }
  }
  if (matchedTechInterests >= 2) {
    techInterest = 90;
    intentHighlights.push("Features candidate's high-interest core technology stack.");
  }

  // 4. Career Trajectory & Growth (15%)
  let careerTrajectory = 75;
  if (jobReqs.seniority === "Junior" || jobReqs.seniority === "Mid") {
    careerTrajectory = 85;
    intentHighlights.push("Strong trajectory for building verified production experience.");
  }

  // 5. Strategic Value
  const strategicValue = 75;

  // Compute Weighted Intent Score
  const rawScore =
    roleAlignment * 0.35 +
    workingConditions * 0.30 +
    techInterest * 0.20 +
    careerTrajectory * 0.15;

  const score = Math.min(100, Math.max(10, Math.round(rawScore)));

  return {
    score,
    roleAlignment,
    careerTrajectory,
    workingConditions,
    strategicValue,
    intentHighlights,
  };
}
