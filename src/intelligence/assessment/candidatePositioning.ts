/**
 * Phase 10 — Candidate Positioning Engine
 * JobSeekR Intelligence Framework v3.0
 *
 * Decision-Support Layer generated for Primary opportunities.
 * Key Guardrail: EVIDENCE-DRIVEN, facts & reasoning in Intelligence Layer, prose in Presentation Layer.
 */

import { OpportunityAssessment } from "./contract";
import { CandidateEvidenceModel } from "./evidence";
import { JobEnrichment } from "./enrichmentEngine";

export interface EvidenceDrivenCoverLetterHook {
  theme: string;
  supportingEvidence: string[];
}

export interface PositioningConcern {
  gapDescription: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
}

export interface CandidatePositioning {
  opportunityId: string;
  jobTitle: string;
  companyName: string;
  whyYouFit: string[];
  strongestEvidence: Array<{
    competency: string;
    evidenceText: string;
    strength: "HIGH" | "MEDIUM";
  }>;
  potentialConcern: PositioningConcern | null;
  howToAddressConcern: string;
  cvPointsToEmphasize: string[];
  coverLetterHook: EvidenceDrivenCoverLetterHook;
  salaryExpectation: {
    estimatedMinSEK?: number;
    estimatedMaxSEK?: number;
    benchmarkText: string;
  };
  recommendedPositioningStrategy: string;
}

export function generateCandidatePositioning(
  jobAd: {
    id: string;
    title: string;
    company: string;
    description: string;
  },
  candidate: CandidateEvidenceModel,
  assessment: OpportunityAssessment,
  enrichment?: JobEnrichment | null
): CandidatePositioning {
  const whyYouFit: string[] = [
    `Qualified fit evaluated at ${assessment.match.score}% match score (Grade ${assessment.match.grade}).`,
    ...assessment.match.evidenceRationale.slice(0, 3),
  ];

  // 1. Extract Top 3 Strongest Evidence Items
  const strongestEvidence: CandidatePositioning["strongestEvidence"] = [];
  for (const reqName of assessment.match.matchedRequirements.slice(0, 3)) {
    const ev = candidate.capabilities.get(reqName.toLowerCase());
    if (ev) {
      strongestEvidence.push({
        competency: ev.capability,
        evidenceText: ev.demonstratedIn.join(", "),
        strength: ev.strength === "HIGH" ? "HIGH" : "MEDIUM",
      });
    }
  }

  if (strongestEvidence.length === 0) {
    strongestEvidence.push({
      competency: candidate.headline,
      evidenceText: "Verified candidate career profile competencies.",
      strength: "HIGH",
    });
  }

  // 2. Identify Potential Concern with Explicit Confidence Level
  let potentialConcern: PositioningConcern | null = null;
  let howToAddressConcern = "Emphasize core technical capability match and engineering adaptability.";

  if (assessment.match.missingRequirements.length > 0) {
    const mainMissing = assessment.match.missingRequirements[0];
    const ev = candidate.capabilities.get(mainMissing.toLowerCase());

    if (ev && ev.isTransferable) {
      potentialConcern = {
        gapDescription: `Job lists "${mainMissing}"; candidate has adjacent transferable capability (${ev.capability}).`,
        riskLevel: "LOW",
        confidenceLevel: "LOW", // Low confidence concern because transferable evidence exists
      };
      howToAddressConcern = `Highlight how your demonstrated capability in ${ev.capability} directly transfers to ${mainMissing}.`;
    } else {
      potentialConcern = {
        gapDescription: `Job lists explicit requirement for "${mainMissing}" with no direct profile evidence.`,
        riskLevel: "MEDIUM",
        confidenceLevel: "HIGH", // High confidence concern because direct evidence is absent
      };
      howToAddressConcern = `Position your core strengths in ${assessment.match.matchedRequirements.slice(0, 2).join(", ")} while demonstrating fast learning velocity.`;
    }
  }

  // 3. Select CV Points to Emphasize
  const cvPointsToEmphasize: string[] = strongestEvidence.map(
    ev => `Emphasize experience in ${ev.competency} (${ev.evidenceText})`
  );

  // 4. Evidence-Driven Cover Letter Hook (Facts & Reasoning, NO generic prose)
  const primaryCompetency = strongestEvidence[0]?.competency || "Software & Systems Engineering";
  const coverLetterHook: EvidenceDrivenCoverLetterHook = {
    theme: `Bridging ${primaryCompetency} with production engineering goals at ${jobAd.company}`,
    supportingEvidence: strongestEvidence.map(e => `${e.competency}: ${e.evidenceText}`),
  };

  // 5. Salary Expectation
  const salaryExpectation = {
    estimatedMinSEK: enrichment?.research.marketSalaryBenchmark.estimatedMinSEK || 45000,
    estimatedMaxSEK: enrichment?.research.marketSalaryBenchmark.estimatedMaxSEK || 65000,
    benchmarkText: enrichment?.research.marketSalaryBenchmark.benchmarkNote || "Market benchmark for role and location.",
  };

  // 6. Recommended Positioning Strategy
  const recommendedPositioningStrategy =
    assessment.match.grade === "A"
      ? "Lead directly with your verified core capability evidence and highlight immediate impact potential."
      : "Lead with your strongest transferable competencies and emphasize rapid technical adaptability.";

  return {
    opportunityId: jobAd.id,
    jobTitle: jobAd.title,
    companyName: jobAd.company,
    whyYouFit,
    strongestEvidence,
    potentialConcern,
    howToAddressConcern,
    cvPointsToEmphasize,
    coverLetterHook,
    salaryExpectation,
    recommendedPositioningStrategy,
  };
}
