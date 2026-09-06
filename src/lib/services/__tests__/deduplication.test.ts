import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { resolveCanonicalJob, normalizeUrl, computeCanonicalHash } from "../identity";

const testDbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const isPostgresUrl = Boolean(testDbUrl && (testDbUrl.startsWith("postgresql://") || testDbUrl.startsWith("postgres://")));

describe("Phase 5 Identity & Tracking Normalization Unit Suite", () => {
  it("Test D — Tracking URLs normalize to identical canonicalUrl and identity", () => {
    const urlA = "https://www.volvocars.com/careers/job/404?utm_source=google&gclid=999&trackingId=abc";
    const urlB = "https://volvocars.com/careers/job/404/";
    const normA = normalizeUrl(urlA);
    const normB = normalizeUrl(urlB);
    expect(normA).toBe("https://volvocars.com/careers/job/404");
    expect(normA).toBe(normB);
  });

  it("Test F — Similar but different vacancies MUST NOT incorrectly merge", () => {
    const hashA = computeCanonicalHash("Volvo Cars Test", "Embedded Control Developer", "Gothenburg");
    const hashB = computeCanonicalHash("Volvo Cars Test", "Frontend Web Developer", "Gothenburg");
    expect(hashA).not.toBe(hashB);
  });
});

describe.runIf(isPostgresUrl)("Phase 5 Canonical Job Identity & Deduplication Integration Suite (PostgreSQL Unmocked)", () => {
  let db: PrismaClient;

  beforeAll(async () => {
    db = new PrismaClient({ datasources: { db: { url: testDbUrl } } });
    await db.$connect();
    await db.application.deleteMany({ where: { notes: { contains: "Phase 5 Test" } } });
    await db.jobAd.deleteMany({ where: { company: { in: ["Phase5 TestCorp", "Scania AB Test", "Volvo Cars Test"] } } });
  });

  afterAll(async () => {
    if (db) {
      await db.application.deleteMany({ where: { notes: { contains: "Phase 5 Test" } } });
      await db.jobAd.deleteMany({ where: { company: { in: ["Phase5 TestCorp", "Scania AB Test", "Volvo Cars Test"] } } });
      await db.$disconnect();
    }
  });

  it("Test A — Same source repeated ingestion produces 1 JobAd", async () => {
    const payload = {
      externalId: "p5_test_jobtech_101",
      title: "Senior Fullstack Engineer",
      company: "Phase5 TestCorp",
      location: "Stockholm",
      description: "Build reactive web platforms",
      webpageUrl: "https://arbetsformedlingen.se/platsbanken/annonser/101",
      source: "Arbetsförmedlingen JobTech",
      publishedAt: new Date(),
    };
    const res1 = await resolveCanonicalJob(db, payload);
    const res2 = await resolveCanonicalJob(db, payload);

    expect(res1.isNew).toBe(true);
    expect(res2.isNew).toBe(false);
    expect(res1.job.id).toBe(res2.job.id);
  });

  it("Test B — Cross-source identity (JobTech + LinkedIn) merges into 1 canonical JobAd with merged provenance", async () => {
    const resJobTech = await resolveCanonicalJob(db, {
      externalId: "p5_jt_202",
      title: "Cloud Infrastructure Architect",
      company: "Phase5 TestCorp",
      location: "Gothenburg",
      description: "AWS Terraform Kubernetes platform",
      webpageUrl: "https://arbetsformedlingen.se/platsbanken/annonser/202",
      source: "Arbetsförmedlingen JobTech",
      publishedAt: new Date(),
    });

    const resLinkedIn = await resolveCanonicalJob(db, {
      externalId: "li_p5_202",
      title: "Cloud Infrastructure Architect",
      company: "Phase5 TestCorp",
      location: "Gothenburg",
      description: "AWS Terraform Kubernetes platform",
      webpageUrl: "https://linkedin.com/jobs/view/999202",
      source: "LinkedIn Jobs",
      publishedAt: new Date(),
    });

    expect(resLinkedIn.isNew).toBe(false);
    expect(resLinkedIn.job.id).toBe(resJobTech.job.id);
    expect(resLinkedIn.job.source).toContain("Arbetsförmedlingen JobTech");
    expect(resLinkedIn.job.source).toContain("LinkedIn Jobs");
  });

  it("Test C — URL import of existing scraped vacancy resolves to 1 canonical JobAd", async () => {
    const resScraped = await resolveCanonicalJob(db, {
      externalId: "p5_scraped_303",
      title: "Systems Validation Engineer",
      company: "Scania AB Test",
      location: "Södertälje",
      description: "Embedded automotive validation",
      webpageUrl: "https://scania.com/careers/jobs/303",
      source: "Scania Career Portal",
      publishedAt: new Date(),
    });

    const resImported = await resolveCanonicalJob(db, {
      externalId: "imported_303_xyz",
      title: "Systems Validation Engineer",
      company: "Scania AB Test",
      location: "Södertälje",
      description: "Embedded automotive validation",
      webpageUrl: "https://www.scania.com/careers/jobs/303?utm_source=linkedin",
      source: "Direct Import",
      publishedAt: new Date(),
      userAccountId: "p5_user_alpha",
    });

    expect(resImported.isNew).toBe(false);
    expect(resImported.job.id).toBe(resScraped.job.id);
  });

  it("Test E — Global/user collision exposes 1 canonical vacancy prioritizing user ownership", async () => {
    const resGlobal = await resolveCanonicalJob(db, {
      externalId: "p5_global_505",
      title: "Lead DevOps Engineer",
      company: "Volvo Cars Test",
      location: "Stockholm",
      description: "CI/CD Docker Kubernetes pipelines",
      webpageUrl: "https://volvocars.com/careers/job/505",
      source: "JobTech Platsbanken",
      publishedAt: new Date(),
      userAccountId: null,
    });

    const resUser = await resolveCanonicalJob(db, {
      externalId: "p5_global_505",
      title: "Lead DevOps Engineer",
      company: "Volvo Cars Test",
      location: "Stockholm",
      description: "CI/CD Docker Kubernetes pipelines",
      webpageUrl: "https://volvocars.com/careers/job/505",
      source: "JobTech Platsbanken",
      publishedAt: new Date(),
      userAccountId: "user_beta_999",
      status: "SAVED",
    });

    expect(resUser.job.id).toBe(resGlobal.job.id);
    expect(resUser.job.userAccountId).toBe("user_beta_999");
  });

  it("Test G — Idempotency: N ingestions produce 1 canonical JobAd", async () => {
    const results = [];
    for (let i = 0; i < 5; i++) {
      const res = await resolveCanonicalJob(db, {
        externalId: "p5_idempotent_707",
        title: "Principal QA Engineer",
        company: "Phase5 TestCorp",
        location: "Malmö",
        description: "Test automation framework Lead",
        webpageUrl: "https://phase5.test/jobs/707",
        source: "Phase5 Jobs",
        publishedAt: new Date(),
      });
      results.push(res);
    }

    const uniqueIds = new Set(results.map(r => r.job.id));
    expect(uniqueIds.size).toBe(1);
    expect(results[0].isNew).toBe(true);
    expect(results[1].isNew).toBe(false);
  });

  it("Test H — Concurrent initial ingestion of nonexistent canonical vacancy produces exactly 1 JobAd", async () => {
    const base = { title: "Staff Security Architect", company: "Phase5 TestCorp", location: "Stockholm", description: "AppSec and cloud security architecture", publishedAt: new Date() };
    const payloadA = { ...base, externalId: "p5_concurrent_jt_909", webpageUrl: "https://arbetsformedlingen.se/platsbanken/annonser/909", source: "Arbetsförmedlingen JobTech" };
    const payloadB = { ...base, externalId: "p5_concurrent_li_909", webpageUrl: "https://linkedin.com/jobs/view/909909", source: "LinkedIn Jobs" };

    const [resA, resB] = await Promise.all([resolveCanonicalJob(db, payloadA), resolveCanonicalJob(db, payloadB)]);

    const newCount = [resA.isNew, resB.isNew].filter(Boolean).length;
    expect(newCount).toBe(1);
    expect(resA.job.id).toBe(resB.job.id);
    expect(resA.job.canonicalHash).toBe(resB.job.canonicalHash);

    const dbRecords = await db.jobAd.findMany({ where: { canonicalHash: resA.job.canonicalHash } });
    expect(dbRecords.length).toBe(1);
  });
});
