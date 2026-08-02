# ADR 001: Local-First Architecture & Data Privacy

- **Status**: Approved
- **Date**: 2026-08-02
- **Deciders**: Product Owner, Manoj Axelsson, Antigravity AI Team

## Context & Problem Statement
Job seekers handle sensitive career data, including CVs, personal details, applications, and recruiter communications. Standard cloud SaaS tools store candidate data on third-party servers, creating privacy risks and data lock-in.

## Decision Drivers
- User data ownership and 100% privacy.
- Zero telemetry or third-party tracking.
- Fast offline-capable performance.
- Seamless compatibility with desktop packaging (Tauri / Electron).

## Considered Options
1. Cloud SaaS database (PostgreSQL on AWS/Neon).
2. Local-first embedded SQLite database managed via Prisma ORM.

## Decision Outcome
Chosen option: **Local-First Embedded SQLite Architecture (`file:./dev.db`)**.

### Positive Consequences
- **Complete Privacy**: All candidate CVs, applications, match scores, and recruiter interactions remain exclusively on the user's device.
- **Instant Response Times**: Embedded SQLite query execution completes in < 5ms.
- **Future Flexibility**: Schema defined cleanly via Prisma ORM (`prisma/schema.prisma`), allowing optional cloud sync or PostgreSQL migration if requested by the user.

### Negative Consequences
- Device-level data backup must be initiated by the user (solved by providing 1-click JSON/SQLite data export in Settings).
