import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import { resolveCanonicalJob, normalizeUrl, computeCanonicalHash } from "../identity";
import { validateTestDatabaseUrl } from "../testDatabaseSecurity";

const isIntegrationMode = process.env.JOBSEEKER_TEST_MODE === "integration";
const rawTestDbUrl = process.env.TEST_DATABASE_URL;
const validation = validateTestDatabaseUrl(rawTestDbUrl);

describe("Phase 5 Identity & Tracking Normalization Unit Suite", () => {
  it("Test D — Tracking URLs normalize to identical canonicalUrl and identity", () => {
    const urlA =
      "https://www.volvocars.com/careers/job/404?utm_source=google&gclid=999&trackingId=abc";
    const urlB = "https://volvocars.com/careers/job/404/";
    const normA = normalizeUrl(urlA);
    const normB = normalizeUrl(urlB);
    expect(normA).toBe("https://volvocars.com/careers/job/404");
    expect(normA).toBe(normB);
  });

  it("Test F — Similar but different vacancies MUST NOT incorrectly merge", () => {
    const hashA = computeCanonicalHash(
      "Volvo Cars Test",
      "Embedded Control Developer",
      "Gothenburg"
    );
    const hashB = computeCanonicalHash("Volvo Cars Test", "Frontend Web Developer", "Gothenburg");
    expect(hashA).not.toBe(hashB);
  });
});

describe.runIf(isIntegrationMode)(
  "Phase 5 Canonical Job Identity & Deduplication Integration Suite (PostgreSQL Unmocked)",
  () => {
    let db: PrismaClient;
    const runId = crypto.randomUUID();
    const userAlphaId = `p5_user_alpha_${runId}`;
    const userBetaId = `user_beta_${runId}`;
    const userAlphaEmail = `p5_alpha_${runId}@test.com`;
    const userBetaEmail = `user_beta_${runId}@test.com`;

    const createdUserAccountIds = new Set<string>();
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

      await db.userAccount.createMany({
        data: [
          {
            id: userAlphaId,
            email: userAlphaEmail,
            name: "User Alpha",
            passwordHash: "dummy_hash",
          },
          {
            id: userBetaId,
            email: userBetaEmail,
            name: "User Beta",
            passwordHash: "dummy_hash",
          },
        ],
      });
      createdUserAccountIds.add(userAlphaId);
      createdUserAccountIds.add(userBetaId);
    });

    afterAll(async () => {
      if (db) {
        // Exact ID teardown - cascade safe order:
        if (createdJobAdIds.size > 0) {
          const jobIds = Array.from(createdJobAdIds);
          await db.jobAdSource.deleteMany({ where: { jobId: { in: jobIds } } });
          await db.application.deleteMany({ where: { jobId: { in: jobIds } } });
          await db.jobAd.deleteMany({ where: { id: { in: jobIds } } });
        }
        if (createdUserAccountIds.size > 0) {
          const userIds = Array.from(createdUserAccountIds);
          await db.userAccount.deleteMany({ where: { id: { in: userIds } } });
        }
        await db.$disconnect();
      }
    });

    it("Test A — Same source repeated ingestion produces 1 JobAd", async () => {
      const payload = {
        externalId: `p5_test_jobtech_101_${runId}`,
        title: `Senior Fullstack Engineer ${runId}`,
        company: `Phase5 TestCorp ${runId}`,
        location: "Stockholm",
        description: "Build reactive web platforms",
        webpageUrl: `https://arbetsformedlingen.se/platsbanken/annonser/101_${runId}`,
        source: "Arbetsförmedlingen JobTech",
        publishedAt: new Date(),
      };
      const res1 = await resolveCanonicalJob(db, payload);
      if (res1.isNew && res1.job?.id) {
        createdJobAdIds.add(res1.job.id);
      }
      const res2 = await resolveCanonicalJob(db, payload);

      expect(res1.isNew).toBe(true);
      expect(res2.isNew).toBe(false);
      expect(res1.job.id).toBe(res2.job.id);
    });

    it("Test B — Cross-source identity (JobTech + LinkedIn) merges into 1 canonical JobAd with merged provenance", async () => {
      const basePayload = {
        title: `Cloud Infrastructure Architect ${runId}`,
        company: `Phase5 TestCorp ${runId}`,
        location: "Gothenburg",
        description: "AWS Terraform Kubernetes platform",
        publishedAt: new Date(),
      };
      const resJobTech = await resolveCanonicalJob(db, {
        ...basePayload,
        externalId: `p5_jt_202_${runId}`,
        webpageUrl: `https://arbetsformedlingen.se/platsbanken/annonser/202_${runId}`,
        source: "Arbetsförmedlingen JobTech",
      });
      if (resJobTech.isNew && resJobTech.job?.id) {
        createdJobAdIds.add(resJobTech.job.id);
      }

      const resLinkedIn = await resolveCanonicalJob(db, {
        ...basePayload,
        externalId: `li_p5_202_${runId}`,
        webpageUrl: `https://linkedin.com/jobs/view/999202_${runId}`,
        source: "LinkedIn Jobs",
      });

      expect(resJobTech.isNew).toBe(true);
      expect(resLinkedIn.isNew).toBe(false);
      expect(resLinkedIn.job.id).toBe(resJobTech.job.id);
      expect(resLinkedIn.job.source).toContain("Arbetsförmedlingen JobTech");
      expect(resLinkedIn.job.source).toContain("LinkedIn Jobs");
    });

    it("Test C — URL import of existing scraped vacancy resolves to 1 canonical JobAd", async () => {
      const resScraped = await resolveCanonicalJob(db, {
        externalId: `p5_scraped_303_${runId}`,
        title: `Systems Validation Engineer ${runId}`,
        company: `Scania AB Test ${runId}`,
        location: "Södertälje",
        description: "Embedded automotive validation",
        webpageUrl: `https://scania.com/careers/jobs/303_${runId}`,
        source: "Scania Career Portal",
        publishedAt: new Date(),
      });
      if (resScraped.isNew && resScraped.job?.id) {
        createdJobAdIds.add(resScraped.job.id);
      }

      const resImported = await resolveCanonicalJob(db, {
        externalId: `imported_303_${runId}`,
        title: `Systems Validation Engineer ${runId}`,
        company: `Scania AB Test ${runId}`,
        location: "Södertälje",
        description: "Embedded automotive validation",
        webpageUrl: `https://www.scania.com/careers/jobs/303_${runId}?utm_source=linkedin`,
        source: "Direct Import",
        publishedAt: new Date(),
        userAccountId: userAlphaId,
      });

      expect(resScraped.isNew).toBe(true);
      expect(resImported.isNew).toBe(false);
      expect(resImported.job.id).toBe(resScraped.job.id);
    });

    it("Test E — Global/user collision exposes 1 canonical vacancy prioritizing user ownership", async () => {
      const resGlobal = await resolveCanonicalJob(db, {
        externalId: `p5_global_505_${runId}`,
        title: `Lead DevOps Engineer ${runId}`,
        company: `Volvo Cars Test ${runId}`,
        location: "Stockholm",
        description: "CI/CD Docker Kubernetes pipelines",
        webpageUrl: `https://volvocars.com/careers/job/505_${runId}`,
        source: "JobTech Platsbanken",
        publishedAt: new Date(),
        userAccountId: null,
      });
      if (resGlobal.isNew && resGlobal.job?.id) {
        createdJobAdIds.add(resGlobal.job.id);
      }

      const resUser = await resolveCanonicalJob(db, {
        externalId: `p5_global_505_${runId}`,
        title: `Lead DevOps Engineer ${runId}`,
        company: `Volvo Cars Test ${runId}`,
        location: "Stockholm",
        description: "CI/CD Docker Kubernetes pipelines",
        webpageUrl: `https://volvocars.com/careers/job/505_${runId}`,
        source: "JobTech Platsbanken",
        publishedAt: new Date(),
        userAccountId: userBetaId,
        status: "SAVED",
      });

      expect(resGlobal.isNew).toBe(true);
      expect(resUser.job.id).toBe(resGlobal.job.id);
      expect(resUser.job.userAccountId).toBe(userBetaId);
    });

    it("Test G — Idempotency: N ingestions produce 1 canonical JobAd", async () => {
      const results = [];
      for (let i = 0; i < 5; i++) {
        const res = await resolveCanonicalJob(db, {
          externalId: `p5_idempotent_707_${runId}`,
          title: `Principal QA Engineer ${runId}`,
          company: `Phase5 TestCorp ${runId}`,
          location: "Malmö",
          description: "Test automation framework Lead",
          webpageUrl: `https://phase5.test/jobs/707_${runId}`,
          source: "Phase5 Jobs",
          publishedAt: new Date(),
        });
        if (i === 0 && res.isNew && res.job?.id) {
          createdJobAdIds.add(res.job.id);
        }
        results.push(res);
      }

      const uniqueIds = new Set(results.map((r) => r.job.id));
      expect(uniqueIds.size).toBe(1);
      expect(results[0].isNew).toBe(true);
      expect(results[1].isNew).toBe(false);
    });

    it("Test H — Concurrent initial ingestion of nonexistent canonical vacancy produces exactly 1 JobAd", async () => {
      const base = {
        title: `Staff Security Architect ${runId}`,
        company: `Phase5 TestCorp ${runId}`,
        location: "Stockholm",
        description: "AppSec and cloud security architecture",
        publishedAt: new Date(),
      };
      const payloadA = {
        ...base,
        externalId: `p5_concurrent_jt_909_${runId}`,
        webpageUrl: `https://arbetsformedlingen.se/platsbanken/annonser/909_${runId}`,
        source: "Arbetsförmedlingen JobTech",
      };
      const payloadB = {
        ...base,
        externalId: `p5_concurrent_li_909_${runId}`,
        webpageUrl: `https://linkedin.com/jobs/view/909909_${runId}`,
        source: "LinkedIn Jobs",
      };

      const [resA, resB] = await Promise.all([
        resolveCanonicalJob(db, payloadA),
        resolveCanonicalJob(db, payloadB),
      ]);

      const createdRes = resA.isNew ? resA : resB;
      if (createdRes.isNew && createdRes.job?.id) {
        createdJobAdIds.add(createdRes.job.id);
      }

      const newCount = [resA.isNew, resB.isNew].filter(Boolean).length;
      expect(newCount).toBe(1);
      expect(resA.job.id).toBe(resB.job.id);
      expect(resA.job.canonicalHash).toBe(resB.job.canonicalHash);

      const dbRecords = await db.jobAd.findMany({
        where: { canonicalHash: resA.job.canonicalHash },
      });
      expect(dbRecords.length).toBe(1);
    });
  }
);
