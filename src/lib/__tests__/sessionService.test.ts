import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  generateRawToken,
  hashToken,
  isValidTokenFormat,
} from "../sessionService";
import { getAuthenticatedUser } from "../authHelper";
import { db } from "../db";

vi.mock("@/lib/db", () => ({
  db: {
    userSession: {
      findUnique: vi.fn(),
    },
  },
}));

describe("Database-Backed Session Service & Authentication Helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Token Generation and Hashing", () => {
    it("generates a 64-character hexadecimal raw token (256-bit entropy)", () => {
      const token = generateRawToken();
      expect(token).toHaveLength(64);
      expect(isValidTokenFormat(token)).toBe(true);
    });

    it("computes deterministic SHA-256 hash of raw token", () => {
      const rawToken = "a".repeat(64);
      const hash1 = hashToken(rawToken);
      const hash2 = hashToken(rawToken);

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(rawToken);
    });

    it("validates strict 64-character hex format", () => {
      expect(isValidTokenFormat("a".repeat(64))).toBe(true);
      expect(isValidTokenFormat("1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")).toBe(true);
      expect(isValidTokenFormat("short_token")).toBe(false);
      expect(isValidTokenFormat("g".repeat(64))).toBe(false); // 'g' is invalid hex
      expect(isValidTokenFormat("a".repeat(63))).toBe(false);
      expect(isValidTokenFormat("a".repeat(65))).toBe(false);
    });
  });

  describe("getAuthenticatedUser (Session Token Validation)", () => {
    const mockUser = {
      id: "usr_789",
      email: "engineer@example.com",
      name: "Senior Engineer",
      passwordHash: "hash",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("returns null immediately for malformed non-hex cookie token without querying DB", async () => {
      const req = new NextRequest("http://localhost:3000/api/jobs", {
        headers: {
          cookie: "jobseeker_session=invalid_malformed_string",
        },
      });

      const user = await getAuthenticatedUser(req);
      expect(user).toBeNull();
      expect(db.userSession.findUnique).not.toHaveBeenCalled();
    });

    it("returns null immediately when duplicate jobseeker_session cookies exist in header", async () => {
      const validToken = "a".repeat(64);
      const req = new NextRequest("http://localhost:3000/api/jobs", {
        headers: {
          cookie: `jobseeker_session=${validToken}; jobseeker_session=${validToken}`,
        },
      });

      const user = await getAuthenticatedUser(req);
      expect(user).toBeNull();
      expect(db.userSession.findUnique).not.toHaveBeenCalled();
    });

    it("validates active session and returns UserAccount when valid token exists in DB and expiresAt > now", async () => {
      const rawToken = "f".repeat(64);
      const tokenHash = hashToken(rawToken);
      const futureExpiry = new Date(Date.now() + 86400000); // +1 day

      vi.mocked(db.userSession.findUnique).mockResolvedValue({
        id: "sess_1",
        sessionTokenHash: tokenHash,
        userAccountId: mockUser.id,
        expiresAt: futureExpiry,
        createdAt: new Date(),
        updatedAt: new Date(),
        userAccount: mockUser,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/jobs", {
        headers: {
          cookie: `jobseeker_session=${rawToken}`,
        },
      });

      const user = await getAuthenticatedUser(req);
      expect(user).toEqual(mockUser);
      expect(db.userSession.findUnique).toHaveBeenCalledWith({
        where: { sessionTokenHash: tokenHash },
        include: { userAccount: true },
      });
    });

    it("returns null when session expiresAt <= now (inclusive boundary)", async () => {
      const rawToken = "e".repeat(64);
      const tokenHash = hashToken(rawToken);
      const pastExpiry = new Date(Date.now() - 1000); // Past

      vi.mocked(db.userSession.findUnique).mockResolvedValue({
        id: "sess_2",
        sessionTokenHash: tokenHash,
        userAccountId: mockUser.id,
        expiresAt: pastExpiry,
        createdAt: new Date(),
        updatedAt: new Date(),
        userAccount: mockUser,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/jobs", {
        headers: {
          cookie: `jobseeker_session=${rawToken}`,
        },
      });

      const user = await getAuthenticatedUser(req);
      expect(user).toBeNull();
    });

    it("returns null when session token hash is not found in database", async () => {
      const rawToken = "b".repeat(64);
      vi.mocked(db.userSession.findUnique).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/jobs", {
        headers: {
          cookie: `jobseeker_session=${rawToken}`,
        },
      });

      const user = await getAuthenticatedUser(req);
      expect(user).toBeNull();
    });
  });
});
