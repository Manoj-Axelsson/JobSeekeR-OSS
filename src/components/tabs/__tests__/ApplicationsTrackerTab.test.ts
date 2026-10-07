import { describe, it, expect } from "vitest";
import {
  filterApplicationsByMonth,
  getStatusTextColor,
} from "../ApplicationsTrackerTab";
import type { Application } from "@/types/domain";

describe("ApplicationsTrackerTab Helpers", () => {
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
        title: "Senior Fullstack Developer",
        company: "TechBolag AB",
        location: "Stockholm",
        description: "Job desc",
        webpageUrl: "https://example.com/1",
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
      appliedAt: "2026-08-01T14:30:00.000Z",
      resumeVersion: "v2.0",
      notes: null,
      monthlyTag: "2026-08",
      job: {
        id: "job-2",
        externalId: "ext-2",
        title: "Systems Architect",
        company: "Industri Systems AB",
        location: "Linköping",
        description: "Systems job",
        webpageUrl: null,
        source: "LinkedIn",
        publishedAt: "2026-07-30T10:00:00.000Z",
        deadline: null,
        matchScore: 90,
        matchedSkills: "[]",
        missingSkills: "[]",
        domainScores: "{}",
        status: "APPLIED",
      },
    },
    {
      id: "app-3",
      jobId: "job-3",
      status: "OFFER",
      appliedAt: "2026-08-15T09:00:00.000Z",
      resumeVersion: "v2.1",
      notes: null,
      monthlyTag: "2026-08",
      job: undefined,
    },
  ];

  describe("filterApplicationsByMonth", () => {
    it("returns all applications when selectedMonth is an empty string", () => {
      const result = filterApplicationsByMonth(mockApplications, "");
      expect(result).toHaveLength(3);
      expect(result).toEqual(mockApplications);
    });

    it("filters applications correctly by matching monthlyTag", () => {
      const julyResult = filterApplicationsByMonth(mockApplications, "2026-07");
      expect(julyResult).toHaveLength(1);
      expect(julyResult[0].id).toBe("app-1");

      const augustResult = filterApplicationsByMonth(mockApplications, "2026-08");
      expect(augustResult).toHaveLength(2);
      expect(augustResult.map((a) => a.id)).toEqual(["app-2", "app-3"]);
    });

    it("returns empty array when no applications match selectedMonth", () => {
      const result = filterApplicationsByMonth(mockApplications, "2026-09");
      expect(result).toHaveLength(0);
    });

    it("handles empty applications array gracefully", () => {
      const result = filterApplicationsByMonth([], "2026-07");
      expect(result).toEqual([]);
    });
  });

  describe("getStatusTextColor", () => {
    it("maps APPLIED status to cyan classes", () => {
      expect(getStatusTextColor("APPLIED")).toBe("text-cyan-600 font-bold");
    });

    it("maps INTERVIEWING status to purple classes", () => {
      expect(getStatusTextColor("INTERVIEWING")).toBe("text-purple-600 font-bold");
    });

    it("maps OFFER status to emerald classes", () => {
      expect(getStatusTextColor("OFFER")).toBe("text-emerald-600 font-bold");
    });

    it("maps REJECTED status to red classes", () => {
      expect(getStatusTextColor("REJECTED")).toBe("text-red-600 font-bold");
    });

    it("falls back to slate styling for unrecognized status", () => {
      expect(
        getStatusTextColor("UNKNOWN" as unknown as Application["status"])
      ).toBe("text-slate-600 font-semibold");
    });
  });
});
