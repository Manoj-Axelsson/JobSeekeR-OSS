import type { JobAd, Application } from "@/types/domain";
import { safeParseSkillArray } from "../utils";
import { calculateRecruiterAnalytics, RecruiterMetric } from "../recruiter";
import { calculateHighestRoiCourse } from "../learning";
import { calculateMarketTrends, MarketTrend } from "../market";
import { calculateCvPerformance, getBestPerformingCv, CvPerformanceMetric } from "../cv";
import { getMostResponsiveCompany } from "../company";
import { predictInterviewProbability } from "../prediction";
import { calculateOverallCareerScore } from "../scoring";

export interface ExecutiveCareerOverview {
  overallCareerScore: number;
  interviewProbabilityPct: number;
  mostValuableSkill: string;
  highestRoiCourse: string;
  bestPerformingCv: string;
  mostResponsiveCompany: string;
  marketTrends: MarketTrend[];
  recruiters: RecruiterMetric[];
  cvPerformance: CvPerformanceMetric[];
}

export function generateExecutiveCareerOverview(
  jobs: JobAd[] = [],
  applications: Application[] = []
): ExecutiveCareerOverview {
  // Find top matched skill across jobs
  const skillCounts: Record<string, number> = {};
  jobs.forEach((j) => {
    const matched = safeParseSkillArray(j.matchedSkills);
    matched.forEach((s) => {
      skillCounts[s] = (skillCounts[s] || 0) + 1;
    });
  });

  const sortedSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]);
  const mostValuableSkill = sortedSkills.length > 0 ? sortedSkills[0][0] : "Competence Fit";

  const highestRoi = calculateHighestRoiCourse(jobs);

  return {
    overallCareerScore: calculateOverallCareerScore(jobs, applications),
    interviewProbabilityPct: predictInterviewProbability(jobs, applications),
    mostValuableSkill,
    highestRoiCourse: highestRoi.highestRoiCourse,
    bestPerformingCv: getBestPerformingCv(applications),
    mostResponsiveCompany: getMostResponsiveCompany(applications).companyName,
    marketTrends: calculateMarketTrends(jobs),
    recruiters: calculateRecruiterAnalytics(applications),
    cvPerformance: calculateCvPerformance(applications),
  };
}
