import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import { resolveCanonicalJob, createIngestionInput, SourceVacancy } from "@/lib/services/identity";
import {
  parseWebbjobbTitleAndLocation,
  parseWebbjobbCompany,
  parseWebbjobbExternalId,
  parseWebbjobbRssXml,
  webbjobbItemToSourceVacancy,
} from "@/lib/services/webbjobb";
import { validateTestDatabaseUrl } from "../testDatabaseSecurity";

const isIntegrationMode = process.env.JOBSEEKER_TEST_MODE === "integration";
const rawTestDbUrl = process.env.TEST_DATABASE_URL;
const validation = validateTestDatabaseUrl(rawTestDbUrl);

describe("Webbjobb.io Source Adapter Unit Suite", () => {
  it("extracts title and location from Webbjobb title formats deterministically", () => {
    const res1 = parseWebbjobbTitleAndLocation("Senior Requirements Analyst  Sundsvall");
    expect(res1.title).toBe("Senior Requirements Analyst");
    expect(res1.location).toBe("Sundsvall");

    const res2 = parseWebbjobbTitleAndLocation("Java Developer  Luleå, Sweden");
    expect(res2.title).toBe("Java Developer");
    expect(res2.location).toBe("Luleå, Sweden");

    const res3 = parseWebbjobbTitleAndLocation("Software Architect");
    expect(res3.title).toBe("Software Architect");
    expect(res3.location).toBe("Sweden");

    const res4 = parseWebbjobbTitleAndLocation("Product Designer - Stockholm");
    expect(res4.title).toBe("Product Designer");
    expect(res4.location).toBe("Stockholm");
  });

  it("extracts company name deterministically from Webbjobb RSS item description or title without synthetic manufacturer", () => {
    const desc1 =
      "Company description: Ericsson AB Job description: Join our global team of engineers...";
    expect(parseWebbjobbCompany(desc1)).toBe("Ericsson AB");

    const desc2 = "General position description without company section";
    const title2 = "Product Designer till PRIMUS-SILVA i Bromma";
    expect(parseWebbjobbCompany(desc2, title2)).toBe("PRIMUS-SILVA");

    const desc3 = "General position description without company section";
    const title3 = "Fullstack Developer";
    expect(parseWebbjobbCompany(desc3, title3)).toBe("");
  });

  it("extracts numerical externalId from Webbjobb job URL", () => {
    const url = "https://webbjobb.io/jobb/347508/systemadministrator-inom-dataplattform";
    expect(parseWebbjobbExternalId(url)).toBe("wj_347508");
  });

  it("parses RSS XML into WebbjobbRssItem list and converts to SourceVacancy", () => {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <item>
          <title>Senior Tester  Sundsvall</title>
          <link>https://webbjobb.io/jobb/347505/senior-tester-sundsvall</link>
          <description>Company description: Scania AB Job description: Experienced Senior Tester</description>
          <pubDate>Fri, 25 Sep 2026 23:30:35 +0200</pubDate>
        </item>
      </channel>
    </rss>`;

    const items = parseWebbjobbRssXml(sampleXml);
    expect(items.length).toBe(1);
    expect(items[0].title).toBe("Senior Tester  Sundsvall");

    const vacancy = webbjobbItemToSourceVacancy(items[0]);
    expect(vacancy.externalId).toBe("wj_347505");
    expect(vacancy.title).toBe("Senior Tester");
    expect(vacancy.company).toBe("Scania AB");
    expect(vacancy.location).toBe("Sundsvall");
    expect(vacancy.source).toBe("Webbjobb.io");
    expect(vacancy.webpageUrl).toBe("https://webbjobb.io/jobb/347505/senior-tester-sundsvall");
  });
});

describe("SourceVacancy Transformer Unit Suite", () => {
  it("createIngestionInput transforms SourceVacancy to IngestionVacancyInput cleanly without mutation", () => {
    const sourceVac: SourceVacancy = {
      externalId: "wj_12345",
      title: "Fullstack Developer",
      company: "Volvo Cars",
      location: "Gothenburg",
      description: "Building Next.js platforms",
      webpageUrl: "https://webbjobb.io/jobb/12345/fullstack",
      source: "Webbjobb.io",
      publishedAt: new Date("2026-09-26T10:00:00Z"),
      deadline: null,
    };

    const input = createIngestionInput(sourceVac, { status: "NEW", matchScore: 85 });
    expect(input.externalId).toBe("wj_12345");
    expect(input.title).toBe("Fullstack Developer");
    expect(input.company).toBe("Volvo Cars");
    expect(input.source).toBe("Webbjobb.io");
    expect(input.matchScore).toBe(85);
    expect(input.status).toBe("NEW");
  });
});

describe.runIf(isIntegrationMode)(
  "JobAdSource Provenance & Deduplication Integration Suite (PostgreSQL)",
  () => {
    let db: PrismaClient;
    const runId = crypto.randomUUID();
    const testCompany = `Provenance TestCorp ${runId}`;
    const testJobTechSource = `Test JobTech ${runId}`;
    const testLinkedInSource = `Test LinkedIn ${runId}`;
    const testWebbjobbSource = `Test Webbjobb ${runId}`;
    const createdJobAdIds = new Set<string>();

    beforeAll(async () => {
      if (!isIntegrationMode) {
        throw new Error(
          "[FAIL-CLOSED] Execution mode violation: Integration suite executed outside explicit integration mode."
        );
      }
      if (!validation.valid || !rawTestDbUrl) {
        throw new Error(
          `[FAIL-CLOSED INTEGRATION GATE] Target validation failed: ${validation.error} (${validation.code})`
        );
      }

      db = new PrismaClient({ datasources: { db: { url: rawTestDbUrl } } });
      await db.$connect();
    });

    afterAll(async () => {
      if (db) {
        if (createdJobAdIds.size > 0) {
          const jobIds = Array.from(createdJobAdIds);
          await db.jobAdSource.deleteMany({ where: { jobId: { in: jobIds } } });
          await db.jobAd.deleteMany({ where: { id: { in: jobIds } } });
        }
        await db.$disconnect();
      }
    });

    it("1. Same source + same externalId creates 1 JobAd and 1 JobAdSource", async () => {
      const vacancy: SourceVacancy = {
        externalId: `test_prov_101_${runId}`,
        title: "Senior Backend Architect",
        company: testCompany,
        location: "Stockholm",
        description: "Distributed Microservices Architecture",
        webpageUrl: `https://platsbanken.se/annonser/101_${runId}`,
        source: testJobTechSource,
        publishedAt: new Date(),
        deadline: null,
      };

      const res1 = await resolveCanonicalJob(db, createIngestionInput(vacancy));
      if (res1.isNew && res1.job?.id) {
        createdJobAdIds.add(res1.job.id);
      }
      expect(res1.isNew).toBe(true);

      const sources = await db.jobAdSource.findMany({ where: { jobId: res1.job.id } });
      expect(sources.length).toBe(1);
      expect(sources[0].source).toBe(testJobTechSource);
      expect(sources[0].externalId).toBe(`test_prov_101_${runId}`);
    });

    it("2. Repeated ingestion of same source observation is idempotent (no duplicate JobAdSource)", async () => {
      const vacancy: SourceVacancy = {
        externalId: `test_prov_101_${runId}`,
        title: "Senior Backend Architect",
        company: testCompany,
        location: "Stockholm",
        description: "Distributed Microservices Architecture",
        webpageUrl: `https://platsbanken.se/annonser/101_${runId}`,
        source: testJobTechSource,
        publishedAt: new Date(),
        deadline: null,
      };

      const res2 = await resolveCanonicalJob(db, createIngestionInput(vacancy));
      expect(res2.isNew).toBe(false);

      const sources = await db.jobAdSource.findMany({ where: { jobId: res2.job.id } });
      expect(sources.length).toBe(1);
    });

    it("3. Cross-source ingestion of same canonical job yields 1 JobAd + 3 JobAdSource records", async () => {
      const base = {
        title: "Principal Platform Engineer",
        company: testCompany,
        location: "Linköping",
        description: "Kubernetes Cloud Infrastructure Architecture",
        publishedAt: new Date(),
        deadline: null,
      };

      const vacJobTech: SourceVacancy = {
        ...base,
        externalId: `prov_jt_202_${runId}`,
        source: testJobTechSource,
        webpageUrl: `https://platsbanken.se/202_${runId}`,
      };
      const vacLinkedIn: SourceVacancy = {
        ...base,
        externalId: `prov_li_202_${runId}`,
        source: testLinkedInSource,
        webpageUrl: `https://linkedin.com/jobs/view/202_${runId}`,
      };
      const vacWebbjobb: SourceVacancy = {
        ...base,
        externalId: `prov_wj_202_${runId}`,
        source: testWebbjobbSource,
        webpageUrl: `https://webbjobb.io/jobb/202_${runId}`,
      };

      const res1 = await resolveCanonicalJob(db, createIngestionInput(vacJobTech));
      if (res1.isNew && res1.job?.id) {
        createdJobAdIds.add(res1.job.id);
      }
      const res2 = await resolveCanonicalJob(db, createIngestionInput(vacLinkedIn));
      const res3 = await resolveCanonicalJob(db, createIngestionInput(vacWebbjobb));

      expect(res1.isNew).toBe(true);
      expect(res2.isNew).toBe(false);
      expect(res3.isNew).toBe(false);

      expect(res2.job.id).toBe(res1.job.id);
      expect(res3.job.id).toBe(res1.job.id);

      const sources = await db.jobAdSource.findMany({
        where: { jobId: res1.job.id },
        orderBy: { source: "asc" },
      });
      expect(sources.length).toBe(3);
      const sourceNames = sources.map((s) => s.source);
      expect(sourceNames).toContain(testJobTechSource);
      expect(sourceNames).toContain(testLinkedInSource);
      expect(sourceNames).toContain(testWebbjobbSource);
    });

    it("4. Concurrent cross-source ingestion yields 1 canonical JobAd + separate JobAdSource records", async () => {
      const base = {
        title: "Lead AI Systems Engineer",
        company: testCompany,
        location: "Stockholm",
        description: "LLM Agentic Execution Systems",
        publishedAt: new Date(),
        deadline: null,
      };

      const vacA: SourceVacancy = {
        ...base,
        externalId: `prov_conc_jt_303_${runId}`,
        source: testJobTechSource,
        webpageUrl: `https://platsbanken.se/303_${runId}`,
      };
      const vacB: SourceVacancy = {
        ...base,
        externalId: `prov_conc_li_303_${runId}`,
        source: testLinkedInSource,
        webpageUrl: `https://linkedin.com/jobs/view/303_${runId}`,
      };

      const [resA, resB] = await Promise.all([
        resolveCanonicalJob(db, createIngestionInput(vacA)),
        resolveCanonicalJob(db, createIngestionInput(vacB)),
      ]);

      const createdRes = resA.isNew ? resA : resB;
      if (createdRes.isNew && createdRes.job?.id) {
        createdJobAdIds.add(createdRes.job.id);
      }

      const newCount = [resA.isNew, resB.isNew].filter(Boolean).length;
      expect(newCount).toBe(1);
      expect(resA.job.id).toBe(resB.job.id);

      const sources = await db.jobAdSource.findMany({ where: { jobId: resA.job.id } });
      expect(sources.length).toBe(2);
    });
  }
);
