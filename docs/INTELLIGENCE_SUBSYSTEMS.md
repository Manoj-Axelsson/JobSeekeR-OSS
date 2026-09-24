# JobSeekeR™ Intelligence Subsystems Architecture

This document describes the principal intelligence subsystems represented under `src/intelligence/` and the service layers that integrate them.

> **Product principle:** AI assists. Humans decide.

## 1. Opportunity Intelligence

Evaluates whether an opportunity merits pursuit using structured opportunity signals.

Implementation: `src/intelligence/opportunity/`

## 2. Competency Intelligence

Evaluates candidate competencies, relationships and transferability rather than relying only on literal keyword overlap.

Implementation: `src/intelligence/competency/`

## 3. Positioning Intelligence

Determines how the candidate's existing evidence should be presented for a target opportunity.

Implementation: `src/intelligence/positioning/`

## 4. Application Coaching

Provides non-fabricating application and interview coaching based on evidence already available to the system.

Implementation: `src/intelligence/coaching/`

## 5. Decision Support

Synthesizes intelligence into decision context while retaining candidate agency.

Implementation: `src/intelligence/decision/`

## 6. Supporting Services

The repository also contains supporting modules for market, salary, prediction, recommendations, matching and scoring:

- `src/intelligence/market/`
- `src/intelligence/salary/`
- `src/intelligence/prediction/`
- `src/intelligence/predictive/`
- `src/intelligence/recommendations/`
- `src/intelligence/match/`
- `src/intelligence/scoring/`
- `src/lib/services/matcher.ts`

These are implementation modules and should not automatically be interpreted as separate product promises.

## Evidence & Non-Fabrication

The decision-support architecture is evidence-first. Recommendations should be grounded in available candidate evidence and clearly distinguish known evidence from inference or missing information.

The system must not invent candidate experience, achievements, education or certifications.

## Verification

The repository contains focused Vitest suites for the intelligence subsystems and broader service/security behavior.

Historical test counts in older documents describe the repository state at the time those documents were written. For the current verification baseline, see the repository README and release checklist.
