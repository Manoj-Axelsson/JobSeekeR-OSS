# ADR 003: Evidence-Based Recommendations & Centralized Settings

- **Status**: Approved
- **Date**: 2026-08-02
- **Deciders**: Product Owner, Manoj Axelsson, Antigravity AI Team

## Context & Problem Statement
Users require actionable synthesis across job market feeds, competence profiles, and application logs rather than isolated stats. Additionally, users need a centralized interface to manage onboarding resets, privacy preferences, and scanner options.

## Decision Outcome
Chosen option: **"Today's Recommendation" Synthesis Card & Centralized Settings Section**.

### 1. "Today's Recommendation" Synthesis Engine
- Version 1 ONLY generates recommendations backed by existing data.
- Synthesizes top feed opportunities, active competence gaps, and recruiter response metrics.

### 2. Centralized Settings Section
- Provides 1-click **Restart Onboarding**, Scanner Auto-Run toggle, Confidence Meter visibility toggle, and Local SQLite Data Export/Clear options.

### Positive Consequences
- Users receive clear answers to: *What should I apply for? Why is it recommended? What should I do next?*
- Centralized user control over privacy and preferences.
