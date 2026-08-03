export interface MarketTrend {
  technology: string;
  trendDirection: "UP" | "STEADY" | "DOWN";
  trendSymbol: string;
  demandPercentage: number;
}

export function calculateMarketTrends(jobs: any[] = []): MarketTrend[] {
  if (!jobs || jobs.length === 0) {
    return [
      { technology: "TypeScript", trendDirection: "UP", trendSymbol: "↑", demandPercentage: 80 },
      { technology: "React", trendDirection: "UP", trendSymbol: "↑", demandPercentage: 75 },
      { technology: "Systems Engineering", trendDirection: "STEADY", trendSymbol: "→", demandPercentage: 65 },
      { technology: "Quality Engineering", trendDirection: "UP", trendSymbol: "↑", demandPercentage: 70 },
    ];
  }

  const techCounts: Record<string, number> = {};
  const total = jobs.length;

  jobs.forEach((j) => {
    const allSkills = [...(j.matchedSkills || []), ...(j.missingKeywords || [])];
    allSkills.forEach((s: string) => {
      if (s && typeof s === "string") {
        const clean = s.trim();
        if (clean) techCounts[clean] = (techCounts[clean] || 0) + 1;
      }
    });
  });

  const sorted = Object.entries(techCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (sorted.length === 0) {
    return [
      { technology: "TypeScript", trendDirection: "UP", trendSymbol: "↑", demandPercentage: 80 },
      { technology: "React", trendDirection: "UP", trendSymbol: "↑", demandPercentage: 75 },
    ];
  }

  return sorted.map(([tech, count]) => {
    const pct = Math.round((count / total) * 100);
    return {
      technology: tech,
      trendDirection: pct >= 50 ? "UP" : "STEADY",
      trendSymbol: pct >= 50 ? "↑" : "→",
      demandPercentage: pct,
    };
  });
}
