/**
 * Offline Feed Simulation Runner for Real JobTech Scraped Dataset
 * JobSeekR Intelligence Framework v3.0
 *
 * Runs the new Opportunity Assessment Engine offline against all 139 real scraped
 * database records without modifying production matcher.ts or UI feeds.
 *
 * Funnel Stages:
 * 1. Raw Scraped Ads (139 jobs)
 * 2. Eligibility Gate (Hard requirements, citizenship, location hierarchy)
 * 3. Match Engine (5 weighted capability dimensions, grades A-F)
 * 4. Intent Engine (Independent target role, location, working model)
 * 5. Recommendation Engine (PRIMARY vs DISCOVERY vs SUPPRESS)
 * 6. History Intelligence (Applied, Re-issued ad, Rejection < 7m)
 * 7. Final Selection Cap (Top <=15 Primary, Top <=5 Discovery)
 */

import { PrismaClient } from "@prisma/client";
import { assessOpportunity } from "../evaluator";
import { evaluateHistoryIntelligence, ApplicationRecord } from "../historyIntelligence";
import { enrichOpportunity, JobEnrichment } from "../enrichmentEngine";
import { generateCandidatePositioning, CandidatePositioning } from "../candidatePositioning";
import { createCandidateEvidenceModel } from "../evidence";
import { extractJobRequirements } from "../requirements";

export interface FunnelCounts {
  totalRawAds: number;
  eligibleCount: number;
  ineligibleCount: number;
  primaryRecommendedCount: number;
  discoveryRecommendedCount: number;
  suppressedCount: number;
  historySuppressedCount: number;
  finalPrimarySelectedCount: number;
  finalDiscoverySelectedCount: number;
}

export interface SimulationJobResult {
  id: string;
  externalId?: string;
  title: string;
  company: string;
  location: string;
  legacyMatchScore: number;
  legacyStatus: string;
  newAssessment: {
    eligibilityStatus: string;
    matchScore: number;
    matchGrade: string;
    intentScore: number;
    confidenceLevel: string;
    recommendationType: string;
    historyConflict?: string;
    blockers: string[];
    reasons: string[];
  };
  finalFeedSelection: "SELECTED_PRIMARY" | "SELECTED_DISCOVERY" | "EXCLUDED_BORDERLINE" | "SUPPRESSED";
  exclusionReason?: string;
  enrichment?: JobEnrichment | null;
  positioning?: CandidatePositioning | null;
}

export interface SimulationReportData {
  candidateProfileName: string;
  funnel: FunnelCounts;
  selectedPrimaryJobs: SimulationJobResult[];
  selectedDiscoveryJobs: SimulationJobResult[];
  borderlineExcludedJobs: SimulationJobResult[];
  ineligibleSampleJobs: SimulationJobResult[];
}

export async function runRealFeedSimulation(): Promise<SimulationReportData> {
  const prisma = new PrismaClient();

  try {
    const rawJobs = await prisma.jobAd.findMany({
      include: {
        applications: true,
      },
    });

    const candidateInput = {
      name: "Manoj John Axelsson",
      headline: "Software & Systems Engineer",
      citizenships: ["SE"],
      languages: ["Swedish", "English"],
      skills: [
        "React", "TypeScript", "Next.js", "Node.js", "Express", "PostgreSQL", "SQL", "REST APIs", "Git", "GitHub", "Tailwind CSS",
        "Systems Engineering", "Software Architecture", "Requirements Engineering", "Validation & Verification", "PLM",
        "Six Sigma Green Belt", "DMAIC", "FMEA", "Poka-Yoke", "Root Cause Analysis", "Quality Assurance", "Process Optimization",
        "Manufacturing Engineering", "Production Development", "Lean Manufacturing", "Automation", "CAD/CAM"
      ],
      targetRoles: [
        "Fullstack Developer", "Software Engineer", "Systems Engineer", "Requirements Engineer",
        "Production Developer", "Automation Engineer", "Quality Assurance Engineer"
      ],
      preferredLocations: ["Stockholm", "Linköping", "Norrköping", "Göteborg", "Sweden"],
      workingModelPreference: "HYBRID" as const,
    };

    const candidateModel = createCandidateEvidenceModel(candidateInput);

    const applications = await prisma.application.findMany({
      include: { job: true },
    });

    const historyRecords: ApplicationRecord[] = applications.map(app => ({
      id: app.jobId,
      externalId: app.job?.externalId,
      company: app.job?.company || "Unknown Company",
      title: app.job?.title || "Unknown Title",
      description: app.job?.description || "",
      status: app.status as any,
      appliedAt: app.appliedAt,
    }));

    let eligibleCount = 0;
    let ineligibleCount = 0;
    let primaryRecommendedCount = 0;
    let discoveryRecommendedCount = 0;
    let suppressedCount = 0;
    let historySuppressedCount = 0;

    const evaluatedJobs: SimulationJobResult[] = [];

    for (const job of rawJobs) {
      const assessment = assessOpportunity(
        {
          title: job.title,
          description: job.description,
          location: job.location,
          company: job.company,
        },
        candidateInput
      );

      const historyResult = evaluateHistoryIntelligence(
        {
          id: job.id,
          externalId: job.externalId,
          company: job.company,
          title: job.title,
          description: job.description,
        },
        historyRecords
      );

      let effectiveRecommendation = assessment.recommendation.type;
      let historyConflictDetail: string | undefined = undefined;

      if (historyResult.hasHistoryConflict) {
        effectiveRecommendation = "SUPPRESS";
        historyConflictDetail = `${historyResult.conflictType}: ${historyResult.suppressReason}`;
        historySuppressedCount++;
      }

      if (assessment.eligibility.status === "ELIGIBLE") {
        eligibleCount++;
      } else {
        ineligibleCount++;
      }

      if (effectiveRecommendation === "PRIMARY") {
        primaryRecommendedCount++;
      } else if (effectiveRecommendation === "DISCOVERY") {
        discoveryRecommendedCount++;
      } else {
        suppressedCount++;
      }

      evaluatedJobs.push({
        id: job.id,
        externalId: job.externalId,
        title: job.title,
        company: job.company,
        location: job.location,
        legacyMatchScore: job.matchScore,
        legacyStatus: job.status,
        newAssessment: {
          eligibilityStatus: assessment.eligibility.status,
          matchScore: assessment.match.score,
          matchGrade: assessment.match.grade,
          intentScore: assessment.intent.score,
          confidenceLevel: assessment.confidence.assessmentConfidence,
          recommendationType: effectiveRecommendation,
          historyConflict: historyConflictDetail,
          blockers: assessment.eligibility.blockers,
          reasons: assessment.recommendation.reasons,
        },
        finalFeedSelection: "SUPPRESSED",
      });
    }

    const primaryCandidates = evaluatedJobs
      .filter(j => j.newAssessment.recommendationType === "PRIMARY")
      .sort((a, b) => b.newAssessment.matchScore - a.newAssessment.matchScore || b.newAssessment.intentScore - a.newAssessment.intentScore);

    const selectedPrimary = primaryCandidates.slice(0, 15);
    const borderlinePrimaryExcluded = primaryCandidates.slice(15);

    const discoveryCandidates = evaluatedJobs
      .filter(j => j.newAssessment.recommendationType === "DISCOVERY")
      .sort((a, b) => b.newAssessment.matchScore - a.newAssessment.matchScore);

    const selectedDiscovery = discoveryCandidates.slice(0, 5);
    const borderlineDiscoveryExcluded = discoveryCandidates.slice(5);

    for (const job of selectedPrimary) {
      job.finalFeedSelection = "SELECTED_PRIMARY";
      const rawJob = rawJobs.find(r => r.id === job.id)!;
      const assessment = assessOpportunity(rawJob, candidateInput);
      const reqs = extractJobRequirements(rawJob.title, rawJob.description, rawJob.location);

      job.enrichment = enrichOpportunity(rawJob, reqs, assessment);
      job.positioning = generateCandidatePositioning(rawJob, candidateModel, assessment, job.enrichment);
    }

    for (const job of selectedDiscovery) {
      job.finalFeedSelection = "SELECTED_DISCOVERY";
      const rawJob = rawJobs.find(r => r.id === job.id)!;
      const assessment = assessOpportunity(rawJob, candidateInput);
      const reqs = extractJobRequirements(rawJob.title, rawJob.description, rawJob.location);

      job.enrichment = enrichOpportunity(rawJob, reqs, assessment);
    }

    for (const job of [...borderlinePrimaryExcluded, ...borderlineDiscoveryExcluded]) {
      job.finalFeedSelection = "EXCLUDED_BORDERLINE";
      job.exclusionReason = "Feed capacity cap reached (selected top candidates by Match & Intent score).";
    }

    const funnel: FunnelCounts = {
      totalRawAds: rawJobs.length,
      eligibleCount,
      ineligibleCount,
      primaryRecommendedCount,
      discoveryRecommendedCount,
      suppressedCount,
      historySuppressedCount,
      finalPrimarySelectedCount: selectedPrimary.length,
      finalDiscoverySelectedCount: selectedDiscovery.length,
    };

    const ineligibleSampleJobs = evaluatedJobs.filter(j => j.newAssessment.eligibilityStatus === "INELIGIBLE").slice(0, 10);

    return {
      candidateProfileName: candidateInput.name,
      funnel,
      selectedPrimaryJobs: selectedPrimary,
      selectedDiscoveryJobs: selectedDiscovery,
      borderlineExcludedJobs: [...borderlinePrimaryExcluded, ...borderlineDiscoveryExcluded],
      ineligibleSampleJobs,
    };
  } finally {
    await prisma.$disconnect();
  }
}
