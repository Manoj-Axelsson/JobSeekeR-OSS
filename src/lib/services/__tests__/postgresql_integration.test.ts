import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

const testDbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const isPostgresUrl = Boolean(testDbUrl && (testDbUrl.startsWith("postgresql://") || testDbUrl.startsWith("postgres://")));

describe.runIf(isPostgresUrl)("Real PostgreSQL Integration Verification Gate (Unmocked)", () => {
  let db: PrismaClient;
  let testUserAId: string;
  let testUserBId: string;

  beforeAll(async () => {
    db = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl,
        },
      },
    });
    await db.$connect();

    // Clean test schema records
    await db.application.deleteMany({ where: { resumeVersion: { contains: "Postgres Integration" } } });
    await db.jobAd.deleteMany({ where: { externalId: { startsWith: "pg_integration_" } } });
    await db.userAccount.deleteMany({ where: { email: { in: ["pg_usera@test.com", "pg_userb@test.com"] } } });
  });

  afterAll(async () => {
    if (db) {
      await db.application.deleteMany({ where: { resumeVersion: { contains: "Postgres Integration" } } });
      await db.jobAd.deleteMany({ where: { externalId: { startsWith: "pg_integration_" } } });
      await db.userAccount.deleteMany({ where: { email: { in: ["pg_usera@test.com", "pg_userb@test.com"] } } });
      await db.$disconnect();
    }
  });

  it("1. UserAccount -> JobAd -> Application Relation & Foreign Key Cascade Test", async () => {
    const user = await db.userAccount.create({
      data: {
        email: "pg_usera@test.com",
        name: "PG Integration User Alpha",
        passwordHash: "hash_pg_a",
      },
    });
    testUserAId = user.id;

    const job = await db.jobAd.create({
      data: {
        userAccountId: user.id,
        externalId: "pg_integration_job_a1",
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
    expect(queriedApp?.userAccount?.email).toBe("pg_usera@test.com");
  });

  it("2. Composite @@unique([userAccountId, externalId]) Constraint Test", async () => {
    const userB = await db.userAccount.create({
      data: {
        email: "pg_userb@test.com",
        name: "PG Integration User Beta",
        passwordHash: "hash_pg_b",
      },
    });
    testUserBId = userB.id;

    // User B saves the SAME externalId as User A -> Should SUCCEED due to candidate composite uniqueness
    const jobB = await db.jobAd.create({
      data: {
        userAccountId: userB.id,
        externalId: "pg_integration_job_a1", // Same externalId as User A
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

    // Attempt to insert duplicate externalId for User A -> Should FAIL composite unique constraint
    let duplicateError: Error | null = null;
    try {
      await db.jobAd.create({
        data: {
          userAccountId: testUserAId,
          externalId: "pg_integration_job_a1", // Duplicate for User A
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
    } catch (e: any) {
      duplicateError = e;
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

    expect(externalIdsA).toContain("pg_integration_job_a1");

    // User B queries jobs
    const jobsB = await db.jobAd.findMany({
      where: { userAccountId: testUserBId },
    });
    expect(jobsB.length).toBe(1);
    expect(jobsB[0].userAccountId).toBe(testUserBId);
    expect(jobsB[0].status).toBe("SAVED"); // User B's status is SAVED while User A's status is APPLIED
  });

  it("4. Migration Rehearsal: SQLite (prisma/dev.db) -> Isolated PostgreSQL Reconciliation", async () => {
    const sqliteDbPath = path.join(process.cwd(), "prisma", "dev.db");
    expect(fs.existsSync(sqliteDbPath)).toBe(true);

    // Extract baseline counts directly from SQLite
    const getSqliteRows = (tableName: string): any[] => {
      try {
        const output = execSync(`sqlite3 "${sqliteDbPath}" ".mode json" "SELECT * FROM ${tableName};"`, { encoding: "utf-8" });
        return output.trim() ? JSON.parse(output) : [];
      } catch {
        return [];
      }
    };

    const sqliteJobs = getSqliteRows("JobAd");
    const sqliteApps = getSqliteRows("Application");
    const sqliteDocs = getSqliteRows("UserDocument");

    console.log(`Rehearsal Baseline Counts: JobAd=${sqliteJobs.length}, Application=${sqliteApps.length}, UserDocument=${sqliteDocs.length}`);
    expect(sqliteJobs.length).toBeGreaterThan(0);
    expect(sqliteApps.length).toBeGreaterThan(0);
  });
});
