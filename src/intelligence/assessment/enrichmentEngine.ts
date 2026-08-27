/**
 * Phase 9 — Enrichment Engine
 * JobSeekR Intelligence Framework v3.0
 *
 * ABSOLUTE ARCHITECTURAL RULE: Enrichment must NEVER influence Eligibility or Match.
 * Flow: Eligibility -> Match -> Intent -> Confidence -> Recommendation -> Enrichment -> Positioning.
 * Enrichment EXPLAINS opportunities; it does NOT qualify opportunities.
 *
 * Post-Qualification Rule: Runs ONLY on qualified Primary and Discovery opportunities.
 * Two-Layer Design:
 * 1. Deterministic Enrichment (Derived directly & stably from job text & profile)
 * 2. Research Enrichment (Market salary benchmarks, company context, growth signals)
 */

import { OpportunityAssessment } from "./contract";
import { StructuredJobRequirementModel } from "./requirements";
import { parseSalaryFromDescription } from "../salary";

export interface DeterministicEnrichment {
  salaryParsed: {
    min?: number;
    max?: number;
    currency?: string;
    rawText?: string;
  };
  locationNormalized: string;
  employerName: string;
  techStack: string[];
  seniority: string;
  workingModel: string;
  domain: string;
}

export interface ResearchEnrichment {
  companyProfile: {
    name: string;
    industry?: string;
    isStartup: boolean;
  };
  marketSalaryBenchmark: {
    estimatedMinSEK?: number;
    estimatedMaxSEK?: number;
    benchmarkNote: string;
  };
  growthSignals: string[];
}

export interface JobEnrichment {
  opportunityId: string;
  deterministic: DeterministicEnrichment;
  research: ResearchEnrichment;
}

/**
 * Enriches a qualified opportunity (Primary or Discovery ONLY).
 * Does NOT alter assessment scores or eligibility status.
 */
export function enrichOpportunity(
  jobAd: {
    id: string;
    title: string;
    description: string;
    location?: string;
    company?: string;
  },
  jobReqs: StructuredJobRequirementModel,
  assessment: OpportunityAssessment
): JobEnrichment | null {
  // Post-Qualification Guardrail: Only enrich surviving Primary or Discovery opportunities
  if (assessment.recommendation.type === "SUPPRESS") {
    return null;
  }

  // 1. Layer 1: Deterministic Enrichment (Derived directly from job ad attributes)
  const salaryParsed = parseSalaryFromDescription(jobAd.description);
  const locationNormalized = jobAd.location || "Sweden";
  const employerName = jobAd.company || "Employer";
  const techStack = [...jobReqs.technologies.required, ...jobReqs.technologies.preferred];
  const seniority = jobReqs.seniority;
  const workingModel = jobReqs.workingModel;

  const descLower = jobAd.description.toLowerCase();
  let domain = "General Engineering";
  if (descLower.includes("software") || descLower.includes("fullstack") || descLower.includes("web")) {
    domain = "Software Development";
  } else if (descLower.includes("system") || descLower.includes("architecture")) {
    domain = "Systems Engineering";
  } else if (descLower.includes("quality") || descLower.includes("six sigma") || descLower.includes("dmaic")) {
    domain = "Quality & Process Improvement";
  } else if (descLower.includes("manufacturing") || descLower.includes("production")) {
    domain = "Industrial Production";
  }

  const deterministic: DeterministicEnrichment = {
    salaryParsed: {
      min: salaryParsed.salaryMin || undefined,
      max: salaryParsed.salaryMax || undefined,
      currency: salaryParsed.salaryCurrency || "SEK",
      rawText: salaryParsed.salaryRawText || undefined,
    },
    locationNormalized,
    employerName,
    techStack,
    seniority,
    workingModel,
    domain,
  };

  // 2. Layer 2: Research Enrichment (Market benchmarks & company context)
  const isStartup =
    descLower.includes("startup") ||
    descLower.includes("tidigt skede") ||
    descLower.includes("founding") ||
    descLower.includes("riskkapital");

  let benchmarkMin = 45000;
  let benchmarkMax = 65000;
  if (seniority === "Senior" || seniority === "Lead") {
    benchmarkMin = 60000;
    benchmarkMax = 85000;
  } else if (seniority === "Junior") {
    benchmarkMin = 35000;
    benchmarkMax = 48000;
  }

  const research: ResearchEnrichment = {
    companyProfile: {
      name: employerName,
      industry: domain,
      isStartup,
    },
    marketSalaryBenchmark: {
      estimatedMinSEK: salaryParsed.salaryMin || benchmarkMin,
      estimatedMaxSEK: salaryParsed.salaryMax || benchmarkMax,
      benchmarkNote: `Swedish market benchmark for ${seniority} ${domain} positions.`,
    },
    growthSignals: isStartup
      ? ["Early-stage growth opportunity", "High autonomy environment"]
      : ["Established employer", "Structured career path"],
  };

  return {
    opportunityId: jobAd.id,
    deterministic,
    research,
  };
}
