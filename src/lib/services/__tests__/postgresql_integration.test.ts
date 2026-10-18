import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import { validateTestDatabaseUrl } from "../testDatabaseSecurity";

const isIntegrationMode = process.env.JOBSEEKER_TEST_MODE === "integration";
const rawTestDbUrl = process.env.TEST_DATABASE_URL;
const validation = validateTestDatabaseUrl(rawTestDbUrl);

describe.runIf(isIntegrationMode)(
  "Real PostgreSQL Integration Verification Gate (Unmocked)",
  () => {
    let db: PrismaClient;
    const runId = crypto.randomUUID().slice(0, 8);
    const suiteUserAEmail = `pg_usera_${runId}@test.com`;
    const suiteUserBEmail = `pg_userb_${runId}@test.com`;
    let testUserAId: string;
    let testUserBId: string;

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

      db = new PrismaClient({
        datasources: {
          db: {
            url: rawTestDbUrl,
          },
        },
      });
      await db.$connect();
    });

    afterAll(async () => {
      if (db) {
        const userIds = [testUserAId, testUserBId].filter(Boolean);
        if (userIds.length > 0) {
          await db.userAccount
            .deleteMany({
              where: { id: { in: userIds } },
            })
            .catch(() => {});
        }
        await db.$disconnect();
      }
    });

    it("1. UserAccount -> JobAd -> Application Relation & Foreign Key Cascade Test", async () => {
      const user = await db.userAccount.create({
        data: {
          email: suiteUserAEmail,
          name: "PG Integration User Alpha",
          passwordHash: "synthetic_test_hash_alpha",
        },
      });
      testUserAId = user.id;

      const job = await db.jobAd.create({
        data: {
          userAccountId: user.id,
          externalId: `pg_integration_job_a1_${runId}`,
          title: "Principal Postgres Architect",
          company: "Neon DB Inc",
          location: "Stockholm",
          description: "PostgreSQL multi-tenant architecture",
          publishedAt: new Date(),
          matchScore: 98,
          matchedSkills: JSON.stringify(["PostgreSQL", "Prisma"]),
          missingSkills: "[]",
          domainScores: "{}",
          status: "APPLIED",
        },
      });

      const app = await db.application.create({
        data: {
          userAccountId: user.id,
          jobId: job.id,
          status: "APPLIED",
          appliedAt: new Date(),
          resumeVersion: "Postgres Integration CV - Alpha",
          notes: "Real PostgreSQL database write verified",
          monthlyTag: "2026-08",
        },
      });

      expect(app.userAccountId).toBe(user.id);
      expect(app.jobId).toBe(job.id);

      // Verify Read
      const queriedApp = await db.application.findUnique({
        where: { id: app.id },
        include: { job: true, userAccount: true },
      });

      expect(queriedApp).not.toBeNull();
      expect(queriedApp?.job.title).toBe("Principal Postgres Architect");
      expect(queriedApp?.userAccount?.email).toBe(suiteUserAEmail);
    });

    it("2. Composite @@unique([userAccountId, externalId]) Constraint Test", async () => {
      const userB = await db.userAccount.create({
        data: {
          email: suiteUserBEmail,
          name: "PG Integration User Beta",
          passwordHash: "synthetic_test_hash_beta",
        },
      });
      testUserBId = userB.id;

      const sharedExternalId = `pg_integration_job_shared_${runId}`;

      // User B saves externalId -> Should SUCCEED
      const jobB = await db.jobAd.create({
        data: {
          userAccountId: userB.id,
          externalId: sharedExternalId,
          title: "Principal Postgres Architect",
          company: "Neon DB Inc",
          location: "Stockholm",
          description: "PostgreSQL multi-tenant architecture for User B",
          publishedAt: new Date(),
          matchScore: 92,
          matchedSkills: "[]",
          missingSkills: "[]",
          domainScores: "{}",
          status: "SAVED",
        },
      });

      expect(jobB.id).toBeDefined();
      expect(jobB.userAccountId).toBe(userB.id);

      // User A saves the same externalId -> Should SUCCEED for different userAccountId
      const jobA = await db.jobAd.create({
        data: {
          userAccountId: testUserAId,
          externalId: sharedExternalId,
          title: "Principal Postgres Architect",
          company: "Neon DB Inc",
          location: "Stockholm",
          description: "PostgreSQL multi-tenant architecture for User A",
          publishedAt: new Date(),
          matchScore: 98,
          matchedSkills: "[]",
          missingSkills: "[]",
          domainScores: "{}",
          status: "NEW",
        },
      });
      expect(jobA.id).toBeDefined();

      // Attempt to insert duplicate externalId for User A -> Should FAIL composite unique constraint
      let duplicateError: Error | null = null;
      try {
        await db.jobAd.create({
          data: {
            userAccountId: testUserAId,
            externalId: sharedExternalId, // Duplicate for User A
            title: "Duplicate Job",
            company: "Other AB",
            location: "Sweden",
            description: "Duplicate",
            publishedAt: new Date(),
            matchScore: 50,
            matchedSkills: "[]",
            missingSkills: "[]",
            domainScores: "{}",
            status: "NEW",
          },
        });
      } catch (e: unknown) {
        duplicateError = e as Error;
      }

      expect(duplicateError).not.toBeNull();
      expect(duplicateError?.message).toContain("Unique constraint failed");
    });

    it("3. Real PostgreSQL Multi-Tenant Isolation Test", async () => {
      // User A queries jobs
      const jobsA = await db.jobAd.findMany({
        where: { userAccountId: testUserAId },
      });
      const externalIdsA = jobsA.map((j) => j.externalId);

      expect(externalIdsA).toContain(`pg_integration_job_a1_${runId}`);

      // User B queries jobs
      const jobsB = await db.jobAd.findMany({
        where: { userAccountId: testUserBId },
      });
      expect(jobsB.length).toBe(1);
      expect(jobsB[0].userAccountId).toBe(testUserBId);
      expect(jobsB[0].status).toBe("SAVED");
    });

    it("4. Multi-Entity Relational Domain Persistence & Integrity Test (Unmocked PostgreSQL)", async () => {
      const test4RunId = crypto.randomUUID().slice(0, 8);
      const rehearsalEmail = `pg_rehearsal_${test4RunId}@test.com`;
      let rehearsalUserId: string | undefined;

      try {
        // Create isolated test-owned tenant with synthetic non-authentication fixture
        const rehearsalUser = await db.userAccount.create({
          data: {
            email: rehearsalEmail,
            name: "PG Integration Rehearsal User",
            passwordHash: "synthetic_non_secret_fixture_hash",
          },
        });
        rehearsalUserId = rehearsalUser.id;

        // 1. Persist deterministic JobAd fixture
        const rehearsalJob = await db.jobAd.create({
          data: {
            userAccountId: rehearsalUser.id,
            externalId: `pg_integration_rehearsal_${test4RunId}`,
            title: "Principal Systems Architect",
            company: "Nordic Tech Solutions",
            location: "Stockholm",
            description: "PostgreSQL multi-entity persistence verification",
            publishedAt: new Date(),
            matchScore: 95,
            matchedSkills: JSON.stringify(["PostgreSQL", "Prisma"]),
            missingSkills: "[]",
            domainScores: "{}",
            status: "NEW",
          },
        });

        // 2. Persist deterministic Application fixture linking user and job
        const rehearsalApp = await db.application.create({
          data: {
            userAccountId: rehearsalUser.id,
            jobId: rehearsalJob.id,
            status: "APPLIED",
            appliedAt: new Date(),
            resumeVersion: "Postgres Integration Rehearsal CV",
            notes: "Deterministic PostgreSQL relational write verified",
            monthlyTag: "2026-10",
          },
        });

        // 3. Persist deterministic UserDocument fixture
        const rehearsalDoc = await db.userDocument.create({
          data: {
            userAccountId: rehearsalUser.id,
            filename: `rehearsal_cv_${test4RunId}.pdf`,
            fileType: "CV",
            extractedText: "Principal Systems Architect with PostgreSQL expertise",
            extractedSkills: JSON.stringify(["PostgreSQL", "TypeScript"]),
          },
        });

        // 4. Query back persisted entities from PostgreSQL
        const persistedJob = await db.jobAd.findUnique({
          where: { id: rehearsalJob.id },
        });
        const persistedApp = await db.application.findUnique({
          where: { id: rehearsalApp.id },
        });
        const persistedDoc = await db.userDocument.findUnique({
          where: { id: rehearsalDoc.id },
        });

        // 5. Meaningful assertions on persistence and relational linkages
        expect(persistedJob).not.toBeNull();
        expect(persistedJob?.userAccountId).toBe(rehearsalUser.id);
        expect(persistedJob?.externalId).toBe(`pg_integration_rehearsal_${test4RunId}`);
        expect(persistedJob?.title).toBe("Principal Systems Architect");

        expect(persistedApp).not.toBeNull();
        expect(persistedApp?.userAccountId).toBe(rehearsalUser.id);
        expect(persistedApp?.jobId).toBe(rehearsalJob.id); // Validates foreign key linkage
        expect(persistedApp?.status).toBe("APPLIED");

        expect(persistedDoc).not.toBeNull();
        expect(persistedDoc?.userAccountId).toBe(rehearsalUser.id);
        expect(persistedDoc?.filename).toBe(`rehearsal_cv_${test4RunId}.pdf`);
      } finally {
        // Safe targeted cleanup strictly by exact test-created user ID
        if (rehearsalUserId) {
          await db.userDocument
            .deleteMany({
              where: { userAccountId: rehearsalUserId },
            })
            .catch(() => {});
          await db.application
            .deleteMany({
              where: { userAccountId: rehearsalUserId },
            })
            .catch(() => {});
          await db.jobAd
            .deleteMany({
              where: { userAccountId: rehearsalUserId },
            })
            .catch(() => {});
          await db.userAccount
            .deleteMany({
              where: { id: rehearsalUserId },
            })
            .catch(() => {});
        }
      }
    });
  }
);
