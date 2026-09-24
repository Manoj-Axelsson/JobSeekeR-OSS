# Contributing to JobSeekeR™

Thank you for your interest in contributing to JobSeekeR™ — an evidence-based Career Intelligence Platform.

## Engineering Principles

- Explicit deployment architecture: local/desktop deployments may use SQLite; the authenticated cloud web deployment uses PostgreSQL.
- Ownership boundaries: user-owned records must remain scoped to the authenticated UserAccount; do not trust client-supplied ownership identifiers.
- Evidence-based intelligence: recommendations and scores must be explainable and must not fabricate candidate evidence.
- Accessibility: maintain the project's accessibility requirements when changing user-facing interfaces.
- Small, reviewable changes: preserve clear feature boundaries and conventional commit messages.

## Getting Started

1. Fork the repository.
2. Clone your fork.
3. Install dependencies with npm install.
4. Configure a PostgreSQL DATABASE_URL for local development.
5. Generate the Prisma client with npx prisma generate.
6. Apply the current schema with npx prisma db push.
7. Start the development server with npm run dev.

## Verification Before Pull Request

Run the core checks used by CI:

    npx tsc --noEmit
    npm test -- --run
    npm run build

For PostgreSQL integration tests, ensure TEST_DATABASE_URL points to an isolated test database.

A successful local test run and a successful GitHub Actions run verify the committed code under those environments. They do not independently prove that a particular production deployment is serving that commit.

## Pull Requests

- Create a descriptive branch name such as feat/... or fix/....
- Use conventional commit messages.
- Explain architectural or schema changes explicitly.
- Include relevant test evidence.
- Do not commit secrets, local database files, or environment-specific credentials.

## Architecture Documentation

Significant architectural decisions belong in an ADR. When an existing decision changes, update the relevant ADR or add a new one rather than silently rewriting history.