# JobSeekeR: Comprehensive Technical Report & Customization Blueprint

**Author:** Manoj John Axelsson  
**Project:** JobSeekeR  
**Repository:** [github.com/Manoj-Axelsson/JobSeekeR-OSS](https://github.com/Manoj-Axelsson/JobSeekeR-OSS)  
**Date:** July 28, 2026  

---

## 1. Executive Summary & Purpose

**JobSeekeR** is an automated daily job market scanner, multi-domain skill matching engine, and monthly application tracking dashboard designed for the Swedish job market. 

Every day at **12:00 PM (noon)**, the application automatically fetches newly published job advertisements from Sweden's official public job database (**Arbetsförmedlingen JobTech API**), evaluates each job posting against a candidate's specific competence profile, calculates a weighted **Match Score (0-100%)**, generates **Cover Letter Pitch Strategies**, and logs applications on a monthly basis.

---

## 2. Full Tech Stack & Dependencies

The application is built on a modern, high-performance, self-contained architecture requiring zero paid external database hosting or third-party server infrastructure.

### Core Architecture & Frameworks
| Layer | Technology Used | Version / Details | Purpose |
| :--- | :--- | :--- | :--- |
| **Web Framework** | **Next.js** | `16.2.11` (App Router, Turbopack) | Server-side API routes, static site generation, fast client rendering |
| **UI Library** | **React** | `19.2.4` | Component-based interactive dashboard UI |
| **Language** | **TypeScript** | `^5.0.0` | Strict type safety across database models, API services, and UI components |
| **Styling** | **Tailwind CSS** | `^4.0.0` | Utility-first styling, glassmorphism, responsive grid layouts |
| **Typography** | **Cochin Serif** | `Cochin, Georgia, serif` | High-legibility serif typography (19px body text, 22-29px headers) |
| **Theme Engine** | **CSS Variables + React State** | Custom Theme Engine | Supports **Light Mode**, **Dark Mode**, and **System OS Preference** |

### Database & Persistence
| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Database** | **SQLite** | `prisma/dev.db` | Local file-based relational database (zero-config, self-contained) |
| **ORM** | **Prisma ORM** | `^6.19.3` (`@prisma/client`) | Type-safe database queries, schema migrations, and seeding |

### Data Integrations & Services
| Integration | Provider / Protocol | Endpoint | Function |
| :--- | :--- | :--- | :--- |
| **Swedish Job Stream API** | **Arbetsförmedlingen JobTech Open Data** | `https://jobsearch.api.jobtechdev.se/search` | Fetches real-time structured JSON job postings from Platsbanken |
| **Matching Engine** | **Custom Multi-Domain Classifier** | `src/lib/services/matcher.ts` | Weighted skill keyword matching, domain scoring, and gap analysis |
| **Cron Scanner** | **Next.js API Route** | `/api/cron/scrape` | Triggers daily scanning at 12:00 PM noon and logs scan results |

---

## 3. How to Use this Dashboard for Specific Job Searches

The system can be configured to target any specialized job search criteria in Sweden or internationally.

### A. Configuring Target Job Keywords & Roles
Search queries are managed in [`src/lib/services/jobtech.ts`](file:///Users/manoj-axelsson/Development/JobSeekeR-OSS/src/lib/services/jobtech.ts#L16). 
You can customize the `keywords` array to search for specific roles:

```typescript
// Example: Targeting Software, Systems, Manufacturing, and Quality Engineering
const defaultKeywords = [
  "fullstack", 
  "react typescript", 
  "systems engineer", 
  "manufacturing engineer", 
  "quality engineer", 
  "automation engineer",
  "requirement engineer"
];
```

### B. Adjusting Minimum Match Thresholds
On the **Competence Profile & Skills** tab of the dashboard, you can adjust the **Minimum Match Threshold slider** (e.g. `45%`, `60%`, `75%`). 
- Only job ads meeting or exceeding this match threshold will be saved to your **Daily Feed**.

### C. Using the Strategic Cover Letter & Pitch Insights
When viewing any job card, clicking **"💡 Score Breakdown & Pitch Strategy"** opens a detailed breakdown containing:
1. **Why This Job Matched You:** Specific competence domain alignment (e.g., Software, Systems, Quality, Industrial).
2. **Potential Skill Gaps:** Specific technologies mentioned in the ad that you may be missing (e.g., *Docker, AWS, ISO 13485*).
3. **Tailored Application Pitch Strategy:**
   - *Recommended Cover Letter Opening Line*
   - *How to Frame & Address Missing Qualifications*
   - *Key Copyable Resume/Cover Letter Bullet Points*

### D. Monthly Application Log & Tracker
Under the **Monthly Application Tracker** tab, all applied positions are organized by month (`2026-07`, `2026-08`, etc.). You can track application statuses (`Applied`, `Interviewing`, `Offer Received 🎉`, `Rejected`) and record notes per job application.

---

## 4. How Others Can Download & "Train" This Model for Their Own Profile

**Yes! This system is 100% open-source, modular, and easy for any job seeker or organization to clone, configure, and "train" for their specific career profile.**

### Step 1: Clone the Repository
```bash
git clone https://github.com/Manoj-Axelsson/JobSeekeR-OSS.git
cd JobSeekeR-OSS
npm install
```

### Step 2: "Train" (Configure) the Model to a New Candidate Profile

#### 1. Update the Candidate Profile Seed ([`prisma/seed.ts`](file:///Users/manoj-axelsson/Development/JobSeekeR-OSS/prisma/seed.ts))
Replace Manoj's profile data with the new candidate's name, headline, target roles, and skill domains:

```typescript
// prisma/seed.ts
const newCandidateProfile = {
  id: "user_main",
  name: "Jane Doe",
  headline: "DevOps Engineer | Cloud Architect | Kubernetes Specialist",
  location: "Stockholm, Sweden",
  targetRoles: JSON.stringify(["DevOps Engineer", "Cloud Architect", "Site Reliability Engineer"]),
  skills: JSON.stringify({
    domain1: ["AWS", "Kubernetes", "Docker", "Terraform", "CI/CD"],
    domain2: ["Linux", "Python", "Bash", "Prometheus", "Grafana"],
  }),
  minMatchScore: 50,
};
```

#### 3. Customize Skill Taxonomy & Keywords ([`src/lib/services/matcher.ts`](file:///Users/manoj-axelsson/Development/JobSeekeR-OSS/src/lib/services/matcher.ts#L22))
Modify the `TAXONOMY` object in `matcher.ts` to reflect the candidate's core domain keywords:

```typescript
const TAXONOMY = {
  cloud: ["aws", "azure", "gcp", "terraform", "cloudformation"],
  devops: ["kubernetes", "docker", "ci/cd", "github actions", "helm"],
  monitoring: ["prometheus", "grafana", "datadog", "elk", "opentelemetry"],
};
```

### Step 3: Initialize Database & Run Seed
```bash
# Push Prisma schema to create local SQLite database (dev.db)
npx prisma db push

# Seed candidate profile
npx tsx prisma/seed.ts
```

### Step 4: Run Initial Job Scan & Launch Dashboard
```bash
# Run initial scan from Arbetsförmedlingen JobTech API
npx tsx scripts/test-scrape.ts

# Start development dashboard
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view your personalized job market scanner!

---

## 5. Summary & Key Advantages

1. **Zero Hosting Cost:** Runs completely on your local machine with a zero-maintenance SQLite database (`prisma/dev.db`).
2. **Official Data Integrity:** Directly connected to Sweden's public Arbetsförmedlingen JobTech API for accurate, real-time job listings.
3. **Strategic Pitch Generator:** Automatically provides cover letter opening hooks and gap mitigation strategies for every job.
4. **Accessible Design:** Features high-contrast Cochin serif typography, adjustable text sizing, Light/Dark/System themes, and monthly tracking logs.
