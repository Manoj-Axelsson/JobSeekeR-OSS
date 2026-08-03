# 🛣️ JobSeekeR v2.0 Roadmap & Architectural Specification

**Target Milestone:** Version 2.0 (v2.0.0) — September / October 2026 (~6 Weeks Window)  
**Status:** Planned / Queued  
**Focus:** SaaS Jobs Digest Parser, Swedish/Remote Filter Engine, Nordic Market Expansion, Rootr Ecosystem Integration

---

## 📅 Schedule & Strategy

JobSeekeR v1.1.0 will run in production for 6 weeks to collect real-world user feedback and usage metrics. In **September / October 2026**, **Version 2.0** will be executed according to this specification as a major platform release.

---

## 🚀 Key Modules & Architecture

### 1. 📬 SaaS Jobs Digest Parser & Location Filter
- **Digest Parser (`src/lib/services/saasDigest.ts`):** Automatically extracts jobs, companies, tech stacks, apply URLs, and remote policies from pasted LinkedIn digests, newsletters, or RSS feeds.
- **Swedish & Remote Filter:** Isolates roles with location `= Sweden / Stockholm / Gothenburg / Malmö` or `Remote (EMEA / Europe UTC+1 / UTC+2)`.
- **SaaS Taxonomy:** Adds PLG, ARR, SDR/BDR, CRM, and cloud-native stack matching to `src/lib/services/matcher.ts`.

### 2. 🌍 Nordic Market Expansion Subsystems
- **🇸🇪 Sweden:** Arbetsförmedlingen JobTech API (`jobsearch.api.jobtechdev.se`)
- **🇳🇴 Norway:** NAV Arbeidsplassen Open Data API (`arbeidsplassen.nav.no`)
- **🇩🇰 Denmark:** Jobindex / Jobnet Open Data Integration
- **🇫🇮 Finland:** Työmarkkinatori TE-Services Open Data API (`tyomarkkinatori.fi`)
- **Unified Competence Matching:** Cross-country 0–100% match score evaluation against a single candidate competence profile.

### 3. 🤝 Rootr Ecosystem Integration & UI Subsystems
- **Rootr Export Endpoint (`/api/rootr/export`):** Standardized local-first JSON sync endpoint for seamless integration into the Rootr platform.
- **NordicMarketSelector Component:** Country and region filter tabs (`🇸🇪`, `🇳🇴`, `🇩🇰`, `🇫🇮`, `🌐 Nordic SaaS / Remote`).
- **SaaSDigestImporter Component:** Interactive digest import drawer for instant parsing.

---

## 📄 Related Documentation
- 📄 [Architecture Decision Records](../architecture/ADR-001-local-first-architecture.md)
- 📊 [JobSeekeR Technical Report](../../JOBSEEKER_REPORT.md)
