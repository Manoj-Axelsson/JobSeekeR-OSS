import { describe, it, expect } from "vitest";
import {
  generateAudioPitchText,
  getPortalApplyButtonLabel,
} from "../JobDetailsModal";

describe("JobDetailsModal Unit & Contract Tests", () => {
  describe("generateAudioPitchText", () => {
    it("should format Swedish audio pitch text correctly with title, company, and opening hook", () => {
      const title = "Senior Fullstack Utvecklare";
      const company = "Tech Bolag AB";
      const openingHook = "Med stark bakgrund inom TypeScript och React matchar jag kraven.";

      const pitch = generateAudioPitchText(title, company, openingHook);

      expect(pitch).toBe(
        "Jobb: Senior Fullstack Utvecklare på Tech Bolag AB. Öppningsfras för personligt brev: Med stark bakgrund inom TypeScript och React matchar jag kraven."
      );
    });
  });

  describe("getPortalApplyButtonLabel", () => {
    it("should return LinkedIn apply label when job id starts with li_", () => {
      const label = getPortalApplyButtonLabel("li_123456", "https://arbetsformedlingen.se/jobb/123");
      expect(label).toBe("Apply on LinkedIn ↗");
    });

    it("should return LinkedIn apply label when webpageUrl contains linkedin.com", () => {
      const label = getPortalApplyButtonLabel("pb_99999", "https://www.linkedin.com/jobs/view/12345678");
      expect(label).toBe("Apply on LinkedIn ↗");
    });

    it("should return Platsbanken apply label for non-LinkedIn job id and url", () => {
      const label = getPortalApplyButtonLabel("pb_12345", "https://arbetsformedlingen.se/platsbanken/annonser/12345");
      expect(label).toBe("Apply on Platsbanken ↗");
    });

    it("should return Platsbanken apply label when webpageUrl is null or undefined", () => {
      const label = getPortalApplyButtonLabel("generic_123", null);
      expect(label).toBe("Apply on Platsbanken ↗");
    });
  });
});
