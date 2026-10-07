import { describe, it, expect } from "vitest";
import {
  VACANCY_FRESHNESS_DAYS,
  getPublicationCutoff,
  isFreshPublicationDate,
} from "../publicationFreshness";

describe("publicationFreshness service", () => {
  // Fixed reference date: 2026-09-28T12:00:00.000Z
  const refNow = new Date("2026-09-28T12:00:00.000Z");
  // Default 7-day cutoff: 2026-09-21T12:00:00.000Z
  const defaultCutoff = getPublicationCutoff(refNow);

  describe("getPublicationCutoff", () => {
    it("calculates default cutoff seven days before the supplied reference date", () => {
      const expectedCutoff = new Date("2026-09-21T12:00:00.000Z");

      expect(defaultCutoff.toISOString()).toBe(expectedCutoff.toISOString());
      expect(VACANCY_FRESHNESS_DAYS).toBe(7);
    });

    it("calculates cutoff for a custom number of days", () => {
      const customDays = 14;
      const customCutoff = getPublicationCutoff(refNow, customDays);
      const expectedCutoff = new Date("2026-09-14T12:00:00.000Z");

      expect(customCutoff.toISOString()).toBe(expectedCutoff.toISOString());
    });

    it("does not mutate the original reference Date object", () => {
      const initialTimestamp = refNow.getTime();

      getPublicationCutoff(refNow);
      expect(refNow.getTime()).toBe(initialTimestamp);
    });
  });

  describe("isFreshPublicationDate", () => {
    it("accepts a publication date within the seven-day window", () => {
      const withinWindowDate = new Date("2026-09-25T12:00:00.000Z");

      expect(isFreshPublicationDate(withinWindowDate, defaultCutoff, refNow)).toBe(true);
    });

    it("accepts a date exactly at the cutoff boundary", () => {
      const exactCutoffDate = new Date("2026-09-21T12:00:00.000Z");

      expect(isFreshPublicationDate(exactCutoffDate, defaultCutoff, refNow)).toBe(true);
    });

    it("rejects a date immediately older than the cutoff boundary", () => {
      const olderDate = new Date("2026-09-21T11:59:59.999Z");

      expect(isFreshPublicationDate(olderDate, defaultCutoff, refNow)).toBe(false);
    });

    it("accepts a date exactly at the reference now timestamp", () => {
      expect(isFreshPublicationDate(refNow, defaultCutoff, refNow)).toBe(true);
    });

    it("rejects a future publication date relative to reference now", () => {
      const futureDate = new Date("2026-09-28T12:00:00.001Z");

      expect(isFreshPublicationDate(futureDate, defaultCutoff, refNow)).toBe(false);
    });

    it("rejects missing values (null and undefined)", () => {
      expect(isFreshPublicationDate(null, defaultCutoff, refNow)).toBe(false);
      expect(isFreshPublicationDate(undefined, defaultCutoff, refNow)).toBe(false);
    });

    it("rejects an invalid date string", () => {
      expect(isFreshPublicationDate("not-a-valid-date-string", defaultCutoff, refNow)).toBe(false);
    });

    it("rejects an invalid cutoff date", () => {
      const invalidCutoff = new Date(NaN);
      const validDate = new Date("2026-09-25T12:00:00.000Z");

      expect(isFreshPublicationDate(validDate, invalidCutoff, refNow)).toBe(false);
    });

    it("correctly handles both string and Date object inputs", () => {
      const dateObj = new Date("2026-09-25T12:00:00.000Z");
      const dateString = "2026-09-25T12:00:00.000Z";

      expect(isFreshPublicationDate(dateObj, defaultCutoff, refNow)).toBe(true);
      expect(isFreshPublicationDate(dateString, defaultCutoff, refNow)).toBe(true);
    });

    it("respects a custom reference now value", () => {
      const customNow = new Date("2026-10-15T12:00:00.000Z");
      const customDefaultCutoff = getPublicationCutoff(customNow);

      const freshForCustomNow = new Date("2026-10-10T12:00:00.000Z");
      const staleForCustomNow = new Date("2026-09-25T12:00:00.000Z");

      expect(isFreshPublicationDate(freshForCustomNow, customDefaultCutoff, customNow)).toBe(true);
      expect(isFreshPublicationDate(staleForCustomNow, customDefaultCutoff, customNow)).toBe(false);
    });

    it("respects a custom cutoff independently of default seven-day policy", () => {
      const customCutoff = new Date("2026-09-01T00:00:00.000Z");
      const dateWithinCustomCutoff = new Date("2026-09-10T12:00:00.000Z");

      expect(isFreshPublicationDate(dateWithinCustomCutoff, customCutoff, refNow)).toBe(true);
      expect(isFreshPublicationDate(dateWithinCustomCutoff, defaultCutoff, refNow)).toBe(false);
    });
  });
});
