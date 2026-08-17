import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAuthenticatedUser } from "../../authHelper";
import { ensureV2ProfilesExist } from "../pipeline/seedV2";
import { GET as getProfile, PUT as putProfile } from "../../../app/api/profile/route";
import { GET as getDocs, POST as postDocs } from "../../../app/api/documents/upload/route";
import { POST as authAction } from "../../../app/api/auth/route";
import { NextRequest } from "next/server";

interface StoreRecord {
  id: string;
  userAccountId?: string | null;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

// Mock the db module with full support for account-scoped operations and userDocuments
vi.mock("../../db", () => {
  const store = {
    userAccount: new Map<string, StoreRecord>(),
    userProfile: new Map<string, StoreRecord>(),
    careerProfile: new Map<string, StoreRecord>(),
    searchProfile: new Map<string, StoreRecord>(),
    searchTerritory: new Map<string, StoreRecord>(),
    userDocument: new Map<string, StoreRecord>(),
  };

  return {
    db: {
      userAccount: {
        findUnique: vi.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
          if (where.email) {
            for (const user of store.userAccount.values()) {
              if (user.email === where.email) return user;
            }
          }
          if (where.id) return store.userAccount.get(where.id) || null;
          return null;
        }),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> & { id?: string } }) => {
          const id = data.id || `user-${Math.random()}`;
          const user = { ...data, id };
          store.userAccount.set(id, user as StoreRecord);
          return user;
        }),
      },
      userProfile: {
        findFirst: vi.fn(async () => {
          const values = Array.from(store.userProfile.values());
          return values[0] || null;
        }),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> & { id?: string } }) => {
          const id = data.id || "user_main";
          const profile = { ...data, id };
          store.userProfile.set(id, profile as StoreRecord);
          return profile;
        }),
        update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
          const profile = store.userProfile.get(where.id) || {};
          const updated = { ...profile, ...data };
          store.userProfile.set(where.id, updated as StoreRecord);
          return updated;
        }),
      },
      careerProfile: {
        findFirst: vi.fn(async ({ where }: { where: { id?: string; userAccountId?: string | null } }) => {
          for (const cp of store.careerProfile.values()) {
            if (where.id && cp.id !== where.id) continue;
            if (where.userAccountId !== undefined && cp.userAccountId !== where.userAccountId) continue;
            return cp;
          }
          return null;
        }),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> & { id?: string } }) => {
          const id = data.id || `cp-${Math.random()}`;
          const cp = { ...data, id };
          store.careerProfile.set(id, cp as StoreRecord);
          return cp;
        }),
        update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
          const cp = store.careerProfile.get(where.id);
          if (!cp) throw new Error("CareerProfile not found");
          const updated = { ...cp, ...data };
          store.careerProfile.set(where.id, updated as StoreRecord);
          return updated;
        }),
      },
      searchProfile: {
        findMany: vi.fn(async ({ where }: { where?: { userAccountId?: string | null; name?: { in: string[] } } } = {}) => {
          const results: StoreRecord[] = [];
          for (const sp of store.searchProfile.values()) {
            if (where?.userAccountId !== undefined && sp.userAccountId !== where.userAccountId) continue;
            if (where?.name?.in && sp.name && !where.name.in.includes(sp.name)) continue;
            results.push(sp);
          }
          return results;
        }),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> & { id?: string } }) => {
          const id = data.id || `sp-${Math.random()}`;
          const sp = { ...data, id };
          store.searchProfile.set(id, sp as StoreRecord);
          return sp;
        }),
        updateMany: vi.fn(async ({ where, data }: { where: { id?: { in: string[] } }; data: Record<string, unknown> }) => {
          let count = 0;
          for (const sp of store.searchProfile.values()) {
            if (where.id?.in && where.id.in.includes(sp.id)) {
              store.searchProfile.set(sp.id, { ...sp, ...data } as StoreRecord);
              count++;
            }
          }
          return { count };
        }),
      },
      searchTerritory: {
        findFirst: vi.fn(async () => {
          const values = Array.from(store.searchTerritory.values());
          return values[0] || null;
        }),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> & { id?: string } }) => {
          const id = data.id || `st-${Math.random()}`;
          const st = { ...data, id };
          store.searchTerritory.set(id, st as StoreRecord);
          return st;
        }),
      },
      userDocument: {
        findMany: vi.fn(async ({ where }: { where?: { userAccountId?: string | null } } = {}) => {
          const results: StoreRecord[] = [];
          for (const doc of store.userDocument.values()) {
            if (where?.userAccountId !== undefined && doc.userAccountId !== where.userAccountId) continue;
            results.push(doc);
          }
          return results;
        }),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> & { id?: string } }) => {
          const id = data.id || `doc-${Math.random()}`;
          const doc = { uploadedAt: new Date(), ...data, id };
          store.userDocument.set(id, doc as StoreRecord);
          return doc;
        }),
      },
      _store: store,
    },
  };
});

import { db } from "../../db";

describe("CONTROLLED V2 ACCOUNT-OWNERSHIP EDGE-CASE TEST MATRIX", () => {
  beforeEach(() => {
    // Reset in-memory store before each test
    const mockDb = db as unknown as { _store: Record<string, Map<string, StoreRecord>> };
    mockDb._store.userAccount.clear();
    mockDb._store.userProfile.clear();
    mockDb._store.careerProfile.clear();
    mockDb._store.searchProfile.clear();
    mockDb._store.searchTerritory.clear();
    mockDb._store.userDocument.clear();
  });

  // Helper to construct request with session cookie
  function createSessionReq(url: string, email: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("cookie", `jobseeker_session=${encodeURIComponent(JSON.stringify({ email }))}`);
    const { signal, ...restOptions } = options;
    return new NextRequest(url, {
      ...restOptions,
      signal: signal ?? undefined,
      headers,
    });
  }

  // Typed test helper for creating UserAccount with required fields
  async function createUserAccount(data: {
    id: string;
    email: string;
    name: string;
  }) {
    return db.userAccount.create({
      data: {
        ...data,
        passwordHash: "test-password",
      },
    });
  }

  // 🔴 P0 SECURITY & OWNERSHIP TESTS
  describe("🔴 P0 Security & Ownership Boundaries", () => {
    it("P0.1: User A cannot see User B's candidate data (Strict Isolation)", async () => {
      // User A (Software Engineer)
      await createUserAccount({ id: "user-a", email: "usera@example.com", name: "User A" });
      await db.careerProfile.create({
        data: {
          id: "cp-user-a",
          userAccountId: "user-a",
          headline: "Fullstack React Developer",
          skills: JSON.stringify(["React", "TypeScript", "Next.js"]),
        },
      });

      // User B (Industrial Engineer)
      await createUserAccount({ id: "user-b", email: "userb@example.com", name: "User B" });
      await db.careerProfile.create({
        data: {
          id: "cp-user-b",
          userAccountId: "user-b",
          headline: "PLC Automation Specialist",
          skills: JSON.stringify(["PLC", "Lean", "Manufacturing"]),
        },
      });

      // User A fetches profile
      const reqA = createSessionReq("http://localhost:3000/api/profile", "usera@example.com");
      const resA = await getProfile(reqA);
      const jsonA = await resA.json();

      expect(resA.status).toBe(200);
      expect(jsonA.v2.careerProfile.headline).toBe("Fullstack React Developer");
      expect(jsonA.v2.careerProfile.skills).toContain("React");
      expect(jsonA.v2.careerProfile.skills).not.toContain("PLC");

      // User B fetches profile
      const reqB = createSessionReq("http://localhost:3000/api/profile", "userb@example.com");
      const resB = await getProfile(reqB);
      const jsonB = await resB.json();

      expect(resB.status).toBe(200);
      expect(jsonB.v2.careerProfile.headline).toBe("PLC Automation Specialist");
      expect(jsonB.v2.careerProfile.skills).toContain("PLC");
      expect(jsonB.v2.careerProfile.skills).not.toContain("React");
    });

    it("P0.2: User A cannot modify User B's candidate data", async () => {
      await createUserAccount({ id: "user-a", email: "usera@example.com", name: "User A" });
      await db.careerProfile.create({ data: { id: "cp-user-a", userAccountId: "user-a", headline: "User A Headline" } });

      await createUserAccount({ id: "user-b", email: "userb@example.com", name: "User B" });
      await db.careerProfile.create({ data: { id: "cp-user-b", userAccountId: "user-b", headline: "User B Headline Original" } });

      // User A attempts PUT request
      const putReqA = createSessionReq("http://localhost:3000/api/profile", "usera@example.com", {
        method: "PUT",
        body: JSON.stringify({ headline: "User A Modified Headline" }),
      });
      await putProfile(putReqA);

      // Verify User A was modified
      const cpA = await db.careerProfile.findFirst({ where: { userAccountId: "user-a" } });
      expect(cpA?.headline).toBe("User A Modified Headline");

      // Verify User B remains completely unmodified
      const cpB = await db.careerProfile.findFirst({ where: { userAccountId: "user-b" } });
      expect(cpB?.headline).toBe("User B Headline Original");
    });

    it("P0.3: Client cannot supply another userAccountId (Prevents Ownership Spoofing)", async () => {
      await createUserAccount({ id: "user-a", email: "usera@example.com", name: "User A" });
      await db.careerProfile.create({ data: { id: "cp-user-a", userAccountId: "user-a", headline: "User A Original" } });

      await createUserAccount({ id: "user-b", email: "userb@example.com", name: "User B" });
      await db.careerProfile.create({ data: { id: "cp-user-b", userAccountId: "user-b", headline: "User B Original" } });

      // Malicious request claiming userAccountId = user-b
      const spoofReq = createSessionReq("http://localhost:3000/api/profile", "usera@example.com", {
        method: "PUT",
        body: JSON.stringify({ userAccountId: "user-b", headline: "Attempted Spoof Headline" }),
      });
      await putProfile(spoofReq);

      // Spoofing ignored: User A updated, User B protected
      const cpB = await db.careerProfile.findFirst({ where: { userAccountId: "user-b" } });
      expect(cpB?.headline).toBe("User B Original");

      const cpA = await db.careerProfile.findFirst({ where: { userAccountId: "user-a" } });
      expect(cpA?.headline).toBe("Attempted Spoof Headline");
    });

    it("P0.4: Unauthenticated requests return 401 Unauthorized", async () => {
      const emptyReq = new NextRequest("http://localhost:3000/api/profile");

      const resGetProfile = await getProfile(emptyReq);
      expect(resGetProfile.status).toBe(401);

      const resPutProfile = await putProfile(new NextRequest("http://localhost:3000/api/profile", { method: "PUT" }));
      expect(resPutProfile.status).toBe(401);

      const resGetDocs = await getDocs(new NextRequest("http://localhost:3000/api/documents/upload"));
      expect(resGetDocs.status).toBe(401);

      const resPostDocs = await postDocs(new NextRequest("http://localhost:3000/api/documents/upload", { method: "POST" }));
      expect(resPostDocs.status).toBe(401);

      // Direct verification of authHelper
      const directUser = await getAuthenticatedUser(emptyReq);
      expect(directUser).toBeNull();
    });

    it("P0.5: Legacy adoption happens strictly ONCE and is idempotent", async () => {
      // Create legacy unassigned singleton records
      await db.careerProfile.create({
        data: { id: "career_main", userAccountId: null, headline: "Legacy Production Headline" },
      });
      await db.searchProfile.create({
        data: { id: "sp-legacy-1", name: "Software & Systems Track", userAccountId: null },
      });

      // User A initializes
      await ensureV2ProfilesExist("user-a");

      const adoptedA = await db.careerProfile.findFirst({ where: { userAccountId: "user-a" } });
      expect(adoptedA?.id).toBe("career_main");

      // User A initializes a second time (idempotency check)
      await ensureV2ProfilesExist("user-a");
      const adoptedA2 = await db.careerProfile.findFirst({ where: { userAccountId: "user-a" } });
      expect(adoptedA2?.id).toBe("career_main");

      // User B initializes
      await ensureV2ProfilesExist("user-b");
      const cpB = await db.careerProfile.findFirst({ where: { userAccountId: "user-b" } });
      expect(cpB).not.toBeNull();
      expect(cpB?.id).not.toBe("career_main");
      expect(cpB?.userAccountId).toBe("user-b");
    });
  });

  // 🟠 P1 CORE FLOW & DOCUMENT SCOPING TESTS
  describe("🟠 P1 Core Flow & Document Scoping", () => {
    it("P1.1: CV skill extraction updates only the authenticated user's profile", async () => {
      await createUserAccount({ id: "user-a", email: "usera@example.com", name: "User A" });
      await db.careerProfile.create({ data: { id: "cp-a", userAccountId: "user-a", skills: JSON.stringify(["React"]) } });

      await createUserAccount({ id: "user-b", email: "userb@example.com", name: "User B" });
      await db.careerProfile.create({ data: { id: "cp-b", userAccountId: "user-b", skills: JSON.stringify(["PLC"]) } });

      // User A uploads CV containing "TypeScript"
      const formData = new FormData();
      const file = new File(["Resume content with TypeScript and Node.js"], "resume_a.txt", { type: "text/plain" });
      formData.append("file", file);

      const uploadReqA = createSessionReq("http://localhost:3000/api/documents/upload", "usera@example.com", {
        method: "POST",
        body: formData,
      });

      await postDocs(uploadReqA);

      // User A's profile contains new skill TypeScript
      const cpA = await db.careerProfile.findFirst({ where: { userAccountId: "user-a" } });
      const skillsA: string[] = JSON.parse(cpA?.skills || "[]");
      expect(skillsA).toContain("TypeScript");

      // User B's profile is completely unchanged
      const cpB = await db.careerProfile.findFirst({ where: { userAccountId: "user-b" } });
      const skillsB: string[] = JSON.parse(cpB?.skills || "[]");
      expect(skillsB).not.toContain("TypeScript");
      expect(skillsB).toEqual(["PLC"]);
    });

    it("P1.2: Documents are strictly account-scoped on GET /api/documents/upload", async () => {
      await createUserAccount({ id: "user-a", email: "usera@example.com", name: "User A" });
      await db.userDocument.create({
        data: { id: "doc-a", userAccountId: "user-a", filename: "usera_cv.pdf", fileType: "CV", extractedText: "", extractedSkills: "[]" },
      });

      await createUserAccount({ id: "user-b", email: "userb@example.com", name: "User B" });
      await db.userDocument.create({
        data: { id: "doc-b", userAccountId: "user-b", filename: "userb_cv.pdf", fileType: "CV", extractedText: "", extractedSkills: "[]" },
      });

      // User A GET documents
      const getReqA = createSessionReq("http://localhost:3000/api/documents/upload", "usera@example.com");
      const resA = await getDocs(getReqA);
      const docsA = await resA.json();

      expect(docsA.length).toBe(1);
      expect(docsA[0].filename).toBe("usera_cv.pdf");

      // User B GET documents
      const getReqB = createSessionReq("http://localhost:3000/api/documents/upload", "userb@example.com");
      const resB = await getDocs(getReqB);
      const docsB = await resB.json();

      expect(docsB.length).toBe(1);
      expect(docsB[0].filename).toBe("userb_cv.pdf");
    });
  });

  // 🟡 P2 ROBUSTNESS & COMPATIBILITY TESTS
  describe("🟡 P2 Robustness & Compatibility", () => {
    it("P2.1: Handles malformed legacy JSON without crashing", async () => {
      await db.userProfile.create({
        data: {
          id: "user_main",
          targetRoles: "INVALID_JSON_STRING",
          skills: "{malformed_json",
        },
      });

      // Seeding does not throw exception
      const result = await ensureV2ProfilesExist("user-malformed");
      expect(result).not.toBeNull();
      expect(result?.careerProfile).toBeDefined();
    });

    it("P2.2: Maintain complete API contract shape expected by frontend UI", async () => {
      await createUserAccount({ id: "user-contract", email: "contract@example.com", name: "Contract Candidate" });

      const req = createSessionReq("http://localhost:3000/api/profile", "contract@example.com");
      const res = await getProfile(req);
      const data = await res.json();

      // Verify contract shape
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("name", "Contract Candidate");
      expect(data).toHaveProperty("headline");
      expect(data).toHaveProperty("location");
      expect(data).toHaveProperty("languages");
      expect(data).toHaveProperty("targetRoles");
      expect(data).toHaveProperty("skills");
      expect(data).toHaveProperty("excludedCompanies");
      expect(data).toHaveProperty("v2");
      expect(data.v2).toHaveProperty("careerProfile");
      expect(data.v2).toHaveProperty("searchProfiles");
    });

    it("P2.3: Logout action clears session and blocks protected endpoints", async () => {
      await createUserAccount({ id: "user-logout", email: "logout@example.com", name: "Logout Test" });

      // Perform logout action
      const logoutReq = new NextRequest("http://localhost:3000/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "logout" }),
      });
      const logoutRes = await authAction(logoutReq);
      expect(logoutRes.status).toBe(200);

      // Verify session cookie maxAge = 0
      const setCookie = logoutRes.cookies.get("jobseeker_session");
      expect(setCookie?.value).toBe("");

      // Subsequent unauthenticated profile request returns 401
      const postLogoutReq = new NextRequest("http://localhost:3000/api/profile");
      const profileRes = await getProfile(postLogoutReq);
      expect(profileRes.status).toBe(401);
    });
  });
});
