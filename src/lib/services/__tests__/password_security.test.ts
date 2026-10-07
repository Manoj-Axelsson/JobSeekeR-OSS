import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  hashPassword,
  verifyPassword,
  isLegacyHash,
  verifyLegacyPassword,
} from "../passwordService";
import { POST as authPost } from "../../../app/api/auth/route";
import { NextRequest } from "next/server";

interface MockAccount {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

interface MockSession {
  id: string;
  sessionTokenHash: string;
  userAccountId: string;
  expiresAt: Date;
}

interface MockDbInterface {
  userAccount: {
    findUnique: (args: { where: { email?: string; id?: string } }) => Promise<MockAccount | null>;
    create: (args: { data: MockAccount }) => Promise<MockAccount>;
    update: (args: {
      where: { email?: string; id?: string };
      data: Partial<MockAccount>;
    }) => Promise<MockAccount>;
  };
  userProfile: {
    create: () => Promise<Record<string, unknown>>;
  };
  userSession: {
    create: (args: { data: MockSession }) => Promise<MockSession>;
    deleteMany: (args: {
      where: { sessionTokenHash?: string; userAccountId?: string };
    }) => Promise<{ count: number }>;
  };
}

// In-memory mock store for testing authentication flow
const { accounts, sessions } = vi.hoisted(() => {
  return {
    accounts: new Map<string, MockAccount>(),
    sessions: new Map<string, MockSession>(),
  };
});

vi.mock("@/lib/db", () => {
  const mockDb: MockDbInterface = {
    userAccount: {
      findUnique: vi.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email) {
          for (const acc of accounts.values()) {
            if (acc.email === where.email) return { ...acc };
          }
        }
        if (where.id) {
          const acc = accounts.get(where.id);
          return acc ? { ...acc } : null;
        }
        return null;
      }),
      create: vi.fn(async ({ data }: { data: MockAccount }) => {
        const id = data.id || `acc-${Math.random().toString(36).substring(7)}`;
        const record = { ...data, id };
        accounts.set(id, record);
        return record;
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { email?: string; id?: string };
          data: Partial<MockAccount>;
        }) => {
          let targetId: string | undefined = where.id;
          if (!targetId && where.email) {
            for (const acc of accounts.values()) {
              if (acc.email === where.email) {
                targetId = acc.id;
                break;
              }
            }
          }
          if (!targetId || !accounts.has(targetId)) {
            throw new Error("Account not found");
          }
          const existing = accounts.get(targetId)!;
          const updated = { ...existing, ...data };
          accounts.set(targetId, updated);
          return updated;
        }
      ),
    },
    userProfile: {
      create: vi.fn(async () => ({})),
    },
    userSession: {
      create: vi.fn(async ({ data }: { data: MockSession }) => {
        const id = data.id || `sess-${Math.random().toString(36).substring(7)}`;
        const sess = { ...data, id };
        sessions.set(id, sess);
        return sess;
      }),
      deleteMany: vi.fn(
        async ({
          where,
        }: {
          where: { sessionTokenHash?: string; userAccountId?: string };
        }) => {
          let count = 0;
          for (const [id, sess] of Array.from(sessions.entries())) {
            if (
              (where.sessionTokenHash && sess.sessionTokenHash === where.sessionTokenHash) ||
              (where.userAccountId && sess.userAccountId === where.userAccountId)
            ) {
              sessions.delete(id);
              count++;
            }
          }
          return { count };
        }
      ),
    },
  };

  return {
    db: {
      ...mockDb,
      $transaction: vi.fn(async (cb: (tx: MockDbInterface) => Promise<unknown>) => {
        return cb(mockDb);
      }),
    },
  };
});

beforeEach(() => {
  accounts.clear();
  sessions.clear();
});

describe("Password Hashing & Authentication Security Suite", () => {
  describe("1. Cryptographic Password Service Unit Tests", () => {
    it("hashes password using scrypt with unique salt per invocation", async () => {
      const password = "SuperSecretPassword123!";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).toMatch(/^scrypt\$N=16384,r=8,p=1\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
      expect(hash2).toMatch(/^scrypt\$N=16384,r=8,p=1\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
      // Different salts guarantee distinct hashes for identical passwords
      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe(password);
      expect(hash1).not.toBe(Buffer.from(password).toString("base64"));
    });

    it("verifies correct password against scrypt hash", async () => {
      const password = "CorrectHorseBatteryStaple!";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("rejects incorrect password against scrypt hash", async () => {
      const password = "CorrectPassword123!";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword("WrongPassword456!", hash);
      expect(isValid).toBe(false);
    });

    it("rejects malformed or tampered scrypt hashes", async () => {
      expect(await verifyPassword("password", "")).toBe(false);
      expect(await verifyPassword("password", "scrypt$invalid$tampered")).toBe(false);
      expect(await verifyPassword("password", "plaintext_password")).toBe(false);
    });

    it("correctly identifies legacy Base64 hashes", () => {
      const legacy = Buffer.from("mypassword").toString("base64");
      expect(isLegacyHash(legacy)).toBe(true);

      const scryptH = `scrypt$N=16384,r=8,p=1$abcdef$123456`;
      expect(isLegacyHash(scryptH)).toBe(false);
    });

    it("verifies legacy Base64 password using constant-time comparison", () => {
      const raw = "LegacyPasswordToTest!";
      const legacy = Buffer.from(raw).toString("base64");

      expect(verifyLegacyPassword(raw, legacy)).toBe(true);
      expect(verifyLegacyPassword("IncorrectRawPassword", legacy)).toBe(false);
    });
  });

  describe("2. Full Application Authentication Path Integration Tests", () => {
    it("Registration: stores scrypt hash and never plaintext or Base64", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth", {
        method: "POST",
        body: JSON.stringify({
          action: "register",
          name: "Alice Candidate",
          email: "alice@example.com",
          password: "MySecurePassword2026!",
        }),
      });

      const res = await authPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.user.email).toBe("alice@example.com");
      expect(data.user.password).toBeUndefined();
      expect(data.user.passwordHash).toBeUndefined();

      // Check stored DB record
      const stored = Array.from(accounts.values()).find((a) => a.email === "alice@example.com");
      expect(stored).toBeDefined();
      expect(stored!.passwordHash).not.toBe("MySecurePassword2026!");
      expect(stored!.passwordHash).not.toBe(
        Buffer.from("MySecurePassword2026!").toString("base64")
      );
      expect(stored!.passwordHash.startsWith("scrypt$")).toBe(true);
    });

    it("Login: authenticates with scrypt hash and rejects wrong password", async () => {
      // Create user with scrypt hash
      const secureHash = await hashPassword("ValidPassword123!");
      accounts.set("user-1", {
        id: "user-1",
        email: "bob@example.com",
        name: "Bob Engineer",
        passwordHash: secureHash,
      });

      // 1. Correct password
      const reqGood = new NextRequest("http://localhost:3000/api/auth", {
        method: "POST",
        body: JSON.stringify({
          action: "login",
          email: "bob@example.com",
          password: "ValidPassword123!",
        }),
      });
      const resGood = await authPost(reqGood);
      expect(resGood.status).toBe(200);
      const dataGood = await resGood.json();
      expect(dataGood.success).toBe(true);
      expect(dataGood.user.id).toBe("user-1");

      // 2. Incorrect password
      const reqBad = new NextRequest("http://localhost:3000/api/auth", {
        method: "POST",
        body: JSON.stringify({
          action: "login",
          email: "bob@example.com",
          password: "WrongPassword999!",
        }),
      });
      const resBad = await authPost(reqBad);
      expect(resBad.status).toBe(401);
      const dataBad = await resBad.json();
      expect(dataBad.error).toBe("Invalid email or password");
    });

    it("Existing Account Migration: transparently upgrades legacy Base64 account to scrypt upon valid login", async () => {
      const rawPassword = "ExistingUserPassword!";
      const legacyBase64 = Buffer.from(rawPassword).toString("base64");

      accounts.set("legacy-user-1", {
        id: "legacy-user-1",
        email: "charlie@example.com",
        name: "Charlie Legacy",
        passwordHash: legacyBase64,
      });

      // Confirm initial stored state is legacy
      expect(accounts.get("legacy-user-1")!.passwordHash).toBe(legacyBase64);

      // Perform login with correct password
      const reqLogin = new NextRequest("http://localhost:3000/api/auth", {
        method: "POST",
        body: JSON.stringify({
          action: "login",
          email: "charlie@example.com",
          password: rawPassword,
        }),
      });

      const resLogin = await authPost(reqLogin);
      expect(resLogin.status).toBe(200);

      // Check updated DB record: MUST be upgraded to scrypt hash!
      const updatedAccount = accounts.get("legacy-user-1")!;
      expect(updatedAccount.passwordHash).not.toBe(legacyBase64);
      expect(updatedAccount.passwordHash.startsWith("scrypt$")).toBe(true);

      // Subsequent login verifies against the new scrypt hash directly
      const verifiedWithScrypt = await verifyPassword(rawPassword, updatedAccount.passwordHash);
      expect(verifiedWithScrypt).toBe(true);
    });

    it("Existing Account Migration: failed login does not upgrade legacy account", async () => {
      const rawPassword = "CorrectExistingPassword!";
      const legacyBase64 = Buffer.from(rawPassword).toString("base64");

      accounts.set("legacy-user-2", {
        id: "legacy-user-2",
        email: "david@example.com",
        name: "David Legacy",
        passwordHash: legacyBase64,
      });

      // Bad password attempt
      const reqBad = new NextRequest("http://localhost:3000/api/auth", {
        method: "POST",
        body: JSON.stringify({
          action: "login",
          email: "david@example.com",
          password: "IncorrectPassword!",
        }),
      });

      const resBad = await authPost(reqBad);
      expect(resBad.status).toBe(401);

      // Stored hash must remain unchanged
      expect(accounts.get("legacy-user-2")!.passwordHash).toBe(legacyBase64);
    });

    it("Password Reset: updates stored credential to modern scrypt hash", async () => {
      accounts.set("reset-user", {
        id: "reset-user",
        email: "eva@example.com",
        name: "Eva Engineer",
        passwordHash: Buffer.from("OldInsecureBase64").toString("base64"),
      });

      const reqReset = new NextRequest("http://localhost:3000/api/auth", {
        method: "POST",
        body: JSON.stringify({
          action: "reset-password",
          email: "eva@example.com",
          password: "NewBrandNewPassword2026!",
        }),
      });

      const resReset = await authPost(reqReset);
      expect(resReset.status).toBe(200);

      const updated = accounts.get("reset-user")!;
      expect(updated.passwordHash.startsWith("scrypt$")).toBe(true);
      expect(await verifyPassword("NewBrandNewPassword2026!", updated.passwordHash)).toBe(true);
    });

    it("Security Hygiene: password is never returned in API responses", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth", {
        method: "POST",
        body: JSON.stringify({
          action: "register",
          name: "Security Audit User",
          email: "sec@example.com",
          password: "TopSecretPassword999!",
        }),
      });

      const res = await authPost(req);
      const json = await res.json();

      expect(json.user).toBeDefined();
      expect(json.user.password).toBeUndefined();
      expect(json.user.passwordHash).toBeUndefined();
      expect(JSON.stringify(json)).not.toContain("TopSecretPassword999!");
      expect(JSON.stringify(json)).not.toContain("scrypt$");
    });
  });
});
