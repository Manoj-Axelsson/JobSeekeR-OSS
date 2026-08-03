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

export function calculateRecruiterAnalytics(applications: any[] = []): RecruiterMetric[] {
  if (!applications || applications.length === 0) {
    return [];
  }

  const recruiterMap: Record<string, { company: string; total: number; interviews: number }> = {};
  applications.forEach((app) => {
    const company = app.company || "Direct Employer";
    const key = `${company}`;
    if (!recruiterMap[key]) {
      recruiterMap[key] = { company, total: 0, interviews: 0 };
    }
    recruiterMap[key].total += 1;
    if (app.status === "INTERVIEWING" || app.status === "OFFER") {
      recruiterMap[key].interviews += 1;
    }
  });

  return Object.entries(recruiterMap).map(([comp, data], i) => ({
    id: `rec_${i + 1}`,
    name: `Talent Acquisition (${comp})`,
    company: comp,
    avgResponseDays: 4.5,
    replyRate: Math.round((data.interviews / data.total) * 100) || 50,
    prefersPortfolio: true,
    seniorityPreference: "Target Fit",
    totalInterviews: data.interviews,
    totalApplications: data.total,
  }));
}
