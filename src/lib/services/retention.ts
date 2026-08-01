import { db } from "../db";

export interface PruneResult {
  purgedAdsCount: number;
  purgedLogsCount: number;
  cutoffDate: Date;
}

/**
 * 12-Month Automated Data Retention Policy Service
 * Purges non-essential job postings and scan logs older than specified days (default 365 days / 12 months)
 */
export async function pruneExpiredData(daysToKeep: number = 365): Promise<PruneResult> {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

  // Purge un-applied or discarded job ads published more than 365 days ago
  const adsDeleteResult = await db.jobAd.deleteMany({
    where: {
      publishedAt: {
        lt: cutoffDate,
      },
      status: {
        in: ["NEW", "DISCARDED"],
      },
    },
  });

  // Purge scan logs older than 365 days
  const logsDeleteResult = await db.scanLog.deleteMany({
    where: {
      scannedAt: {
        lt: cutoffDate,
      },
    },
  });

  return {
    purgedAdsCount: adsDeleteResult.count,
    purgedLogsCount: logsDeleteResult.count,
    cutoffDate,
  };
}
