/**
 * Phase 8 — Application History Intelligence Engine
 * JobSeekR Intelligence Framework v3.0
 *
 * Operates before final recommendation selection.
 * Evaluates:
 * 1. Already applied positions
 * 2. Re-issued advertisements (comparing substantive requirement & description fingerprints rather than externalId alone)
 * 3. Rejection history (suppresses matching role fingerprints at Employer X if rejection < 7 months ago)
 */

export interface ApplicationRecord {
  id: string;
  externalId?: string;
  company: string;
  title: string;
  description: string;
  status: "APPLIED" | "INTERVIEWING" | "OFFER" | "REJECTED";
  appliedAt: Date;
  rejectedAt?: Date;
}

export interface HistoryIntelligenceResult {
  hasHistoryConflict: boolean;
  conflictType?: "ALREADY_APPLIED" | "REISSUED_AD" | "RECENT_REJECTION";
  suppressReason?: string;
  details?: string;
}

export function computeJobWords(title: string, description: string): Set<string> {
  const text = `${title} ${description}`.toLowerCase();
  const words = text
    .replace(/[^a-zäöå0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 3);
  return new Set(words);
}

export function computeJaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  let intersection = 0;
  for (const w of set1) {
    if (set2.has(w)) intersection++;
  }
  const union = new Set([...set1, ...set2]).size;
  return union === 0 ? 0 : intersection / union;
}

export function evaluateHistoryIntelligence(
  job: {
    id: string;
    externalId?: string;
    company: string;
    title: string;
    description: string;
  },
  history: ApplicationRecord[] = []
): HistoryIntelligenceResult {
  const targetWords = computeJobWords(job.title, job.description);
  const descTarget = computeJobWords("", job.description);

  for (const app of history) {
    const isSameCompany = app.company.toLowerCase().trim() === job.company.toLowerCase().trim();

    // 1. Check Already Applied (Exact ID match)
    if (app.id === job.id || (app.externalId && app.externalId === job.externalId)) {
      return {
        hasHistoryConflict: true,
        conflictType: "ALREADY_APPLIED",
        suppressReason: `Already applied to this exact opportunity on ${app.appliedAt.toISOString().slice(0, 10)}.`,
      };
    }

    if (app.status === "APPLIED" && isSameCompany && app.title.toLowerCase() === job.title.toLowerCase()) {
      return {
        hasHistoryConflict: true,
        conflictType: "ALREADY_APPLIED",
        suppressReason: `Active application already pending for ${job.title} at ${job.company}.`,
      };
    }

    // 2. Check Re-issued Advertisements (Substantive requirement & description fingerprint match)
    if (isSameCompany) {
      const appWords = computeJobWords(app.title, app.description);
      const descApp = computeJobWords("", app.description);

      const descSimilarity = computeJaccardSimilarity(descTarget, descApp);
      const overallSimilarity = computeJaccardSimilarity(targetWords, appWords);

      if ((descSimilarity >= 0.70 || overallSimilarity >= 0.55) && app.status === "APPLIED") {
        return {
          hasHistoryConflict: true,
          conflictType: "REISSUED_AD",
          suppressReason: `Substantially similar re-issued advertisement of active application (Description similarity: ${Math.round(descSimilarity * 100)}%).`,
        };
      }
    }

    // 3. Check Rejection History (< 7 months window / 213.4 days)
    if (app.status === "REJECTED" && isSameCompany) {
      const rejectedDate = app.rejectedAt || app.appliedAt;
      const daysSinceRejection = (Date.now() - rejectedDate.getTime()) / (1000 * 60 * 60 * 24);
      const monthsSinceRejection = daysSinceRejection / 30.44;

      if (monthsSinceRejection < 7.0) {
        const appWords = computeJobWords(app.title, app.description);
        const descApp = computeJobWords("", app.description);

        const descSimilarity = computeJaccardSimilarity(descTarget, descApp);
        const overallSimilarity = computeJaccardSimilarity(targetWords, appWords);

        if (descSimilarity >= 0.65 || overallSimilarity >= 0.50) {
          return {
            hasHistoryConflict: true,
            conflictType: "RECENT_REJECTION",
            suppressReason: `Role fingerprint matches previous rejection at ${job.company} (${Math.round(daysSinceRejection)} days / ${monthsSinceRejection.toFixed(1)} months ago, threshold 7 months).`,
          };
        }
      }
    }
  }

  return {
    hasHistoryConflict: false,
  };
}
