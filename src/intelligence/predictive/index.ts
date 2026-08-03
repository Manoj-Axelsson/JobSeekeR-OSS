export interface PredictiveIntelligenceStats {
  interviewProbabilityPct: number;
  offerProbabilityPct: number;
  estimatedTimeToHireDays: number;
}

export function getPredictiveIntelligenceStats(jobs: any[] = [], applications: any[] = []): PredictiveIntelligenceStats {
  const matchedScores = jobs.map((j) => j.matchScore || 0);
  const avgMatch = matchedScores.length > 0 ? Math.round(matchedScores.reduce((a, b) => a + b, 0) / matchedScores.length) : 70;
  
  const interviewProb = Math.min(95, Math.max(15, Math.round(avgMatch * 0.5)));
  const offerProb = Math.min(80, Math.max(10, Math.round(interviewProb * 0.6)));

  return {
    interviewProbabilityPct: interviewProb,
    offerProbabilityPct: offerProb,
    estimatedTimeToHireDays: 14,
  };
}
