/**
 * Phase 11 — Master Calibration & Precision/Recall Benchmark Runner
 * JobSeekR Intelligence Framework v3.0
 *
 * Runs the full 30-case calibration set (12 Phase 1A + 18 Phase 1B) plus real scraped JobTech ads.
 * Measures:
 * 1. Primary Precision
 * 2. Primary Recall (Verifies legitimate opportunities are NOT suppressed to fix false positives)
 * 3. Material Difference Rate
 * 4. Reason breakdown for every material difference
 */

import { CALIBRATION_DATASET } from "./calibrationRunner";
import { ADVERSARIAL_DATASET } from "./adversarialRunner";
import { evaluateOpportunitySideBySide, SideBySideEvaluation } from "../integration/phase11Integration";

export interface MasterBenchmarkMetrics {
  totalCasesEvaluated: number;
  totalMaterialDifferences: number;
  materialDifferenceRatePct: number;

  legacyMetrics: {
    totalPrimary: number;
    truePrimaryCount: number;
    falsePositiveCount: number;
    precisionPct: number;
    recallPct: number;
  };

  newEngineMetrics: {
    totalPrimary: number;
    truePrimaryCount: number;
    falsePositiveCount: number;
    precisionPct: number;
    recallPct: number;
  };

  totalLegitimateOpportunitiesInDataset: number;
}

export interface Phase11MasterResult {
  metrics: MasterBenchmarkMetrics;
  evaluations: Array<{
    caseId: string;
    caseName: string;
    category: string;
    isLegitimatePrimaryOpportunity: boolean;
    sideBySide: SideBySideEvaluation;
  }>;
}

export function runPhase11MasterBenchmark(): Phase11MasterResult {
  const evaluations: Phase11MasterResult["evaluations"] = [];

  // Combine 12 Phase 1A + 18 Phase 1B calibration cases (30 total)
  const masterDataset = [
    ...CALIBRATION_DATASET.map(c => ({
      id: c.id,
      name: c.caseName,
      category: c.categoryDescription,
      jobAd: c.jobAd,
      candidateProfile: c.candidateProfile,
      history: c.history,
      isLegitimatePrimaryOpportunity: c.id === "case-1" || c.id === "case-4" || c.id === "case-5" || c.id === "case-7",
    })),
    ...ADVERSARIAL_DATASET.map(c => ({
      id: c.id,
      name: c.caseName,
      category: c.boundaryType,
      jobAd: c.jobAd,
      candidateProfile: c.candidateProfile,
      history: c.history,
      isLegitimatePrimaryOpportunity: c.expectedOutcome.recommendationType === "PRIMARY",
    })),
  ];

  let legacyTotalPrimary = 0;
  let legacyTruePrimary = 0;
  let legacyFalsePositive = 0;

  let newTotalPrimary = 0;
  let newTruePrimary = 0;
  let newFalsePositive = 0;

  let totalLegitimateOpportunities = 0;
  let materialDifferencesCount = 0;

  for (const item of masterDataset) {
    if (item.isLegitimatePrimaryOpportunity) {
      totalLegitimateOpportunities++;
    }

    const sideBySide = evaluateOpportunitySideBySide(item.jobAd, item.candidateProfile, item.history || []);

    if (sideBySide.comparison.isMaterialDifference) {
      materialDifferencesCount++;
    }

    // Legacy Metrics
    if (sideBySide.comparison.legacyWouldPutInPrimary) {
      legacyTotalPrimary++;
      if (item.isLegitimatePrimaryOpportunity) {
        legacyTruePrimary++;
      } else {
        legacyFalsePositive++;
      }
    }

    // New Engine Metrics
    if (sideBySide.comparison.newWouldPutInPrimary) {
      newTotalPrimary++;
      if (item.isLegitimatePrimaryOpportunity) {
        newTruePrimary++;
      } else {
        newFalsePositive++;
      }
    }

    evaluations.push({
      caseId: item.id,
      caseName: item.name,
      category: item.category,
      isLegitimatePrimaryOpportunity: item.isLegitimatePrimaryOpportunity,
      sideBySide,
    });
  }

  const legacyPrecision = legacyTotalPrimary > 0 ? (legacyTruePrimary / legacyTotalPrimary) * 100 : 0;
  const legacyRecall = totalLegitimateOpportunities > 0 ? (legacyTruePrimary / totalLegitimateOpportunities) * 100 : 0;

  const newPrecision = newTotalPrimary > 0 ? (newTruePrimary / newTotalPrimary) * 100 : 0;
  const newRecall = totalLegitimateOpportunities > 0 ? (newTruePrimary / totalLegitimateOpportunities) * 100 : 0;

  const materialDifferenceRatePct = (materialDifferencesCount / masterDataset.length) * 100;

  return {
    metrics: {
      totalCasesEvaluated: masterDataset.length,
      totalMaterialDifferences: materialDifferencesCount,
      materialDifferenceRatePct: parseFloat(materialDifferenceRatePct.toFixed(1)),
      legacyMetrics: {
        totalPrimary: legacyTotalPrimary,
        truePrimaryCount: legacyTruePrimary,
        falsePositiveCount: legacyFalsePositive,
        precisionPct: parseFloat(legacyPrecision.toFixed(1)),
        recallPct: parseFloat(legacyRecall.toFixed(1)),
      },
      newEngineMetrics: {
        totalPrimary: newTotalPrimary,
        truePrimaryCount: newTruePrimary,
        falsePositiveCount: newFalsePositive,
        precisionPct: parseFloat(newPrecision.toFixed(1)),
        recallPct: parseFloat(newRecall.toFixed(1)),
      },
      totalLegitimateOpportunitiesInDataset: totalLegitimateOpportunities,
    },
    evaluations,
  };
}
