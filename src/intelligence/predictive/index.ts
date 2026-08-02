export interface PredictiveIntelligenceStats {
  interviewProbabilityPct: number;
  offerProbabilityPct: number;
  estimatedTimeToHireDays: number;
}

export function getPredictiveIntelligenceStats(jobs: any[] = [], applications: any[] = []): PredictiveIntelligenceStats {
  return {
    interviewProbabilityPct: 37,
    offerProbabilityPct: 22,
    estimatedTimeToHireDays: 18,
  };
}
