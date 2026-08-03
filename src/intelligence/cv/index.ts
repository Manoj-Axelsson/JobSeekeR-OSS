export interface CvPerformanceMetric {
  resumeVersion: string;
  totalApplied: number;
  interviewsCount: number;
  offersCount: number;
  conversionRate: number; // %
}

export function calculateCvPerformance(applications: any[] = []): CvPerformanceMetric[] {
  if (!applications || applications.length === 0) {
    return [];
  }

  const cvGroups: Record<string, { applied: number; interviews: number; offers: number }> = {};

  applications.forEach((app) => {
    const cvName = app.resumeVersion || "Primary Competence Profile";
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

  return Object.entries(cvGroups).map(([resumeVersion, data]) => ({
    resumeVersion,
    totalApplied: data.applied,
    interviewsCount: data.interviews,
    offersCount: data.offers,
    conversionRate: Math.round((data.interviews / (data.applied || 1)) * 100),
  }));
}

export function getBestPerformingCv(applications: any[] = []): string {
  const metrics = calculateCvPerformance(applications);
  if (metrics.length > 0) {
    return metrics.sort((a, b) => b.conversionRate - a.conversionRate)[0].resumeVersion;
  }
  return "Primary Profile";
}
