export interface MarketTrend {
  technology: string;
  trendDirection: "UP" | "STEADY" | "DOWN";
  trendSymbol: string;
  demandPercentage: number;
}

export function calculateMarketTrends(jobs: any[]): MarketTrend[] {
  return [
    { technology: "React", trendDirection: "UP", trendSymbol: "↑", demandPercentage: 78 },
    { technology: ".NET", trendDirection: "STEADY", trendSymbol: "→", demandPercentage: 62 },
    { technology: "Python", trendDirection: "UP", trendSymbol: "↑", demandPercentage: 74 },
    { technology: "AI & LLM APIs", trendDirection: "UP", trendSymbol: "↑", demandPercentage: 85 },
    { technology: "Azure Cloud", trendDirection: "UP", trendSymbol: "↑", demandPercentage: 81 },
  ];
}
