# Changelog

All notable changes to **JobSeekeR™** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-03

### Changed & Dynamic Intelligence Upgrade
- **Application-Wide Placeholder Cleanup**: Conducted a sweeping QA audit across all 8 intelligence subsystems (`company`, `document`, `learning`, `recruiter`, `cv`, `market`, `predictive`, `scoring`, `analytics`).
- **Dynamic Today's Recommendation**: Replaced static fallback cards with 100% dynamic, context-aware cards. Button clicks now directly open top matched job cards, trigger live JobTech scans, open document uploaders, or switch active tabs.
- **Full LinkedIn Job Description Scraping**: Integrated `fetchLinkedInJobDetails()` in `linkedin.ts` to parse complete public job descriptions, responsibilities, and required qualifications instead of short 15-word template strings.
- **Domain-Aware Pitch Strategy Engine**: Rewrote `evaluateJobMatch()` in `matcher.ts` to generate tailored cover letter opening hooks, gap mitigation strategies, and bullet points specific to the position's domain (Automation & Production, Quality Engineering, Systems Engineering, or Software Engineering).
- **Dynamic Apply Labels**: Automatically detects job listing source, rendering `↗️ Apply on LinkedIn` for LinkedIn listings and `↗️ Apply on Platsbanken` for JobTech listings.
- **Dynamic Intelligence Suite Math**: Replaced static mock values with mathematical models for company response rates, document skills counts, upskilling ROI roadmaps, recruiter analytics, CV conversion metrics, market trends, and overall career scorecards.

### Fixed
- Fixed unclickability issue on Card 1 ("View Matched Positions Feed") when user was already on the `feed` tab.
- Fixed hardcoded "Version 8 (Fullstack Architecture)" and "50% conversion rate" static text across recommendation cards and summary widgets.
- Fixed hardcoded "Docker & Kubernetes" upskilling recommendations for non-software engineering candidate profiles.

---

## [1.0.0-rc1] - 2026-08-02

### Added
- **Unified 8-Pillar JobseekeR™ Intelligence Suite**: Modular architecture under `src/intelligence/` (`recruiter`, `company`, `document`, `market`, `learning`, `salary`, `match`, `prediction`).
- **Mathematical Confidence Model**: Evidence-based formula calculated from candidate application logs with non-punitive states (`🌱 Learning` → `⚡ Ready` → `🎯 High Confidence`).
- **"Today's Recommendation" Synthesized Card**: Daily actionable synthesis card on feed header.
- **Consolidated Settings**: Coherent settings section categorized into `Account`, `Career`, `Automation`, `Accessibility`, `Privacy`, and `About`.
- **PWA Installation**: Cross-platform 1-click installation manifest (`public/manifest.json`).
- **Accessibility & TTS**: High-contrast black font rules for sight impairment, Web Speech API TTS audio reader, and WCAG 2.1 AA focus rings.
- **Architecture Documentation**: ADRs 001–003, `docs/INTELLIGENCE_SUBSYSTEMS.md`, and `docs/TAURI_READINESS.md`.
- **Community Standards**: Open-source MIT License, `CONTRIBUTING.md`, and `.github/` templates.
