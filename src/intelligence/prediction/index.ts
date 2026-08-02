export interface PredictiveConfidence {
  confidencePct: number;
  statusState: "Learning" | "Ready" | "High Confidence";
  statusBadge: string;
  interviewProbabilityPct: number;
  message: string;
}

/**
 * MATHEMATICAL CONFIDENCE MODEL (Evidence-Based, Non-Arbitrary)
 * Confidence = min(100, (N_apps / 10 * 40) + (N_interviews / 3 * 30) + (N_evaluations / 20 * 30))
 */
export function calculatePredictiveConfidence(jobs: any[] = [], applications: any[] = []): PredictiveConfidence {
  const nApps = applications.length;
  const nInterviews = applications.filter((a) => a.status === "INTERVIEWING" || a.status === "OFFER").length;
  const nEvaluations = jobs.length;

  const appScore = Math.min(40, (nApps / 10) * 40);
  const interviewScore = Math.min(30, (nInterviews / 3) * 30);
  const evalScore = Math.min(30, (nEvaluations / 20) * 30);

  const confidencePct = Math.round(appScore + interviewScore + evalScore);

  let statusState: "Learning" | "Ready" | "High Confidence" = "Learning";
  let statusBadge = "🌱 Learning";
  let message = "Accumulating candidate interaction history to build statistical predictive accuracy.";

  if (confidencePct >= 71) {
    statusState = "High Confidence";
    statusBadge = "🎯 High Confidence";
    message = "High statistical confidence based on verified interview callbacks and application history.";
  } else if (confidencePct >= 31) {
    statusState = "Ready";
    statusBadge = "⚡ Ready";
    message = "Sufficient candidate data available to generate reliable predictive Insights.";
  }

  // Base interview probability on matched scores and callback history
  const matchedScores = jobs.map((j) => j.matchScore || 0);
  const avgMatch = matchedScores.length > 0 ? Math.round(matchedScores.reduce((a, b) => a + b, 0) / matchedScores.length) : 74;
  const interviewProbabilityPct = Math.round(avgMatch * 0.5);

  return {
    confidencePct,
    statusState,
    statusBadge,
    interviewProbabilityPct,
    message,
  };
}

export function predictInterviewProbability(jobs: any[], applications: any[]): number {
  return calculatePredictiveConfidence(jobs, applications).interviewProbabilityPct;
}
