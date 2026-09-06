# Phase 5 — Gate 3: Canonical Identity, Deduplication & Concurrency Protection

---

## Executive Summary

| Property | Value |
| :--- | :--- |
| **Milestone Status** | **COMPLETE** 🟢 |
| **Target Integration Branch** | `main` |
| **Merge Commit** | `b38f551 — Merge branch 'feat/29-non-numerical-assessment-v3-1-1' into main` |
| **Date of Completion** | September 6, 2026 |
| **Architecture Contract** | Strategy 4 Candidate Identity & Dual-Stage Resolution |

---

## 1. Commits & Historical Lineage

### Baseline Foundation (Gate 1)
* **`17e41dc`** — `feat(identity): add canonical job identity primitives` *(Gate 1 baseline foundation introducing additive schema fields and normalization primitives)*

### Implementation & Test Commits (Gate 3)
The Gate 3 implementation was committed across three authorized feature boundaries before integration:
1. **`aa6c0ea`** — `feat(deduplication): centralize canonical ingestion resolution` *(Shared resolution facade, scraper evaluator extraction, cron & URL import refactoring)*
2. **`3c91fbb`** — `feat(api): enforce canonical feed uniqueness` *(API feed query fallback grouping)*
3. **`7bab15a`** — `test(deduplication): add cross-source identity regression suite` *(Identity primitives, lock lifecycle unit tests, and cross-source deduplication integration suite)*

---

## 2. Implemented Architecture & Identity Resolution

### Four-Level Identity Contract
The platform distinguishes four identity levels:
1. **Source Identity (`externalId`):** Identifies the vacancy within its originating external source.
2. **Canonical Web Identity (`canonicalUrl`):** Normalized webpage URL with tracking query parameters stripped.
3. **Candidate Real-World Identity (`canonicalHash`):** Deterministic candidate identity/grouping signal derived from normalized company, title, and location.
4. **Database Identity (`JobAd.id`):** Internal primary key UUID.

### Strategy 4 Candidate Hash Formula
```ts
canonicalHash = SHA256(normalizeText(company) + "::" + normalizeText(title) + "::" + normalizeText(canonicalLocation))
```

### Architectural Identity Resolution Principles
* `canonicalHash` is a deterministic candidate identity/grouping signal derived from normalized company, title, and location.
* Acquiring the advisory lock for a `canonicalHash` does not itself authorize a merge. Identity resolution still evaluates the available source identity, canonical URL, canonical hash, and user-account scope (`OR: [{ userAccountId: targetUserAccountId }, { userAccountId: null }]`).

---

## 3. Two-Layer Concurrency Protection Strategy

To prevent initial ingestion race conditions without introducing database uniqueness constraints prematurely:

1. **Layer 1: In-Process FIFO Lock Map (`acquireCanonicalLock`)**
   * Uses a strict FIFO promise chain (`Map<string, Promise<void>>`) keyed by `canonicalHash`.
   * Serializes concurrent resolution attempts within the same Node.js worker process heap.
   * Memory-safe with verified lock cleanup (`resolutionLocks.delete(key)`) on both success and error paths.
2. **Layer 2: PostgreSQL Transaction Advisory Locks (`pg_advisory_xact_lock`)**
   * Executes `SELECT pg_advisory_xact_lock(${hashId})` inside Prisma interactive transactions (`$transaction`) when connecting to PostgreSQL.
   * Advisory locks are transaction-scoped and automatically released on transaction completion or rollback.
   * PostgreSQL CI concurrency testing demonstrated that concurrent initial ingestion of the same canonical candidate resulted in exactly one `JobAd` record.

---

## 4. Verification & Test Evidence

* **TypeScript:** `npx tsc --noEmit` — **0 errors**.
* **Build:** `npm run build` — **Successful** (compiled in 1.4s).
* **Formatting:** `git diff --check` — **Clean** (0 whitespace/formatting defects).
* **Test Suite Totals:**
  * **LOCAL (SQLite `dev.db`):** 108 Passed / 10 Skipped / 118 total.
  * **POSTGRESQL CI:** 118 Passed / 0 Skipped / 0 Failed.

### File-Size Engineering Discipline ($\le 200$ Lines Target)
All seven Gate 3 source and test files strictly satisfy the $\le 200$-line limit:
* `190` `src/lib/services/identity.ts`
* `183` `src/lib/services/scraperEvaluator.ts`
* `179` `src/app/api/cron/scrape/route.ts`
* `175` `src/app/api/jobs/import-url/route.ts`
* `168` `src/app/api/jobs/route.ts`
* `123` `src/lib/services/__tests__/identity.test.ts`
* `186` `src/lib/services/__tests__/deduplication.test.ts`

---

## 5. Protected Subsystems & Safety Invariants

* **Protected Subsystem:** `src/intelligence/assessment/` remained **100% UNTOUCHED** by Gate 3.
* **Schema Constraints:** Prisma schema uniqueness constraints were not introduced during Gate 3. No `@unique` or `@@unique` constraint for `canonicalHash` was added. Any schema changes belonging to the earlier Gate 1 baseline remain outside the Gate 3 scope.
* **CI Workflows:** CI workflow configuration was not modified as part of Gate 3.
* **Production Data Safety:**
  * No production data reconciliation was performed.
  * No production record deletion was performed.
  * No canonical duplicate reconciliation was performed.

---

## 6. Explicit Reservation of Commit 5

```
Commit 5 — chore(data): reconcile existing canonical duplicates
```

* **Explicit Reservation Statement:** Commit 5 remains reserved for a separate, future, explicitly authorized data-reconciliation phase. It is not part of Gate 3. Existing production duplicate records were deliberately not modified, reconciled, or deleted during this milestone.

---

## 7. Formal Milestone Closure Statement

> **Phase 5 — Gate 3: Canonical Identity, Deduplication & Concurrency Protection is hereby declared COMPLETE and integrated into main at merge commit b38f551. Gate 3 establishes deterministic candidate identity resolution, centralized ingestion deduplication, and two-layer concurrency protection while deliberately deferring production-data reconciliation and database uniqueness constraints to separately authorized future work.**
