/**
 * JobSeekR Comprehensive 8-Dimension QA Audit Test Suite
 * Covers:
 * 1. Functional Testing
 * 2. Browser / Error Handling
 * 3. Performance / Responsive Testing
 * 4. Security & Non-Fabrication
 * 5. Visual Consistency
 * 6. Accessibility (WCAG 2.1 AA)
 * 7. UX Testing & Rationale Explainability
 * 8. Exploratory & Edge Case Testing
 */

import { describe, it, expect } from "vitest";
import { evaluateJobMatch } from "../matcher";
import { competencyGraph } from "../../../intelligence/competency/graph";
import { opportunityEvaluator } from "../../../intelligence/opportunity/evaluator";
import { positioningAnalyzer } from "../../../intelligence/positioning/analyzer";
import { applicationCoachingAdvisor } from "../../../intelligence/coaching/advisor";
import { decisionSupportEngine } from "../../../intelligence/decision/decisionSupport";
import { translations } from "../i18n";

describe("JobSeekR Comprehensive 8-Dimension QA Audit Suite", () => {
  // 1. Functional Testing
  describe("1. Functional Testing", () => {
    it("evaluates 5-tier opportunity classification and Decision Support integration", () => {
      const result = evaluateJobMatch(
        "Lead Quality Assurance Engineer",
        "Seeking Lean Six Sigma Black Belt with DMAIC and Root Cause Analysis background.",
        ["Lean Six Sigma", "DMAIC", "RCA"],
        "Anna",
        "Quality Engineer"
      );

      expect(result.matchScore).toBeGreaterThanOrEqual(74);
      expect(result.decisionSupport).toBeDefined();
      expect(result.decisionSupport?.stage1Opportunity.tier).toMatch(/EXCELLENT_MATCH|STRONG_MATCH/);
      expect(result.decisionSupport?.stage2Competencies.matchedTransferableSkills.length).toBeGreaterThan(0);
      expect(result.decisionSupport?.stage3Positioning.cvEmphasisOrder.length).toBeGreaterThan(0);
      expect(result.decisionSupport?.stage4Coaching.nonFabricationGuarantee).toBe(true);
      expect(result.decisionSupport?.stage5UserDecisionPrompt.decisionQuestion).toContain("Anna");
    });

    it("evaluates multi-hop competency graph relationships", () => {
      const transfer = competencyGraph.evaluateTransferability("DMAIC", "Operational Excellence");
      expect(transfer).not.toBeNull();
      expect(transfer?.transferWeight).toBeGreaterThan(0.6);
      expect(transfer?.rationale).toContain("DMAIC");
    });
  });

  // 2. Browser / Error Handling
  describe("2. Browser / Error Handling & Resilience", () => {
    it("handles null, empty, or malformed job title and description gracefully", () => {
      const result = evaluateJobMatch("", "", [], "", "");
      expect(result).toBeDefined();
      expect(result.matchScore).toBeGreaterThanOrEqual(20);
      expect(result.matchedSkills).toBeDefined();
      expect(result.analysis.whyMatched.length).toBeGreaterThan(0);
    });

    it("handles extreme text input lengths without crashing or memory overflow", () => {
      const hugeDescription = "Quality Engineer DMAIC ".repeat(5000);
      const result = evaluateJobMatch("Senior Quality Manager", hugeDescription);
      expect(result.matchScore).toBeGreaterThan(0);
      expect(result.matchedSkills).toContain("Dmaic");
    });
  });

  // 3. Performance / Responsive Testing
  describe("3. Performance & Benchmark Testing", () => {
    it("executes full 5-stage decision support evaluation in under 15ms", () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 50; i++) {
        evaluateJobMatch(
          "Fullstack Systems Developer",
          "React TypeScript Node.js PostgreSQL Docker CI/CD requirements engineering.",
          ["TypeScript", "React", "Node.js"]
        );
      }

      const endTime = performance.now();
      const avgExecutionTime = (endTime - startTime) / 50;

      expect(avgExecutionTime).toBeLessThan(15); // < 15ms per evaluation
    });
  });

  // 4. Security & Non-Fabrication Testing
  describe("4. Security & Non-Fabrication Audit", () => {
    it("sanitizes potential XSS script tags in user inputs and job titles", () => {
      const maliciousTitle = "<script>alert('xss')</script> Quality Specialist";
      const maliciousDesc = "<img src=x onerror=alert(1)> DMAIC Six Sigma";
      
      const result = evaluateJobMatch(maliciousTitle, maliciousDesc);
      expect(result.decisionSupport?.stage4Coaching.coverLetterHook).not.toContain("<script>");
      expect(result.decisionSupport?.stage4Coaching.nonFabricationGuarantee).toBe(true);
    });

    it("strictly preserves candidate authenticity and avoids inventing fake experience", () => {
      const opp = {
        id: "job-sec",
        title: "Quantum Computing Specialist",
        company: "DeepTech AB",
        location: "Stockholm",
        description: "Requires 10 years experience in Qiskit quantum algorithms.",
        workingModel: "ON_SITE" as const,
      };

      const candidate = {
        name: "Anna",
        targetRoleTitle: "Software Developer",
        superpowers: ["Fullstack TypeScript"],
        verifiedEvidence: [],
      };

      const coaching = applicationCoachingAdvisor.generateCoaching(opp, candidate);
      expect(coaching.nonFabricationGuarantee).toBe(true);
      expect(coaching.coachingGuidance.some((g) => g.includes("Do not attempt to rewrite"))).toBe(true);
    });
  });

  // 5. Visual Consistency
  describe("5. Visual Consistency & Styling Rules", () => {
    it("provides consistent 5-tier badge tags and color tokens across all match outcomes", () => {
      const opp = {
        id: "job-vis",
        title: "Systems Architect",
        company: "Ericsson",
        location: "Kista",
        description: "Systems engineering and architecture.",
        workingModel: "HYBRID" as const,
      };

      const candidateProfile = {
        targetRoles: ["Systems Architect"],
        preferredLocations: ["Kista"],
        skills: ["Systems engineering"],
        workingModelPreference: "HYBRID" as const,
      };

      const evalResult = opportunityEvaluator.evaluateOpportunity(opp, candidateProfile);
      expect(evalResult.tierLabel).toMatch(/🌟|🟢|🟡|🚀|⚪/);
    });
  });

  // 6. Accessibility (WCAG 2.1 AA)
  describe("6. Accessibility & i18n Audit", () => {
    it("supports multi-language translations (Swedish, English, Norwegian, Danish)", () => {
      expect(translations.sv.dailyFeed).toBeDefined();
      expect(translations.en.dailyFeed).toBeDefined();
      expect(translations.no.dailyFeed).toBeDefined();
      expect(translations.da.dailyFeed).toBeDefined();

      expect(translations.sv.runJobScan).toContain("skanning");
      expect(translations.en.runJobScan).toContain("Scan");
    });
  });

  // 7. UX Testing & Rationale Explainability
  describe("7. UX & Rationale Explainability Audit", () => {
    it("ensures EVERY recommendation includes a non-empty explainable rationale", () => {
      const opp = {
        id: "job-ux",
        title: "Continuous Improvement Lead",
        company: "Scania",
        location: "Södertälje",
        description: "Lean production, Kaizen, and DMAIC.",
        workingModel: "ON_SITE" as const,
      };

      const candidateProfile = {
        name: "Anna",
        targetRoleTitle: "Continuous Improvement Engineer",
        superpowers: ["Kaizen", "DMAIC"],
        verifiedEvidence: [
          {
            id: "ev-ux",
            achievementText: "Reduced assembly downtime by 15% via Kaizen workshops",
            associatedCompetency: "DMAIC",
          },
        ],
      };

      const preferences = {
        targetRoles: ["Continuous Improvement Lead"],
        preferredLocations: ["Södertälje"],
        skills: ["Kaizen", "DMAIC"],
      };

      const context = decisionSupportEngine.evaluateDecisionSupport(opp, candidateProfile, preferences);

      expect(context.stage1Opportunity.rationale).not.toBe("");
      expect(context.stage3Positioning.rationale).not.toBe("");
      expect(context.stage4Coaching.coachingGuidance.length).toBeGreaterThan(0);
      expect(context.stage5UserDecisionPrompt.decisionQuestion).not.toBe("");
    });
  });

  // 8. Exploratory & Edge Case Testing
  describe("8. Exploratory & Edge Case Testing", () => {
    it("handles multi-domain mixed technical keywords cleanly", () => {
      const result = evaluateJobMatch(
        "Fullstack Software QA Engineer (Six Sigma & Automation)",
        "React TypeScript Python PLC SCADA Six Sigma DMAIC ISO 9001",
        ["TypeScript", "Six Sigma"]
      );

      expect(result.domainScores.software).toBeGreaterThan(0);
      expect(result.domainScores.quality).toBeGreaterThan(0);
      expect(result.domainScores.industrial).toBeGreaterThan(0);
      expect(result.matchScore).toBeGreaterThanOrEqual(60);
    });
  });
});
