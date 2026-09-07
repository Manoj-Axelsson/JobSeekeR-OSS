# JobSeekeR™ — Open Source Download & Setup Guide

JobSeekeR™ is an open-source Career Intelligence Platform for job discovery, competence assessment, application tracking and evidence-based career recommendations.

## Local Setup

1. Clone the repository.
2. Install dependencies with `npm install`.
3. Configure an isolated PostgreSQL `DATABASE_URL`.
4. Run `npx prisma generate`.
5. Run `npx prisma db push`.
6. Start with `npm run dev`.

The current Prisma schema is PostgreSQL-backed. Older documentation describing `prisma/dev.db` as the universal application database is historical and should not be followed for the current web schema.

## Current Platform Capabilities

- Candidate and search-profile configuration
- Job ingestion from Arbetsförmedlingen JobTech
- Primary and Discovery opportunity routing
- Competency and opportunity assessment
- Canonical vacancy identity and deduplication
- Account-scoped job and application ownership
- CV/document parsing
- Application tracking
- Evidence-first positioning and coaching
- Progressive Web App support

## Desktop Direction

SQLite remains a local-first desktop option, subject to the desktop packaging architecture. Tauri readiness is documented separately; this guide does not imply that a native desktop package is currently released.

## Verification

Before sharing or releasing a change:

```bash
npx tsc --noEmit
npm test -- --run
npm run build
```

See the repository README and release checklist for the current verification status and the distinction between CI verification and live-production verification.

## License

Distributed under the MIT License.
