# JobseekeR™ — Open Source Download & Setup Guide

**JobseekeR™** is an open-source, automated job market scanner, CV competence matcher, and monthly application tracking platform for Sweden's job market (connected to Arbetsförmedlingen JobTech Open Data API).

---

## 💻 Quick Start & Desktop Setup

### Option 1: Run Locally (Web & Desktop View)

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Manoj-Axelsson/JobSeekeR-OSS.git
   cd JobSeekeR-OSS
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Initialize Database**:
   ```bash
   npx prisma db push
   ```

4. **Launch Application**:
   ```bash
   npm run dev
   ```
   Open **http://localhost:3000** in your browser or mobile viewport to launch **JobseekeR™**!

---

## 🚀 Key Features in JobseekeR™

- ⚙️ **First-Run Onboarding Setup Wizard**: Visually configure your name, target roles, preferred location, and minimum match score threshold.
- 📄 **CV & Certificate Upload**: Upload your CV (PDF, DOCX, TXT) and educational certificates to automatically extract technical competences for hyper-accurate matching.
- ⏱️ **12-Month Automated Data Retention**: Automatic database pruning service purges non-saved listings older than 365 days, keeping the SQLite database fast and lightweight.
- ⚡ **On-Demand & 12:00 PM Daily Scans**: Trigger immediate job scans or rely on automated daily scans at 12:00 PM noon.
- 📋 **Aktivitetsrapport Export**: One-click copy for monthly reporting to Arbetsförmedlingen.

---

## 🛠️ Building Standalone Desktop Packages (macOS, Windows, Linux)

To package **JobseekeR™** as a native desktop application:

```bash
# Production Build
npm run build

# Start Production Mode
npm run start
```

---

## ⚖️ Open Source License

Distributed under the **MIT License**. Free for job seekers, developers, and organizations worldwide.
