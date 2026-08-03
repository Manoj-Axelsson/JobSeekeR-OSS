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
- **Phase 4: Application Coaching Engine (`src/intelligence/coaching/`)**: Added career strategist coaching advisor answering "*How can Anna communicate this authentically?*", generating interview talking points and cover letter hooks while enforcing a strict non-fabrication guarantee and XSS sanitization.
- **Phase 5: Decision Support Engine (`src/intelligence/decision/`)**: Integrated all 4 intelligence sub-engines into a unified 5-stage Decision Support flow answering "*Anna decides whether to apply*".
- **Peer Review & Architecture Guide (`docs/PEER_REVIEW_GUIDE_v2.0.md`)**: Comprehensive documentation artifact detailing the domain architecture, sequence flows, and 8-dimension QA audit findings for peer reviewers.
- **Independent Vitest Unit Test Suites & 8-Dimension QA Audit**: Created unit test coverage across `competency.test.ts`, `opportunity.test.ts`, `positioning.test.ts`, `coaching.test.ts`, `decision.test.ts`, `qa_audit.test.ts`, and `matcher.test.ts` (23/23 tests passing).

---

## [1.0.2] - 2026-08-03

### Added & Improved
- **Mobile Responsive Navbar**: Built a responsive navigation header for `Navbar.tsx` and `landing/page.tsx` featuring responsive logo brand scaling (`text-2xl` to `text-5xl`), a compact quick-scan mobile action bar, and an animated mobile hamburger menu drawer panel.
- **Mobile Menu Drawer**: Integrated complete navigation tab switching (Feed, Tracker, Profile, Intelligence, Logs, Settings), quick actions (Home, Run Job Scan, User Profile, Upload Files, Guided Setup), Language Selector (Swedish, English, Norwegian, Danish), Accessibility/Audio TTS, and Theme Mode directly inside the mobile navbar drawer.
- **Application-Wide Interactive Button Hover & Active Design System**: Added enhanced micro-interactions, `hover:scale-105`, `hover:shadow-xl`, `hover:shadow-amber-400/40`, active scale compression (`active:scale-95`), and smooth transitions across all buttons in `Navbar`, `SidebarNav`, `LandingPage`, and UI modals.

### Fixed
- **Mobile Viewport Overflow**: Resolved desktop button horizontal overflow and layout clipping on mobile viewports (< 768px).
