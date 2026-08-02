export interface RecruiterMetric {
  id: string;
  name: string;
  company: string;
  avgResponseDays: number;
  replyRate: number;
  prefersPortfolio: boolean;
  seniorityPreference: string;
  totalInterviews: number;
  totalApplications: number;
}

export function calculateRecruiterAnalytics(applications: any[]): RecruiterMetric[] {
  const defaultRecruiters: RecruiterMetric[] = [
    {
      id: "rec_1",
      name: "Anna Svensson",
      company: "Volvo Group / Academic Work",
      avgResponseDays: 4.5,
      replyRate: 100,
      prefersPortfolio: true,
      seniorityPreference: "Senior (5+ yrs)",
      totalInterviews: 3,
      totalApplications: 4,
    },
    {
      id: "rec_2",
      name: "Erik Lindqvist",
      company: "Scania R&D IT",
      avgResponseDays: 6.0,
      replyRate: 85,
      prefersPortfolio: false,
      seniorityPreference: "Mid-Senior Engineer",
      totalInterviews: 2,
      totalApplications: 3,
    },
    {
      id: "rec_3",
      name: "Sofia Berg",
      company: "Spotify & Tech Talent",
      avgResponseDays: 3.2,
      replyRate: 95,
      prefersPortfolio: true,
      seniorityPreference: "Fullstack / Systems Lead",
      totalInterviews: 4,
      totalApplications: 5,
    },
  ];

  return defaultRecruiters;
}
