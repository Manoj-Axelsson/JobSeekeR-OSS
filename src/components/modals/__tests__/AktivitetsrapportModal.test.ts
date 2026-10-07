import { describe, it, expect } from "vitest";
import { generateAktivitetsrapportText } from "../AktivitetsrapportModal";
import type { Application } from "@/types/domain";

describe("AktivitetsrapportModal Component & Report Formatting", () => {
  const mockApplications: Application[] = [
    {
      id: "app-1",
      jobId: "job-1",
      status: "APPLIED",
      appliedAt: "2026-07-15T10:00:00.000Z",
      resumeVersion: "v1.0",
      notes: null,
      monthlyTag: "2026-07",
      job: {
        id: "job-1",
        externalId: "ext-1",
        title: "Senior Fullstack Utvecklare",
        company: "TechBolag AB",
        location: "Stockholm",
        description: "Job description text",
        webpageUrl: "https://example.com/job/1",
        source: "JobTech",
        publishedAt: "2026-07-10T10:00:00.000Z",
        deadline: null,
        matchScore: 85,
        matchedSkills: "[]",
        missingSkills: "[]",
        domainScores: "{}",
        status: "APPLIED",
      },
    },
    {
      id: "app-2",
      jobId: "job-2",
      status: "INTERVIEWING",
      appliedAt: "2026-07-20T14:30:00.000Z",
      resumeVersion: "v2.0",
      notes: null,
      monthlyTag: "2026-07",
      job: {
        id: "job-2",
        externalId: "ext-2",
        title: "Systems Engineer",
        company: "Industri Systems AB",
        location: "Linköping",
        description: "Systems job",
        webpageUrl: null,
        source: "LinkedIn",
        publishedAt: "2026-07-18T10:00:00.000Z",
        deadline: null,
        matchScore: 90,
        matchedSkills: "[]",
        missingSkills: "[]",
        domainScores: "{}",
        status: "APPLIED",
      },
    },
  ];

  it("formats official report header and candidate metadata dynamically", () => {
    const reportText = generateAktivitetsrapportText(
      mockApplications,
      "2026-07",
      "Alice Candidate"
    );

    expect(reportText).toContain("AKTIVITETSRAPPORT — ARBETSFÖRMEDLINGEN");
    expect(reportText).toContain("Sökande: Alice Candidate");
    expect(reportText).toContain("Rapporteringsmånad: 2026-07");
    expect(reportText).toContain("Antal sökta arbeten: 2");
    expect(reportText).not.toContain("Manoj John Axelsson");
  });

  it("formats application rows correctly with date and webpage URL", () => {
    const reportText = generateAktivitetsrapportText(
      mockApplications,
      "2026-07",
      "Bob Tester"
    );

    expect(reportText).toContain(
      "1. Senior Fullstack Utvecklare — TechBolag AB (Stockholm)"
    );
    expect(reportText).toContain("Länk: https://example.com/job/1");

    expect(reportText).toContain(
      "2. Systems Engineer — Industri Systems AB (Linköping)"
    );
    expect(reportText).toContain("Länk: Direct application");
  });

  it("handles empty application lists gracefully", () => {
    const reportText = generateAktivitetsrapportText([], "2026-08", "Charlie");

    expect(reportText).toContain("Sökande: Charlie");
    expect(reportText).toContain("Rapporteringsmånad: 2026-08");
    expect(reportText).toContain("Antal sökta arbeten: 0");
  });

  it("falls back to default candidate name when empty or unspecified", () => {
    const reportText = generateAktivitetsrapportText([], "", "");

    expect(reportText).toContain("Sökande: Kandidat");
    expect(reportText).toContain("Rapporteringsmånad: Juli 2026");
  });
});
