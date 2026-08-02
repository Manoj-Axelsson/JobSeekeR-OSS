# JobseekeR™ Intelligence Suite

> **"JobseekeR™ is an intelligence platform built to automate job searching."**

[![Version](https://img.shields.io/badge/version-v1.0.0--rc1-amber.svg)](file:///Users/manoj-axelsson/Development/atlas-talent-navigator/package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](file:///Users/manoj-axelsson/Development/atlas-talent-navigator/LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![PWA Ready](https://img.shields.io/badge/PWA-iOS%2FAndroid%2FMac%2FWin-blue.svg)](file:///Users/manoj-axelsson/Development/atlas-talent-navigator/public/manifest.json)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-success.svg)]()

---

## 🌟 Overview

**JobseekeR™** connects directly to Sweden's official **Arbetsförmedlingen JobTech API** and external career links (LinkedIn, Platsbanken) to automatically scan, score, match, and organize job postings using local-first career intelligence.

Developed by **RubberDuckWorks — ENGINEER • THINK • BUILD • IMPROVE**.

---

## 🤖 The 8 Pillars of JobseekeR™ Intelligence Suite

1. 🧠 **Recruiter Intelligence**: Tracks recruiter response speeds, reply rates, and portfolio requirements.
2. 🏢 **Company Intelligence**: Monitors employer callback ratios and flags ghosting risk.
3. 📄 **Document Intelligence**: Automated PDF/Word CV parsing & skill taxonomy extraction.
4. 📈 **Market Intelligence**: Real-time Swedish tech stack demand trends (`React ↑`, `.NET →`, `Python ↑`, `AI ↑`).
5. 🎓 **Learning Intelligence**: Upskilling recommendations with highest ROI course projections (*Docker +18% Boost*).
6. 💰 **Salary Intelligence**: Swedish SEK salary range parser (*45 000 – 65 000 SEK/mån*).
7. 🎯 **Match Intelligence**: Multi-domain fit scoring across Software, Systems, Quality, and Manufacturing taxonomies.
8. 🔮 **Predictive Intelligence**: Evidence-based mathematical interview probability predictions and progressive activation states.

---

## 🔒 Local-First Privacy Architecture

JobseekeR™ operates under a strict **local-first privacy philosophy**. All candidate CVs, application logs, match scores, and profile details are stored locally on your device in an embedded SQLite database (`prisma/dev.db`). No personal career data is sent to external servers or data brokers.

---

## 📱 Progressive Web App (PWA) & 1-Click Installer

JobseekeR™ is a Progressive Web App ready for 1-click installation:
- **iPhone / iPad**: Open Safari → Share → **Add to Home Screen**.
- **Android**: Open Chrome → Tap **Install JobseekeR App**.
- **Mac & Windows**: Click the **Install App** icon in the browser address bar.

---

## 📁 Architecture & Documentation

- 📄 [Architecture Decision Records (ADRs)](file:///Users/manoj-axelsson/Development/atlas-talent-navigator/docs/architecture/)
- 🧠 [Intelligence Subsystems Guide](file:///Users/manoj-axelsson/Development/atlas-talent-navigator/docs/INTELLIGENCE_SUBSYSTEMS.md)
- 🖥️ [Tauri Desktop Packaging Readiness](file:///Users/manoj-axelsson/Development/atlas-talent-navigator/docs/TAURI_READINESS.md)
- ⚖️ [MIT License](file:///Users/manoj-axelsson/Development/atlas-talent-navigator/LICENSE)
- 🤝 [Contribution Guidelines](file:///Users/manoj-axelsson/Development/atlas-talent-navigator/CONTRIBUTING.md)

---

## 🚀 Quick Start for Developers

```bash
# Clone the repository
git clone https://github.com/Manoj-Axelsson/atlas-talent-navigator.git
cd atlas-talent-navigator

# Install dependencies
npm install

# Run database migrations
npx prisma db push

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
