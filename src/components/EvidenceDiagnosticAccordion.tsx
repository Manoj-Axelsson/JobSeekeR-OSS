"use client";

import React, { useState } from "react";
import { NonNumericalOpportunityAssessment } from "@/intelligence/assessment/NonNumericalContract";

interface EvidenceDiagnosticAccordionProps {
  assessment: NonNumericalOpportunityAssessment;
}

export function EvidenceDiagnosticAccordion({ assessment }: EvidenceDiagnosticAccordionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { decisionSupport, mandatoryGates, competencyFit, autonomyAlignment, unverifiedNotices } = assessment;
  const { recommendation } = decisionSupport;

  const verdictStyles: Record<string, { bg: string; border: string; text: string; badgeBg: string }> = {
    STRONG_OPPORTUNITY_VERIFIED: {
      bg: "bg-emerald-950/20",
      border: "border-emerald-500/30",
      text: "text-emerald-300",
      badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    },
    OPPORTUNITY_VERIFY_BEFORE_APPLYING: {
      bg: "bg-amber-950/20",
      border: "border-amber-500/30",
      text: "text-amber-300",
      badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    },
    STRETCH_OPPORTUNITY_GROWTH: {
      bg: "bg-cyan-950/20",
      border: "border-cyan-500/30",
      text: "text-cyan-300",
      badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    },
    INELIGIBLE_REQUIREMENT_UNSATISFIED: {
      bg: "bg-rose-950/20",
      border: "border-rose-500/30",
      text: "text-rose-300",
      badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    },
  };

  const currentStyle = verdictStyles[recommendation.verdict] || verdictStyles.OPPORTUNITY_VERIFY_BEFORE_APPLYING;

  return (
    <div className={`w-full rounded-xl border ${currentStyle.border} ${currentStyle.bg} p-5 shadow-sm transition-all`}>
      {/* Header Banner */}
      <div className="flex items-start justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${currentStyle.badgeBg}`}>
              {recommendation.candidateActionContext}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              v{assessment.assessmentVersion}
            </span>
          </div>
          <h3 className={`text-base font-semibold ${currentStyle.text}`}>
            {recommendation.headline}
          </h3>
        </div>
        <button className="text-zinc-400 hover:text-zinc-200 text-sm font-medium px-2 py-1">
          {isOpen ? "Collapse ▲" : "Expand Diagnostics ▼"}
        </button>
      </div>

      {/* Accordion Content */}
      {isOpen && (
        <div className="mt-6 space-y-6 border-t border-zinc-800/80 pt-5">
          {/* Summary Rationale */}
          {recommendation.summaryRationale && recommendation.summaryRationale.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Diagnostic Rationale</h4>
              <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1">
                {recommendation.summaryRationale.map((rationale, idx) => (
                  <li key={idx}>{rationale}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Mandatory Statutory Gates */}
          {mandatoryGates.evaluations && mandatoryGates.evaluations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Mandatory Eligibility Gates ({mandatoryGates.overallStatus})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {mandatoryGates.evaluations.map((gate, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs">
                    <span className="font-medium text-zinc-200">{gate.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                        gate.gateStatus === "SATISFIED"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50"
                          : gate.gateStatus === "UNSATISFIED"
                          ? "bg-rose-950 text-rose-400 border border-rose-800/50"
                          : "bg-amber-950 text-amber-400 border border-amber-800/50"
                      }`}
                    >
                      {gate.gateStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verified Core Competencies */}
          {competencyFit.essentialCompetencies && competencyFit.essentialCompetencies.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Essential CompetenciesFit</h4>
              <div className="space-y-2">
                {competencyFit.essentialCompetencies.map((c, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-100">{c.competency}</span>
                      <span className="text-[11px] font-mono text-zinc-400">{c.status} ({c.provenance})</span>
                    </div>
                    {c.demonstratedIn && c.demonstratedIn.length > 0 && (
                      <div className="text-zinc-400 text-[11px]">
                        Anchored in: {c.demonstratedIn.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Prompts for Unverified Requirements */}
          {unverifiedNotices && unverifiedNotices.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Action Prompts — Unverified Requirements ({unverifiedNotices.length})
              </h4>
              <div className="space-y-2">
                {unverifiedNotices.map((notice, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs space-y-1 text-amber-200">
                    <div className="font-semibold text-amber-300">{notice.requirementName} [{notice.category}]</div>
                    <p className="text-[11px] leading-relaxed">{notice.userActionPrompt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Autonomy Scope & Transferable Narrative */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {autonomyAlignment && (
              <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                <span className="font-semibold text-zinc-200">Autonomy & Scope Context</span>
                <p className="text-zinc-400">{autonomyAlignment.autonomyDescriptor}</p>
              </div>
            )}
            {competencyFit.transferableCapabilities && competencyFit.transferableCapabilities.length > 0 && (
              <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                <span className="font-semibold text-zinc-200">Transferable Capabilities Narrative</span>
                {competencyFit.transferableCapabilities.map((t, idx) => (
                  <p key={idx} className="text-zinc-400">{t.sourceCapability} $\rightarrow$ {t.targetRequirement}: {t.transferRationale}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
