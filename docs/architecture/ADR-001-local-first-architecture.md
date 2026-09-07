# ADR 001: Local-First Architecture & Data Privacy

- **Status**: **Superseded for authenticated cloud web deployment; retained for local/desktop architecture**
- **Original Date**: 2026-08-02
- **Superseded by**: [ADR-002 — Production Persistence & Dual Account Ownership](../adr/ADR-002-production-persistence-and-account-ownership.md)

## Context & Problem Statement

Job seekers handle sensitive career data, including CVs, personal details, applications, and recruiter communications. A local-first model was originally selected to minimize external persistence and data lock-in.

## Decision Drivers

- User data ownership and privacy.
- Minimal third-party tracking.
- Fast local/offline-capable operation.
- Compatibility with future desktop packaging.
- Clear separation between local and cloud deployment requirements.

## Original Decision

The original architecture selected **embedded SQLite** through Prisma for local-first desktop use:

`file:./dev.db`

This remains a valid local-development and desktop architecture option.

## Architectural Evolution

The original SQLite decision was not sufficient for an authenticated serverless web deployment. Vercel serverless execution provides ephemeral local filesystems, so a SQLite file inside the deployed runtime cannot provide durable shared production persistence.

The architecture therefore evolved into two explicit deployment modes:

1. **Local / Desktop:** SQLite remains the local-first persistence option.
2. **Authenticated Cloud Web:** PostgreSQL provides durable persistence, with `UserAccount` ownership boundaries.

The cloud persistence and ownership model is defined by **ADR-002**.

## Consequences

### Positive

- Local deployments retain a simple, self-contained database option.
- Cloud deployments use durable database persistence rather than ephemeral serverless storage.
- Account ownership is explicit in the cloud data model.
- The architecture remains suitable for future desktop packaging without pretending that desktop and cloud persistence are identical.

### Negative

- Deployment mode now affects database configuration.
- Contributors must understand the PostgreSQL requirement for the current web schema.
- Local-first privacy claims must be scoped to the deployment mode rather than stated as a universal property of every deployment.

## Historical Note

This ADR is intentionally preserved as an architectural record. It should not be read as the current production-web persistence decision. For the current cloud architecture, consult ADR-002.

## Related Decisions

- [ADR-002 — Production Persistence & Dual Account Ownership](../adr/ADR-002-production-persistence-and-account-ownership.md)
- [ADR-004 — Decoupled Career, Search & Territory Domain Model](ADR-004-decoupled-career-search-and-territory-domain-model.md)
