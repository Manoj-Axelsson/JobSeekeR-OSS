/**
 * Phase 5 — Match Engine
 * JobSeekR Intelligence Framework v3.0
 *
 * Evaluates candidate capability fit across 5 weighted dimensions:
 * 1. Core Capability (30%)
 * 2. Requirement Coverage (25%)
 * 3. Transferability (20%)
 * 4. Seniority Alignment (15%)
 * 5. Domain / Context Alignment (10%)
 *
 * The output number is the summary; the evidence behind it is what matters.
 */

import { MatchAssessment, AssessmentGrade } from "./contract";
import { StructuredJobRequirementModel } from "./requirements";
import { CandidateEvidenceModel, findEvidence } from "./evidence";

export function evaluateMatch(
  jobReqs: StructuredJobRequirementModel,
  candidate: CandidateEvidenceModel
): MatchAssessment {
  const matchedRequirements: string[] = [];
  const missingRequirements: string[] = [];
  const evidenceRationale: string[] = [];

  // 1. Core Capability Score (30%)
  // Does candidate have evidence for core role functions & primary required technologies?
  let coreHits = 0;
  const coreTotal = Math.max(1, jobReqs.technologies.required.length + 1);

  // Core title/function match
  const titleMatch = candidate.targetRoles.some(
    r => jobReqs.title.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(jobReqs.title.toLowerCase())
  );
  if (titleMatch) {
    coreHits++;
    evidenceRationale.push(`Direct alignment between candidate target role and position title (${jobReqs.title}).`);
  }

  for (const tech of jobReqs.technologies.required) {
    const ev = findEvidence(candidate, tech);
    if (ev && !ev.isTransferable) {
      coreHits++;
      matchedRequirements.push(tech);
      evidenceRationale.push(`Verified direct capability evidence for required core technology ${tech} (${ev.source}).`);
    } else if (ev && ev.isTransferable) {
      evidenceRationale.push(`Transferable capability identified for ${tech} via ${ev.capability}.`);
    } else {
      missingRequirements.push(tech);
    }
  }

  const coreCapability = Math.min(100, Math.round((coreHits / coreTotal) * 100));

  // 2. Requirement Coverage Score (25%)
  // Evaluates coverage across PREFERRED & DESIRED requirements
  let coverageHits = 0;
  const secondaryReqs = [...jobReqs.technologies.preferred, ...jobReqs.technologies.desired];
  const coverageTotal = Math.max(1, secondaryReqs.length);

  for (const tech of secondaryReqs) {
    const ev = findEvidence(candidate, tech);
    if (ev) {
      coverageHits++;
      matchedRequirements.push(tech);
      evidenceRationale.push(`Matched secondary preference/desired tech ${tech}.`);
    } else {
      missingRequirements.push(tech);
    }
  }

  const requirementCoverage = secondaryReqs.length === 0
    ? 85
    : Math.min(100, Math.round((coverageHits / coverageTotal) * 100));

  // 3. Transferability Score (20%)
  // Evaluates how well adjacent experience fills any missing gaps
  let transferableCount = 0;
  for (const missing of missingRequirements) {
    const ev = findEvidence(candidate, missing);
    if (ev && ev.isTransferable) {
      transferableCount++;
    }
  }

  const transferabilityRatio = missingRequirements.length > 0
    ? transferableCount / missingRequirements.length
    : 0.8;
  const transferability = Math.min(100, Math.round((0.5 + transferabilityRatio * 0.5) * 100));

  // 4. Seniority Alignment Score (15%)
  let seniorityAlignment = 75; // Default solid fit
  if (jobReqs.seniority === "Junior") {
    seniorityAlignment = 95; // Excellent entry fit for candidate profile
    evidenceRationale.push("Junior/Mid level requirement matches candidate growth profile.");
  } else if (jobReqs.seniority === "Mid") {
    seniorityAlignment = 90;
  } else if (jobReqs.seniority === "Senior") {
    seniorityAlignment = 80;
  } else if (jobReqs.seniority === "Lead") {
    seniorityAlignment = 70;
  }

  // 5. Domain / Context Alignment (10%)
  // Software, Systems, Quality, Industrial domain fit
  let domainAlignment = 70;
  const textLower = `${jobReqs.title} ${jobReqs.coreWorkDescription}`.toLowerCase();
  const softwareFit = textLower.includes("software") || textLower.includes("fullstack") || textLower.includes("web") || textLower.includes("developer");
  const systemsFit = textLower.includes("system") || textLower.includes("requirement") || textLower.includes("architecture");
  const industrialFit = textLower.includes("manufacturing") || textLower.includes("production") || textLower.includes("quality") || textLower.includes("automation");

  if (softwareFit && systemsFit) {
    domainAlignment = 95;
    evidenceRationale.push("Dual Software + Systems domain alignment matches candidate background.");
  } else if (softwareFit || systemsFit || industrialFit) {
    domainAlignment = 85;
  }

  // 6. Compute Weighted Overall Match Score
  // Weights: Core Capability (30%) + Coverage (25%) + Transferability (20%) + Seniority (15%) + Domain (10%)
  const rawScore =
    coreCapability * 0.30 +
    requirementCoverage * 0.25 +
    transferability * 0.20 +
    seniorityAlignment * 0.15 +
    domainAlignment * 0.10;

  const score = Math.min(100, Math.max(10, Math.round(rawScore)));

  // 7. Assign Grade
  let grade: AssessmentGrade = "F";
  if (score >= 85) grade = "A";
  else if (score >= 70) grade = "B";
  else if (score >= 55) grade = "C";
  else if (score >= 40) grade = "D";

  return {
    score,
    grade,
    coreCapability,
    requirementCoverage,
    transferability,
    seniorityAlignment,
    domainAlignment,
    matchedRequirements: Array.from(new Set(matchedRequirements)),
    missingRequirements: Array.from(new Set(missingRequirements)),
    evidenceRationale,
  };
}
