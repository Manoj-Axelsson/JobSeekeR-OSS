# ADR 004: Decoupled Domain Architecture & V2 Constitutional Principles

- **Status**: Approved (Constitutional Architectural Specification for v2.0)
- **Date**: 2026-08-15
- **Deciders**: Product Owner, Manoj Axelsson, Antigravity AI Architecture Team

---

## 1. V2 Constitutional Principles

JobSeekeR Version 2.0 establishes two fundamental constitutional principles that dictate data processing and user experience from pipeline ingestion down to UI rendering:

### 📜 Principle I: The Primary vs. Discovery Feed Separation
User expectations for targeted search versus exploration are fundamentally different:

1. **📍 Primary Feed ("Find me what I asked for"):**
   - Strictly enforces candidate search intent, target occupations, and `SearchTerritory` boundary limits.
   - Zero pollution from out-of-boundary or unrequested listings.

2. **🌐 Discovery Feed ("Show me things I didn't explicitly ask for but might find valuable"):**
   - Deliberately relaxes strict territory or keyword boundaries to surface high-fit national opportunities, adjacent career paths, or emerging industry roles.
   - Exists as a dedicated, separate feed in the UI so candidates get 100% local precision without missing serendipitous national roles.

### 📜 Principle II: Decoupled 4-Pillar Model ($1 \text{ User} \to 1 \text{ Career Profile} \to N \text{ Search Profiles}$)
JobSeekeR explicitly distinguishes four separate domain entities:
1. **Candidate (`What I Bring`):** Experience, skills, qualifications, career history.
2. **Search Intent (`What I Want`):** Target occupations, target industries, preferences, discovery rules.
3. **Search Territory (`Where I Will Work`):** Multi-tier commuter graph (countries, regions, municipalities, commute time, transit mode).
4. **Opportunity (`What Is Available`):** Standardized, normalized job vacancies ingested from data APIs.

A candidate can maintain **multiple independent Search Profiles** (e.g., *Track A: Fullstack Dev in Östergötland* vs. *Track B: Production Engineer in Småland*), natively supporting career transitions and multi-track job searches.

---

## 2. Decoupled Domain Architecture

```
                            User Account
                                 │
        ┌────────────────────────┴────────────────────────┐
        ▼                                                 ▼
 Career Profile                                    Search Profiles
(What I Bring)                                           │
 ├── Work Experience                                     ├─► [Search Profile A: Software]
 ├── Skill Taxonomy                                      │   ├── Target: Fullstack / Frontend
 ├── Qualifications                                      │   ├── Territory: Östergötland (Commute ≤ 60m)
 └── Role History                                        │   └── Mode: Hybrid (SEK 50k+)
                                                         │
                                                         ├─► [Search Profile B: Industry]
                                                         │   ├── Target: Process / Production Eng
                                                         │   ├── Territory: Småland (Commute ≤ 45m)
                                                         │   └── Mode: On-Site (SEK 45k+)
                                                         │
                                                         └─► [Search Profile C: Exploration]
                                                             ├── Target: Sustainability / Cleantech
                                                             ├── Territory: National Sweden / Remote
                                                             └── Mode: Remote / Flexible
```

---

## 3. Human-Centric Preference Translation Engine

Instead of exposing arbitrary percentage sliders to users, JobSeekeR captures intent using five natural human categories:

| Human Preference | Engine Translation | Processing Rule |
| :--- | :--- | :--- |
| **`Must Have`** | Hard Binary Gatekeeper | Eligibility Gatekeeper. If violated, $Score = 0$ (Ineligible). |
| **`Prefer`** | Primary Multiplier | Core ranking driver for capability and intent fit. |
| **`Nice to Have`** | Secondary Additive Boost | Score boost applied if present, no penalty if missing. |
| **`Exclude`** | Elimination Rule | Immediate auto-discard ($Status = DISCARDED$). |
| **`Explore`** | Discovery Routing | Routes high-fit jobs outside primary territory to the **Discovery Feed**. |

---

## 4. Probabilistic Occupation Classification (SSYK / ISCO Confidence Model)

Official job codes (SSYK/ISCO) are treated as **probabilistic metadata with confidence scores** rather than absolute, rigid truths:

```
                          Raw Job Title
                 ("Automation & DevOps Engineer")
                                │
                                ▼
               Canonical Occupation Candidates
           [ "DevOps Engineer", "Automation Engineer" ]
                                │
                                ▼
                     Classification Mapping
       ┌────────────────────────┴────────────────────────┐
       ▼                                                 ▼
SSYK 2512 (Software Dev)                        SSYK 2144 (Industrial Eng)
Confidence: 0.85                                Confidence: 0.65
```

---

## 5. Prisma Database Schema Specification (`prisma/schema.prisma`)

```prisma
model UserAccount {
  id            String          @id @default(uuid())
  email         String          @unique
  name          String
  careerProfile CareerProfile?
  searchProfiles SearchProfile[]
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}

model CareerProfile {
  id             String      @id @default(uuid())
  userAccountId  String      @unique
  userAccount    UserAccount @relation(fields: [userAccountId], references: [id], onDelete: Cascade)
  headline       String
  summary        String?
  skills         String      // JSON array of verified skills & competencies
  experience     String      // JSON array of work history items
  qualifications String      // JSON array of degrees, licenses, certifications
  currentRoles   String      // JSON array of current/previous role titles
  updatedAt      DateTime    @updatedAt
}

model SearchProfile {
  id                    String          @id @default(uuid())
  userAccountId         String
  userAccount           UserAccount     @relation(fields: [userAccountId], references: [id], onDelete: Cascade)
  name                  String          @default("Default Search") // e.g. "Software Track", "Industrial Track"
  isPrimary             Boolean         @default(true)
  targetOccupations     String          // JSON array of target titles & SSYK/ISCO codes
  targetIndustries      String          // JSON array of target industry sectors
  workModes             String          // JSON array: ["HYBRID", "REMOTE", "ON_SITE"]
  employmentPreferences String          // JSON array: ["FULL_TIME", "CONTRACT"]
  minMatchScore         Int             @default(50)
  territoryId           String?
  territory             SearchTerritory? @relation(fields: [territoryId], references: [id], onDelete: SetNull)
  discoveryInterests    String          // JSON array of discovery topics
  updatedAt             DateTime        @updatedAt
}

model SearchTerritory {
  id                 String          @id @default(uuid())
  name               String
  countries          String          // JSON array: ["SE"]
  regions            String          // JSON array: ["Östergötlands län"]
  municipalities     String          // JSON array: ["Linköping", "Norrköping", ...]
  cities             String          // JSON array
  maxCommuteMinutes  Int             @default(60)
  commuteMode        String          @default("PUBLIC_TRANSIT")
  remotePolicy       String          @default("ALLOWED")
  discoveryPolicy    String          @default("SHOW_SEPARATELY")
  searchProfiles     SearchProfile[]
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt
}
```

---

## 6. The 7-Stage v2.0 Processing Pipeline

1. **Candidate Profile (`What I Bring`):** Experience, skills, qualifications, career history.
2. **Search Profile (`What I Want`):** Target occupations, target industries, keywords, territory, preferences.
3. **Discovery (`Data Ingestion`):** Multi-stream query fetchers.
4. **Normalisation (`Data Standardisation`):** Location mapping, SSYK/ISCO confidence classification, salary parsing.
5. **Eligibility (`Hard Gatekeeping`):** `Must Have` and `Exclude` boundary compliance.
6. **Matching & Ranking (`Dual-Layer Scoring`):** Capability Fit vs. Intent Fit scoring.
7. **Explanation (`Pitch & Narrative`):** Generating tailored pitch strategies and transferable skill framing for career transitions.
