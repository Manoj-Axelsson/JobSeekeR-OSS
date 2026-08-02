# JobseekeR™ Intelligence Subsystems Architecture

This document describes all 8 Intelligence subsystems under `src/intelligence/`.

---

## 1. 🧠 Recruiter Intelligence

### Purpose
Analyzes recruiter behavior, communication response speed, reply rate reliability, and hiring preferences.

### Inputs
- Application logs (`Application` model)
- Recruiter profile records (`Recruiter` model)

### Outputs
- Average response speed (days)
- Reply rate (%)
- Seniority preference indicators
- Portfolio request frequency

### Dependencies
- `@/lib/prisma` (SQLite database client)

### Confidence Sources
- Historical recruiter responses logged by candidate
- Verification count of completed application cycles

### Current Responsibilities
- Calculates recruiter response reliability metrics
- Flags preferred seniority levels and portfolio habits

### Future Expansion
- Direct candidate-to-recruiter message template suggestions

---

## 2. 🏢 Company Intelligence

### Purpose
Monitors employer callback ratios, response benchmarks, and ghosting risk across Swedish hiring companies.

### Inputs
- Scanned job ads (`JobAd` model)
- Historical applications (`Application` model)

### Outputs
- Company callback ratio (%)
- Average response timeframe (days)
- Ghosting risk score

### Dependencies
- `@/lib/prisma`

### Confidence Sources
- Aggregated application outcomes per company

### Current Responsibilities
- Ranks employer response speeds and highlights responsive organizations (e.g. *Toyota*)

### Future Expansion
- Regional company culture and benefit benchmarks

---

## 3. 📄 Document Intelligence

### Purpose
Extracts technical competencies, skills, and certifications from candidate PDF/Word CVs.

### Inputs
- PDF / Word document files uploaded via `/api/documents/upload`

### Outputs
- Structured skill taxonomy array
- Candidate profile skill tags

### Dependencies
- `@/lib/services/docParser`

### Confidence Sources
- Direct keyword extraction from verified CV documents

### Current Responsibilities
- Parses uploaded resumes and updates target competence profiles automatically

### Future Expansion
- Multi-language resume skill extraction (Swedish / English)

---

## 4. 📈 Market Intelligence

### Purpose
Tracks real-time Swedish tech stack demand velocity and regional technology trends.

### Inputs
- Scanned job ad descriptions from Arbetsförmedlingen JobTech API

### Outputs
- Tech stack demand trends (`React ↑`, `.NET →`, `Python ↑`, `AI ↑`)
- Regional skill distribution

### Dependencies
- `src/intelligence/market/index.ts`

### Confidence Sources
- Real-time job posting keyword frequency across Sweden

### Current Responsibilities
- Displays market trend indicators on the Intelligence Dashboard

### Future Expansion
- Historical 12-month tech demand forecasting

---

## 5. 🎓 Learning Intelligence

### Purpose
Projects upskilling score boosts and recommends highest ROI courses to close candidate skill gaps.

### Inputs
- Candidate profile competence tags
- Target job posting skill requirements

### Outputs
- Course recommendations (e.g. *Docker Fundamentals*)
- Projected match score boost (+18%)

### Dependencies
- `src/intelligence/learning/index.ts`

### Confidence Sources
- Frequency of missing skill keywords in high-matching target job ads

### Current Responsibilities
- Identifies missing skills in target job postings and projects score increases

### Future Expansion
- Direct integration with open-source learning platforms

---

## 6. 💰 Salary Intelligence

### Purpose
Extracts SEK compensation figures from job text and benchmarks salaries against Swedish role averages.

### Inputs
- Raw job ad description text (`salaryRawText`)

### Outputs
- Parsed SEK salary range (*45 000 – 65 000 SEK/mån*)
- Compensation badges on job cards

### Dependencies
- `src/intelligence/salary/index.ts`

### Confidence Sources
- Explicit SEK regex patterns matched in job posting text

### Current Responsibilities
- Displays salary range badges on job cards and calculates compensation benchmarks

### Future Expansion
- Swedish regional cost-of-living salary adjustments

---

## 7. 🎯 Match Intelligence

### Purpose
Calculates weighted domain fit across Software, Systems, Quality, and Manufacturing taxonomies.

### Inputs
- Candidate profile target roles and skills
- Job posting title, location, and description

### Outputs
- Overall match score (0% – 100%)
- Domain breakdown scores (Software, Systems, Quality, Industrial)

### Dependencies
- `@/lib/services/matcher`

### Confidence Sources
- Explicit keyword match count and domain weighting taxonomy

### Current Responsibilities
- Scores every scanned job posting against candidate profile criteria

### Future Expansion
- Custom user-weighted domain scoring multipliers

---

## 8. 🔮 Predictive Intelligence

### Purpose
Calculates evidence-based interview probability predictions and progressive confidence states.

### Inputs
- Total logged applications ($N_{\text{apps}}$)
- Verified interviews ($N_{\text{interviews}}$)
- Evaluated job postings ($N_{\text{evaluations}}$)

### Outputs
- Evidence-based confidence score:
  $$\text{Confidence} = \min\left(100, \left(\frac{N_{\text{apps}}}{10} \times 40\right) + \left(\frac{N_{\text{interviews}}}{3} \times 30\right) + \left(\frac{N_{\text{evaluations}}}{20} \times 30\right)\right)$$
- Activation states: `🌱 0-30%: Learning`, `⚡ 31-70%: Ready`, `🎯 71-100%: High Confidence`

### Dependencies
- `src/intelligence/prediction/index.ts`

### Confidence Sources
- Mathematical formula calculated directly from candidate activity logs

### Current Responsibilities
- Renders explainable confidence indicators and interview likelihood estimations

### Future Expansion
- Multi-factor interview outcome probability models
