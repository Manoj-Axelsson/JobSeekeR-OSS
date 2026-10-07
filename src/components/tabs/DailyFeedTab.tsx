"use client";

import { useState } from "react";
import type { JobAd, Application } from "@/types/domain";
import type { TranslationDictionary } from "@/lib/services/i18n";
import {
  parseSalaryFromDescription,
  calculatePredictiveConfidence,
  generateTodaysRecommendations,
  type RecommendationItem,
} from "@/intelligence";

export interface SearchProfile {
  id: string;
  name: string;
  isPrimary?: boolean;
}

export interface DailyFeedTabProps {
  jobs: JobAd[];
  applications: Application[];
  primaryJobs: JobAd[];
  discoveryJobs: JobAd[];
  eligibleJobs: JobAd[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  searchProfilesList: SearchProfile[];
  selectedProfileId: string;
  onSelectProfileId: (id: string) => void;
  appliedConfirmJobIds: Set<string>;
  onSetAppliedConfirm: (jobId: string, confirmed: boolean) => void;
  onSelectJob: (job: JobAd) => void;
  onUpdateJobStatus: (jobId: string, status: JobAd["status"], notes?: string) => Promise<void> | void;
  onToggleCompanyExclusion: (company: string) => Promise<void> | void;
  onTriggerScan: () => void;
  onOpenDocUploader: () => void;
  onNavigateTab: (tab: "feed" | "tracker" | "profile" | "logs" | "intelligence" | "settings") => void;
  onRefreshData: () => Promise<void> | void;
  isDark: boolean;
  t: TranslationDictionary;
}

/**
 * Pure helper function to filter eligible jobs by query, status, minScore, and company blacklist.
 */
export function filterEligibleJobs(
  jobs: JobAd[],
  searchQuery: string,
  statusFilter: string,
  minScore: number = 0,
  excludedCompanies: string[] = []
): JobAd[] {
  return jobs.filter((job) => {
    // 0. Excluded Companies Blacklist Check
    const isExcluded = excludedCompanies.some(
      (c) => c && job.company.toLowerCase().includes(c.toLowerCase())
    );
    if (isExcluded) return false;

    // Minimum match score threshold
    if (minScore > 0 && job.matchScore < minScore) return false;

    // Search filter across title, company, location
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL"
        ? job.status !== "DISCARDED" && job.status !== "APPLIED"
        : job.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}

/**
 * Pure helper function to partition eligible jobs into Primary (up to 15) and Discovery (up to 10),
 * ordered newest publishedAt first.
 */
export function partitionFeeds(
  eligibleJobs: JobAd[],
  selectedProfileId: string = "ALL"
): { primaryJobs: JobAd[]; discoveryJobs: JobAd[]; filteredJobs: JobAd[] } {
  const sortedEligibleJobs = [...eligibleJobs].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const primaryJobs = sortedEligibleJobs
    .filter((job) => {
      const profileEval =
        selectedProfileId !== "ALL" && job.profileEvaluations?.length
          ? job.profileEvaluations.find((pe) => pe.searchProfileId === selectedProfileId)
          : undefined;
      const effectiveFeedType = profileEval ? profileEval.feedType : job.feedType || "PRIMARY";
      return effectiveFeedType === "PRIMARY";
    })
    .slice(0, 15);

  const primaryJobIds = new Set(primaryJobs.map((j) => j.id));

  const discoveryJobs = sortedEligibleJobs
    .filter((job) => !primaryJobIds.has(job.id))
    .slice(0, 10);

  const filteredJobs = [...primaryJobs, ...discoveryJobs];

  return { primaryJobs, discoveryJobs, filteredJobs };
}

export function DailyFeedTab({
  jobs,
  applications,
  primaryJobs,
  discoveryJobs,
  eligibleJobs,
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  searchProfilesList,
  selectedProfileId,
  onSelectProfileId,
  appliedConfirmJobIds,
  onSetAppliedConfirm,
  onSelectJob,
  onUpdateJobStatus,
  onTriggerScan,
  onOpenDocUploader,
  onNavigateTab,
  onRefreshData,
  isDark,
  t,
}: DailyFeedTabProps) {
  // Feed-local accordion expanded state
  const [expandedJobIds, setExpandedJobIds] = useState<Set<string>>(new Set());

  // V2 Constitutional Feed Separation State
  const [v2FeedTab, setV2FeedTab] = useState<"PRIMARY" | "DISCOVERY">("PRIMARY");

  // Job URL Importer local form state
  const [importUrlInput, setImportUrlInput] = useState("");
  const [importStatus, setImportStatus] = useState<"APPLIED" | "SAVED" | "NEW">("APPLIED");
  const [importingUrl, setImportingUrl] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const handleImportJobUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!importUrlInput.trim()) return;
    setImportingUrl(true);
    setImportMessage(null);
    try {
      const res = await fetch("/api/jobs/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrlInput.trim(), status: importStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setImportMessage(`✓ ${data.message || "Job ad imported and matched successfully!"}`);
        setImportUrlInput("");
        await onRefreshData();
      } else {
        setImportMessage(`❌ ${data.error || "Failed to import job URL."}`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Import failed";
      setImportMessage(`❌ Error: ${errorMsg}`);
    } finally {
      setImportingUrl(false);
    }
  };

  const toggleAccordion = (jobId: string) => {
    setExpandedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const currentDisplayJobs =
    statusFilter === "ALL"
      ? v2FeedTab === "PRIMARY"
        ? primaryJobs
        : discoveryJobs
      : eligibleJobs;

  return (
    <div className="space-y-5">
      {/* External Job URL Importer Bar (LinkedIn, Teamtailor, Workday, ATS Portals) */}
      <div className="bg-[#5c3612]/90 border-2 border-amber-300/60 rounded-2xl p-3.5 sm:p-4 shadow-xl text-amber-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm sm:text-base font-extrabold text-amber-300 uppercase tracking-wider flex items-center space-x-2">
            <span>🔗 Importera Direkt Jobblänk</span>
            <span className="text-xs font-normal text-amber-200/70 normal-case">
              (LinkedIn, Teamtailor, Workday, ATS Portal)
            </span>
          </h3>
        </div>
        <form onSubmit={handleImportJobUrl} className="flex flex-col sm:flex-row gap-3 items-stretch">
          <input
            type="url"
            placeholder="Klistra in jobb-URL (t.ex. LinkedIn, Teamtailor, Workday, karriärsida)..."
            value={importUrlInput}
            onChange={(e) => setImportUrlInput(e.target.value)}
            className="flex-1 bg-[#241203] border border-amber-500/40 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold text-amber-100 placeholder:opacity-50 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
          />
          <select
            value={importStatus}
            onChange={(e) => setImportStatus(e.target.value as "APPLIED" | "SAVED" | "NEW")}
            className="bg-[#241203] border border-amber-500/40 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-400 transition cursor-pointer"
          >
            <option value="APPLIED">✉️ Save as Applied</option>
            <option value="SAVED">🔖 Save for Later</option>
            <option value="NEW">🆕 Save as New</option>
          </select>
          <button
            type="submit"
            disabled={importingUrl || !importUrlInput.trim()}
            className="px-5 py-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-amber-950 font-black text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center space-x-2 shrink-0"
          >
            <span>{importingUrl ? "⏳ Importerar..." : "🚀 Importera & Spara"}</span>
          </button>
        </form>
        {importMessage && (
          <p className="mt-2 text-xs font-bold text-amber-300 animate-fade-in">{importMessage}</p>
        )}
      </div>

      {/* 💡 Today's Recommendation Synthesized Intelligence Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-950/90 via-orange-950 to-amber-900/90 border-2 border-amber-400/60 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">💡</span>
            <h3 className="text-base sm:text-lg font-black text-amber-300 uppercase tracking-wide">
              Today&apos;s Recommendation
            </h3>
          </div>
          {(() => {
            const conf = calculatePredictiveConfidence(jobs, applications);
            return (
              <span className="px-3.5 py-1 rounded-full text-xs sm:text-sm font-extrabold bg-amber-950 text-amber-300 border border-amber-400/40 shadow-sm flex items-center space-x-1.5">
                <span>{conf.statusBadge}</span>
                <span>•</span>
                <span>Confidence: {conf.confidencePct}%</span>
              </span>
            );
          })()}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {generateTodaysRecommendations(jobs, applications).map((rec: RecommendationItem) => (
            <div
              key={rec.id}
              onClick={() => {
                if (rec.actionType === "OPEN_JOB_MODAL" && rec.targetJobId) {
                  const target = jobs.find((j) => j.id === rec.targetJobId);
                  if (target) onSelectJob(target);
                } else if (rec.actionType === "OPEN_DOC_UPLOADER") {
                  onOpenDocUploader();
                } else if (rec.actionType === "NAVIGATE_TAB" && rec.targetTab) {
                  onNavigateTab(rec.targetTab);
                } else if (rec.actionType === "TRIGGER_SCAN") {
                  onTriggerScan();
                }
              }}
              className="p-4 rounded-xl bg-amber-950/80 hover:bg-amber-900/90 border-2 border-amber-500/40 hover:border-amber-300 transition-all cursor-pointer shadow-md space-y-2.5 group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-xs font-black uppercase px-2.5 py-1 rounded-md bg-amber-400 text-amber-950 inline-block shadow-sm">
                  {rec.priorityBadge}
                </span>
                <h4 className="font-black text-sm sm:text-base text-amber-200 group-hover:text-amber-300 leading-snug">
                  {rec.title}
                </h4>
                <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-medium">
                  {rec.rationale}
                </p>
              </div>

              <div className="pt-2 border-t border-amber-500/30 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold text-amber-300 group-hover:text-amber-200">
                  {rec.actionText}
                </span>
                <span className="text-amber-400 group-hover:translate-x-1 transition-transform font-bold">
                  ➔
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div
        className={`flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center p-3.5 sm:p-4 rounded-2xl border transition ${
          isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}
      >
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 text-[17px] focus:outline-none focus:border-amber-500 transition bg-[#251304] border-amber-500/40 text-amber-100"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {searchProfilesList.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-[15px] font-bold text-amber-300">Search Track:</span>
              <select
                value={selectedProfileId}
                onChange={(e) => onSelectProfileId(e.target.value)}
                className="border border-amber-500/40 rounded-xl px-3 py-3 text-[15px] focus:outline-none focus:ring-1 focus:ring-amber-400 bg-[#251304] text-amber-100 font-bold cursor-pointer"
              >
                <option value="ALL">All Active Tracks</option>
                {searchProfilesList.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.isPrimary ? "📍 " : "🌐 "}
                    {sp.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <span className="text-[17px] font-medium text-amber-300">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="border border-amber-500/40 rounded-xl px-4 py-3 text-[17px] focus:outline-none focus:ring-1 focus:ring-amber-400 bg-[#251304] text-amber-100 font-bold cursor-pointer"
            >
              <option value="ALL">{t.statusAll}</option>
              <option value="NEW">New Jobs</option>
              <option value="SAVED">Saved Jobs</option>
              <option value="APPLIED">{t.statusApplied}</option>
            </select>
          </div>
        </div>
      </div>

      {/* V2 CONSTITUTIONAL FEED SEPARATION TABS (PRIMARY VS DISCOVERY) */}
      <div className="p-1.5 rounded-2xl bg-[#361c07] border-2 border-amber-400/50 shadow-xl flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => setV2FeedTab("PRIMARY")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
            v2FeedTab === "PRIMARY"
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg border border-emerald-300 scale-[1.01]"
              : "bg-[#241203] text-amber-200 hover:bg-[#4a2709] border border-amber-500/30"
          }`}
        >
          <span className="text-base sm:text-lg">📍</span>
          <div className="text-left">
            <p className="font-black leading-none text-white">📍 Primary Feed</p>
            <p className="text-[10px] sm:text-[11px] font-medium opacity-90">
              Find me what I asked for (Strict Territory & Intent)
            </p>
          </div>
        </button>

        <button
          onClick={() => setV2FeedTab("DISCOVERY")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
            v2FeedTab === "DISCOVERY"
              ? "bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 text-white shadow-lg border border-indigo-300 scale-[1.01]"
              : "bg-[#241203] text-amber-200 hover:bg-[#4a2709] border border-amber-500/30"
          }`}
        >
          <span className="text-base sm:text-lg">🌐</span>
          <div className="text-left">
            <p className="font-black leading-none text-white">🌐 Discovery Feed</p>
            <p className="text-[10px] sm:text-[11px] font-medium opacity-90">
              Additional opportunities (Newest published first)
            </p>
          </div>
        </button>
      </div>

      {/* Job List Accordions */}
      {currentDisplayJobs.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border bg-[#381f09]/80 border-amber-500/40 shadow-xl">
          <h3 className="text-[23px] font-bold text-amber-100">
            {v2FeedTab === "PRIMARY"
              ? "No Primary Feed Jobs Found"
              : "No Discovery Opportunities Found"}
          </h3>
          <p className="text-[17px] mt-1 text-amber-200/70">
            {v2FeedTab === "PRIMARY"
              ? "Try running a job scan or adjusting your target search profile."
              : "No additional discovery opportunities found at this time."}
          </p>
          <button
            onClick={onTriggerScan}
            className="mt-4 px-6 py-3 bg-linear-to-r from-amber-400 to-orange-500 text-amber-950 text-[17px] font-black rounded-xl hover:opacity-90 transition shadow-lg cursor-pointer"
          >
            ⚡ {t.runJobScan}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {currentDisplayJobs.map((job) => {
            const matchedSkillsArr: string[] = JSON.parse(job.matchedSkills || "[]");
            const domainScoresObj = JSON.parse(job.domainScores || "{}");
            const isExpanded = expandedJobIds.has(job.id);

            // Active profile evaluation if specific profile selected
            const profileEval =
              selectedProfileId !== "ALL"
                ? job.profileEvaluations?.find((pe) => pe.searchProfileId === selectedProfileId)
                : undefined;

            const effectiveFeedType = profileEval ? profileEval.feedType : job.feedType || "PRIMARY";
            const isPrimary = effectiveFeedType === "PRIMARY";

            return (
              <div
                key={job.id}
                className={`rounded-2xl border transition shadow-sm overflow-hidden ${
                  isDark
                    ? "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* ACCORDION COLLAPSED HEADER */}
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Top Row: V2 Feed Badge + Score Badges + Status */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Constitutional Feed Badge */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border shadow-sm ${
                          isPrimary
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                            : "bg-indigo-500/20 text-indigo-300 border-indigo-400/40"
                        }`}
                      >
                        {isPrimary ? "📍 Primary Feed" : "🌐 Discovery Feed"}
                      </span>

                      <span
                        className={`text-[14px] font-semibold uppercase px-3 py-0.5 rounded-md ${
                          job.status === "APPLIED"
                            ? isDark
                              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                              : "bg-cyan-50 text-cyan-700 border border-cyan-200"
                            : job.status === "SAVED"
                              ? isDark
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                              : job.status === "DISCARDED"
                                ? isDark
                                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                  : "bg-red-50 text-red-700 border border-red-200"
                                : isDark
                                  ? "bg-slate-800 text-slate-400"
                                  : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {job.status}
                      </span>

                      {/* Source Badge */}
                      <span
                        className={`text-[13px] font-bold px-2.5 py-0.5 rounded-md border ${
                          job.source.includes("LinkedIn")
                            ? "bg-blue-600 text-white border-blue-700"
                            : isDark
                              ? "bg-slate-800 text-emerald-400 border-slate-700"
                              : "bg-slate-100 text-slate-700 border-slate-300"
                        }`}
                      >
                        {job.source.includes("LinkedIn")
                          ? "💼 LinkedIn Jobs"
                          : "🏛️ JobTech Platsbanken"}
                      </span>

                      <span className={`text-[15px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        Published: {new Date(job.publishedAt).toLocaleDateString("sv-SE")}
                      </span>

                      {/* Salary Intelligence Badge */}
                      {(() => {
                        const salaryInfo = parseSalaryFromDescription(job.description);
                        if (salaryInfo.salaryRawText) {
                          return (
                            <span className="text-[13px] font-extrabold px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm flex items-center space-x-1">
                              <span>💰</span>
                              <span>{salaryInfo.salaryRawText}</span>
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* Title & Company */}
                    <div>
                      <h2 className={`text-[22px] font-black ${isDark ? "text-white" : "text-black"}`}>
                        {job.title}
                      </h2>
                      <p
                        className={`text-[16px] font-bold mt-0.5 flex items-center space-x-2 ${
                          isDark ? "text-slate-300" : "text-black"
                        }`}
                      >
                        <span>🏢 {job.company}</span>
                        <span>•</span>
                        <span>📍 {job.location}</span>
                      </p>
                    </div>
                  </div>

                  {/* Accordion Toggle & Quick Primary Actions */}
                  <div className="flex items-center space-x-3">
                    {/* Primary Action / Accidental Undo Button */}
                    {job.status === "APPLIED" ? (
                      <button
                        onClick={() => onUpdateJobStatus(job.id, "NEW")}
                        className="px-4 py-2 bg-amber-700/90 hover:bg-amber-600 text-white text-[15px] font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center space-x-1.5"
                        title="Undo accidental application status and return job to active feed"
                      >
                        <span>↩️ Undo Applied</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateJobStatus(job.id, "APPLIED")}
                        className="px-4 py-2 bg-cyan-600 text-white hover:bg-cyan-500 text-[15px] font-bold rounded-xl transition cursor-pointer shadow-sm"
                      >
                        Mark Applied
                      </button>
                    )}

                    {/* Accordion Menu Toggle Button */}
                    <button
                      onClick={() => toggleAccordion(job.id)}
                      className={`px-4 py-2 text-[16px] font-bold rounded-xl border transition flex items-center space-x-2 cursor-pointer ${
                        isExpanded
                          ? isDark
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : isDark
                            ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                            : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      <span>{isExpanded ? "▲ Hide Menu" : "▼ Breakdown & Options"}</span>
                    </button>
                  </div>
                </div>

                {/* ACCORDION EXPANDED DROPDOWN MENU PANEL */}
                {isExpanded && (
                  <div
                    className={`p-6 border-t space-y-6 transition-all ${
                      isDark
                        ? "border-slate-800 bg-slate-950/60"
                        : "border-slate-200 bg-slate-50/70"
                    }`}
                  >
                    {/* 1. ACCORDION ACTION BUTTONS DROPDOWN MENU */}
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        {/* Breakdown & Analysis */}
                        <button
                          onClick={() => onSelectJob(job)}
                          className="px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-500 text-[15px] font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center space-x-1.5"
                        >
                          <span>💡 Match Breakdown & Pitch Strategy</span>
                        </button>

                        {/* Save Job */}
                        {job.status !== "SAVED" && (
                          <button
                            onClick={() => onUpdateJobStatus(job.id, "SAVED")}
                            className={`px-4 py-2.5 text-[15px] font-bold rounded-xl transition cursor-pointer border flex items-center space-x-1.5 ${
                              isDark
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20"
                                : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                            }`}
                          >
                            <span>🔖 Save Job</span>
                          </button>
                        )}

                        {/* Mark / Undo Applied */}
                        {job.status === "APPLIED" ? (
                          <button
                            onClick={() => onUpdateJobStatus(job.id, "NEW")}
                            className="px-4 py-2.5 bg-amber-700/90 hover:bg-amber-600 text-white text-[15px] font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center space-x-1.5"
                            title="Revert application status"
                          >
                            <span>↩️ Undo / Unmark Applied</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateJobStatus(job.id, "APPLIED")}
                            className="px-4 py-2.5 bg-cyan-600 text-white hover:bg-cyan-500 text-[15px] font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center space-x-1.5"
                          >
                            <span>✉️ Mark as Applied</span>
                          </button>
                        )}

                        {/* Direct Apply Web Link */}
                        {job.webpageUrl && (
                          <a
                            href={job.webpageUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => onSetAppliedConfirm(job.id, true)}
                            className={`px-4 py-2.5 text-[15px] font-bold rounded-xl transition cursor-pointer border flex items-center space-x-1.5 ${
                              isDark
                                ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                                : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200"
                            }`}
                          >
                            <span>
                              {job.id.startsWith("li_") ||
                              (job.webpageUrl && job.webpageUrl.includes("linkedin.com"))
                                ? "↗️ Apply on LinkedIn"
                                : "↗️ Apply on Platsbanken"}
                            </span>
                          </a>
                        )}

                        {/* DISCARD / DELETE BUTTON */}
                        <button
                          onClick={() => onUpdateJobStatus(job.id, "DISCARDED")}
                          className="px-4 py-2.5 bg-red-600/10 text-red-600 border border-red-200 dark:border-red-500/30 hover:bg-red-600 text-[15px] hover:text-white font-bold rounded-xl transition cursor-pointer flex items-center space-x-1.5"
                        >
                          <span>🗑️ Discard & Delete (Never Show Again)</span>
                        </button>
                      </div>

                      {/* Application Confirmation Banner upon opening external portal */}
                      {appliedConfirmJobIds.has(job.id) && job.status !== "APPLIED" && (
                        <div className="mt-3 p-3.5 bg-[#4a2408] border-2 border-amber-400 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm shadow-xl">
                          <p className="font-black text-amber-200 flex items-center space-x-2">
                            <span>
                              ↗️ Opened external application portal. Did you finish submitting your application?
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

                    {/* 2. DOMAIN BREAKDOWN BADGES */}
                    <div>
                      <h4
                        className={`text-[16px] font-extrabold mb-2 ${
                          isDark ? "text-slate-300" : "text-black"
                        }`}
                      >
                        Domain Match Fit:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {domainScoresObj.software > 0 && (
                          <span
                            className={`text-[14px] px-3 py-1 rounded-md font-extrabold ${
                              isDark
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-blue-100 text-blue-950 border border-blue-300"
                            }`}
                          >
                            Software ({domainScoresObj.software}%)
                          </span>
                        )}
                        {domainScoresObj.systems > 0 && (
                          <span
                            className={`text-[14px] px-3 py-1 rounded-md font-extrabold ${
                              isDark
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : "bg-purple-100 text-purple-950 border border-purple-300"
                            }`}
                          >
                            Systems ({domainScoresObj.systems}%)
                          </span>
                        )}
                        {domainScoresObj.quality > 0 && (
                          <span
                            className={`text-[14px] px-3 py-1 rounded-md font-extrabold ${
                              isDark
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-emerald-100 text-emerald-950 border border-emerald-300"
                            }`}
                          >
                            Quality ({domainScoresObj.quality}%)
                          </span>
                        )}
                        {domainScoresObj.industrial > 0 && (
                          <span
                            className={`text-[14px] px-3 py-1 rounded-md font-extrabold ${
                              isDark
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-amber-100 text-amber-950 border border-amber-300"
                            }`}
                          >
                            Manufacturing ({domainScoresObj.industrial}%)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 3. MATCHED SKILL TAGS */}
                    {matchedSkillsArr.length > 0 && (
                      <div>
                        <h4
                          className={`text-[16px] font-extrabold mb-2 ${
                            isDark ? "text-slate-300" : "text-black"
                          }`}
                        >
                          Matched Skills &amp; Keywords:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {matchedSkillsArr.map((skill, idx) => (
                            <span
                              key={idx}
                              className={`text-[14px] px-3 py-1 rounded-md border font-bold ${
                                isDark
                                  ? "bg-slate-950 text-slate-300 border-slate-800"
                                  : "bg-slate-200 text-black border-slate-400"
                              }`}
                            >
                              ✓ {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. DESCRIPTION PREVIEW */}
                    <div>
                      <h4
                        className={`text-[16px] font-extrabold mb-2 ${
                          isDark ? "text-slate-300" : "text-black"
                        }`}
                      >
                        Job Overview:
                      </h4>
                      <p
                        className={`text-[17px] leading-relaxed whitespace-pre-line font-medium ${
                          isDark ? "text-slate-300" : "text-black"
                        }`}
                      >
                        {job.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
