import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import crypto from "node:crypto";
import {
  generateRawToken,
  hashToken,
  createDatabaseSession,
  isValidTokenFormat,
} from "../../sessionService";
import { getAuthenticatedUser } from "../../authHelper";
import { validateTestDatabaseUrl } from "../testDatabaseSecurity";

const isIntegrationMode = process.env.JOBSEEKER_TEST_MODE === "integration";
const rawTestDbUrl = process.env.TEST_DATABASE_URL;
const validation = validateTestDatabaseUrl(rawTestDbUrl);

describe.runIf(isIntegrationMode)("Real PostgreSQL UserSession Integration Suite (Unmocked)", () => {
  let db: PrismaClient;
  const runId = crypto.randomUUID().slice(0, 8);
  const userAEmail = `pg_sess_usera_${runId}@test.com`;
  const userBEmail = `pg_sess_userb_${runId}@test.com`;
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

    // Clean up any stale test records from previous runs
    await db.userSession.deleteMany({
      where: {
        userAccount: {
          email: { in: [userAEmail, userBEmail] },
        },
      },
    });
    await db.userAccount.deleteMany({
      where: { email: { in: [userAEmail, userBEmail] } },
    });
  });

  afterAll(async () => {
    if (db) {
      await db.userSession.deleteMany({
        where: {
          userAccount: {
            email: { in: [userAEmail, userBEmail] },
          },
        },
      });
      await db.userAccount.deleteMany({
        where: { email: { in: [userAEmail, userBEmail] } },
      });
      await db.$disconnect();
    }
  });

  beforeEach(async () => {
    // Reset test user accounts and sessions before each test
    await db.userSession.deleteMany({
      where: {
        userAccount: {
          email: { in: [userAEmail, userBEmail] },
        },
      },
    });
    await db.userAccount.deleteMany({
      where: { email: { in: [userAEmail, userBEmail] } },
    });

    const userA = await db.userAccount.create({
      data: {
        email: userAEmail,
        name: "PG Session User Alpha",
        passwordHash: "hash_pg_sess_a",
      },
    });
    testUserAId = userA.id;

    const userB = await db.userAccount.create({
      data: {
        email: userBEmail,
        name: "PG Session User Beta",
        passwordHash: "hash_pg_sess_b",
      },
    });
    testUserBId = userB.id;
  });

  describe("A. Session Issuance and Persistence", () => {
    it("generates 256-bit hex raw token and stores SHA-256 hash in PostgreSQL without raw token", async () => {
      const { rawToken, expiresAt } = await createDatabaseSession(db, testUserAId, true);

      expect(rawToken).toHaveLength(64);
      expect(isValidTokenFormat(rawToken)).toBe(true);

      const computedHash = hashToken(rawToken);

      const sessionRecord = await db.userSession.findUnique({
        where: { sessionTokenHash: computedHash },
      });

      expect(sessionRecord).not.toBeNull();
      expect(sessionRecord?.sessionTokenHash).toBe(computedHash);
      expect(sessionRecord?.userAccountId).toBe(testUserAId);
      expect(sessionRecord?.expiresAt.getTime()).toBeCloseTo(expiresAt.getTime(), -3);

      // Verify raw token itself is NOT stored in database
      const allSessions = await db.userSession.findMany({
        where: { userAccountId: testUserAId },
      });
      for (const sess of allSessions) {
        expect(sess.sessionTokenHash).not.toBe(rawToken);
      }
    });
  });

  describe("B. Real Authentication Helper Validation", () => {
    it("authenticates valid active session and returns correct account from PostgreSQL", async () => {
      const { rawToken } = await createDatabaseSession(db, testUserAId, true);

      const req = new NextRequest("http://localhost:3000/api/profile", {
        headers: { cookie: `jobseeker_session=${rawToken}` },
      });

      const user = await getAuthenticatedUser(req);
      expect(user).not.toBeNull();
      expect(user?.id).toBe(testUserAId);
      expect(user?.email).toBe(userAEmail);
    });

    it("rejects unknown but correctly formatted 64-char hex token", async () => {
      const unknownToken = "f".repeat(64);
      const req = new NextRequest("http://localhost:3000/api/profile", {
        headers: { cookie: `jobseeker_session=${unknownToken}` },
      });

      const user = await getAuthenticatedUser(req);
      expect(user).toBeNull();
    });

    it("rejects malformed token format before database query", async () => {
      const malformedToken = "invalid-token-format";
      const req = new NextRequest("http://localhost:3000/api/profile", {
        headers: { cookie: `jobseeker_session=${malformedToken}` },
      });

      const user = await getAuthenticatedUser(req);
      expect(user).toBeNull();
    });

    it("rejects duplicate or ambiguous jobseeker_session cookies", async () => {
      const { rawToken: tokenA } = await createDatabaseSession(db, testUserAId, true);
      const { rawToken: tokenB } = await createDatabaseSession(db, testUserBId, true);

      const req = new NextRequest("http://localhost:3000/api/profile", {
        headers: {
          cookie: `jobseeker_session=${tokenA}; jobseeker_session=${tokenB}`,
        },
      });

      const user = await getAuthenticatedUser(req);
      expect(user).toBeNull();
    });

    it("rejects expired session based on expiresAt <= now boundary in PostgreSQL", async () => {
      const rawToken = generateRawToken();
      const sessionTokenHash = hashToken(rawToken);
      const expiredDate = new Date(Date.now() - 1000); // 1 second in past

      await db.userSession.create({
        data: {
          sessionTokenHash,
          userAccountId: testUserAId,
          expiresAt: expiredDate,
        },
      });

      const req = new NextRequest("http://localhost:3000/api/profile", {
        headers: { cookie: `jobseeker_session=${rawToken}` },
      });

      const user = await getAuthenticatedUser(req);
      expect(user).toBeNull();
    });

    it("ensures User A token never authenticates as User B", async () => {
      const { rawToken: tokenA } = await createDatabaseSession(db, testUserAId, true);

      const req = new NextRequest("http://localhost:3000/api/profile", {
        headers: { cookie: `jobseeker_session=${tokenA}` },
      });

      const user = await getAuthenticatedUser(req);
      expect(user?.id).toBe(testUserAId);
      expect(user?.id).not.toBe(testUserBId);
    });
  });

  describe("C. Revocation and Account Isolation", () => {
    it("deleting specific session prevents subsequent authentication", async () => {
      const { rawToken } = await createDatabaseSession(db, testUserAId, true);
      const sessionTokenHash = hashToken(rawToken);

      const reqBefore = new NextRequest("http://localhost:3000/api/profile", {
        headers: { cookie: `jobseeker_session=${rawToken}` },
      });
      expect(await getAuthenticatedUser(reqBefore)).not.toBeNull();

      await db.userSession.deleteMany({ where: { sessionTokenHash } });

      const reqAfter = new NextRequest("http://localhost:3000/api/profile", {
        headers: { cookie: `jobseeker_session=${rawToken}` },
      });
      expect(await getAuthenticatedUser(reqAfter)).toBeNull();
    });

    it("revoking User A sessions in transaction does not affect User B sessions", async () => {
      const { rawToken: tokenA } = await createDatabaseSession(db, testUserAId, true);
      const { rawToken: tokenB } = await createDatabaseSession(db, testUserBId, true);

      // Password-reset revocation pattern executed in Prisma transaction
      await db.$transaction(async (tx) => {
        await tx.userAccount.update({
          where: { id: testUserAId },
          data: { passwordHash: "new_hash_a" },
        });
        await tx.userSession.deleteMany({
          where: { userAccountId: testUserAId },
        });
      });

      const reqA = new NextRequest("http://localhost:3000/api/profile", {
        headers: { cookie: `jobseeker_session=${tokenA}` },
      });
      const reqB = new NextRequest("http://localhost:3000/api/profile", {
        headers: { cookie: `jobseeker_session=${tokenB}` },
      });

      expect(await getAuthenticatedUser(reqA)).toBeNull();
      expect(await getAuthenticatedUser(reqB)).not.toBeNull();
    });
  });

  describe("D. PostgreSQL Database Constraints", () => {
    it("enforces unique constraint on sessionTokenHash in PostgreSQL", async () => {
      const rawToken = generateRawToken();
      const sessionTokenHash = hashToken(rawToken);

      await db.userSession.create({
        data: {
          sessionTokenHash,
          userAccountId: testUserAId,
          expiresAt: new Date(Date.now() + 86400000),
        },
      });

      let duplicateError: Error | null = null;
      try {
        await db.userSession.create({
          data: {
            sessionTokenHash, // Duplicate hash
            userAccountId: testUserBId,
            expiresAt: new Date(Date.now() + 86400000),
          },
        });
      } catch (e: any) {
        duplicateError = e;
      }

      expect(duplicateError).not.toBeNull();
      expect(duplicateError?.message).toMatch(/Unique constraint failed/i);
    });

    it("enforces foreign key cascade deletion on UserAccount -> UserSession in PostgreSQL", async () => {
      const { rawToken } = await createDatabaseSession(db, testUserAId, true);
      const sessionTokenHash = hashToken(rawToken);

      // Delete UserAccount record
      await db.userAccount.delete({ where: { id: testUserAId } });

      // Verify UserSession was cascade-deleted by PostgreSQL
      const sessionRecord = await db.userSession.findUnique({
        where: { sessionTokenHash },
      });
      expect(sessionRecord).toBeNull();
    });
  });
});
