"use client";

import { useState, useMemo } from "react";
import type { JobAd } from "@/types/domain";
import {
  evaluateOpportunityAssessment,
  MatchResult,
} from "@/lib/services/matcher";
import { EvidenceDiagnosticAccordion } from "@/components/EvidenceDiagnosticAccordion";
import { speakText } from "@/lib/services/tts";

export interface JobDetailsModalProps {
  job: JobAd | null;
  onClose: () => void;
  onUpdateJobStatus: (
    jobId: string,
    newStatus: JobAd["status"],
    notes?: string
  ) => Promise<void> | void;
  appliedConfirmJobIds: Set<string>;
  onSetAppliedConfirm: (jobId: string, confirmed: boolean) => void;
  isDark: boolean;
}

/**
 * Pure helper for formatting audio pitch text for text-to-speech.
 */
export function generateAudioPitchText(
  title: string,
  company: string,
  openingHook: string
): string {
  return `Jobb: ${title} på ${company}. Öppningsfras för personligt brev: ${openingHook}`;
}

/**
 * Pure helper for determining external portal apply button label.
 */
export function getPortalApplyButtonLabel(
  jobId: string,
  webpageUrl?: string | null
): string {
  if (
    jobId.startsWith("li_") ||
    (webpageUrl && webpageUrl.includes("linkedin.com"))
  ) {
    return "Apply on LinkedIn ↗";
  }
  return "Apply on Platsbanken ↗";
}

export function JobDetailsModal({
  job,
  onClose,
  onUpdateJobStatus,
  appliedConfirmJobIds,
  onSetAppliedConfirm,
  isDark,
}: JobDetailsModalProps) {
  const [modalTab, setModalTab] = useState<"analysis" | "description">(
    "analysis"
  );

  const jobAnalysis: MatchResult | null = useMemo(() => {
    if (!job) return null;
    return evaluateOpportunityAssessment({
      id: job.id,
      externalId: job.externalId,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
    });
  }, [job]);

  if (!job || !jobAnalysis) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-7 space-y-5 border shadow-2xl ${
          isDark
            ? "bg-slate-900 border-slate-800 text-slate-100"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[15px] font-semibold text-slate-500">
                Source: {job.source}
              </span>
              <button
                onClick={() => {
                  const pitchText = generateAudioPitchText(
                    job.title,
                    job.company,
                    jobAnalysis.analysis.coverLetterPitch.openingHook
                  );
                  speakText(pitchText, "sv-SE");
                }}
                className="px-3 py-1 bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Audio Assistance: Read Job Details & Cover Letter Hook Aloud"
                aria-label="Read job pitch strategy aloud"
              >
                🔊 Listen to Pitch
              </button>
            </div>
            <h2
              className={`text-[25px] font-bold mt-2 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {job.title}
            </h2>
            <p
              className={`text-[17px] font-medium ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              🏢 {job.company} • 📍 {job.location}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`text-[23px] font-bold p-1 cursor-pointer ${
              isDark
                ? "text-slate-400 hover:text-white"
                : "text-slate-400 hover:text-slate-900"
            }`}
          >
            ✕
          </button>
        </div>

        {/* Modal Sub Navigation */}
        <div
          className={`border-b flex space-x-6 ${
            isDark ? "border-slate-800" : "border-slate-200"
          }`}
        >
          <button
            onClick={() => setModalTab("analysis")}
            className={`pb-3 text-[17px] font-bold border-b-2 transition cursor-pointer ${
              modalTab === "analysis"
                ? "border-emerald-600 text-emerald-600"
                : isDark
                  ? "border-transparent text-slate-400 hover:text-slate-200"
                  : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            💡 Match Analysis & Cover Letter Strategy
          </button>
          <button
            onClick={() => setModalTab("description")}
            className={`pb-3 text-[17px] font-bold border-b-2 transition cursor-pointer ${
              modalTab === "description"
                ? "border-emerald-600 text-emerald-600"
                : isDark
                  ? "border-transparent text-slate-400 hover:text-slate-200"
                  : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            📄 Full Job Posting Text
          </button>
        </div>

        {/* MODAL TAB 1: STRATEGIC MATCH ANALYSIS */}
        {modalTab === "analysis" && (
          <div className="space-y-6">
            {/* NON-NUMERICAL EVIDENCE DIAGNOSTIC ACCORDION (v3.1.1) */}
            {jobAnalysis.nonNumericalAssessment && (
              <EvidenceDiagnosticAccordion
                assessment={jobAnalysis.nonNumericalAssessment}
              />
            )}

            {/* 1. WHY THIS JOB MATCHED */}
            <div
              className={`p-5 rounded-xl border ${
                isDark
                  ? "bg-slate-950 border-slate-800"
                  : "bg-emerald-50/60 border-emerald-200"
              }`}
            >
              <h3 className="text-[20px] font-bold text-emerald-700 flex items-center space-x-2">
                <span>✓ Why This Job Matched Your Profile</span>
              </h3>
              <div className="mt-3 space-y-2">
                {jobAnalysis.analysis.whyMatched.map((reason, idx) => (
                  <p
                    key={idx}
                    className={`text-[17px] leading-relaxed ${
                      isDark ? "text-slate-300" : "text-slate-800"
                    }`}
                  >
                    • {reason}
                  </p>
                ))}
              </div>
              {/* Matched Skills Tags */}
              <div className="mt-4 flex flex-wrap gap-2">
                {jobAnalysis.matchedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[15px] font-semibold rounded-md border border-emerald-300"
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* 2. WHAT IS LACKING / GAPS */}
            <div
              className={`p-5 rounded-xl border ${
                isDark
                  ? "bg-slate-950 border-slate-800"
                  : "bg-amber-50/60 border-amber-200"
              }`}
            >
              <h3 className="text-[20px] font-bold text-amber-800 flex items-center space-x-2">
                <span>⚠️ Potential Skill Gaps & What Is Missing</span>
              </h3>
              <div className="mt-3 space-y-2">
                {jobAnalysis.analysis.whatLacking.map((gap, idx) => (
                  <p
                    key={idx}
                    className={`text-[17px] leading-relaxed ${
                      isDark ? "text-slate-300" : "text-slate-800"
                    }`}
                  >
                    • {gap}
                  </p>
                ))}
              </div>
              {/* Missing Skills Tags */}
              {jobAnalysis.missingSkills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {jobAnalysis.missingSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-amber-100 text-amber-900 text-[15px] font-semibold rounded-md border border-amber-300"
                    >
                      ! {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 3. COVER LETTER PITCH STRATEGY */}
            <div
              className={`p-5 rounded-xl border ${
                isDark
                  ? "bg-slate-950 border-slate-800"
                  : "bg-blue-50/60 border-blue-200"
              }`}
            >
              <h3 className="text-[20px] font-bold text-blue-800 flex items-center space-x-2">
                <span>✍️ Tailored Cover Letter & Application Pitch Strategy</span>
              </h3>

              {/* Opening Hook */}
              <div className="mt-4">
                <h4 className="text-[17px] font-bold text-slate-900 dark:text-slate-200">
                  Recommended Opening Line for Cover Letter:
                </h4>
                <p className="mt-1.5 p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 text-[18px] italic font-bold text-slate-950 dark:text-white leading-relaxed">
                  &quot;{jobAnalysis.analysis.coverLetterPitch.openingHook}&quot;
                </p>
              </div>

              {/* Key Strengths to Lead With */}
              <div className="mt-4">
                <h4 className="text-[17px] font-bold text-slate-900 dark:text-slate-200">
                  Core Strengths to Emphasize in Your Resume/Letter:
                </h4>
                <ul className="mt-1.5 list-disc list-inside text-[17px] text-slate-800 dark:text-slate-300 space-y-1">
                  {jobAnalysis.analysis.coverLetterPitch.keyStrengthsToLeadWith.map(
                    (str, idx) => (
                      <li
                        key={idx}
                        className="font-semibold text-emerald-700 dark:text-emerald-400"
                      >
                        {str}
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* Gap Mitigation Strategy */}
              <div className="mt-4">
                <h4 className="text-[17px] font-bold text-slate-900 dark:text-slate-200">
                  How to Frame Missing Qualifications:
                </h4>
                <p className="mt-1 text-[17px] text-slate-800 dark:text-slate-300 leading-relaxed">
                  {jobAnalysis.analysis.coverLetterPitch.gapMitigationStrategy}
                </p>
              </div>

              {/* Suggested Copyable Bullet Points */}
              <div className="mt-4">
                <h4 className="text-[17px] font-bold text-slate-900 dark:text-slate-200">
                  Suggested Application Bullet Points to Highlight:
                </h4>
                <div className="mt-2 space-y-2">
                  {jobAnalysis.analysis.coverLetterPitch.suggestedBulletPoints.map(
                    (bp, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[16px] text-slate-800 dark:text-slate-200"
                      >
                        📌 {bp}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL TAB 2: FULL DESCRIPTION */}
        {modalTab === "description" && (
          <div
            className={`p-5 rounded-xl border space-y-3 ${
              isDark
                ? "bg-slate-950 border-slate-800"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <h3
              className={`text-[20px] font-bold uppercase tracking-wider ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Full Job Description Text
            </h3>
            <p
              className={`text-[18px] leading-relaxed whitespace-pre-line ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}
            >
              {job.description}
            </p>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div
          className={`pt-4 border-t flex justify-between items-center ${
            isDark ? "border-slate-800" : "border-slate-200"
          }`}
        >
          <div className="flex items-center space-x-3">
            {job.status !== "APPLIED" ? (
              <button
                onClick={() => onUpdateJobStatus(job.id, "APPLIED")}
                className="px-5 py-2.5 bg-cyan-600 text-white hover:bg-cyan-500 text-[16px] font-bold rounded-xl transition cursor-pointer shadow-sm"
              >
                Mark as Applied Today
              </button>
            ) : (
              <span className="text-[16px] font-bold text-emerald-600">
                ✓ Marked as Applied
              </span>
            )}

            {/* DISCARD BUTTON INSIDE MODAL */}
            <button
              onClick={() => {
                onUpdateJobStatus(job.id, "DISCARDED");
                onClose();
              }}
              className="px-4 py-2.5 bg-red-600/10 text-red-600 border border-red-200 dark:border-red-500/30 hover:bg-red-600 hover:text-white text-[16px] font-bold rounded-xl transition cursor-pointer"
            >
              🗑️ Discard & Delete
            </button>
          </div>

          {job.webpageUrl && (
            <a
              href={job.webpageUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => onSetAppliedConfirm(job.id, true)}
              className="px-5 py-2.5 bg-emerald-600 text-white text-[17px] font-bold rounded-xl hover:bg-emerald-500 transition shadow-sm"
            >
              {getPortalApplyButtonLabel(job.id, job.webpageUrl)}
            </a>
          )}
        </div>

        {/* Application Confirmation Banner in Modal */}
        {appliedConfirmJobIds.has(job.id) && job.status !== "APPLIED" && (
          <div className="mt-3 p-3.5 bg-[#4a2408] border-2 border-amber-400 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm shadow-xl">
            <p className="font-black text-amber-200 flex items-center space-x-2">
              <span>
                ↗️ Opened external application portal. Did you finish submitting
                your application?
              </span>
            </p>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => {
                  onUpdateJobStatus(job.id, "APPLIED");
                  onSetAppliedConfirm(job.id, false);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg transition cursor-pointer shadow-md"
              >
                ✅ Yes, Mark as Applied
              </button>
              <button
                onClick={() => {
                  onUpdateJobStatus(job.id, "SAVED");
                  onSetAppliedConfirm(job.id, false);
                }}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-200 font-bold text-xs rounded-lg transition cursor-pointer border border-amber-500/40"
              >
                📌 Keep as Saved / Not Yet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
