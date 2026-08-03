# Changelog

All notable changes to **JobSeekeR™** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-08-04

### Added & Architecture Overhaul
- **AXIS JobSeekR Intelligence Framework v2.0**: Shifted platform focus from AI content generation to an authentic, human-centred Decision Support Platform ("*AI assists. Humans decide.*").
- **Phase 0 & 1: Competency Domain Model & Graph Engine (`src/intelligence/competency/`)**: Built canonical competency taxonomy nodes, relationship edges (`IS_CHILD_OF`, `ENABLES`, `REQUIRES`, `EQUIVALENT_TO`), and multi-hop graph transferability calculations with explainable rationale.
- **Phase 2: Opportunity Intelligence Engine (`src/intelligence/opportunity/`)**: Implemented 5-tier opportunity classification (`🌟 Excellent Match`, `🟢 Strong Match`, `🟡 Potential Match`, `🚀 Stretch Opportunity`, `⚪ Low Priority`) answering "*Should Anna pursue this?*".
- **Phase 3: Positioning Intelligence Engine (`src/intelligence/positioning/`)**: Implemented candidate profile analyzer answering "*How should Anna present her existing evidence?*", advising structural layout recommendations and missing evidence warnings without content fabrication.
- **Phase 4: Application Coaching Engine (`src/intelligence/coaching/`)**: Added career strategist coaching advisor answering "*How can Anna communicate this authentically?*", generating interview talking points and cover letter hooks while enforcing a strict non-fabrication guarantee.
- **Phase 5: Decision Support Engine (`src/intelligence/decision/`)**: Integrated all 4 intelligence sub-engines into a unified 5-stage Decision Support flow answering "*Anna decides whether to apply*".
- **Independent Vitest Unit Test Suites**: Created unit test coverage across `competency.test.ts`, `opportunity.test.ts`, `positioning.test.ts`, `coaching.test.ts`, `decision.test.ts`, and `matcher.test.ts`.

---

## [1.0.2] - 2026-08-03

### Added & Improved
- **Mobile Responsive Navbar**: Built a responsive navigation header for `Navbar.tsx` and `landing/page.tsx` featuring responsive logo brand scaling (`text-2xl` to `text-5xl`), a compact quick-scan mobile action bar, and an animated mobile hamburger menu drawer panel.
- **Mobile Menu Drawer**: Integrated complete navigation tab switching (Feed, Tracker, Profile, Intelligence, Logs, Settings), quick actions (Home, Run Job Scan, User Profile, Upload Files, Guided Setup), Language Selector (Swedish, English, Norwegian, Danish), Accessibility/Audio TTS, and Theme Mode directly inside the mobile navbar drawer.
- **Application-Wide Interactive Button Hover & Active Design System**: Added enhanced micro-interactions, `hover:scale-105`, `hover:shadow-xl`, `hover:shadow-amber-400/40`, active scale compression (`active:scale-95`), and smooth transitions across all buttons in `Navbar`, `SidebarNav`, `LandingPage`, and UI modals.

### Fixed
- **Mobile Viewport Overflow**: Resolved desktop button horizontal overflow and layout clipping on mobile viewports (< 768px).

---

## [1.0.1] - 2026-08-03

### Changed & Dynamic Intelligence Upgrade
- **Application-Wide Placeholder Cleanup**: Conducted a sweeping QA audit across all 8 intelligence subsystems (`company`, `document`, `learning`, `recruiter`, `cv`, `market`, `predictive`, `scoring`, `analytics`).
- **Dynamic Today's Recommendation**: Replaced static fallback cards with 100% dynamic, context-aware cards. Button clicks now directly open top matched job cards, trigger live JobTech scans, open document uploaders, or switch active tabs.
- **Full LinkedIn Job Description Scraping**: Integrated `fetchLinkedInJobDetails()` in `linkedin.ts` to parse complete public job descriptions, responsibilities, and required qualifications instead of short 15-word template strings.
- **Domain-Aware Pitch Strategy Engine**: Rewrote `evaluateJobMatch()` in `matcher.ts` to generate tailored cover letter opening hooks, gap mitigation strategies, and bullet points specific to the position's domain (Automation & Production, Quality Engineering, Systems Engineering, or Software Engineering).
- **Dynamic Apply Labels**: Automatically detects job listing source, rendering `↗️ Apply on LinkedIn` for LinkedIn listings and `↗️ Apply on Platsbanken` for JobTech listings.
- **Dynamic Intelligence Suite Math**: Replaced static mock values with mathematical models for company response rates, document skills counts, upskilling ROI roadmaps, recruiter analytics, CV conversion metrics, market trends, and overall career scorecards.
- **Public Live Download & Clone Counter**: Added `/api/analytics/downloads` API route and live glowing counter badge in `Navbar.tsx` displaying real-time public GitHub downloads, clones, and community interest.

### Fixed
- Fixed unclickability issue on Card 1 ("View Matched Positions Feed") when user was already on the `feed` tab.
- Fixed hardcoded "Version 8 (Fullstack Architecture)" and "50% conversion rate" static text across recommendation cards and summary widgets.
- Fixed hardcoded "Docker & Kubernetes" upskilling recommendations for non-software engineering candidate profiles.
