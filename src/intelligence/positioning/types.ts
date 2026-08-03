/**
 * JobSeekR Intelligence Framework v2.0
 * Phase 3: Positioning Intelligence Types ("How should Anna present her existing evidence?")
 */

export interface EvidenceItem {
  id: string;
  achievementText: string;
  associatedCompetency: string;
  quantifiableMetric?: string;
}

export interface CandidateStrategyProfile {
  name: string;
  targetRoleTitle: string;
  superpowers: string[];
  verifiedEvidence: EvidenceItem[];
}

export interface PositioningAdvice {
  strongestCompetencies: string[];
  missingEvidenceWarnings: string[];
  cvEmphasisOrder: string[];         // Recommended layout order of existing evidence
  transferableHighlight: string;      // Key transferable story
  rationale: string;                 // Plain language rationale for Anna
}
