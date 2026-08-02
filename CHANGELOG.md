# Changelog

All notable changes to **JobseekeR™** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
