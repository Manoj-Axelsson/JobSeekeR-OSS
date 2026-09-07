# ADR-002: Production Persistence & Dual Account-Ownership Architecture

## Status

**Implemented architectural decision. Historical production acceptance recorded; current live deployment requires independent verification.**

**Decision date:** 2026-08-24

## Context

The initial Vercel deployment used SQLite inside a serverless runtime. Because serverless local filesystems are ephemeral and instance-scoped, this was unsuitable for durable authenticated web persistence.

The architecture therefore evolved from a single local-first model into explicit deployment modes:

- **Local / Desktop:** SQLite remains the local-first persistence option.
- **Authenticated Cloud Web:** PostgreSQL provides durable persistence with UserAccount ownership boundaries.

## Decision

The authenticated cloud web deployment uses PostgreSQL.

The production environment must provide DATABASE_URL. Production must fail safely rather than silently falling back to an ephemeral local database.

JobAd and Application are related to UserAccount through foreign keys. Protected API routes derive ownership from authenticated session context.

JobAd uses the composite uniqueness rule:

    @@unique([userAccountId, externalId])

This allows independent candidate accounts to track the same external vacancy while retaining account-specific state.

## Security

The ownership model is enforced through:

- session-derived UserAccount identity;
- database foreign keys;
- account-scoped data access;
- rejection of unauthenticated protected requests.

Client-supplied ownership identifiers must not be treated as authoritative.

## Historical Data Reconciliation

The original production repair recorded successful migration of the recoverable baseline records from the former local database to Neon PostgreSQL:

- 1 UserAccount
- 21 JobAds
- 5 Applications
- 29 baseline UserDocuments, plus 1 pre-existing production document
- 1 UserProfile
- 1 CareerProfile
- 2 SearchProfiles

Five historically unrecoverable pre-repair ephemeral application records were separately classified as data that had never reached durable storage.

## Historical Production Acceptance

The original repair acceptance record reported successful production deployment, Neon connectivity, schema migration, legacy data backfill, and browser persistence testing.

Those are historical acceptance results. They should not be interpreted as a current guarantee that the live application is still serving the same repository commit after later deployments.

## Current Verification Boundary

The current repository is independently CI-verified. The latest recorded workflow for commit 7afefa2 completed successfully, with the repository test suite at 118 passing tests.

A green CI result verifies the repository in CI. **It does not establish the currently deployed production commit or runtime configuration.**

Current production acceptance therefore requires an explicit live check of:

1. deployed commit/version;
2. DATABASE_URL/runtime database connectivity;
3. authenticated persistence across hard refresh;
4. account isolation;
5. relevant API authentication boundaries.

## Consequences

### Positive

- Durable cloud persistence.
- Explicit candidate ownership.
- Clear multi-tenant boundaries.
- SQLite remains available for local-first desktop architecture.

### Negative

- Cloud deployment requires PostgreSQL configuration.
- Local development and cloud deployment have different persistence requirements.
- Production acceptance requires both automated verification and live operational verification.

## Related Records

- [ADR-001 — Local-First Architecture](../architecture/ADR-001-local-first-architecture.md)
- [ADR-004 — Decoupled Career, Search & Territory Domain Model](../architecture/ADR-004-decoupled-career-search-and-territory-domain-model.md)
- [Production Persistence Repair — Historical Acceptance Record](../verification/PRODUCTION-PERSISTENCE-REPAIR-ACCEPTED.md)
