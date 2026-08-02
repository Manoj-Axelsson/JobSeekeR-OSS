export interface CvPerformanceMetric {
  resumeVersion: string;
  totalApplied: number;
  interviewsCount: number;
  offersCount: number;
  conversionRate: number; // %
}

export function calculateCvPerformance(applications: any[]): CvPerformanceMetric[] {
  const cvGroups: Record<string, { applied: number; interviews: number; offers: number }> = {};

  applications.forEach((app) => {
    const cvName = app.resumeVersion || "Version 8 (Fullstack Architecture)";
    if (!cvGroups[cvName]) {
      cvGroups[cvName] = { applied: 0, interviews: 0, offers: 0 };
    }
    cvGroups[cvName].applied += 1;
    if (app.status === "INTERVIEWING") cvGroups[cvName].interviews += 1;
    if (app.status === "OFFER") {
      cvGroups[cvName].interviews += 1;
      cvGroups[cvName].offers += 1;
    }
  });

  const defaultCvMetrics: CvPerformanceMetric[] = [
    {
      resumeVersion: "Version 8 (Fullstack Architecture)",
      totalApplied: 4,
      interviewsCount: 2,
      offersCount: 1,
      conversionRate: 50,
    },
    {
      resumeVersion: "Version 5 (Systems Engineering)",
      totalApplied: 3,
      interviewsCount: 1,
      offersCount: 0,
      conversionRate: 33,
    },
  ];

  const calculated = Object.entries(cvGroups).map(([resumeVersion, data]) => ({
    resumeVersion,
    totalApplied: data.applied,
    interviewsCount: data.interviews,
    offersCount: data.offers,
    conversionRate: Math.round((data.interviews / (data.applied || 1)) * 100),
  }));

  return calculated.length > 0 ? calculated : defaultCvMetrics;
}

export function getBestPerformingCv(applications: any[]): string {
  const metrics = calculateCvPerformance(applications);
  if (metrics.length > 0) {
    return metrics.sort((a, b) => b.conversionRate - a.conversionRate)[0].resumeVersion;
  }
  return "Version 8";
}
