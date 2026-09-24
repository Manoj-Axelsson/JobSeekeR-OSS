# Production Persistence Repair — Historical Acceptance Record

## Current Verification Boundary

This document records the production persistence repair and the acceptance evidence collected at the time of the repair.

**Important:** The acceptance statements below are historical evidence. A current GitHub/CI result does not automatically prove that the live application is still serving the same code or configuration. Current production status must be re-verified independently after subsequent deployments or resets.

## Incident Summary

JobSeekeR™ originally used SQLite in the Vercel serverless runtime, where writes could land on ephemeral filesystem storage. Candidate job saves, application updates and status transitions could therefore disappear after container lifecycle events.

## Architectural Repair

The repair moved the authenticated cloud web deployment to durable PostgreSQL and established explicit account ownership:

1. Prisma production datasource uses PostgreSQL.
2. Production requires DATABASE_URL and does not silently fall back to an ephemeral database.
3. JobAd and Application support UserAccount ownership through foreign-key relations.
4. Protected API routes derive ownership from authenticated session context.
5. JobAd uses account-scoped composite uniqueness for externalId.

SQLite remains a valid local-first desktop/development architecture option.

## Data Recovery Record

The original repair audit recorded the following baseline reconciliation:

| Entity | Baseline recoverable | Production migrated | Record |
|---|---:|---:|---|
| UserAccount | 1 | 1 | Reconciled |
| JobAd | 21 | 21 | Reconciled |
| Application | 5 | 5 | Reconciled |
| UserDocument | 29 | 30 | 29 baseline + 1 pre-existing production record |
| UserProfile | 1 | 1 | Reconciled |
| CareerProfile | 1 | 1 | Reconciled |
| SearchProfile | 2 | 2 | Reconciled |

Five additional applications previously visible on Arbetsförmedlingen were classified at the time as unrecoverable pre-repair ephemeral records.

## Historical Verification Evidence

The original acceptance record reported:

- 4/4 unmocked PostgreSQL integration gates passed.
- TypeScript strict compilation passed.
- Next.js production build passed.
- Production schema migration completed.
- Legacy baseline data backfill completed.
- Vercel deployment completed.
- Neon connectivity and browser persistence were reported as verified.

Those statements describe the repair acceptance evidence available at that time. They are not a substitute for a fresh live-production verification after later repository changes.

## Current Repository Verification

The current repository has subsequently reached:

- **33 test files passed**
- **118 tests passed**
- **0 skipped**
- **0 failed**
- GitHub Actions for commit **7afefa2** completed successfully.

This confirms the current committed repository under CI. It does not independently confirm the currently served production deployment.

## Security Boundary

The intended production security model remains:

- Protected API routes derive tenant ownership from authenticated session context.
- Client-supplied ownership identifiers must not be trusted.
- User-owned records are related to UserAccount through database foreign keys.
- Automated account-isolation tests protect against cross-account access regressions.

## Historical Git / Deployment Lineage

The repair was introduced through the historical production-persistence commits recorded in the original acceptance work. Later Phase 5 identity/deduplication work and its PostgreSQL test-fixture repair are separate changes.

For current architecture, consult ADR-002 and the repository README.

## Acceptance Interpretation

**Historical conclusion:** the original production persistence defect was accepted as resolved at the time of the repair.

**Current conclusion:** the repository is CI-green, but current live-production serving status remains a separate operational verification item.
