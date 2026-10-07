/**
 * Shared publication-date policy for vacancy discovery.
 * The cutoff is inclusive: an advert published exactly seven days ago
 * is considered fresh.
 */

export const VACANCY_FRESHNESS_DAYS = 7;

export function getPublicationCutoff(
  now: Date = new Date(),
  days: number = VACANCY_FRESHNESS_DAYS
): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export function isFreshPublicationDate(
  value: string | Date | null | undefined,
  cutoff: Date,
  now: Date = new Date()
): boolean {
  if (value == null || !Number.isFinite(cutoff.getTime())) {
    return false;
  }

  const publishedAt = value instanceof Date ? value : new Date(value);

  if (!Number.isFinite(publishedAt.getTime())) {
    return false;
  }

  // Reject dates in the future rather than treating them as fresh.
  return publishedAt.getTime() >= cutoff.getTime() && publishedAt.getTime() <= now.getTime();
}
