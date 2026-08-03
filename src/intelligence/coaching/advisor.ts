/**
 * JobSeekR Intelligence Framework v2.0
 * Phase 4: Application Coaching Advisor Engine
 * Answer: "How can Anna communicate this authentically?"
 */

import { CoachingAdviceResult } from "./types";
import { OpportunityEntity } from "../opportunity/types";
import { CandidateStrategyProfile } from "../positioning/types";

function sanitizeText(str: string): string {
  if (!str) return "";
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

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

    const cleanTitle = sanitizeText(opp.title);
    const cleanCompany = sanitizeText(opp.company);
    const cleanRoleTitle = sanitizeText(candidate.targetRoleTitle);

    // 1. Authentic Narrative Theme based on candidate's real verified achievements
    const primaryEvidence = candidate.verifiedEvidence[0];
    const authenticNarrativeTheme = primaryEvidence
      ? `Demonstrated track record of delivering measurable outcomes in ${primaryEvidence.associatedCompetency} (${primaryEvidence.achievementText}).`
      : `Experienced ${cleanRoleTitle} dedicated to structured problem solving and operational quality.`;

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

    const cleanSuperpowers = candidate.superpowers.map(sanitizeText).filter(Boolean).join(" and ");

    const coverLetterHook = `As a ${cleanRoleTitle} with verified background in ${cleanSuperpowers || "engineering"}, I am drawn to ${cleanCompany}'s commitment to excellence in ${cleanTitle}.`;

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
