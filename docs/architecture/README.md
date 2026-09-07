# 🏗️ Architecture Decision Records

This directory contains the Architecture Decision Records documenting the key engineering decisions behind JobSeekeR™ OSS.

JobSeekeR uses ADRs to preserve engineering intent, make architectural changes reviewable, and distinguish historical decisions from the current architecture.

## ADR Index

| ADR | Decision | Status |
|---|---|---|
| [ADR-001](ADR-001-local-first-architecture.md) | Local-First Architecture & Data Privacy | Superseded for cloud web; retained for local/desktop |
| [ADR-002](ADR-002-progressive-onboarding-and-confidence-model.md) | Progressive Onboarding & Confidence Model | Historical product decision |
| [ADR-003](ADR-003-evidence-based-recommendations-and-settings.md) | Evidence-Based Recommendations & Settings | Historical product decision |
| [ADR-004](ADR-004-decoupled-career-search-and-territory-domain-model.md) | Decoupled Career, Search & Territory Domain Model | Approved for v2 architecture |

### Production persistence decision

The current production persistence and account-ownership decision is documented separately under:

**[ADR-002 — Production Persistence & Dual Account Ownership](../adr/ADR-002-production-persistence-and-account-ownership.md)**

This file deliberately lives under docs/adr/ because it records the later production persistence transition. It must not be confused with the historical docs/architecture/ADR-002-progressive-onboarding-and-confidence-model.md.

## How to Read the ADR Set

The records are historical as well as prescriptive. A later ADR may supersede part of an earlier decision without invalidating the earlier record.

When documentation conflicts, prefer the most recent accepted architectural decision and verify it against the current schema and implementation.

Architecture evolves. Documenting the evolution preserves engineering intent and reduces knowledge loss for future contributors.

Maintained as part of the RubberDuckWorks Engineering Documentation.