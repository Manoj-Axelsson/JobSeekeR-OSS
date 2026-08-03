/**
 * JobSeekR Intelligence Framework v2.0
 * Phase 3: Positioning Intelligence Analyzer Engine
 * Answer: "How should Anna present her existing evidence?"
 */

import { CandidateStrategyProfile, PositioningAdvice } from "./types";
import { OpportunityEntity } from "../opportunity/types";
import { competencyGraph } from "../competency/graph";

export class PositioningAnalyzer {
  /**
   * Analyzes how Anna should position her existing evidence for a specific opportunity
   */
  public analyzePositioning(
    opp: OpportunityEntity,
    candidate: CandidateStrategyProfile
  ): PositioningAdvice {
    const strongestCompetencies: string[] = [];
    const missingEvidenceWarnings: string[] = [];
    const cvEmphasisOrder: string[] = [];
    let transferableHighlight = "";

    const lowerDesc = opp.description.toLowerCase();

    // 1. Evaluate strongest verified evidence present in candidate profile
    for (const item of candidate.verifiedEvidence) {
      const transfer = competencyGraph.evaluateTransferability(item.associatedCompetency, opp.description);
      if (transfer && transfer.transferWeight >= 0.75) {
        strongestCompetencies.push(`${item.associatedCompetency} (${item.achievementText})`);
        cvEmphasisOrder.push(`Move higher: "${item.achievementText}" directly supports the employer's requirement.`);
        if (!transferableHighlight) {
          transferableHighlight = transfer.rationale;
        }
      }
    }

    // 2. Identify missing evidence warnings without fabricating experience
    const keyExpectedTerms = ["lead", "quality", "automation", "dmaic", "stakeholder", "ci/cd", "agile"];
    for (const term of keyExpectedTerms) {
      if (lowerDesc.includes(term)) {
        const candidateHasEvidence = candidate.verifiedEvidence.some((e) =>
          e.achievementText.toLowerCase().includes(term) || e.associatedCompetency.toLowerCase().includes(term)
        );
        if (!candidateHasEvidence) {
          missingEvidenceWarnings.push(
            `The job posting emphasizes '${term.toUpperCase()}', which is currently missing explicit evidence in your profile.`
          );
        }
      }
    }

    // Default fallback order if verified evidence matches
    if (cvEmphasisOrder.length === 0) {
      cvEmphasisOrder.push("Maintain current CV layout; highlight core strengths in executive summary.");
    }

    const rationale = `Positioning strategy prioritizes your ${strongestCompetencies.length} verified evidence items and highlights transferable competence paths.`;

    return {
      strongestCompetencies,
      missingEvidenceWarnings,
      cvEmphasisOrder,
      transferableHighlight,
      rationale,
    };
  }
}

export const positioningAnalyzer = new PositioningAnalyzer();
