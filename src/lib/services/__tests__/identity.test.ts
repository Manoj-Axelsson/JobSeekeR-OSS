import { describe, it, expect } from "vitest";
import { normalizeUrl, normalizeText, computeCanonicalHash, resolveCanonicalJob, getActiveLockCount } from "../identity";

describe("Pure Canonical Identity Primitives (Strategy 4)", () => {
  describe("normalizeUrl", () => {
    it("strips tracking parameters while preserving canonical path structure", () => {
      const url1 = "https://www.platsbanken.se/arbetsforetag/2918293?utm_source=google&utm_medium=cpc&ref=123";
      const url2 = "https://platsbanken.se/arbetsforetag/2918293/";
      expect(normalizeUrl(url1)).toBe("https://platsbanken.se/arbetsforetag/2918293");
      expect(normalizeUrl(url2)).toBe("https://platsbanken.se/arbetsforetag/2918293");
    });

    it("handles LinkedIn URLs and removes trackingId / refId noise", () => {
      const url = "https://www.linkedin.com/jobs/view/410293812/?trackingId=abc%3D%3D&refId=xyz";
      expect(normalizeUrl(url)).toBe("https://linkedin.com/jobs/view/410293812");
    });

    it("returns null for null, undefined, or empty URLs", () => {
      expect(normalizeUrl(null)).toBeNull();
      expect(normalizeUrl(undefined)).toBeNull();
      expect(normalizeUrl("   ")).toBeNull();
    });
  });

  describe("normalizeText", () => {
    it("handles Swedish characters Å, Ä, Ö, case-folding, and extra whitespace", () => {
      const input = "  Volvo Cars  —  Linköping (Östergötland)  ";
      expect(normalizeText(input)).toBe("volvo cars linköping östergötland");
    });

    it("strips punctuation while retaining alphanumeric tokens", () => {
      const input = "Senior Software Engineer (React / Node.js!)";
      expect(normalizeText(input)).toBe("senior software engineer react node js");
    });
  });

  describe("computeCanonicalHash (Strategy 4 Candidate Grouping)", () => {
    it("produces deterministic SHA-256 hashes for company + title + location", () => {
      const hash1 = computeCanonicalHash("Volvo", "Systems Engineer", "Stockholm");
      const hash2 = computeCanonicalHash("VOLVO", "Systems Engineer", "stockholm");
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it("allows cross-source vacancies (JobTech vs LinkedIn) to generate identical Stage 1 candidate hash", () => {
      const jobTechHash = computeCanonicalHash("Volvo Cars AB", "Senior Systems Engineer", "Stockholm");
      const linkedInHash = computeCanonicalHash("Volvo Cars AB", "Senior Systems Engineer", "Stockholm");
      expect(jobTechHash).toBe(linkedInHash);
    });
  });

  describe("In-Process Lock Lifecycle & Memory Safety", () => {
    it("cleans up lock entries from resolutionLocks Map after successful resolution", async () => {
      const mockDb = {
        jobAd: {
          findFirst: async () => null,
          create: async (args: any) => ({ id: "mock_1", ...args.data }),
        },
      };

      const res = await resolveCanonicalJob(mockDb, {
        externalId: "lock_test_1",
        title: "Test Engineer",
        company: "Lock Corp",
        location: "Stockholm",
        description: "Testing lock cleanup",
        source: "Test",
        publishedAt: new Date(),
      });

      expect(res.job.id).toBe("mock_1");
      expect(getActiveLockCount()).toBe(0);
    });

    it("cleans up lock entries from resolutionLocks Map even after database error / failure", async () => {
      const failingDb = {
        jobAd: {
          findFirst: async () => {
            throw new Error("DB Connection Error");
          },
        },
      };

      await expect(
        resolveCanonicalJob(failingDb, {
          externalId: "lock_fail_1",
          title: "Failing Engineer",
          company: "Fail Corp",
          location: "Stockholm",
          description: "Testing lock cleanup on failure",
          source: "Test",
          publishedAt: new Date(),
        })
      ).rejects.toThrow("DB Connection Error");

      expect(getActiveLockCount()).toBe(0);
    });

    it("enforces strict FIFO release ordering between first caller and queued second caller", async () => {
      const executionOrder: string[] = [];
      let resolveFirstJob: () => void;
      const firstJobPromise = new Promise<void>((r) => { resolveFirstJob = r; });

      const mockDb = {
        jobAd: {
          findFirst: async (args: any) => {
            const extId = args?.where?.externalId;
            if (extId === "fifo_1" && !executionOrder.includes("caller1_start")) {
              executionOrder.push("caller1_start");
              await firstJobPromise;
              executionOrder.push("caller1_finish");
            } else if (extId === "fifo_2" && !executionOrder.includes("caller2_start")) {
              executionOrder.push("caller2_start");
              executionOrder.push("caller2_finish");
            }
            return null;
          },
          create: async (args: any) => ({ id: `mock_${args.data.externalId}`, ...args.data }),
        },
      };

      const payload = {
        title: "FIFO Engineer",
        company: "FIFO Corp",
        location: "Stockholm",
        description: "Testing FIFO order",
        source: "Test",
        publishedAt: new Date(),
      };

      const p1 = resolveCanonicalJob(mockDb, { ...payload, externalId: "fifo_1" });
      const p2 = resolveCanonicalJob(mockDb, { ...payload, externalId: "fifo_2" });

      await new Promise((r) => setTimeout(r, 10));
      expect(executionOrder).toEqual(["caller1_start"]);

      resolveFirstJob!();
      await Promise.all([p1, p2]);

      expect(executionOrder).toEqual(["caller1_start", "caller1_finish", "caller2_start", "caller2_finish"]);
      expect(getActiveLockCount()).toBe(0);
    });

    it("prevents unbounded resolutionLocks Map growth under 100 unique concurrent resolutions", async () => {
      const mockDb = {
        jobAd: {
          findFirst: async () => null,
          create: async (args: any) => ({ id: `mock_${Math.random()}`, ...args.data }),
        },
      };

      const promises = Array.from({ length: 100 }, (_, i) =>
        resolveCanonicalJob(mockDb, {
          externalId: `stress_${i}`,
          title: `Engineer ${i}`,
          company: `Corp ${i}`,
          location: `City ${i}`,
          description: `Stress testing ${i}`,
          source: "StressTest",
          publishedAt: new Date(),
        })
      );

      await Promise.all(promises);
      expect(getActiveLockCount()).toBe(0);
    });
  });
});
