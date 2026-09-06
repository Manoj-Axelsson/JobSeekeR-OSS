import { describe, it, expect } from "vitest";
import { normalizeUrl, normalizeText, computeCanonicalHash } from "../identity";

describe("Pure Canonical Identity Primitives", () => {
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

  describe("computeCanonicalHash", () => {
    it("produces deterministic SHA-256 hashes for identical inputs", () => {
      const hash1 = computeCanonicalHash("Volvo", "Systems Engineer", "Stockholm", "Build automotive software platforms.");
      const hash2 = computeCanonicalHash("VOLVO", "Systems Engineer", "stockholm", "Build automotive software platforms.");
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it("prevents false-positive over-merging for distinct vacancies at the same company and location", () => {
      const hashA = computeCanonicalHash(
        "Volvo Cars",
        "Senior Software Engineer",
        "Stockholm",
        "Role A: Focus on C++ embedded control software for battery systems."
      );
      const hashB = computeCanonicalHash(
        "Volvo Cars",
        "Senior Software Engineer",
        "Stockholm",
        "Role B: Focus on React and TypeScript web cloud portals for fleet telemetry."
      );

      // Must NOT produce the same canonical hash due to description signature divergence
      expect(hashA).not.toBe(hashB);
    });
  });
});
