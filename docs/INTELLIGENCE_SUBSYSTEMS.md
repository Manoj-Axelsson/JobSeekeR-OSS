# JobseekeR™ Intelligence Subsystems Architecture

This document describes the 8 intelligence modules under `src/intelligence/`.

---

## 1. 🧠 Recruiter Intelligence (`src/intelligence/recruiter/`)
- **Responsibility**: Analyzes recruiter behavior metrics, response speeds (in days), reply rates (%), portfolio request habits, and preferred candidate seniority levels.
- **Data Model**: `Recruiter` Prisma model (`id`, `name`, `company`, `avgResponseDays`, `replyRate`, `prefersPortfolio`).

## 2. 🏢 Company Intelligence (`src/intelligence/company/`)
- **Responsibility**: Calculates employer callback ratios, response benchmarks, and evaluates ghosting risks across Swedish companies.

## 3. 📄 Document Intelligence (`src/intelligence/document/`)
- **Responsibility**: Parses uploaded PDF/Word CVs and competence certificates using keyword taxonomy extraction, updating candidate profile skills automatically.

## 4. 📈 Market Intelligence (`src/intelligence/market/`)
- **Responsibility**: Tracks Swedish tech stack demand velocity (`React ↑`, `.NET →`, `Python ↑`, `AI ↑`) and regional tech density.

## 5. 🎓 Learning Intelligence (`src/intelligence/learning/`)
- **Responsibility**: Projects upskilling score boosts and recommends highest ROI courses (e.g. *Docker +18% Match Boost*) based on target role gap analysis.

## 6. 💰 Salary Intelligence (`src/intelligence/salary/`)
- **Responsibility**: Parses Swedish SEK salary ranges (*45 000 – 65 000 SEK/mån*) from job description text and benchmarks compensation against role averages.

## 7. 🎯 Match Intelligence (`src/intelligence/match/`)
- **Responsibility**: Calculates weighted multi-domain fit across Software, Systems, Quality, and Manufacturing taxonomy domains.

## 8. 🔮 Predictive Intelligence (`src/intelligence/prediction/`)
- **Responsibility**: Calculates interview probability predictions and evidence-based confidence percentages using the mathematical model:
  $$\text{Confidence} = \min\left(100, \left(\frac{N_{\text{apps}}}{10} \times 40\right) + \left(\frac{N_{\text{interviews}}}{3} \times 30\right) + \left(\frac{N_{\text{evaluations}}}{20} \times 30\right)\right)$$
