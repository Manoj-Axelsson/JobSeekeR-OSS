# ADR 004: Decoupled Domain Architecture & V2 Constitutional Principles

- **Status:** Approved — constitutional architectural specification for v2.0
- **Date:** 2026-08-15
- **Purpose:** Define the intended v2 domain model and processing principles.

> **Documentation boundary:** This ADR is a design specification, not a verbatim copy of the current Prisma schema. The current implementation may contain additive fields and implementation details introduced after this decision. Use prisma/schema.prisma as the source of truth for the implemented database shape.

## 1. V2 Constitutional Principles

### Principle I: Primary vs. Discovery Feed Separation

**Primary Feed:** enforces candidate search intent, target occupations and SearchTerritory boundaries.

**Discovery Feed:** deliberately relaxes selected boundaries to surface high-fit national opportunities, adjacent career paths or emerging roles. Discovery is kept separate from the precision-oriented primary feed.

### Principle II: Decoupled Domain Model

JobSeekeR distinguishes:

1. Candidate / Career Profile — What I Bring
2. Search Profile — What I Want
3. Search Territory — Where I Will Work
4. Opportunity / JobAd — What Is Available

A candidate can maintain multiple Search Profiles for different career tracks.

## 2. Human-Centric Preference Translation

| Human Preference | Engine Translation |
|---|---|
| Must Have | Hard eligibility gate |
| Prefer | Primary ranking signal |
| Nice to Have | Non-punitive additive boost |
| Exclude | Elimination rule |
| Explore | Discovery routing |

## 3. Probabilistic Occupation Classification

Official occupation codes such as SSYK/ISCO should be treated as classification metadata with confidence rather than as infallible descriptions of a vacancy.

## 4. Current Implementation Relationship

The implemented schema contains UserAccount, CareerProfile, SearchProfile, SearchTerritory, JobAd and related entities. JobAd includes feed classification, eligibility, capability/intent scoring and canonical identity fields.

The exact field names, nullability and defaults are governed by prisma/schema.prisma.

## 5. V2 Processing Pipeline

1. Candidate Profile — What I Bring
2. Search Profile — What I Want
3. Discovery / Data Ingestion
4. Normalisation
5. Eligibility
6. Matching & Ranking
7. Explanation / Positioning

## 6. Architectural Intent

The purpose of this ADR is to preserve the domain boundaries and product principles that guide v2 development. Implementation changes should preserve those boundaries or be documented through a subsequent ADR.

Related decisions:

- ADR-001 — Local-First Architecture
- ADR-002 — Production Persistence & Dual Account Ownership
