export function calculateOverallCareerScore(jobs: any[] = [], applications: any[] = []): number {
  if (!jobs || jobs.length === 0) return 75;

  const matchedScores = jobs.map((j) => j.matchScore || 0);
  const avgMatch = Math.round(matchedScores.reduce((a, b) => a + b, 0) / (matchedScores.length || 1));
  const appBonus = Math.min(20, applications.length * 4);

  const finalScore = Math.min(100, Math.max(50, Math.round(avgMatch * 0.8 + appBonus)));
  return finalScore;
}
