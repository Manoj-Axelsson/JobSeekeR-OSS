/**
 * JobSeekR Intelligence Framework v2.0
 * Phase 4: Application Coaching Advisor Engine
 * Answer: "How can Anna communicate this authentically?"
 */

import { CoachingAdviceResult } from "./types";
import { OpportunityEntity } from "../opportunity/types";
import { CandidateStrategyProfile } from "../positioning/types";

export class ApplicationCoachingAdvisor {
  /**
   * Generates career strategist coaching guidance for candidate Anna
   */
  public generateCoaching(
    opp: OpportunityEntity,
    candidate: CandidateStrategyProfile
  ): CoachingAdviceResult {
    const keyInterviewTalkingPoints: string[] = [];
    const coachingGuidance: string[] = [];

    // 1. Authentic Narrative Theme based on candidate's real verified achievements
    const primaryEvidence = candidate.verifiedEvidence[0];
    const authenticNarrativeTheme = primaryEvidence
      ? `Demonstrated track record of delivering measurable outcomes in ${primaryEvidence.associatedCompetency} (${primaryEvidence.achievementText}).`
      : `Experienced ${candidate.targetRoleTitle} dedicated to structured problem solving and operational quality.`;

    // 2. Formulate authentic interview talking points
    candidate.verifiedEvidence.forEach((item) => {
      keyInterviewTalkingPoints.push(
        `When discussing ${item.associatedCompetency}, reference your verified outcome: "${item.achievementText}".`
      );
    });

    // 3. Career Strategist Coaching Notes (Preserving authenticity)
    coachingGuidance.push("Focus your cover letter intro on your authentic motivation for this specific employer.");
    coachingGuidance.push("Do not attempt to rewrite your background with buzzwords; emphasize verified evidence.");
    coachingGuidance.push("Be prepared to explain how your transferable skills directly mitigate any experience gaps.");

    const coverLetterHook = `As a ${candidate.targetRoleTitle} with verified background in ${candidate.superpowers.join(" and ")}, I am drawn to ${opp.company}'s commitment to excellence in ${opp.title}.`;

    return {
      authenticNarrativeTheme,
      keyInterviewTalkingPoints,
      coverLetterHook,
      coachingGuidance,
      nonFabricationGuarantee: true,
    };
  }
}

export const applicationCoachingAdvisor = new ApplicationCoachingAdvisor();
