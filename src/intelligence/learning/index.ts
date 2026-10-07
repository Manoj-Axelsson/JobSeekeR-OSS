import type { JobAd } from "@/types/domain";
import { safeParseSkillArray } from "../utils";

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

export function calculateHighestRoiCourse(jobs: JobAd[] = []): LearningMetric {
  const skillCounts: Record<string, number> = {};
  for (const j of jobs) {
    const missing = safeParseSkillArray(j.missingSkills);
    for (const kw of missing) {
      skillCounts[kw] = (skillCounts[kw] || 0) + 1;
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

export function calculateUpskillingRoadmap(jobs: JobAd[] = []): SkillDemandMetric[] {
  const skillCounts: Record<string, number> = {};
  const totalJobs = jobs.length || 1;

  for (const j of jobs) {
    const matched = safeParseSkillArray(j.matchedSkills);
    const missing = safeParseSkillArray(j.missingSkills);
    const keywords = [...matched, ...missing];
    for (const kw of keywords) {
      skillCounts[kw] = (skillCounts[kw] || 0) + 1;
    }
  }

  const sorted = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (sorted.length === 0) {
    return [
      {
        skill: "Software & Systems Architecture",
        count: 5,
        percentage: 70,
        growthVelocity: "🔥 High Demand",
        scoreBoostPct: 15,
      },
      {
        skill: "Quality Assurance & Compliance",
        count: 4,
        percentage: 60,
        growthVelocity: "⚡ Essential",
        scoreBoostPct: 12,
      },
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
