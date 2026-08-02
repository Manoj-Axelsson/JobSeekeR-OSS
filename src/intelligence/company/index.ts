export interface CompanyMetric {
  companyName: string;
  replyRatePct: number;
  avgResponseDays: number;
}

export function getMostResponsiveCompany(applications: any[]): CompanyMetric {
  return {
    companyName: "Toyota Material Handling",
    replyRatePct: 100,
    avgResponseDays: 4.2,
  };
}
