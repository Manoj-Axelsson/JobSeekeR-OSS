import { calculateRecruiterAnalytics, RecruiterMetric } from "../recruiter";
import { parseSalaryFromDescription, SalaryInfo } from "../salary";
import { calculateHighestRoiCourse, LearningMetric } from "../learning";
import { calculateMarketTrends, MarketTrend } from "../market";
import { calculateCvPerformance, getBestPerformingCv, CvPerformanceMetric } from "../cv";
import { getMostResponsiveCompany, CompanyMetric } from "../company";
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

export function generateExecutiveCareerOverview(jobs: any[], applications: any[]): ExecutiveCareerOverview {
  return {
    overallCareerScore: calculateOverallCareerScore(jobs, applications),
    interviewProbabilityPct: predictInterviewProbability(jobs, applications),
    mostValuableSkill: "Azure",
    highestRoiCourse: calculateHighestRoiCourse().highestRoiCourse,
    bestPerformingCv: getBestPerformingCv(applications),
    mostResponsiveCompany: getMostResponsiveCompany(applications).companyName,
    marketTrends: calculateMarketTrends(jobs),
    recruiters: calculateRecruiterAnalytics(applications),
    cvPerformance: calculateCvPerformance(applications),
  };
}
