# Contributing to JobseekeR™

Thank you for your interest in contributing to **JobseekeR™ — An intelligence platform built to automate job searching**.

## Code of Conduct & Principles
- **Local-First & Privacy First**: All candidate data must remain embedded locally (SQLite) without third-party tracking.
- **Evidence-Based Intelligence**: Recommendations and confidence scores must be statistically explainable.
- **Accessibility (WCAG 2.1 AA)**: High contrast, screen reader compatibility, and touch targets are strictly required.

## Getting Started
1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/atlas-talent-navigator.git
   cd atlas-talent-navigator
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the local development server:
   ```bash
   npm run dev
   ```

## Development & Verification Guidelines
Before submitting a Pull Request, verify that:
1. `npx tsc --noEmit` passes with 0 errors.
2. `npm run build` compiles cleanly.
3. Code changes adhere to TypeScript strict mode.

## Submitting Pull Requests
- Create a descriptive branch name (`feat/your-feature` or `fix/your-bugfix`).
- Commit changes using conventional commit messages.
- Open a Pull Request referencing the relevant issue.
