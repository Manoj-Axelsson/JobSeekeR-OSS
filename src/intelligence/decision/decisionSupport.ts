/**
 * JobSeekR Intelligence Framework v2.0
 * Phase 5: Decision Support Engine ("Anna decides whether to apply")
 * Synthesizes the 4 Intelligence Engines into an explainable decision framework.
 */

import { OpportunityEntity, OpportunityEvaluationResult } from "../opportunity/types";
import { opportunityEvaluator } from "../opportunity/evaluator";
import { competencyGraph } from "../competency/graph";
import { CandidateStrategyProfile, PositioningAdvice } from "../positioning/types";
import { positioningAnalyzer } from "../positioning/analyzer";
import { CoachingAdviceResult } from "../coaching/types";
import { applicationCoachingAdvisor } from "../coaching/advisor";

export interface DecisionSupportContext {
  stage1Opportunity: OpportunityEvaluationResult;
  stage2Competencies: {
    matchedTransferableSkills: string[];
    skillRationales: string[];
  };
  stage3Positioning: PositioningAdvice;
  stage4Coaching: CoachingAdviceResult;
  stage5UserDecisionPrompt: {
    decisionQuestion: string; // "Anna, based on this intelligence, do you want to pursue this opportunity?"
    actionOptions: string[];
  };
}

export class DecisionSupportEngine {
  /**
   * Synthesizes the 5-stage Decision Support flow for candidate Anna
   */
  public evaluateDecisionSupport(
    opp: OpportunityEntity,
    candidate: CandidateStrategyProfile,
    preferences: {
      targetRoles: string[];
      preferredLocations: string[];
      skills: string[];
      workingModelPreference?: "REMOTE" | "HYBRID" | "ON_SITE";
    }
  ): DecisionSupportContext {
    // Stage 1: Opportunity Intelligence ("Should Anna pursue this?")
    const stage1Opportunity = opportunityEvaluator.evaluateOpportunity(opp, preferences);

    // Stage 2: Competency Intelligence ("Why is she a suitable candidate?")
    const matchedTransferableSkills: string[] = [];
    const skillRationales: string[] = [];
    for (const skill of preferences.skills) {
      const transfer = competencyGraph.evaluateTransferability(skill, opp.description);
      if (transfer && transfer.transferWeight >= 0.7) {
        matchedTransferableSkills.push(transfer.targetCompetency.name);
        skillRationales.push(transfer.rationale);
      }
    }

    // Stage 3: Positioning Intelligence ("How should Anna present her existing evidence?")
    const stage3Positioning = positioningAnalyzer.analyzePositioning(opp, candidate);

    // Stage 4: Application Coaching ("How can Anna communicate this authentically?")
    const stage4Coaching = applicationCoachingAdvisor.generateCoaching(opp, candidate);

    // Stage 5: Decision Support ("Anna decides whether to apply")
    const stage5UserDecisionPrompt = {
      decisionQuestion: `Anna, you have a ${stage1Opportunity.tierLabel} (${stage1Opportunity.score}%) for ${opp.title} at ${opp.company}. Would you like to save, track, or apply to this opportunity?`,
      actionOptions: [
        "📌 Save Position to Daily Feed",
        "📋 Add to Application Tracker",
        "📖 View Coaching Rationale & Interview Talking Points",
        "↗️ Proceed to Employer Site",
      ],
    };

    return {
      stage1Opportunity,
      stage2Competencies: {
        matchedTransferableSkills,
        skillRationales,
      },
      stage3Positioning,
      stage4Coaching,
      stage5UserDecisionPrompt,
    };
  }
}

export const decisionSupportEngine = new DecisionSupportEngine();
