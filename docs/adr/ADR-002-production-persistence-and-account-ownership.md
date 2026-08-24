# ADR-002: Production Persistence & Dual Account-Ownership Architecture

## Status
**Accepted & Implemented in Production** (2026-08-24)

---

## Context & Problem Statement

When JobseekeR™ was initially deployed to Vercel Cloud infrastructure under ADR-001 (Local-First Desktop Architecture), the application used an embedded SQLite database (`prisma/dev.db`). In Vercel's serverless environment, runtime database writes were copied to `/tmp/dev.db`.

### Original Root Cause of Production Data Loss
1. **Serverless Ephemeral Storage**: Vercel Serverless Lambda containers maintain isolated, temporary `/tmp` filesystems.
2. **Container Reset**: Whenever serverless instances cold-started, scaled horizontally, or recycled, `/tmp/dev.db` was reset to the baseline image.
3. **Data Loss Symptom**: Candidate job saves, application updates, and status changes created during active browser sessions were lost upon container recycling or browser reloads.

---

## Decision Drivers & Strategic Architectural Evolution

While local-first desktop deployments continue to benefit from embedded storage, cloud-deployed multi-tenant web instances require **durable, persistent cloud storage** anchored to explicit candidate ownership boundaries.

Rather than treating local desktop and cloud deployments as identical, the architecture evolves into:
- **Local-First Desktop**: Embedded SQLite.
- **Authenticated Cloud Web Deployment**: Hosted **Neon PostgreSQL** backed by **Session-Derived `UserAccount` Ownership Scoping**.

---

## Architectural Changes & Database Schema Design

### 1. Mandatory PostgreSQL Production Datasource Contract
- Updated `prisma/schema.prisma` datasource provider to `provider = "postgresql"`.
- Modified `src/lib/db.ts` to enforce a **fail-fast production environment contract**:
  - In production (`VERCEL === "1"` or `NODE_ENV === "production"`), `DATABASE_URL` is mandatory.
  - If `DATABASE_URL` is missing, the application fails safely immediately rather than falling back to an ephemeral `/tmp/dev.db` filesystem.

### 2. Dual Account-Ownership Model (`UserAccount`)
Both `JobAd` and `Application` models are account-scoped under `UserAccount`:

```prisma
model UserAccount {
  id           String        @id @default(uuid())
  email        String        @unique
  name         String
  jobAds       JobAd[]
  applications Application[]
}

model JobAd {
  id            String       @id @default(uuid())
  userAccountId String?
  userAccount   UserAccount? @relation(fields: [userAccountId], references: [id], onDelete: Cascade)
  externalId    String
  title         String
  company       String
  applications  Application[]

  @@unique([userAccountId, externalId])
}

model Application {
  id            String       @id @default(uuid())
  userAccountId String?
  userAccount   UserAccount? @relation(fields: [userAccountId], references: [id], onDelete: Cascade)
  jobId         String
  job           JobAd        @relation(fields: [jobId], references: [id], onDelete: Cascade)
  status        String
}
```

### 3. Composite Uniqueness (`@@unique([userAccountId, externalId])`)
- Replaced the legacy global `@unique` constraint on `JobAd.externalId` with a candidate composite constraint:
  `@@unique([userAccountId, externalId])`
- **Rationale**: Allows independent candidate accounts (User A and User B) to save or discover the same JobTech vacancy simultaneously while maintaining independent match scores, notes, and application statuses.

### 4. Session-Derived Tenant Isolation
- Protected API routes (`/api/jobs`, `/api/applications`, `/api/jobs/import-url`) derive `userAccountId` strictly from the authenticated session (`getAuthenticatedUser(request)`).
- Client-supplied ownership inputs or URL parameters are explicitly ignored.
- Unauthenticated requests return `401 Unauthorized`.

---

## Legacy Data Migration & Count Reconciliation Audit

All baseline recoverable records from `prisma/dev.db` were backfilled with `userAccountId` and migrated 1-to-1 to production Neon PostgreSQL:

| Entity Model | SQLite Source (`prisma/dev.db`) | Production Neon Migrated Count | Status |
| :--- | :--- | :--- | :--- |
| **`UserAccount`** | **1** | **1** | Primary Candidate Assigned (`Manoj Axelsson`) |
| **`JobAd`** | **21** | **21** | 100% Match |
| **`Application`** | **5** | **5** | 100% Match |
| **`UserDocument`** | **29** | **30** | 29 baseline documents + 1 pre-existing production document |

### 📌 Formal Ephemeral Record Documentation
- **Pre-Repair Ephemeral Loss**: The 5 additional applications reflected on Arbetsförmedlingen were submitted on Vercel prior to this architectural repair while running on the ephemeral `/tmp/dev.db` container filesystem. Because `/tmp` storage resets on cold starts, those 5 temporary writes were never saved to disk and are formally documented as **pre-repair ephemeral records**, *not as migration failures*.
- **Post-Migration Guarantee**: Following successful production rollout and verification, newly applied and imported jobs will persist in Neon PostgreSQL independently of Vercel serverless container lifecycle.

---

## Verification & Deployment Audit

1. **Unmocked PostgreSQL Integration Gate**: **4/4 Gates Passed** (Foreign key cascade, composite uniqueness, multi-tenant isolation, and migration rehearsal).
2. **Production Deployment**: Merged to `main` and deployed to Vercel Production (`https://jobseeker.website`).
3. **Authentication Compatibility Refinements**: Updated `authHelper.ts` and API handlers with `export const dynamic = "force-dynamic"` and robust URL-encoded cookie parsing (`decodeURIComponent`) to ensure seamless cookie evaluation on Vercel serverless functions.
4. **Live Production Acceptance**: Candidate state updates, job saves, and status transitions survive browser hard refreshes (`Cmd + Shift + R`), cold starts, and container recycling cleanly.

---

## Remaining Acceptance Checks

- Live multi-account cross-account isolation test (verifying User B cannot view User A data).
- Automated regression monitoring for unauthenticated `401` enforcement across all new candidate routes.
