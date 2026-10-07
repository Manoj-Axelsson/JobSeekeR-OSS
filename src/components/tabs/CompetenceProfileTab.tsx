"use client";

import { useState } from "react";

export interface CompetenceProfileTabProps {
  profileName: string;
  minScore: number;
  onMinScoreChange: (score: number) => void;
  excludedCompanies: string[];
  onToggleCompanyExclusion: (company: string) => Promise<void> | void;
  onOpenOnboarding: () => void;
  isDark: boolean;
}

export function toggleExcludedCompany(
  excludedCompanies: string[],
  companyName: string
): string[] {
  const trimmed = companyName.trim();
  if (!trimmed) return excludedCompanies;
  if (excludedCompanies.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
    return excludedCompanies.filter((c) => c.toLowerCase() !== trimmed.toLowerCase());
  }
  return [...excludedCompanies, trimmed];
}

export function CompetenceProfileTab({
  profileName,
  minScore,
  onMinScoreChange,
  excludedCompanies,
  onToggleCompanyExclusion,
  onOpenOnboarding,
  isDark,
}: CompetenceProfileTabProps) {
  const [newCompanyToBlock, setNewCompanyToBlock] = useState("");

  return (
    <div className="space-y-6 max-w-4xl">
      <div
        className={`rounded-2xl p-6 border space-y-6 transition ${
          isDark
            ? "bg-slate-900/80 border-slate-800"
            : "bg-white border-slate-200 shadow-sm"
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2
              className={`text-xl sm:text-2xl font-black ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {profileName || "Candidate Profile"} — Competence &amp; CV Profile
            </h2>
            <p
              className={`text-xs sm:text-sm mt-1 ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Target roles and skill taxonomy stored in your local SQLite database
              (`prisma/dev.db`) used to score daily Swedish job ads.
            </p>
          </div>
          <button
            onClick={onOpenOnboarding}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md shrink-0"
          >
            ✏️ Edit Profile &amp; Target Roles
          </button>
        </div>

        {/* Competence Domains */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div
            className={`p-5 rounded-xl border ${
              isDark
                ? "bg-slate-950 border-slate-800"
                : "bg-slate-100 border-slate-300 text-black"
            }`}
          >
            <h3
              className={`text-base font-black uppercase tracking-wider mb-2 ${
                isDark ? "text-blue-400" : "text-blue-900"
              }`}
            >
              1. Software Engineering
            </h3>
            <p
              className={`text-sm sm:text-base font-medium leading-relaxed ${
                isDark ? "text-slate-300" : "text-slate-900"
              }`}
            >
              React, TypeScript, Next.js, Node.js, Express, PostgreSQL, SQL, REST
              APIs, Git/GitHub, Tailwind CSS, Vercel.
            </p>
          </div>

          <div
            className={`p-5 rounded-xl border ${
              isDark
                ? "bg-slate-950 border-slate-800"
                : "bg-slate-100 border-slate-300 text-black"
            }`}
          >
            <h3
              className={`text-base font-black uppercase tracking-wider mb-2 ${
                isDark ? "text-purple-400" : "text-purple-900"
              }`}
            >
              2. Systems Engineering &amp; Architecture
            </h3>
            <p
              className={`text-sm sm:text-base font-medium leading-relaxed ${
                isDark ? "text-slate-300" : "text-slate-900"
              }`}
            >
              Systems Thinking, Software Architecture, Requirements Engineering,
              Validation &amp; Verification, Technical Documentation, PLM.
            </p>
          </div>

          <div
            className={`p-5 rounded-xl border ${
              isDark
                ? "bg-slate-950 border-slate-800"
                : "bg-slate-100 border-slate-300 text-black"
            }`}
          >
            <h3
              className={`text-base font-black uppercase tracking-wider mb-2 ${
                isDark ? "text-emerald-400" : "text-emerald-900"
              }`}
            >
              3. Quality &amp; Continuous Improvement
            </h3>
            <p
              className={`text-sm sm:text-base font-medium leading-relaxed ${
                isDark ? "text-slate-300" : "text-slate-900"
              }`}
            >
              Six Sigma Green Belt (KPMG), DMAIC, FMEA, Poka-Yoke, Root Cause
              Analysis, QA, Process Optimization, Standard Work.
            </p>
          </div>

          <div
            className={`p-5 rounded-xl border ${
              isDark
                ? "bg-slate-950 border-slate-800"
                : "bg-slate-100 border-slate-300 text-black"
            }`}
          >
            <h3
              className={`text-base font-black uppercase tracking-wider mb-2 ${
                isDark ? "text-amber-400" : "text-amber-900"
              }`}
            >
              4. Industrial &amp; Manufacturing
            </h3>
            <p
              className={`text-sm sm:text-base font-medium leading-relaxed ${
                isDark ? "text-slate-300" : "text-slate-900"
              }`}
            >
              Manufacturing Engineering, Production Development, Lean Manufacturing,
              Industrial Digitalization, Automation, CNC, CAD/CAM.
            </p>
          </div>
        </div>

        {/* Scanner Threshold Slider */}
        <div
          className={`pt-4 border-t space-y-2 ${
            isDark ? "border-slate-800" : "border-slate-200"
          }`}
        >
          <label
            className={`text-[17px] font-semibold flex justify-between ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            <span>Candidate Match Preference Benchmark:</span>
            <span className="text-emerald-600 font-bold text-[21px]">
              {minScore}% Benchmark
            </span>
          </label>
          <input
            type="range"
            min="30"
            max="80"
            value={minScore}
            onChange={(e) => onMinScoreChange(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <p
            className={`text-[16px] ${
              isDark ? "text-slate-500" : "text-slate-500"
            }`}
          >
            Candidate-led feed: all fresh eligible jobs are presented chronologically.
            Benchmark preference setting: {minScore}%.
          </p>
        </div>

        {/* 🚫 Excluded Companies & Employer Blacklist Manager */}
        <div
          className={`pt-6 border-t space-y-4 ${
            isDark ? "border-slate-800" : "border-slate-200"
          }`}
        >
          <div>
            <h3 className="text-[20px] font-extrabold text-red-400 flex items-center space-x-2">
              <span>🚫 Excluded Companies &amp; Employer Blacklist</span>
            </h3>
            <p
              className={`text-[16px] mt-0.5 ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Job ads from these employers will be automatically hidden from your
              daily feed and API scans.
            </p>
          </div>

          {/* Form to add company to blacklist */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newCompanyToBlock.trim()) {
                onToggleCompanyExclusion(newCompanyToBlock);
                setNewCompanyToBlock("");
              }
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              placeholder="Type company name to block (e.g. Acme Corp, Unwanted Company AB)..."
              value={newCompanyToBlock}
              onChange={(e) => setNewCompanyToBlock(e.target.value)}
              className="flex-1 bg-[#241203] border border-amber-500/40 rounded-xl px-4 py-2.5 text-sm text-amber-100 placeholder:opacity-50 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
            />
            <button
              type="submit"
              disabled={!newCompanyToBlock.trim()}
              className="px-5 py-2.5 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition cursor-pointer shadow-sm shrink-0"
            >
              + Block Company
            </button>
          </form>

          {/* Excluded company badges list */}
          <div className="flex flex-wrap gap-2 pt-2">
            {excludedCompanies.length === 0 ? (
              <p className="text-xs text-amber-200/60 italic">
                No companies currently blocked.
              </p>
            ) : (
              excludedCompanies.map((comp) => (
                <span
                  key={comp}
                  className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-950/90 text-red-200 border border-red-500/40 shadow-sm"
                >
                  <span>🏢 {comp}</span>
                  <button
                    type="button"
                    onClick={() => onToggleCompanyExclusion(comp)}
                    className="text-red-400 hover:text-white font-black text-sm ml-1 cursor-pointer"
                    title={`Remove ${comp} from blacklist`}
                  >
                    ✕
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
