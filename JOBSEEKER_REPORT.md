# JobSeekeR™ — Technical Report & Customization Blueprint

**Project:** JobSeekeR™ OSS  
**Repository:** Manoj-Axelsson/JobSeekeR-OSS  
**Document status:** Maintained technical overview

> This document supersedes older descriptions that treated SQLite as the universal application database. Historical implementation details are intentionally not presented as current architecture.

## 1. Purpose

JobSeekeR is an open-source Career Intelligence Platform for job discovery, competence assessment, application tracking and evidence-based career decision support.

The platform combines external job ingestion, normalized opportunity data, candidate/search context, eligibility and scoring, canonical vacancy identity, account ownership, and explainable intelligence.

## 2. Current Technology Stack

| Layer | Current technology |
|---|---|
| Web framework | Next.js 16 App Router |
| UI | React 19 |
| Language | TypeScript |
| ORM | Prisma 6 |
| Cloud web database | PostgreSQL |
| Local/desktop database option | SQLite |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| Primary job source | Arbetsförmedlingen JobTech |

The current Prisma schema is PostgreSQL-backed. SQLite remains a deployment option for local-first desktop architecture rather than the production web database.

## 3. Current Domain Architecture

The platform separates:

1. **Candidate / Career Profile** — what the candidate brings.
2. **Search Profile** — what the candidate wants.
3. **Search Territory** — where the candidate is willing to work.
4. **Opportunity / JobAd** — what is available.

Search Profiles may represent different career tracks. Primary and Discovery feeds are intentionally separated.

See ADR-004 for the constitutional v2 domain model.

## 4. Production Persistence & Ownership

The authenticated cloud deployment uses PostgreSQL with explicit UserAccount ownership boundaries.

JobAd and Application records may be global or associated with a UserAccount according to the current domain rules. Protected API routes derive ownership from authenticated session context rather than trusting client-supplied ownership identifiers.

Production persistence architecture is documented in:

docs/adr/ADR-002-production-persistence-and-account-ownership.md

## 5. Canonical Job Identity

The platform uses multiple identity levels:

- source identity through externalId;
- normalized web identity through canonicalUrl;
- deterministic candidate identity/grouping through canonicalHash;
- internal database identity through JobAd.id.

Phase 5 Gate 3 added centralized resolution and two-layer concurrency protection, including PostgreSQL transaction advisory locks for PostgreSQL transactions.

## 6. Intelligence Architecture

Principal intelligence domains include:

- Opportunity
- Competency
- Positioning
- Application Coaching
- Decision Support

Supporting modules cover market, salary, prediction, recommendations, matching and scoring.

The governing product principle is:

> AI assists. Humans decide.

The evidence-first architecture must not fabricate candidate experience, education, achievements or certifications.

## 7. Verification Baseline

The latest repository verification recorded on September 6, 2026:

- **33 test files passed**
- **118 tests passed**
- **0 skipped**
- **0 failed**
- TypeScript check passed with 0 errors.
- Production build completed successfully in the verified local run.
- The GitHub Actions run for commit 7afefa2 completed successfully.

CI verification confirms the committed repository under the configured CI environment. It does not independently prove that the same commit is serving the live production application.

## 8. Customization

For contributors or derivative deployments, review:

- prisma/schema.prisma for the current data model;
- src/lib/services/matcher.ts for matching behavior;
- src/lib/services/jobtech.ts for JobTech ingestion;
- src/intelligence/ for intelligence domains;
- docs/architecture/ and docs/adr/ for architectural decisions.

Do not copy production credentials into source code or documentation.

## 9. Documentation Authority

For current architecture, use the latest accepted ADRs and the current Prisma schema together.

Historical documents remain valuable evidence of how the platform evolved, but historical claims about storage, version numbers or test counts must not be interpreted as current state without checking the current repository.

## 10. Related Documentation

- README.md
- docs/architecture/README.md
- docs/architecture/ADR-001-local-first-architecture.md
- docs/adr/ADR-002-production-persistence-and-account-ownership.md
- docs/architecture/ADR-004-decoupled-career-search-and-territory-domain-model.md
- docs/milestones/phase-5-gate-3-canonical-identity.md
- docs/verification/PRODUCTION-PERSISTENCE-REPAIR-ACCEPTED.md
- docs/RELEASE_CHECKLIST.md
