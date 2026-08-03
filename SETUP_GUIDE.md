# How to Download, Setup, and Customize JobSeekeR for Your Job Search

Welcome! **JobSeekeR™** is an automated daily job market scanner, skill matching engine, and monthly application tracking dashboard. It queries official Swedish job listings (from Arbetsförmedlingen JobTech API) every day at **12:00 PM (noon)** and evaluates them against a candidate's custom competence profile.

This guide explains how **anyone** can download this dashboard, run it on their computer for **free**, and customize ("train") it for their own specific career goals.

---

## 🌟 Key Features

- 📌 **Automated 12:00 PM Swedish Job Scanner:** Automatically fetches live job postings from Arbetsförmedlingen JobTech (Platsbanken).
- 🎯 **Multi-Domain Competence Matching:** Calculates a weighted **Match Score (0-100%)** based on your target skills.
- 💡 **Strategic Cover Letter Pitch Generator:** Analyzes job postings to give you:
  - *Why the job matched your background*
  - *Potential skill gaps / missing keywords*
  - *Tailored cover letter opening hooks & copyable bullet points*
- 📋 **Monthly Application Tracker:** Organizes applied jobs by month (`2026-07`, `2026-08`) with status badges (`Applied`, `Interviewing`, `Offer Received 🎉`, `Rejected`).
- ☀️ **Theme Engine:** Supports **Light Mode**, **Dark Mode**, and **System OS Preference** with high-contrast Cochin typography.
- 🔒 **100% Free & Private:** Uses a self-contained local SQLite database (`prisma/dev.db`). No paid server or API keys required!

---

## 🚀 Step-by-Step Setup Guide

### 1. Prerequisites
Ensure you have the following installed on your computer (Mac, Windows, or Linux):
- **Node.js** (v18 or newer) — Download from [nodejs.org](https://nodejs.org)
- **Git** — Download from [git-scm.com](https://git-scm.com)

---

### 2. Download / Clone the Project
Open your terminal (or Command Prompt) and run:

```bash
# Clone the repository
git clone https://github.com/Manoj-Axelsson/JobSeekeR-OSS.git

# Navigate into the project folder
cd JobSeekeR-OSS

# Install dependencies
npm install
```

---

### 3. Customize ("Train") the System for Your Career

You can easily adapt the system to match **any profession** (e.g. *Fullstack Developer, Nurse, Project Manager, Accountant, DevOps Engineer, Marketing Specialist*).

#### A. Edit Candidate Profile (`prisma/seed.ts`)
Open `prisma/seed.ts` in any code editor (like VS Code) and update your profile information:

```typescript
const defaultProfile = {
  id: "user_main",
  name: "Your Name",
  headline: "Your Target Profession / Title",
  location: "Sweden (Stockholm / Remote)",
  languages: "English, Swedish",
  targetRoles: JSON.stringify([
    "Your Target Role 1",
    "Your Target Role 2",
    "Your Target Role 3"
  ]),
  skills: JSON.stringify({
    domain1: ["Skill A", "Skill B", "Skill C"],
    domain2: ["Skill D", "Skill E", "Skill F"],
  }),
  minMatchScore: 45, // Minimum match % threshold to display in feed
};
```

#### B. Customize Skill Keywords (`src/lib/services/matcher.ts`)
Open `src/lib/services/matcher.ts` and customize the `TAXONOMY` keywords to match your industry:

```typescript
const TAXONOMY = {
  domain1: ["keyword1", "keyword2", "keyword3"],
  domain2: ["keyword4", "keyword5", "keyword6"],
};
```

#### C. Customize Search Terms (`src/lib/services/jobtech.ts`)
Open `src/lib/services/jobtech.ts` and set the search queries you want to fetch daily:

```typescript
// Keywords to search on Arbetsförmedlingen JobTech API
export async function fetchSwedishJobs(keywords: string[] = ["your", "target", "search", "words"])
```

---

### 4. Initialize Database & Run Initial Job Scan

Run the following commands in your terminal:

```bash
# Push schema to create your local SQLite database (dev.db)
npx prisma db push

# Seed your custom profile into the database
npx tsx prisma/seed.ts

# Run an initial scan to fetch matching jobs right now
npx tsx scripts/test-scrape.ts
```

---

### 5. Launch the Dashboard

```bash
npm run dev
```

Open your browser to **`http://localhost:3000`** (or `http://localhost:3001`). 

Your personalized Swedish job market scanner and application tracker is now active!

---

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React 19)
- **Database:** SQLite (`prisma/dev.db`) via Prisma ORM v6
- **Styling:** Tailwind CSS v4 + Cochin serif typography
- **Data Stream:** Arbetsförmedlingen JobTech Open Data API (`JobSearch / Platsbanken`)

---

## 📄 License & Attribution

Created by Manoj John Axelsson. Free for personal use and career automation.
