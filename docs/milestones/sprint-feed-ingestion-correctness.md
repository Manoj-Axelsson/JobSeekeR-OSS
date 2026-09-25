# Sprint Milestone — Feed & Ingestion Correctness

## Executive Summary

| Property | Value |
|---|---|
| Milestone Status | **PLANNED / IN PROGRESS** |
| Target Integration Branch | main |
| Start Date | September 25, 2026 |
| Domain Focus | Feed semantics, ingestion correctness & engineering maintenance |

This milestone strengthens JobSeekeR-OSS as a maintained software system rather than treating the project as a sequence of isolated feature implementations.

The iteration establishes a trustworthy separation between job discovery, source publication, feed presentation, and explicit user application activity.

It also records an important engineering-learning milestone: the project is increasingly demonstrating the ability to investigate existing behaviour, trace root causes across system boundaries, make targeted changes, preserve working architecture, and validate the result systematically.

## Scope

The milestone addresses:

- Direct URL import semantics.
- Separation of discovery/import from application activity.
- Source publication-date semantics.
- Primary Feed ordering.
- Preservation of existing JobTech and LinkedIn ingestion behaviour.
- Evaluation and integration of additional Swedish job sources:
  - webbjobb.io
  - The Hub
  - JobbSafari
- Reuse of the existing canonical JobAd, identity and deduplication pipeline.
- Regression coverage for the corrected behaviour.
- Full post-change verification through tests, TypeScript validation and production build.

## Domain Invariant

> **A discovered or imported job is not an application. An Application exists only after the user explicitly records that they applied.**

The system therefore distinguishes:

```
Discovery
   ↓
JobAd
   ↓
User decision
   ├── Save
   ├── Discard
   └── Apply
          ↓
      Application
```

A direct URL import must not create an Application unless the user explicitly selects the applied state.

## Publication Date Contract

`publishedAt` represents the publication date supplied by the source, not the moment JobSeekeR discovers or imports the job.

The intended feed ordering is:

```
ORDER BY publishedAt DESC
```

This prevents status changes or later discovery from incorrectly making older opportunities appear newer.

Where a source does not provide a publication date, the system must not silently treat import time as verified publication time without an explicit domain decision.

## Ingestion Contract

All supported providers should converge on the same canonical ingestion representation:

- `source`
- `externalId`
- `title`
- `company`
- `location`
- `description`
- `webpageUrl`
- `publishedAt`
- `deadline`

The intended flow is:

```
JobTech ───────┐
LinkedIn ──────┤
webbjobb.io ───┤
The Hub ───────┤──→ Canonical JobAd
JobbSafari ────┘          ↓
                    Identity / Deduplication
                          ↓
                       Feed
```

Provider-specific ingestion remains separate from the shared JobAd identity and deduplication boundary.

## Root-Cause Learning

The direct URL import issue illustrates the maintenance approach used in this iteration.

Observed behaviour suggested that an imported job was being treated as already applied. Investigation traced the behaviour through the UI and API rather than immediately changing the database model.

The investigation established:

- The importer API already defaults an unspecified status to `NEW`.
- The API creates an Application only when the requested job status is `APPLIED`.
- The incorrect default originates in the UI import workflow.

This establishes an engineering principle for the project:

> **Understand the execution path and locate the actual boundary defect before redesigning the domain model.**

## Engineering Learning Curve

This milestone deliberately records more than the resulting code changes.

JobSeekeR-OSS is evolving through the following engineering loop:

```
Design
  ↓
Implementation
  ↓
Testing
  ↓
Deployment
  ↓
Real-world usage
  ↓
Observed behaviour
  ↓
Root-cause investigation
  ↓
Targeted correction
  ↓
Regression protection
  ↓
Documentation
  ↓
Next iteration
```

The project therefore demonstrates progression from feature implementation toward system maintenance and engineering stewardship.

The iteration specifically demonstrates the ability to:

- Read and understand an existing codebase.
- Trace behaviour across UI, API, domain and persistence boundaries.
- Challenge assumptions about where a defect originates.
- Preserve existing working behaviour while making targeted corrections.
- Separate domain concepts that were previously coupled in behaviour.
- Establish explicit invariants before modifying implementation.
- Keep architectural improvements scoped rather than introducing unnecessary redesign.
- Validate changes through repeatable engineering gates.
- Document both technical outcomes and engineering reasoning.

## Verification Contract

Completion requires:

- Unit/integration test suite passes.
- TypeScript validation passes with zero errors.
- Production build passes.
- No unintended regression in existing JobTech or LinkedIn ingestion.
- Direct import no longer implies application.
- Primary Feed ordering reflects publication date semantics.
- New providers use the canonical ingestion boundary.
- `git diff --check` remains clean where applicable.
- Production verification remains a separate acceptance step from local verification.

## Protected Boundaries

The following remain outside this milestone:

- Candidate Experience / Employer Interaction domain.
- Employer acknowledgement tracking.
- Response-time analytics.
- Interview/rejection event modelling.
- Expanded JobAd lifecycle redesign.
- Expanded Application lifecycle redesign.
- JobAd Links API integration.
- Company-level employer ratings or rankings.
- Production duplicate reconciliation unrelated to this milestone.

These remain candidates for future, separately scoped work.

## Future Candidate Experience Domain

The project has identified a future opportunity to record factual employer interactions associated with individual applications, such as:

- application acknowledgement;
- response received;
- interview invitation;
- rejection;
- offer;
- response time;
- candidate notes.

This should be modelled as observed Candidate Experience / Employer Interaction data rather than as a mutable company-level rating.

It is intentionally not part of the current milestone.

## Completion Criteria

The milestone can be marked **COMPLETE** only after implementation and verification demonstrate that:

1. Direct URL imports default to `NEW`.
2. Importing/discovering a job does not create an Application.
3. Explicit application action continues to create the Application correctly.
4. Primary Feed ordering uses `publishedAt DESC`.
5. Publication-date semantics are preserved across ingestion paths.
6. Existing JobTech and LinkedIn ingestion remain operational.
7. Additional supported providers are integrated through the canonical ingestion boundary.
8. Regression tests cover the corrected semantics.
9. TypeScript and production build remain clean.
10. The resulting repository state is documented and reproducible.

## Closure

This milestone is complete when the corrected feed and ingestion semantics are implemented, verified and documented.

Its broader engineering significance is that JobSeekeR-OSS continues to serve as a practical record of iterative software engineering:

> **A mature software project is not defined by never encountering defects. It is defined by how effectively the team can observe, understand, isolate, correct, validate and document them without destabilizing the system.**

