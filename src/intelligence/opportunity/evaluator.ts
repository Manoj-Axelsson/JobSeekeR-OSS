/**
 * JobSeekR Intelligence Framework v2.0
 * Phase 2: Opportunity Intelligence Evaluator Engine
 * Answer: "Should Anna pursue this?"
 */

import { OpportunityEntity, OpportunityEvaluationResult, MatchTier } from "./types";
import { competencyGraph } from "../competency/graph";

export class OpportunityEvaluator {
  /**
   * Evaluates an opportunity for candidate Anna
   */
  public evaluateOpportunity(
    opp: OpportunityEntity,
    candidateProfile: {
      targetRoles: string[];
      preferredLocations: string[];
      skills: string[];
      workingModelPreference?: "REMOTE" | "HYBRID" | "ON_SITE";
    }
  ): OpportunityEvaluationResult {
    let score = 50; // Base score
    const advantages: string[] = [];
    const considerations: string[] = [];

    // 1. Role Title Alignment
    const titleMatch = candidateProfile.targetRoles.some((role) =>
      opp.title.toLowerCase().includes(role.toLowerCase()) || role.toLowerCase().includes(opp.title.toLowerCase())
    );
    if (titleMatch) {
      score += 20;
      advantages.push(`Direct alignment with your target role title (${opp.title}).`);
    }

    // 2. Working Model & Location Alignment
    if (opp.workingModel === candidateProfile.workingModelPreference) {
      score += 15;
      advantages.push(`Matches your preferred ${opp.workingModel.toLowerCase()} working model.`);
    }

    const locationMatch = candidateProfile.preferredLocations.some((loc) =>
      opp.location.toLowerCase().includes(loc.toLowerCase()) || loc.toLowerCase().includes(opp.location.toLowerCase())
    );
    if (locationMatch) {
      score += 10;
      advantages.push(`Located in your target geographic preference (${opp.location}).`);
    } else if (opp.workingModel === "REMOTE") {
      score += 10;
      advantages.push(`Fully remote role eliminates geographic commuting constraints.`);
    } else {
      considerations.push(`Requires location/commute to ${opp.location}.`);
    }

    // 3. Competency Relationship Coverage
    let matchedSkillsCount = 0;
    for (const candidateSkill of candidateProfile.skills) {
      const transfer = competencyGraph.evaluateTransferability(candidateSkill, opp.description);
      if (transfer && transfer.transferWeight >= 0.7) {
        matchedSkillsCount++;
      }
    }

    if (matchedSkillsCount >= 3) {
      score += 15;
      advantages.push(`High transferable competency alignment across ${matchedSkillsCount}+ core areas.`);
    } else if (matchedSkillsCount >= 1) {
      score += 5;
    } else {
      considerations.push("Requires building new competency evidence in key job requirements.");
    }

    // Bound score 0 - 100
    score = Math.max(10, Math.min(98, score));

    // 4. Assign 5-Tier Category & Rationale
    let tier: MatchTier = "LOW_PRIORITY";
    let tierLabel = "White ⚪ Low Priority";
    let pursuitRecommendation = "";

    if (score >= 88) {
      tier = "EXCELLENT_MATCH";
      tierLabel = "🌟 Excellent Match";
      pursuitRecommendation = "Strongly Recommended: This opportunity closely aligns with your target role, working model, and core competencies.";
    } else if (score >= 74) {
      tier = "STRONG_MATCH";
      tierLabel = "🟢 Strong Match";
      pursuitRecommendation = "Recommended: High value opportunity matching your primary strengths and location preferences.";
    } else if (score >= 60) {
      tier = "POTENTIAL_MATCH";
      tierLabel = "🟡 Potential Match";
      pursuitRecommendation = "Worth Exploring: Solid role alignment with a few areas requiring positioning emphasis.";
    } else if (score >= 45) {
      tier = "STRETCH_OPPORTUNITY";
      tierLabel = "🚀 Stretch Opportunity";
      pursuitRecommendation = "Growth Step: Higher seniority or new domain opportunity that leverages your transferable competencies.";
    } else {
      tier = "LOW_PRIORITY";
      tierLabel = "⚪ Low Priority";
      pursuitRecommendation = "Low Relevance: Limited alignment with your target preferences and verified competencies.";
    }

    const rationale = `Evaluated based on role alignment (${titleMatch ? "matched" : "partial"}), ${opp.workingModel} work model, and ${matchedSkillsCount} verified transferable competencies.`;

    return {
      opportunity: opp,
      tier,
      tierLabel,
      score,
      pursuitRecommendation,
      keyAdvantages: advantages,
      considerations,
      rationale,
    };
  }
}

export const opportunityEvaluator = new OpportunityEvaluator();
