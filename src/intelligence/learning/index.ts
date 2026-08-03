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

export function calculateHighestRoiCourse(jobs: any[] = []): LearningMetric {
  const skillCounts: Record<string, number> = {};
  for (const j of jobs) {
    if (Array.isArray(j.missingKeywords)) {
      for (const kw of j.missingKeywords) {
        if (kw && typeof kw === "string") {
          const cleanKw = kw.trim();
          if (cleanKw) skillCounts[cleanKw] = (skillCounts[cleanKw] || 0) + 1;
        }
      }
    }
  }

  const sorted = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    const [topSkill, count] = sorted[0];
    const boost = Math.min(25, Math.max(10, count * 3));
    return {
      highestRoiCourse: `${topSkill} Fundamentals & Mastery`,
      courseProvider: "Industry Certification / Docs",
      projectedScoreBoostPct: boost,
      unlockedPositionCount: count,
    };
  }

  return {
    highestRoiCourse: "Core Competence Mastery",
    courseProvider: "Self-Paced Learning",
    projectedScoreBoostPct: 15,
    unlockedPositionCount: jobs.length || 5,
  };
}

export function calculateUpskillingRoadmap(jobs: any[] = []): SkillDemandMetric[] {
  const skillCounts: Record<string, number> = {};
  const totalJobs = jobs.length || 1;

  for (const j of jobs) {
    const keywords = Array.isArray(j.matchedSkills) ? [...j.matchedSkills, ...(j.missingKeywords || [])] : (j.missingKeywords || []);
    for (const kw of keywords) {
      if (kw && typeof kw === "string") {
        const cleanKw = kw.trim();
        if (cleanKw) skillCounts[cleanKw] = (skillCounts[cleanKw] || 0) + 1;
      }
    }
  }

  const sorted = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (sorted.length === 0) {
    return [
      { skill: "Software & Systems Architecture", count: 5, percentage: 70, growthVelocity: "🔥 High Demand", scoreBoostPct: 15 },
      { skill: "Quality Assurance & Compliance", count: 4, percentage: 60, growthVelocity: "⚡ Essential", scoreBoostPct: 12 },
    ];
  }

  return sorted.map(([skill, count]) => {
    const pct = Math.round((count / totalJobs) * 100);
    return {
      skill,
      count,
      percentage: pct,
      growthVelocity: pct >= 50 ? "🔥 High Demand" : "⚡ In Demand",
      scoreBoostPct: Math.min(20, Math.max(8, count * 2)),
    };
  });
}
