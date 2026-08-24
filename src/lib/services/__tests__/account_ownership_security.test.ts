import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getJobs, PATCH as patchJob, DELETE as deleteJob } from "../../../app/api/jobs/route";
import { GET as getApplications, PATCH as patchApplication } from "../../../app/api/applications/route";
import { POST as importUrl } from "../../../app/api/jobs/import-url/route";
import { NextRequest } from "next/server";

interface StoreRecord {
  id: string;
  userAccountId?: string | null;
  email?: string;
  name?: string;
  externalId?: string;
  jobId?: string;
  status?: string;
  [key: string]: unknown;
}

// In-memory db mock for multi-tenant isolation and security testing
vi.mock("../../db", () => {
  const store = {
    userAccount: new Map<string, StoreRecord>(),
    jobAd: new Map<string, StoreRecord>(),
    application: new Map<string, StoreRecord>(),
    userProfile: new Map<string, StoreRecord>(),
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
        create: vi.fn(async ({ data }: { data: StoreRecord }) => {
          const id = data.id || `user-${Math.random()}`;
          const user = { ...data, id };
          store.userAccount.set(id, user);
          return user;
        }),
        deleteMany: vi.fn(async ({ where }: { where: { email?: { in?: string[] } } }) => {
          if (where?.email?.in) {
            for (const [id, user] of store.userAccount.entries()) {
              if (user.email && where.email.in.includes(user.email)) {
                store.userAccount.delete(id);
              }
            }
          } else {
            store.userAccount.clear();
          }
          return { count: 0 };
        }),
      },
      jobAd: {
        findFirst: vi.fn(async ({ where }: { where: any }) => {
          for (const job of store.jobAd.values()) {
            if (where.id && job.id !== where.id) continue;
            if (where.webpageUrl && job.webpageUrl !== where.webpageUrl) continue;
            if (where.OR) {
              const match = where.OR.some((cond: any) => {
                if (cond.userAccountId !== undefined && job.userAccountId === cond.userAccountId) return true;
                if (cond.userAccountId === null && (job.userAccountId === null || job.userAccountId === undefined)) return true;
                return false;
              });
              if (!match) continue;
            }
            return job;
          }
          return null;
        }),
        findMany: vi.fn(async ({ where }: { where: any }) => {
          const results: StoreRecord[] = [];
          for (const job of store.jobAd.values()) {
            if (where?.OR) {
              const matchesOR = where.OR.some((cond: any) => {
                if (cond.userAccountId !== undefined && job.userAccountId === cond.userAccountId) return true;
                if (cond.userAccountId === null && (job.userAccountId === null || job.userAccountId === undefined)) return true;
                return false;
              });
              if (!matchesOR) continue;
            }
            if (where?.status && job.status !== where.status) continue;
            results.push(job);
          }
          return results;
        }),
        create: vi.fn(async ({ data }: { data: StoreRecord }) => {
          const id = data.id || `job-${Math.random()}`;
          const job = { ...data, id };
          store.jobAd.set(id, job);
          return job;
        }),
        update: vi.fn(async ({ where, data }: { where: { id: string }; data: StoreRecord }) => {
          const job = store.jobAd.get(where.id);
          if (!job) throw new Error("Record not found");
          const updated = { ...job, ...data };
          store.jobAd.set(where.id, updated);
          return updated;
        }),
        delete: vi.fn(async ({ where }: { where: { id: string } }) => {
          const job = store.jobAd.get(where.id);
          store.jobAd.delete(where.id);
          return job;
        }),
        deleteMany: vi.fn(async ({ where }: { where: { externalId?: { startsWith?: string } } }) => {
          if (where?.externalId?.startsWith) {
            const prefix = where.externalId.startsWith;
            for (const [id, job] of store.jobAd.entries()) {
              if (job.externalId && (job.externalId as string).startsWith(prefix)) {
                store.jobAd.delete(id);
              }
            }
          } else {
            store.jobAd.clear();
          }
          return { count: 0 };
        }),
      },
      application: {
        findFirst: vi.fn(async ({ where }: { where: any }) => {
          for (const app of store.application.values()) {
            if (where.id && app.id !== where.id) continue;
            if (where.jobId && app.jobId !== where.jobId) continue;
            if (where.OR) {
              const match = where.OR.some((cond: any) => {
                if (cond.userAccountId !== undefined && app.userAccountId === cond.userAccountId) return true;
                if (cond.userAccountId === null && (app.userAccountId === null || app.userAccountId === undefined)) return true;
                return false;
              });
              if (!match) continue;
            }
            return app;
          }
          return null;
        }),
        findMany: vi.fn(async ({ where }: { where: any }) => {
          const results: StoreRecord[] = [];
          for (const app of store.application.values()) {
            if (where?.OR) {
              const matchesOR = where.OR.some((cond: any) => {
                if (cond.userAccountId !== undefined && app.userAccountId === cond.userAccountId) return true;
                if (cond.userAccountId === null && (app.userAccountId === null || app.userAccountId === undefined)) return true;
                return false;
              });
              if (!matchesOR) continue;
            }
            results.push(app);
          }
          return results;
        }),
        create: vi.fn(async ({ data }: { data: StoreRecord }) => {
          const id = data.id || `app-${Math.random()}`;
          const app = { ...data, id };
          store.application.set(id, app);
          return app;
        }),
        update: vi.fn(async ({ where, data }: { where: { id: string }; data: StoreRecord }) => {
          const app = store.application.get(where.id);
          if (!app) throw new Error("Record not found");
          const updated = { ...app, ...data };
          store.application.set(where.id, updated);
          return updated;
        }),
        deleteMany: vi.fn(async ({ where }: { where: { resumeVersion?: { contains?: string } } }) => {
          if (where?.resumeVersion?.contains) {
            const term = where.resumeVersion.contains;
            for (const [id, app] of store.application.entries()) {
              if (app.resumeVersion && (app.resumeVersion as string).includes(term)) {
                store.application.delete(id);
              }
            }
          } else {
            store.application.clear();
          }
          return { count: 0 };
        }),
      },
      userProfile: {
        findFirst: vi.fn(async () => ({ id: "user_main", name: "Manoj John Axelsson", headline: "Software Engineer" })),
      },
    },
  };
});

describe("Multi-Tenant Account Ownership & Security Boundary Suite", () => {
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };

  beforeEach(async () => {
    const { db } = await import("../../db");
    await db.userAccount.deleteMany({ where: { email: { in: ["usera@test.com", "userb@test.com"] } } });
    await db.jobAd.deleteMany({ where: { externalId: { startsWith: "test_tenant_" } } });
    await db.application.deleteMany({ where: { resumeVersion: { contains: "Test Ownership CV" } } });

    userA = await db.userAccount.create({
      data: {
        id: "user-a-id",
        email: "usera@test.com",
        name: "User Alpha",
        passwordHash: "hashA",
      },
    });

    userB = await db.userAccount.create({
      data: {
        id: "user-b-id",
        email: "userb@test.com",
        name: "User Beta",
        passwordHash: "hashB",
      },
    });
  });

  function createSessionCookie(email: string): string {
    return `jobseeker_session=${encodeURIComponent(JSON.stringify({ email }))}`;
  }

  it("Security Gate: Unauthenticated requests without session cookie return 401 Unauthorized", async () => {
    const reqJobs = new NextRequest("http://localhost:3000/api/jobs");
    const resJobs = await getJobs(reqJobs);
    expect(resJobs.status).toBe(401);

    const reqApps = new NextRequest("http://localhost:3000/api/applications");
    const resApps = await getApplications(reqApps);
    expect(resApps.status).toBe(401);

    const reqImport = new NextRequest("http://localhost:3000/api/jobs/import-url", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com/job/1" }),
    });
    const resImport = await importUrl(reqImport);
    expect(resImport.status).toBe(401);
  });

  it("Multi-Tenant Isolation: User A cannot view User B's jobs or applications", async () => {
    const { db } = await import("../../db");

    const jobA = await db.jobAd.create({
      data: {
        id: "job-a-id",
        userAccountId: userA.id,
        externalId: "test_tenant_job_a",
        title: "Frontend Architect",
        company: "Alpha Corp",
        location: "Stockholm",
        description: "React & Next.js",
        publishedAt: new Date(),
        matchScore: 90,
        matchedSkills: "[]",
        missingSkills: "[]",
        domainScores: "{}",
        status: "APPLIED",
      },
    });

    const appA = await db.application.create({
      data: {
        id: "app-a-id",
        userAccountId: userA.id,
        jobId: jobA.id,
        status: "APPLIED",
        appliedAt: new Date(),
        resumeVersion: "Test Ownership CV - Alpha",
        monthlyTag: "2026-08",
      },
    });

    const jobB = await db.jobAd.create({
      data: {
        id: "job-b-id",
        userAccountId: userB.id,
        externalId: "test_tenant_job_b",
        title: "Backend Engineer",
        company: "Beta Systems",
        location: "Gothenburg",
        description: "Node.js & Postgres",
        publishedAt: new Date(),
        matchScore: 85,
        matchedSkills: "[]",
        missingSkills: "[]",
        domainScores: "{}",
        status: "APPLIED",
      },
    });

    const appB = await db.application.create({
      data: {
        id: "app-b-id",
        userAccountId: userB.id,
        jobId: jobB.id,
        status: "APPLIED",
        appliedAt: new Date(),
        resumeVersion: "Test Ownership CV - Beta",
        monthlyTag: "2026-08",
      },
    });

    const reqUserAJobs = new NextRequest("http://localhost:3000/api/jobs", {
      headers: { cookie: createSessionCookie(userA.email) },
    });
    const resUserAJobs = await getJobs(reqUserAJobs);
    const dataUserAJobs = await resUserAJobs.json();

    expect(resUserAJobs.status).toBe(200);
    const jobIdsUserA = dataUserAJobs.jobs.map((j: any) => j.id);
    expect(jobIdsUserA).toContain(jobA.id);
    expect(jobIdsUserA).not.toContain(jobB.id);

    const reqUserAApps = new NextRequest("http://localhost:3000/api/applications", {
      headers: { cookie: createSessionCookie(userA.email) },
    });
    const resUserAApps = await getApplications(reqUserAApps);
    const dataUserAApps = await resUserAApps.json();

    expect(resUserAApps.status).toBe(200);
    const appIdsUserA = dataUserAApps.applications.map((a: any) => a.id);
    expect(appIdsUserA).toContain(appA.id);
    expect(appIdsUserA).not.toContain(appB.id);

    const reqPatchUserBApp = new NextRequest("http://localhost:3000/api/applications", {
      method: "PATCH",
      headers: { cookie: createSessionCookie(userA.email) },
      body: JSON.stringify({ id: appB.id, status: "REJECTED" }),
    });
    const resPatchUserBApp = await patchApplication(reqPatchUserBApp);
    expect(resPatchUserBApp.status).toBe(404);

    const reqDeleteUserBJob = new NextRequest(`http://localhost:3000/api/jobs?id=${jobB.id}`, {
      method: "DELETE",
      headers: { cookie: createSessionCookie(userA.email) },
    });
    const resDeleteUserBJob = await deleteJob(reqDeleteUserBJob);
    expect(resDeleteUserBJob.status).toBe(404);
  });
});
