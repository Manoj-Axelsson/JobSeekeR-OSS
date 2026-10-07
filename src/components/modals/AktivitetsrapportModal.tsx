"use client";

import { useState } from "react";
import type { Application } from "@/types/domain";

export interface AktivitetsrapportModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: Application[];
  selectedMonth: string;
  candidateName: string;
}

export function generateAktivitetsrapportText(
  applications: Application[],
  selectedMonth: string,
  candidateName: string
): string {
  const lines = [
    `AKTIVITETSRAPPORT — ARBETSFÖRMEDLINGEN`,
    `Sökande: ${candidateName || "Kandidat"}`,
    `Rapporteringsmånad: ${selectedMonth || "Juli 2026"}`,
    `Antal sökta arbeten: ${applications.length}`,
    `--------------------------------------------------`,
    ...applications.map(
      (app, idx) =>
        `${idx + 1}. ${app.job?.title || "Sökt roll"} — ${app.job?.company || "Arbetsgivare"} (${app.job?.location || "Sverige"})\n   Ansökningsdatum: ${new Date(app.appliedAt).toLocaleDateString("sv-SE")}\n   Länk: ${app.job?.webpageUrl || "Direct application"}`
    ),
  ];
  return lines.join("\n\n");
}

export function AktivitetsrapportModal({
  isOpen,
  onClose,
  applications,
  selectedMonth,
  candidateName,
}: AktivitetsrapportModalProps) {
  const [copiedReport, setCopiedReport] = useState(false);

  if (!isOpen) return null;

  function copyTextReport() {
    const reportText = generateAktivitetsrapportText(
      applications,
      selectedMonth,
      candidateName
    );
    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 3000);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 space-y-6 shadow-2xl border border-slate-300">
        {/* Report Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
          <div>
            <span className="text-[14px] font-bold uppercase tracking-wider text-emerald-700">
              Official Swedish Compliance Export
            </span>
            <h1 className="text-[28px] font-bold text-slate-950 mt-1">
              AKTIVITETSRAPPORT — ARBETSFÖRMEDLINGEN
            </h1>
            <p className="text-[16px] text-slate-600">
              Månadssammanställning över sökta arbeten för redovisning till Arbetsförmedlingen
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[24px] font-bold text-slate-500 hover:text-slate-900 p-1 cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Applicant Summary Meta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-100 p-4 rounded-xl border border-slate-300 text-[16px]">
          <div>
            <span className="font-bold text-slate-600 block text-[14px]">
              SÖKANDE / CANDIDATE:
            </span>
            <span className="font-bold text-slate-950">{candidateName || "Kandidat"}</span>
          </div>
          <div>
            <span className="font-bold text-slate-600 block text-[14px]">
              RAPPORTERINGSMÅNAD:
            </span>
            <span className="font-bold text-emerald-800">{selectedMonth || "Juli 2026"}</span>
          </div>
          <div>
            <span className="font-bold text-slate-600 block text-[14px]">
              TOTALT SÖKTA ARBETEN:
            </span>
            <span className="font-bold text-slate-950">{applications.length} stycken</span>
          </div>
        </div>

        {/* Official Activity Table */}
        <div>
          <h2 className="text-[20px] font-bold text-slate-900 mb-3">
            Redovisning av sökta arbeten
          </h2>
          {applications.length === 0 ? (
            <p className="text-[16px] text-slate-600 italic">
              Inga sökta arbeten registrerade för denna månad ännu.
            </p>
          ) : (
            <div className="overflow-x-auto border border-slate-300 rounded-xl">
              <table className="w-full text-left text-[15px]">
                <thead className="bg-slate-200 text-slate-800 uppercase text-[13px] font-bold border-b border-slate-300">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Yrkesbenämning (Roll)</th>
                    <th className="py-3 px-4">Arbetsgivare</th>
                    <th className="py-3 px-4">Ort / Kommun</th>
                    <th className="py-3 px-4">Ansökningsdatum</th>
                    <th className="py-3 px-4">Länk / Referens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {applications.map((app, idx) => (
                    <tr key={app.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-950">
                        {app.job?.title || "Sökt roll"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {app.job?.company || "Arbetsgivare"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {app.job?.location || "Sverige"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-800">
                        {new Date(app.appliedAt).toLocaleDateString("sv-SE")}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600 truncate max-w-50">
                        {app.job?.webpageUrl || "Direct Application"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Controls & Export Actions */}
        <div className="pt-4 border-t border-slate-300 flex flex-wrap justify-between items-center gap-3">
          <button
            onClick={copyTextReport}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 text-[16px] font-bold rounded-xl transition cursor-pointer flex items-center space-x-2"
          >
            <span>
              {copiedReport
                ? "✓ Kopierat till urklipp!"
                : "📋 Kopiera text för Arbetsförmedlingen Portal"}
            </span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.print()}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[16px] font-bold rounded-xl transition cursor-pointer shadow-md flex items-center space-x-2"
            >
              <span>🖨️ Skriv ut / Spara som PDF (Print)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
