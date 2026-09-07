# How to Download, Set Up, and Customize JobSeekeR

JobSeekeR™ is an open-source Career Intelligence Platform for job discovery, competence assessment, application tracking and evidence-based career decision support.

This guide describes the current repository setup and distinguishes local development from authenticated cloud deployment.

## 1. Prerequisites

- Node.js compatible with the current project toolchain
- Git
- PostgreSQL for the current Prisma schema
- A browser for the Next.js application

## 2. Clone and Install

```bash
git clone https://github.com/Manoj-Axelsson/JobSeekeR-OSS.git
cd JobSeekeR-OSS
npm install
```

## 3. Configure the Database

The current checked-in Prisma schema uses PostgreSQL. Configure an isolated local development database through DATABASE_URL.

Example:

```
postgresql://postgres:YOUR_PASSWORD@localhost:5432/jobseeker_dev?schema=public
```

For integration testing, use a separate TEST_DATABASE_URL database. Never commit real credentials.

Then:

```bash
npx prisma generate
npx prisma db push
```

The SQLite local-first path remains an architectural desktop option, but it is **not the current checked-in Prisma datasource**. A future desktop implementation must explicitly provide and verify its SQLite schema/configuration rather than assuming the current PostgreSQL schema can be used unchanged.

## 4. Start the Application

```bash
npm run dev
```

Open http://localhost:3000.

## 5. Verify Changes

```bash
npx tsc --noEmit
npm test -- --run
npm run build
```

The CI workflow provisions PostgreSQL automatically. A green CI run verifies the committed repository under CI; it is not, by itself, proof that the same commit is serving production.

## 6. Deployment Architecture

- Local/desktop direction: SQLite remains a valid architectural option requiring an explicit SQLite deployment configuration.
- Authenticated cloud web deployment: PostgreSQL with UserAccount ownership scoping.
- Production deployment: Vercel, with DATABASE_URL supplied through the deployment environment.

For architectural history, see ADR-001 and ADR-002.

## Historical Note

Older versions of this guide described SQLite as the universal application database. That description is obsolete for the current PostgreSQL-backed web schema.
