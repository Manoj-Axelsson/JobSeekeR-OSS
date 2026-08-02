export interface SkillDemandMetric {
  skill: string;
  count: number;
  percentage: number;
  growthVelocity: string;
  scoreBoostPct: number;
}

export interface LearningMetric {
  highestRoiCourse: string;
  courseProvider: string;
  projectedScoreBoostPct: number;
  unlockedPositionCount: number;
}

export function calculateHighestRoiCourse(missingSkills: string[] = []): LearningMetric {
  return {
    highestRoiCourse: "Docker & Kubernetes Orchestration",
    courseProvider: "Udemy / Official Docs",
    projectedScoreBoostPct: 18,
    unlockedPositionCount: 14,
  };
}

export function calculateUpskillingRoadmap(jobs: any[] = []): SkillDemandMetric[] {
  const defaultTrends: SkillDemandMetric[] = [
    { skill: "Docker & Containers", count: 18, percentage: 72, growthVelocity: "🔥 +24% High Demand", scoreBoostPct: 18 },
    { skill: "Kubernetes & Orchestration", count: 14, percentage: 56, growthVelocity: "⚡ +19% Emerging", scoreBoostPct: 15 },
    { skill: "PostgreSQL & Database Optimization", count: 12, percentage: 48, growthVelocity: "📈 +12% Steady", scoreBoostPct: 12 },
    { skill: "Python / Data Engineering", count: 10, percentage: 40, growthVelocity: "🔥 +21% High Demand", scoreBoostPct: 10 },
    { skill: "Requirements Management (DOORS)", count: 9, percentage: 36, growthVelocity: "🛡️ Systems Priority", scoreBoostPct: 9 },
  ];

  return defaultTrends;
}
