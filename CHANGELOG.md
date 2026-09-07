# Changelog

All notable changes to **JobSeekeR™** are documented here.

The format follows Keep a Changelog and Semantic Versioning.

## [Unreleased]

### Documentation & Verification

- Reconciled public documentation with the current PostgreSQL-backed authenticated web architecture.
- Clarified that SQLite remains a local/desktop deployment option rather than the universal production database.
- Documented the Phase 5 canonical identity, deduplication and concurrency milestone.
- Recorded the current repository verification baseline: 33 test files and 118 tests passing, with PostgreSQL integration coverage included.
- Explicitly separated GitHub/CI verification from live-production verification.

## [1.0.1]

Current package version in package.json.

The 1.0.1 release line includes the post-1.0 platform architecture and engineering work present in the repository.

## [2.0.0] - 2026-08-04

### Added & Architecture Overhaul

- AXIS JobSeekeR Intelligence Framework v2.0: shifted platform focus from AI content generation to an authentic, human-centred Decision Support Platform ("AI assists. Humans decide.").
- Phase 0 & 1: competency domain model and graph engine.
- Phase 2: opportunity intelligence engine with five-tier opportunity classification.
- Phase 3: positioning intelligence engine.
- Phase 4: application coaching engine with non-fabrication guarantee and XSS sanitization.
- Phase 5: decision support engine.
- Peer Review & Architecture Guide.
- Independent Vitest unit test suites and the original 8-dimension QA audit.

## [1.0.2] - 2026-08-03

### Added & Improved

- Mobile responsive navigation.
- Mobile menu drawer and navigation actions.
- Application-wide interactive button hover and active design system.

### Fixed

- Mobile viewport overflow.

## Versioning Note

Some architecture and milestone documents use milestone/phase terminology rather than package-version terminology. These are deliberately retained as engineering history. The package version in package.json is the authoritative application version.
