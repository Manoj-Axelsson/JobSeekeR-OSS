export interface PrimaryFeedItem {
  id: string;
  feedType?: string | null;
  eligibilityStatus?: string | null;
  matchScore: number;
  publishedAt: Date | string;
  createdAt?: Date | string;
  [key: string]: any;
}

export interface FeedSelectionResult<T extends PrimaryFeedItem> {
  primaryJobs: T[];
  discoveryJobs: T[];
  retainedPrimary: T[];
  surplusToDemote: T[];
}

export interface PrimaryFeedSelectionResult<T extends PrimaryFeedItem> {
  retainedPrimary: T[];
  surplusToDemote: T[];
}

/**
 * Deterministically partitions eligible jobs into Primary (up to 15) and Discovery (up to 10) feeds.
 * Orders both feeds chronologically (newest published date first).
 *
 * Selection Rules:
 * 1. Filters candidate jobs for ELIGIBLE status (if status fields present).
 * 2. Primary ordering: publishedAt descending (most recent publication date first).
 * 3. Secondary ordering: matchScore descending (internal relevance signal for identical dates).
 * 4. Tertiary ordering: id ascending (deterministic tie-breaker).
 * 5. Primary feed receives up to `maxPrimaryCapacity` (default 15) eligible jobs.
 * 6. Discovery feed receives up to `maxDiscoveryCapacity` (default 10) additional eligible jobs not in Primary.
 * 7. Feeds are strictly mutually exclusive: no job appears in both feeds.
 */
export function selectFeedJobs<T extends PrimaryFeedItem>(
  jobs: T[],
  maxPrimaryCapacity: number = 15,
  maxDiscoveryCapacity: number = 10
): FeedSelectionResult<T> {
  const eligibleJobs = jobs.filter((job) => {
    const isEligible = job.eligibilityStatus == null || job.eligibilityStatus === "ELIGIBLE";
    return isEligible;
  });

  const getTimestamp = (val: Date | string | undefined | null): number => {
    if (!val) return 0;
    const d = val instanceof Date ? val : new Date(val);
    const time = d.getTime();
    return Number.isFinite(time) ? time : 0;
  };

  const sorted = [...eligibleJobs].sort((a, b) => {
    // 1. Primary sort: publishedAt descending (newest first)
    const timeA = getTimestamp(a.publishedAt) || getTimestamp(a.createdAt);
    const timeB = getTimestamp(b.publishedAt) || getTimestamp(b.createdAt);
    if (timeB !== timeA) {
      return timeB - timeA;
    }

    // 2. Secondary sort: matchScore descending (internal relevance signal)
    const scoreA = Number.isFinite(a.matchScore) ? a.matchScore : 0;
    const scoreB = Number.isFinite(b.matchScore) ? b.matchScore : 0;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    // 3. Tertiary sort: id ascending (deterministic string comparison)
    const idA = String(a.id || "");
    const idB = String(b.id || "");
    return idA.localeCompare(idB);
  });

  const primaryCandidates = sorted.filter((j) => j.feedType == null || j.feedType === "PRIMARY");
  const retainedPrimary = primaryCandidates.slice(0, maxPrimaryCapacity);
  const retainedPrimaryIds = new Set(retainedPrimary.map((j) => j.id));

  // Discovery receives additional eligible jobs not in retainedPrimary
  const discoveryCandidates = sorted.filter((j) => !retainedPrimaryIds.has(j.id));
  const discoveryJobs = discoveryCandidates.slice(0, maxDiscoveryCapacity);

  const surplusToDemote = primaryCandidates.slice(maxPrimaryCapacity);

  return {
    primaryJobs: retainedPrimary,
    discoveryJobs,
    retainedPrimary,
    surplusToDemote,
  };
}

export function selectPrimaryFeedJobs<T extends PrimaryFeedItem>(
  jobs: T[],
  maxCapacity: number = 15
): PrimaryFeedSelectionResult<T> {
  const result = selectFeedJobs(jobs, maxCapacity, 10);
  return {
    retainedPrimary: result.retainedPrimary,
    surplusToDemote: result.surplusToDemote,
  };
}
