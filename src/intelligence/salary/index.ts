export interface SalaryInfo {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryRawText: string | null;
}

export function parseSalaryFromDescription(description: string): SalaryInfo {
  if (!description) {
    return { salaryMin: null, salaryMax: null, salaryCurrency: "SEK", salaryRawText: null };
  }

  const rangePattern = /(?:lön|salary|ersättning|månadslön)?\s*:?\s*(\d{2,3}[\s.]?\d{3})\s*(?:-|till|–)\s*(\d{2,3}[\s.]?\d{3})\s*(?:kr|sek|SEK|\/mån)/i;
  const singlePattern = /(?:lön|salary|ersättning|månadslön)\s*:?\s*(\d{2,3}[\s.]?\d{3})\s*(?:kr|sek|SEK|\/mån)/i;

  const rangeMatch = description.match(rangePattern);
  if (rangeMatch) {
    const minVal = parseInt(rangeMatch[1].replace(/[\s.]/g, ""), 10);
    const maxVal = parseInt(rangeMatch[2].replace(/[\s.]/g, ""), 10);
    if (minVal > 15000 && maxVal > 15000) {
      return {
        salaryMin: minVal,
        salaryMax: maxVal,
        salaryCurrency: "SEK",
        salaryRawText: `${minVal.toLocaleString("sv-SE")} - ${maxVal.toLocaleString("sv-SE")} SEK/mån`,
      };
    }
  }

  const singleMatch = description.match(singlePattern);
  if (singleMatch) {
    const val = parseInt(singleMatch[1].replace(/[\s.]/g, ""), 10);
    if (val > 15000) {
      return {
        salaryMin: val,
        salaryMax: val,
        salaryCurrency: "SEK",
        salaryRawText: `${val.toLocaleString("sv-SE")} SEK/mån`,
      };
    }
  }

  return { salaryMin: null, salaryMax: null, salaryCurrency: "SEK", salaryRawText: null };
}

export interface RoleSalaryBenchmark {
  roleTitle: string;
  minSalary: number;
  maxSalary: number;
  currency: string;
  scope: string;
}

const SWEDISH_SALARY_DATABASE: Record<string, { min: number; max: number; scope: string }> = {
  "software": { min: 48000, max: 68000, scope: "Stockholm & Gothenburg • Mid-Senior" },
  "fullstack": { min: 50000, max: 70000, scope: "Stockholm & Malmö • Senior Level" },
  "frontend": { min: 45000, max: 64000, scope: "Sweden Tech Hubs • Mid-Senior" },
  "backend": { min: 48000, max: 68000, scope: "Sweden Tech Hubs • Mid-Senior" },
  "systems architect": { min: 58000, max: 78000, scope: "Enterprise & Industrial R&D" },
  "systems engineer": { min: 48000, max: 66000, scope: "Aerospace & Automotive R&D" },
  "quality": { min: 44000, max: 62000, scope: "QA & Continuous Improvement" },
  "data": { min: 52000, max: 74000, scope: "Data Science & Analytics" },
  "devops": { min: 52000, max: 72000, scope: "Cloud & Infrastructure" },
  "manufacturing": { min: 45000, max: 63000, scope: "Production & Automation" },
  "product manager": { min: 54000, max: 75000, scope: "Product Management & Tech" },
};

export function calculateSalaryBenchmarks(targetRoles: string[] = [], jobs: any[] = []): RoleSalaryBenchmark[] {
  const benchmarks: RoleSalaryBenchmark[] = [];
  const processedTitles = new Set<string>();

  // 1. First, evaluate applicant's target roles from user profile or CVs
  if (targetRoles && targetRoles.length > 0) {
    for (const role of targetRoles) {
      const lower = role.toLowerCase().trim();
      if (!lower || processedTitles.has(lower)) continue;

      const matchedKey = Object.keys(SWEDISH_SALARY_DATABASE).find((key) => lower.includes(key));
      const dbEntry = matchedKey ? SWEDISH_SALARY_DATABASE[matchedKey] : { min: 46000, max: 65000, scope: "Swedish Industry Average • Tech & Engineering" };

      benchmarks.push({
        roleTitle: `${role} Benchmark`,
        minSalary: dbEntry.min,
        maxSalary: dbEntry.max,
        currency: "SEK/mån",
        scope: dbEntry.scope,
      });
      processedTitles.add(lower);
      if (benchmarks.length >= 3) break;
    }
  }

  // 2. If fewer than 3 benchmarks, pull top titles from scanned jobs feed
  if (benchmarks.length < 3 && jobs && jobs.length > 0) {
    for (const job of jobs) {
      if (!job.title) continue;
      const titleLower = job.title.toLowerCase().trim();

      if ([...processedTitles].some((t) => titleLower.includes(t))) continue;

      const matchedKey = Object.keys(SWEDISH_SALARY_DATABASE).find((key) => titleLower.includes(key));
      const dbEntry = matchedKey ? SWEDISH_SALARY_DATABASE[matchedKey] : { min: 45000, max: 64000, scope: "Sweden National Industry Benchmark" };

      benchmarks.push({
        roleTitle: `${job.title} Benchmark`,
        minSalary: dbEntry.min,
        maxSalary: dbEntry.max,
        currency: "SEK/mån",
        scope: dbEntry.scope,
      });
      processedTitles.add(titleLower);
      if (benchmarks.length >= 3) break;
    }
  }

  // 3. Fallback defaults if no profile or jobs loaded yet
  if (benchmarks.length === 0) {
    benchmarks.push(
      { roleTitle: "Software Developer Benchmark", minSalary: 48000, maxSalary: 68000, currency: "SEK/mån", scope: "Stockholm & Gothenburg • Senior Level" },
      { roleTitle: "Systems Engineer Benchmark", minSalary: 50000, maxSalary: 72000, currency: "SEK/mån", scope: "Industrial R&D & Enterprise IT" },
      { roleTitle: "Quality Assurance Benchmark", minSalary: 44000, maxSalary: 62000, currency: "SEK/mån", scope: "Continuous Improvement & QA" }
    );
  }

  return benchmarks.slice(0, 3);
}
