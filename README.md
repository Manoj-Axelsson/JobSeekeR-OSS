# JobSeekeR™ OSS

### Open-Source Career Intelligence Platform

Helping jobseekers make evidence-based career decisions through intelligent software—not guesswork.

🌐 **Live Demo:** https://jobseeker.website

---

[![Release](https://img.shields.io/badge/release-v1.0.1-blue.svg)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-success.svg)](public/manifest.json)
[![Accessibility](https://img.shields.io/badge/WCAG-2.1%20AA-success.svg)]()

---

# 🌟 Overview

JobSeekeR™ OSS is an open-source Career Intelligence Platform designed to help jobseekers automate job discovery, analyze opportunities, optimize application material and make evidence-based career decisions.

Unlike traditional job boards, JobSeekeR™ combines recruiter analytics, company intelligence, document parsing, labor market insights and predictive recommendations into a single privacy-first application.

Built around Sweden's official **Arbetsförmedlingen JobTech API**, the platform has been architected for future expansion into the Nordic labor market.

---

# ✨ Key Features

- 🤖 Automated job scanning
- 🎯 Multi-domain job matching
- 📄 Intelligent CV & certificate parsing
- 📋 Application tracking
- 📈 Labour market analytics
- 💰 Salary intelligence
- 🎓 Learning ROI recommendations
- 🔮 Predictive career intelligence
- 📱 Progressive Web App (PWA)
- 🔒 Local-first privacy architecture

---

# 🧠 Intelligence Platform

| Intelligence               | Purpose                                                      |
|----------------------------|--------------------------------------------------------------|
| 🧠 Recruiter Intelligence  | Analyse recruiter behaviour and response patterns            |
| 🏢 Company Intelligence    | Track employer responsiveness and callback rates             |
| 📄 Document Intelligence   | Parse CVs and certificates into structured competences       |
| 📈 Market Intelligence     | Analyse Swedish labour market demand and technology trends   |
| 🎓 Learning Intelligence   | Recommend the highest ROI upskilling opportunities           |
| 💰 Salary Intelligence     | Parse and compare Swedish salary ranges                      |
| 🎯 Match Intelligence      | Multi-domain competence and role fit analysis                |
| 🔮 Predictive Intelligence | Evidence-based recommendations powered by real user activity |

---

# 🔒 Privacy First

JobSeekeR™ follows a strict **local-first architecture**.

Candidate profiles, CVs, applications, match scores and personal career data remain under the user's control using an embedded SQLite database.

No personal career information is shared with external data brokers or third-party analytics platforms.

---

# 📱 Progressive Web App

Install JobSeekeR™ directly from your browser.

Supported platforms:

- 🍎 iPhone & iPad
- 🤖 Android
- 💻 macOS
- 🪟 Windows

No installation package is required.

---

# 🏗️ Technology Stack

| Layer          | Technology                     |
|----------------|--------------------------------|
| Frontend       | Next.js + React                |
| Language       | TypeScript                     |
| Database       | Prisma ORM + SQLite            |
| Styling        | Tailwind CSS                   |
| Authentication | Local Authentication           |
| Deployment     | Vercel                         |
| Data Source    | Arbetsförmedlingen JobTech API |

---

# 📁 Documentation

- 📄 [Architecture Decision Records](docs/architecture/ADR-001-local-first-architecture.md)
- 🧠 [Intelligence Subsystems Guide](docs/INTELLIGENCE_SUBSYSTEMS.md)
- 🛣️ [v2.0 Nordic & SaaS Roadmap](docs/roadmap/ROADMAP_v2.0_NORDIC_SAAS.md)
- 🖥️ [Tauri Desktop Readiness](docs/TAURI_READINESS.md)
- 📋 [Release Checklist](docs/RELEASE_CHECKLIST.md)
- ⚖️ [MIT License](LICENSE)
- 🤝 [Contribution Guidelines](CONTRIBUTING.md)

---

# 🚀 Quick Start

Clone the repository

```bash
git clone https://github.com/Manoj-Axelsson/JobSeekeR-OSS.git
cd JobSeekeR-OSS
```

Install dependencies

```bash
npm install
```

Prepare the database

```bash
npx prisma db push
```

Run the development server

```bash
npm run dev
```

Open your browser

```
http://localhost:3000
```

---

# 🛣️ Roadmap

## Version 2.0 (Target: September / October 2026 ~ 6 Weeks)
*Detailed Specification: [docs/roadmap/ROADMAP_v2.0_NORDIC_SAAS.md](docs/roadmap/ROADMAP_v2.0_NORDIC_SAAS.md)*

- 📬 **SaaS Jobs Digest Parser & LinkedIn Feed Scraper**
- 🇸🇪 **Swedish & Remote (EMEA / Europe) Location Filtering**
- 🌍 **Nordic Market Open APIs** (🇸🇪 Sweden, 🇳🇴 Norway, 🇩🇰 Denmark, 🇫🇮 Finland)
- 🤝 **Rootr Ecosystem Local-First Integration Hooks** (`/api/rootr/export`)
- 🌐 **Nordic Country & Region Filter Tabs UI**

---

# 🤝 Contributing

Contributions are welcome.

Please read the [Contribution Guidelines](CONTRIBUTING.md) before submitting pull requests.

---

# 📄 License

This project is released under the MIT License.

See the [LICENSE](LICENSE) file for details.

---

# 🦆 RubberDuckWorks

Developed inside the **RubberDuckWorks Engineering Systems Laboratory**.

> **ENGINEER • THINK • BUILD • IMPROVE**