# JobSeekeR™ OSS

### Open-Source Career Intelligence Platform

Helping jobseekers make evidence-based career decisions through intelligent software—not guesswork.

🌐 **Live Application:** https://jobseeker.website

---

[![Release](https://img.shields.io/badge/release-v1.0.1-blue.svg)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-success.svg)](public/manifest.json)

---

# 🌟 Overview

JobSeekeR™ OSS is an open-source Career Intelligence Platform designed to help jobseekers automate job discovery, analyze opportunities, optimize application material and make evidence-based career decisions.

The platform combines job ingestion, canonical vacancy identity and deduplication, candidate/account ownership, document parsing, competency and opportunity intelligence, application tracking, and explainable decision support.

The project currently supports a **PostgreSQL-backed authenticated web deployment** and retains a **SQLite local-development/desktop path as an architectural option**. These deployment modes are intentionally distinguished rather than treated as the same persistence model.

Sweden's official **Arbetsförmedlingen JobTech API** remains the primary job-data integration, with the architecture prepared for future Nordic expansion.

---

# ✨ Current Capabilities

- 🤖 Automated job ingestion and scanning
- 🎯 Multi-domain competence and opportunity assessment
- 🧭 Primary vs. Discovery search/feed separation
- 📄 CV and certificate document parsing
- 🧬 Canonical job identity and cross-source deduplication
- 👤 Account-scoped job and application ownership
- 📋 Application tracking
- 📈 Labour-market and salary intelligence
- 🧠 Evidence-first positioning, coaching and decision support
- 📱 Progressive Web App support
- 🔒 Explicit ownership and privacy boundaries

---

# 🧠 Intelligence & Decision Support

The current intelligence architecture is organized around domain-specific services:

| Subsystem | Purpose |
|---|---|
| Opportunity | Determines whether an opportunity merits pursuit |
| Competency | Evaluates candidate competencies, relationships and transferability |
| Positioning | Determines how existing candidate evidence should be presented |
| Coaching | Provides non-fabricating application and interview guidance |
| Decision | Synthesizes intelligence into explainable decision support |
| Pipeline | Classifies eligibility, capability and intent |
| Canonical Identity | Resolves duplicate representations of the same vacancy |

The governing product principle is:

> **AI assists. Humans decide.**

Recommendations are intended to be evidence-first and explainable; the system must not fabricate candidate experience, qualifications or achievements.

---

# 🗄️ Persistence Architecture

JobSeekeR uses deployment-specific persistence:

- **Cloud Web:** PostgreSQL, with authenticated `UserAccount` ownership boundaries.
- **Local / Desktop Direction:** SQLite remains a local-first architectural option; the current checked-in Prisma schema is PostgreSQL and is not itself a SQLite desktop schema.
- **ORM:** Prisma.

The production web architecture does **not** fall back to an ephemeral local database when PostgreSQL is unavailable. Production database configuration is an explicit deployment contract.

See:
- [ADR-001 — Local-First Architecture](docs/architecture/ADR-001-local-first-architecture.md)
- [ADR-002 — Production Persistence & Account Ownership](docs/adr/ADR-002-production-persistence-and-account-ownership.md)
- [ADR-004 — Career, Search & Territory Domain Model](docs/architecture/ADR-004-decoupled-career-search-and-territory-domain-model.md)

---

# 🧪 Verification Status

The repository has a verified implementation baseline at commit `7afefa2` from September 6, 2026:

- **33 test files passed**
- **118 tests passed**
- **0 skipped**
- **0 failed**

The PostgreSQL-backed integration suite is included in that verification. The subsequent documentation-reconciliation commits on September 7 also passed GitHub Actions.

CI success establishes that the committed repository passes its configured automated verification. **It does not, by itself, prove that the same commit is serving the live production application.** Live production verification remains a separate operational check.

For milestone-specific evidence, see [Phase 5 Gate 3](docs/milestones/phase-5-gate-3-canonical-identity.md).

---

# 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + React |
| Language | TypeScript |
| Database / ORM | PostgreSQL + Prisma |
| Local database option | SQLite architectural path for local/desktop deployment |
| Styling | Tailwind CSS |
| Authentication | Local/session-derived account authentication |
| Deployment | Vercel |
| Primary data source | Arbetsförmedlingen JobTech API |

---

# 📁 Documentation

- 🏛️ [Architecture Decision Records](docs/architecture/README.md)
- 🧠 [Intelligence Subsystems Guide](docs/INTELLIGENCE_SUBSYSTEMS.md)
- 🧪 [Phase 5 Gate 3 — Canonical Identity](docs/milestones/phase-5-gate-3-canonical-identity.md)
- 🔧 [Production Persistence Repair & Acceptance Record](docs/verification/PRODUCTION-PERSISTENCE-REPAIR-ACCEPTED.md)
- 🛣️ [v2.0 Nordic & SaaS Roadmap](docs/roadmap/ROADMAP_v2.0_NORDIC_SAAS.md)
- 🖥️ [Tauri Desktop Readiness](docs/TAURI_READINESS.md)
- 📋 [Release Checklist](docs/RELEASE_CHECKLIST.md)
- 🤝 [Contribution Guidelines](CONTRIBUTING.md)
- ⚖️ [MIT License](LICENSE)

---

# 🚀 Quick Start

Clone the repository:

```bash
git clone https://github.com/Manoj-Axelsson/JobSeekeR-OSS.git
cd JobSeekeR-OSS
```

Install dependencies:

```bash
npm install
```

For local development, configure a PostgreSQL `DATABASE_URL` and then run:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

Open:

```
http://localhost:3000
```

The repository's CI workflow provisions an isolated PostgreSQL service for automated verification.

---

# 🛣️ Roadmap

## Version 2.0

**Status:** Planned / queued.

The v2.0 roadmap covers Nordic market expansion, additional job-digest ingestion, Swedish/remote filtering, and Rootr ecosystem integration.

See [ROADMAP_v2.0_NORDIC_SAAS.md](docs/roadmap/ROADMAP_v2.0_NORDIC_SAAS.md).

---

# 🤝 Contributing

Contributions are welcome.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes.

---

# 📄 License

This project is released under the MIT License.

See [LICENSE](LICENSE) for details.

---

# 🦆 RubberDuckWorks

Developed inside the **RubberDuckWorks Engineering Systems Laboratory**.

> **ENGINEER • THINK • BUILD • IMPROVE**
