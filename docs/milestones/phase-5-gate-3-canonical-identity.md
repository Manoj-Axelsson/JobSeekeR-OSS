# Phase 5 — Gate 3: Canonical Identity, Deduplication & Concurrency Protection

## Executive Summary

| Property | Value |
|---|---|
| Milestone Status | **COMPLETE** |
| Target Integration Branch | main |
| Completion Date | September 6, 2026 |
| Architecture Contract | Strategy 4 Candidate Identity & Dual-Stage Resolution |

## Scope

Gate 3 established deterministic canonical vacancy identity, centralized ingestion resolution, cross-source deduplication, API feed uniqueness handling, and concurrency protection.

The milestone deliberately did not perform production duplicate reconciliation or introduce a canonicalHash database uniqueness constraint.

## Identity Contract

The platform distinguishes source identity (externalId), canonical web identity (canonicalUrl), candidate real-world identity/grouping signal (canonicalHash), and database identity (JobAd.id).

The canonical hash is derived from normalized company, title and canonical location. Identity resolution evaluates source identity, canonical URL, canonical hash and account scope. An advisory lock does not by itself authorize a merge.

## Concurrency Protection

Two layers are used: in-process FIFO locking keyed by canonicalHash, and PostgreSQL transaction advisory locking through pg_advisory_xact_lock inside Prisma transactions.

The PostgreSQL concurrency test verifies that concurrent initial ingestion of the same canonical candidate produces exactly one JobAd.

## Verification

The original local test snapshot was 108 passed / 10 skipped because PostgreSQL integration tests were environment-gated.

The subsequent PostgreSQL test-fixture repair added the required UserAccount records for ownership-promotion cases without changing production code.

Final verified repository state:

- **33 test files passed**
- **118 tests passed**
- **0 skipped**
- **0 failed**
- TypeScript check passed with 0 errors.
- Build passed.
- git diff --check was clean.
- GitHub Actions for commit **7afefa2** completed successfully.

The fixture repair is recorded in commit 7afefa2: test: seed PostgreSQL deduplication user fixtures.

## Protected Boundaries

- src/intelligence/assessment/ remained outside Gate 3 scope.
- No canonicalHash database uniqueness constraint was introduced.
- No production duplicate reconciliation was performed.
- No production records were deliberately deleted as part of Gate 3.
- Commit 5 remains reserved for separately authorized production-data reconciliation.

## Production Verification Boundary

A green local or GitHub Actions test run verifies the committed code in that test environment. It does not, by itself, establish that the same commit is serving the live production application.

Live production verification therefore remains a separate operational acceptance step.

## Closure

Gate 3 is complete as an engineering milestone. The repository contains the canonical identity and deduplication implementation, PostgreSQL integration coverage, and the repaired test fixtures required for the full 118-test verification baseline.