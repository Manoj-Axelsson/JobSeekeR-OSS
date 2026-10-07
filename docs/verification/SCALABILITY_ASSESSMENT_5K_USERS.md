# Preliminary — Code Inspection and Engineering Projections

**Project:** JobSeekeR™ OSS  
**Date:** September 29, 2026  
**Baseline Commit:** `f81d50c`  
**Scope:** Read-only architectural scalability assessment comparing single-user baseline against a hypothetical 5,000 registered user deployment.

---

## 1. Executive Summary & Readiness Verdict

* **Architectural Readiness for 5,000 Users:** **NOT READY / CRITICAL RISK**.
* The current architecture is designed as a single-user local-first application. Deploying it for 5,000 users without structural modifications will result in immediate security vulnerabilities (plaintext/base64 session cookies), data corruption (shared `user_main` profile overwrites), and server instability (unpaginated memory spikes).

---

## 2. Tool Availability & Working Principles Status

* **CodeGraph:** Initialized and synchronized (`codegraph init` — 138 files, 798 nodes, 1,972 edges). MCP tool `codegraph_explore` is fully operational.
* **Headroom:** Healthy and operational.
* **Repository Integrity:** All 128 pre-existing modified, unstaged tracked files preserved without modification, staging, or committing.

---

## 3. Current Architecture Review

### Database Architecture & Data Models
The application relies on PostgreSQL managed via Prisma ORM ([schema.prisma](file:///Users/manoj-axelsson/Development/JobSeekeR-OSS/prisma/schema.prisma)).
* **User Isolation & Ownership Gap:** While `UserAccount` models exist, the legacy `UserProfile` model uses a fixed singleton ID (`user_main`) without a foreign key to `UserAccount`. Updates to user profile parameters in `PUT /api/profile` overwrite `user_main` globally across all sessions.
* **Job Ad Scoping:** `JobAd` records store `userAccountId` as optional (`String?`). Scraped jobs are ingested with `userAccountId: null`, making them globally visible across all account queries.
* **JSON String Storage:** Multiple complex domain structures (`skills`, `domainScores`, `hardRequirements`, `matchedRequirements`, `missingRequirements`, `enrichmentData`, `positioningData`) are stored as serialized JSON strings in standard PostgreSQL `TEXT` columns rather than native `JSONB` types, preventing database-level indexing, filtering, or JSON path querying.

### API Routes & Access Patterns
* **Unpaginated Data Fetching:** In `GET /api/jobs`, the query fetches all jobs matching `userAccountId: user.id` OR `userAccountId: null` with full relation includes (`applications`, `profileEvaluations`). The entire table of unowned jobs is returned to Node.js without database-level pagination limit or offset.
* **In-Memory Deduplication:** Deduplication across canonical job hashes (`canonicalHash` / `canonicalUrl` / composite key) is executed entirely in-memory within Node.js V8 heap loop after retrieving the entire database result set.
* **Authentication Overhead:** `getAuthenticatedUser()` parses an unencrypted `jobseeker_session` cookie containing plain JSON data and issues a database lookup (`db.userAccount.findUnique`) on every authenticated HTTP request. Password authentication uses Base64 encoding rather than standard cryptographic password hashing.

### Job Scanning & Background Workloads
* **Monolithic Synchronous Cron:** The job ingestion and matching endpoint (`/api/cron/scrape`) is executed as a single synchronous HTTP request handler.
* **Global Profile Ingestion:** Ingestion iterates over all active search profiles across all users sequentially, querying JobTech, LinkedIn, and Webbjobb external APIs.
* **Hardcoded Global Feed Limits:** New jobs matching `PRIMARY` feed status are truncated to a global cap of 15 system-wide, demoting all remaining jobs to `DISCOVERY` status regardless of profile ownership.

---

## 4. Scaling Scenario Comparison

| Architectural Aspect | Scenario A: 1 User (Baseline) | Scenario B: 5,000 Users (Modest Activity: ~50 Concurrent) | Scenario C: 5,000 Users (Elevated Activity: ~500 Concurrent) |
| :--- | :--- | :--- | :--- |
| **Database Connections & Queries** | 1-3 active connections; DB response times <10ms. | Prisma pool saturation (default 10-20 connections); lock contention on `UserAccount` lookups. | Complete DB connection pool starvation; connection timeouts (Error P1001/P1002). |
| **Database Storage & Growth** | ~500 JobAds (~5 MB data size). | ~100,000 JobAds & 500,000 JobAdSearchProfile rows (~1.5–3.0 GB data size). | >500,000 JobAds & millions of evaluation records (~10–25 GB); unindexed JSON string bloat. |
| **API Response & Server Memory** | GET `/api/jobs` response ~50ms; payload <200 KB; RAM <100 MB. | GET `/api/jobs` returns >50,000 unowned rows (~15–30 MB JSON); response time >3s; V8 heap spikes. | Node.js event loop lag >10s; severe garbage collection pauses; frequent process crashes (OOM). |
| **Job Scanning Workload** | Single scrape loop runs in ~10–25s. | Cron endpoint times out (>60s gateway limit); external APIs block requests due to rate limits. | Cron scrape completely unusable as HTTP endpoint; background ingestion failures. |
| **User Isolation & Data Integrity** | Single candidate assumption works without conflict. | Race conditions on `user_main` `UserProfile`; user profile settings overwritten by concurrent updates. | Data integrity breach; candidates see mixed profile configurations and cross-tenant data leaks. |

---

## 5. Margin-of-Error & Engineering Projections

### Top 5 Identified Bottlenecks

1. **Unpaginated Job Feed Fetching & In-Memory Deduplication (`CRITICAL`):**
   * Loads all database job ads into Node.js V8 memory to deduplicate on every HTTP request.
2. **Global Single-Tenant UserProfile (`CRITICAL`):**
   * Uses hardcoded ID `user_main` without `userAccountId` foreign key, causing cross-tenant profile overwrites.
3. **Monolithic Synchronous HTTP Scrape/Match Pipeline (`HIGH`):**
   * Runs all external fetch operations and multi-profile evaluation sequentially inside a single HTTP request handler.
4. **Cookie Authentication & Per-Request DB Query (`HIGH`):**
   * Plaintext Base64 password hashing and unencrypted JSON cookie; executes `findUnique` DB query on every endpoint call.
5. **Serialized JSON String Storage in Standard TEXT Fields (`MODERATE`):**
   * Prevents database indexing and query filtering, requiring full row transfers for evaluation.

### Recommended Preventive Measures

1. **User Account Scoping & Schema Normalization (Risk: Critical | Effort: Low):** Link `UserProfile` strictly to `UserAccount` (`userAccountId` FK) and enforce multi-tenant WHERE clauses across all Prisma queries.
2. **API Pagination & DB-Level Deduplication (Risk: Critical | Effort: Medium):** Implement cursor/offset pagination (limit 20-50) on `GET /api/jobs` and push canonical deduplication into database queries.
3. **Asynchronous Background Job Processing (Risk: High | Effort: Medium):** Decouple scrape ingestion from HTTP request cycle using background workers/queues.
4. **Secure Authentication & Stateless Session Verification (Risk: High | Effort: Low):** Replace Base64 encoding with bcrypt/Argon2 hashing and replace unencrypted cookies with signed session tokens.
5. **PostgreSQL JSONB Migration & Indexing (Risk: Moderate | Effort: Low):** Convert stringified JSON TEXT columns to native PostgreSQL JSONB columns and add composite indexes.

---

## 6. Effort Log Entry

| Field | Detail |
| :--- | :--- |
| **Date** | September 29, 2026 |
| **Project** | JobSeekeR-OSS |
| **Workstream** | Scalability & Margin-of-Error Assessment |
| **Active Duration** | 25 minutes |
| **Outcomes** | Completed architectural assessment, initialized CodeGraph index (`138 files`), closed out documentation report under `docs/verification/SCALABILITY_ASSESSMENT_5K_USERS.md`. |
| **Blockers** | None. CodeGraph index initialized and operational. |
| **Cumulative Effort** | Session effort logged; git working tree preserved completely. |
| **Next Steps** | Return full attention to existing development scope as directed by Manoj. |
