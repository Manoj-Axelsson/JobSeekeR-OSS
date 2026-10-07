import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseWebbjobbTitleAndLocation,
  parseWebbjobbCompany,
  parseWebbjobbExternalId,
  parseWebbjobbRssXml,
  webbjobbItemToSourceVacancy,
  fetchWebbjobbVacancies,
} from "../webbjobb";
import { getPublicationCutoff } from "../publicationFreshness";

describe("Webbjobb Ingestion Service", () => {
  describe("parseWebbjobbTitleAndLocation", () => {
    it("parses title and location with double space separator", () => {
      const result = parseWebbjobbTitleAndLocation("Senior Requirements Analyst  Sundsvall");
      expect(result).toEqual({ title: "Senior Requirements Analyst", location: "Sundsvall" });
    });

    it("parses title and location with city and country", () => {
      const result = parseWebbjobbTitleAndLocation("Java Developer  Luleå, Sweden");
      expect(result).toEqual({ title: "Java Developer", location: "Luleå, Sweden" });
    });

    it("parses title and location with hyphen separator", () => {
      const result = parseWebbjobbTitleAndLocation("Senior Developer - Stockholm");
      expect(result).toEqual({ title: "Senior Developer", location: "Stockholm" });
    });

    it("defaults location to Sweden when no separator is found", () => {
      const result = parseWebbjobbTitleAndLocation("Fullstack Developer");
      expect(result).toEqual({ title: "Fullstack Developer", location: "Sweden" });
    });
  });

  describe("parseWebbjobbCompany", () => {
    it("extracts company name from description text", () => {
      const desc = "Company description: Ericsson AB Job description: Developing software systems";
      const company = parseWebbjobbCompany(desc);
      expect(company).toBe("Ericsson AB");
    });

    it("extracts company name from title with 'till' pattern", () => {
      const company = parseWebbjobbCompany(
        "Job description",
        "Product Designer till PRIMUS-SILVA i Bromma"
      );
      expect(company).toBe("PRIMUS-SILVA");
    });

    it("returns empty string when company cannot be established", () => {
      const company = parseWebbjobbCompany("Just a plain job description without company tags");
      expect(company).toBe("");
    });
  });

  describe("parseWebbjobbExternalId", () => {
    it("extracts numeric job ID from Webbjobb URL", () => {
      const id = parseWebbjobbExternalId("https://webbjobb.io/jobb/347508/systemadministrator");
      expect(id).toBe("wj_347508");
    });

    it("generates deterministic hash fallback for non-standard URL", () => {
      const id = parseWebbjobbExternalId("https://webbjobb.io/custom-path");
      expect(id).toMatch(/^wj_\d+$/);
    });
  });

  describe("parseWebbjobbRssXml", () => {
    it("parses valid RSS XML into WebbjobbRssItem list", () => {
      const xml = `
        <rss version="2.0">
          <channel>
            <item>
              <title>Fullstack Developer  Stockholm</title>
              <link>https://webbjobb.io/jobb/12345/fullstack</link>
              <description>&lt;p&gt;Company description: TechCorp AB Job description: Building web applications&lt;/p&gt;</description>
              <pubDate>Mon, 28 Sep 2026 10:00:00 GMT</pubDate>
            </item>
          </channel>
        </rss>
      `;
      const items = parseWebbjobbRssXml(xml);
      expect(items).toHaveLength(1);
      expect(items[0].title).toBe("Fullstack Developer  Stockholm");
      expect(items[0].link).toBe("https://webbjobb.io/jobb/12345/fullstack");
      expect(items[0].pubDate).toBe("Mon, 28 Sep 2026 10:00:00 GMT");
    });
  });

  describe("webbjobbItemToSourceVacancy", () => {
    it("converts WebbjobbRssItem to SourceVacancy with normalized fields", () => {
      const item = {
        title: "Systems Engineer  Linköping",
        link: "https://webbjobb.io/jobb/999/systems-engineer?utm_source=rss",
        description: "Company description: SAAB AB Job description: Avionics software",
        pubDate: "2026-09-29T12:00:00.000Z",
      };

      const vacancy = webbjobbItemToSourceVacancy(item);

      expect(vacancy.externalId).toBe("wj_999");
      expect(vacancy.title).toBe("Systems Engineer");
      expect(vacancy.location).toBe("Linköping");
      expect(vacancy.company).toBe("SAAB AB");
      expect(vacancy.source).toBe("Webbjobb.io");
      expect(vacancy.webpageUrl).toBe("https://webbjobb.io/jobb/999/systems-engineer");
      expect(vacancy.publishedAt).toEqual(new Date("2026-09-29T12:00:00.000Z"));
    });
  });

  describe("fetchWebbjobbVacancies", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("fetches vacancies and filters out non-fresh items", async () => {
      const now = new Date("2026-10-01T12:00:00Z");
      const cutoff = getPublicationCutoff(now, 7); // Cutoff: 2026-09-24

      const xml = `
        <rss version="2.0">
          <channel>
            <item>
              <title>Fresh Developer  Stockholm</title>
              <link>https://webbjobb.io/jobb/1001/fresh</link>
              <description>Company description: Acme AB</description>
              <pubDate>Mon, 28 Sep 2026 10:00:00 GMT</pubDate>
            </item>
            <item>
              <title>Stale Developer  Malmö</title>
              <link>https://webbjobb.io/jobb/1002/stale</link>
              <description>Company description: OldCorp</description>
              <pubDate>Mon, 15 Sep 2026 10:00:00 GMT</pubDate>
            </item>
          </channel>
        </rss>
      `;

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        text: async () => xml,
      } as Response);

      const vacancies = await fetchWebbjobbVacancies("https://webbjobb.io/rss/jobb.xml", cutoff);

      expect(vacancies).toHaveLength(1);
      expect(vacancies[0].title).toBe("Fresh Developer");
      expect(vacancies[0].externalId).toBe("wj_1001");
    });

    it("returns empty array on fetch error", async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const vacancies = await fetchWebbjobbVacancies();
      expect(vacancies).toEqual([]);
    });
  });
});
