# Production Persistence Repair — ACCEPTED

## 1. Incident Summary

JobseekeR™ production candidate job saves, application updates, and status transitions were failing to persist permanently. While client-side UI state made operations appear successful during active browser sessions, records disappeared upon browser hard refreshes (`Cmd + Shift + R`), cold serverless invocations, or container restarts.

---

## 2. Root Cause Analysis

- **Ephemeral Storage Dependency**: The original deployment copied the local SQLite database (`prisma/dev.db`) into Vercel's temporary `/tmp/dev.db` filesystem inside serverless Lambda containers.
- **Transient Write Lifecycle**: While writes to `/tmp/dev.db` succeeded for the lifetime of an active container, Vercel routinely recycles `/tmp` storage during cold starts, horizontal scaling, or redeployments.
- **Illusion of Persistence**: Transient React component state rendered application updates temporarily, masking the underlying failure of container-bound storage.

---

## 3. Architectural Repair Specifications

To permanently eliminate ephemeral storage data loss, the system architecture was upgraded:

1. **Persistent PostgreSQL Engine**: Updated `prisma/schema.prisma` datasource provider to `provider = "postgresql"`.
2. **Fail-Fast Environment Contract**: Modified `src/lib/db.ts` to require a mandatory `DATABASE_URL` in production (`VERCEL === "1"` or `NODE_ENV === "production"`), removing the silent fallback to `/tmp/dev.db`.
3. **Dual Account-Ownership Scoping**: Bound both `JobAd` and `Application` models directly to `UserAccount` via foreign-key relations.
4. **Session-Derived Security**: Protected API endpoints (`/api/jobs`, `/api/applications`, `/api/jobs/import-url`) derive `userAccountId` strictly from `getAuthenticatedUser(request)` using session cookies. Unauthenticated requests are rejected with `401 Unauthorized`.
5. **Candidate Composite Uniqueness**: Replaced global `@unique` on `JobAd.externalId` with `@@unique([userAccountId, externalId])`, allowing multiple candidates to track the same JobTech vacancy independently.

---

## 4. Data Recovery & Audit Classification

All recoverable baseline records from `prisma/dev.db` were backfilled with `userAccountId` and migrated 1-to-1 to production Neon PostgreSQL:

| Entity Model | Baseline Recoverable Count (`prisma/dev.db`) | Production Neon Migrated Count | Reconciliation Status |
| :--- | :--- | :--- | :--- |
| **`UserAccount`** | **1** | **1** | Assigned to Primary Candidate (`Manoj Axelsson`) |
| **`JobAd`** | **21** | **21** | 100% Match |
| **`Application`** | **5** | **5** | 100% Match |
| **`UserDocument`** | **29** | **30** | 29 baseline documents + 1 legitimate pre-existing production document |
| **`UserProfile`** | **1** | **1** | 100% Match |
| **`CareerProfile`** | **1** | **1** | 100% Match |
| **`SearchProfile`** | **2** | **2** | 100% Match |

### 📌 Ephemeral Record Data Loss Audit
- **5 Recoverable Baseline Applications**: All 5 applications stored in `prisma/dev.db` were 100% migrated and assigned candidate ownership.
- **5 Historically Unrecoverable Ephemeral Applications**: The 5 additional applications visible on Arbetsförmedlingen were created on Vercel prior to this repair against the ephemeral `/tmp/dev.db` filesystem. Because `/tmp` storage resets on cold starts, those 5 writes were never saved to disk and are formally documented as **pre-repair ephemeral records**, *not as migration failures*.

---

## 5. Verification Matrix

The production repair was validated through a multi-tiered verification pipeline:

- ✅ **Unmocked PostgreSQL Integration Gate**: Passed **4/4 gates** (Foreign key cascade, composite uniqueness, multi-tenant isolation, and migration rehearsal).
- ✅ **Schema Uniqueness & Relations**: Verified candidate composite index `@@unique([userAccountId, externalId])`.
- ✅ **Multi-Tenant Security Suite**: Automated unit tests passed User A vs User B data isolation and `401` unauthenticated rejection.
- ✅ **TypeScript Strict Compilation**: `npx tsc --noEmit` passed with 0 errors.
- ✅ **Next.js Production Build**: `npm run build` compiled cleanly.
- ✅ **Production Schema Migration**: `npx prisma migrate deploy` executed successfully against production Neon.
- ✅ **Production Legacy Data Backfill**: `scripts/migrate_legacy_data_to_user_account.ts` reconciled 100% of baseline records.
- ✅ **Vercel Production Deployment**: Successfully deployed to `https://jobseeker.website`.
- ✅ **Live Production Neon Connectivity**: Verified `DATABASE_URL` active on Vercel serverless functions.
- ✅ **Live Browser & HTTP Acceptance**: Browser testing confirmed state changes, job saves, and application updates survive hard refreshes (`Cmd + Shift + R`) and cold invocations.

---

## 6. Formal Acceptance Statement

> **ACCEPTANCE**: The original production persistence defect is **ACCEPTED AS RESOLVED**.
> 
> Following this successful production deployment and verification, newly created, saved, and applied job records persist directly in Neon PostgreSQL independently of Vercel serverless container lifecycles.

---

## 7. Security Boundary & Tenant Isolation

Candidate data isolation is enforced at the database and API controller layers:
- All protected API routes ignore client-supplied candidate IDs and derive tenant ownership exclusively from authenticated session cookies.
- Automated security test suites verify that User B cannot query, update, or delete User A's jobs or applications.

---

## 8. Historical Data Preservation Record

- **5 Recoverable Applications**: Successfully migrated and assigned to candidate `UserAccount`.
- **5 Ephemeral Records**: Formally classified as historically unrecoverable pre-repair container records.

---

## 9. Git & Deployment Commit History

- **Production Architectural Repair Commit**: `6e6eae8` (`feat(db): transition to production PostgreSQL with dual account-ownership scoping`)
- **Runtime & Auth Compatibility Commits**: Culminating in `94036de`
- **ADR Documentation Commit**: `d507891` (`docs(adr): document production persistence and ownership repair`)
- **Live Verification**: Verified against live Vercel production deployment (`https://jobseeker.website`).

---

## 10. Final System Status Summary

```text
Production Persistence Repair: ACCEPTED
Data Persistence:             RESOLVED
Neon PostgreSQL:              ACTIVE
Vercel Production:            ACTIVE
Legacy Recoverable Data:      MIGRATED
/tmp/dev.db Dependency:       REMOVED
Working Tree:                 CLEAN
```
