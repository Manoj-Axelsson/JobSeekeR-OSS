"use client";

import { useEffect, useState } from "react";
import { evaluateJobMatch, MatchResult } from "@/lib/services/matcher";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { AuthModal } from "@/components/AuthModal";
import { DocumentUploader } from "@/components/DocumentUploader";
import { UserGuideModal } from "@/components/UserGuideModal";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Navbar } from "@/components/Navbar";
import { SidebarNav } from "@/components/SidebarNav";
import { speakText } from "@/lib/services/tts";
import { translations, Language } from "@/lib/services/i18n";
import {
  generateExecutiveCareerOverview,
  calculateRecruiterAnalytics,
  calculateUpskillingRoadmap,
  calculateCvPerformance,
  parseSalaryFromDescription,
  calculatePredictiveConfidence,
  generateTodaysRecommendations,
  RecommendationItem,
} from "@/intelligence";

interface JobAd {
  id: string;
  externalId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  webpageUrl: string | null;
  source: string;
  publishedAt: string;
  deadline: string | null;
  matchScore: number;
  matchedSkills: string; // JSON string array
  missingSkills: string; // JSON string array
  domainScores: string; // JSON string object
  status: "NEW" | "SAVED" | "APPLIED" | "DISCARDED";
  applications?: Application[];
}

interface Application {
  id: string;
  jobId: string;
  status: "APPLIED" | "INTERVIEWING" | "OFFER" | "REJECTED";
  appliedAt: string;
  resumeVersion: string;
  notes: string | null;
  monthlyTag: string;
  job?: JobAd;
}

interface ScanLog {
  id: string;
  scannedAt: string;
  totalFound: number;
  totalMatched: number;
  newAdded: number;
  status: string;
  message: string | null;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"feed" | "tracker" | "profile" | "logs" | "intelligence" | "settings">("feed");
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("light");
  const [isDark, setIsDark] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>("sv");

  const t = translations[currentLang] || translations.sv;

  const [jobs, setJobs] = useState<JobAd[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedJob, setSelectedJob] = useState<JobAd | null>(null);
  const [modalTab, setModalTab] = useState<"analysis" | "description">("analysis");

  // Onboarding & Auth & User Guide Modals state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [showDocUploader, setShowDocUploader] = useState(false);

  // Aktivitetsrapport State
  const [showAktivitetsrapport, setShowAktivitetsrapport] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Import Job URL state
  const [importUrlInput, setImportUrlInput] = useState("");
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
        body: JSON.stringify({ url: importUrlInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setImportMessage(`✓ ${data.message || "Job ad imported and matched successfully!"}`);
        setImportUrlInput("");
        fetchData();
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

  // Track expanded accordion cards by Job ID
  const [expandedJobIds, setExpandedJobIds] = useState<Set<string>>(new Set());

  // Profile states
  const [minScore, setMinScore] = useState(45);
  const [profileName, setProfileName] = useState("JobseekeR Candidate");

  // Handle Theme switching
  useEffect(() => {
    const updateTheme = () => {
      if (themeMode === "dark") {
        setIsDark(true);
      } else if (themeMode === "light") {
        setIsDark(false);
      } else {
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setIsDark(systemPrefersDark);
      }
    };

    updateTheme();

    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [themeMode]);

  useEffect(() => {
    fetchData();
  }, []);

  // Excluded Companies Blacklist state
  const [excludedCompanies, setExcludedCompanies] = useState<string[]>([]);
  const [newCompanyToBlock, setNewCompanyToBlock] = useState("");

  const handleToggleCompanyExclusion = async (companyName: string) => {
    const trimmed = companyName.trim();
    if (!trimmed) return;
    let updated: string[];
    if (excludedCompanies.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      updated = excludedCompanies.filter(c => c.toLowerCase() !== trimmed.toLowerCase());
    } else {
      updated = [...excludedCompanies, trimmed];
    }
    setExcludedCompanies(updated);
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excludedCompanies: updated }),
      });
    } catch (e) {
      console.error("Error updating excluded companies:", e);
    }
  };

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch profile
      const profRes = await fetch("/api/profile");
      if (profRes.ok) {
        const profData = await profRes.json();
        if (profData.name) setProfileName(profData.name);
        if (profData.minMatchScore) setMinScore(profData.minMatchScore);
        if (Array.isArray(profData.excludedCompanies)) setExcludedCompanies(profData.excludedCompanies);
      }

      // Fetch jobs
      const jobsRes = await fetch("/api/jobs");
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        const jobsList = Array.isArray(jobsData.jobs) ? jobsData.jobs : (Array.isArray(jobsData) ? jobsData : []);
        setJobs(jobsList);
      }

      // Fetch applications
      const appsRes = await fetch("/api/applications");
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        const appsList: Application[] = Array.isArray(appsData.applications) ? appsData.applications : (Array.isArray(appsData) ? appsData : []);
        setApplications(appsList);

        const sortedMonths = Array.isArray(appsData.months)
          ? appsData.months
          : Array.from(new Set(appsList.map((a) => a.monthlyTag).filter(Boolean))).sort().reverse();
        setMonths(sortedMonths);
        if (sortedMonths.length > 0 && !selectedMonth) {
          setSelectedMonth(sortedMonths[0]);
        }
      }

      // Fetch scan logs
      const logsRes = await fetch("/api/scans");
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        const logsList = Array.isArray(logsData.scanLogs) ? logsData.scanLogs : (Array.isArray(logsData) ? logsData : []);
        setScanLogs(logsList);
      }
    } catch (err) {
      console.error("fetchData error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function triggerJobScan() {
    setScanning(true);
    try {
      const res = await fetch("/api/cron/scrape", { method: "POST" });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  }

  async function updateJobStatus(jobId: string, newStatus: JobAd["status"], notes?: string) {
    try {
      const res = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, status: newStatus, notes }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        if (selectedJob && selectedJob.id === jobId) {
          setSelectedJob({ ...selectedJob, status: newStatus });
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  async function updateAppStatus(appId: string, newStatus: Application["status"]) {
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error("Error updating app status:", error);
    }
  }

  function toggleAccordion(jobId: string) {
    setExpandedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  }

  const jobsList = Array.isArray(jobs) ? jobs : [];
  const appsList = Array.isArray(applications) ? applications : [];
  const logsList = Array.isArray(scanLogs) ? scanLogs : [];

  const filteredJobs = jobsList.filter((job) => {
    // 0. Excluded Companies Blacklist Check
    const isExcluded = excludedCompanies.some((c) => c && job.company.toLowerCase().includes(c.toLowerCase()));
    if (isExcluded) return false;

    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL"
        ? job.status !== "DISCARDED" && job.status !== "APPLIED"
        : job.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredApps = appsList.filter((app) => {
    if (!selectedMonth) return true;
    return app.monthlyTag === selectedMonth;
  });

  const currentMonthTag = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();
  const currentMonthLabel = new Date().toLocaleDateString("sv-SE", {
    month: "long",
    year: "numeric",
  });
  const applicationsByMonth = appsList.reduce<Record<string, number>>((counts, app) => {
    counts[app.monthlyTag] = (counts[app.monthlyTag] || 0) + 1;
    return counts;
  }, {});
  const applicationMonths = Array.from(new Set([currentMonthTag, ...months])).sort().reverse();

  // Calculate live dynamic analysis for the selected job modal
  const jobAnalysis: MatchResult | null = selectedJob
    ? evaluateJobMatch(selectedJob.title, selectedJob.description)
    : null;

  function copyTextReport() {
    const lines = [
      `AKTIVITETSRAPPORT — ARBETSFÖRMEDLINGEN`,
      `Sökande: Manoj John Axelsson`,
      `Rapporteringsmånad: ${selectedMonth || "Juli 2026"}`,
      `Antal sökta arbeten: ${filteredApps.length}`,
      `--------------------------------------------------`,
      ...filteredApps.map(
        (app, idx) =>
          `${idx + 1}. ${app.job?.title || "Sökt roll"} — ${app.job?.company || "Arbetsgivare"} (${app.job?.location || "Sverige"})\n   Ansökningsdatum: ${new Date(app.appliedAt).toLocaleDateString("sv-SE")}\n   Länk: ${app.job?.webpageUrl || "Direct application"}`
      ),
    ];
    navigator.clipboard.writeText(lines.join("\n\n"));
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 3000);
  }

  return (
    <div
      style={{ fontFamily: 'Cochin, Georgia, Garamond, "Times New Roman", serif' }}
      className="min-h-screen bg-gradient-to-br from-[#593915] via-[#784e1d] to-[#996525] text-amber-50 selection:bg-amber-300 selection:text-amber-950 transition-colors duration-200 antialiased"
    >
      {/* Modern Responsive Navbar with Landing Page Warm Amber Theme */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profileName={profileName}
        jobCount={filteredJobs.length}
        appCount={appsList.length}
        scanning={scanning}
        onTriggerScan={triggerJobScan}
        onToggleDocUploader={() => setShowDocUploader(!showDocUploader)}
        onOpenOnboarding={() => setShowOnboarding(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenUserGuide={() => setShowUserGuide(true)}
        onLogout={() => setCurrentUser(null)}
        currentUser={currentUser}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        isDark={isDark}
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
      />

      {/* Main Content Area with Vertical Left Sidebar Navigation */}
      <main className="w-full max-w-[98%] mx-auto px-2 sm:px-4 py-3">
        <OnboardingWizard
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={fetchData}
        />

        <UserGuideModal
          isOpen={showUserGuide}
          onClose={() => setShowUserGuide(false)}
          onOpenOnboarding={() => setShowOnboarding(true)}
        />

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(u) => setCurrentUser(u)}
        />

        {showDocUploader && (
          <div className="mb-8">
            <DocumentUploader onUploadSuccess={fetchData} />
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Vertical Left Navigation Sidebar */}
          <SidebarNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            jobCount={filteredJobs.length}
            appCount={appsList.length}
            currentLang={currentLang}
            onOpenUserGuide={() => setShowUserGuide(true)}
          />

          {/* Main Dashboard Content Area */}
          <div className="flex-1 min-w-0">

            {loading ? (
              <div className="py-20 text-center">
                <div className="inline-block w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className={`mt-4 text-[18px] font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Loading JobseekeR™ Dashboard...
                </p>
              </div>
            ) : (
              <>
                {/* APPLICATION SUMMARY */}
                <section
                  aria-label="Monthly application summary"
                  className={`mb-5 rounded-2xl border p-3.5 sm:p-4 transition ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                    }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div
                      className={`min-w-55 rounded-xl border p-3.5 ${isDark
                        ? "bg-cyan-500/10 border-cyan-500/30"
                        : "bg-cyan-50 border-cyan-200"
                        }`}
                    >
                      <p className={`text-[16px] font-bold uppercase tracking-wide ${isDark ? "text-cyan-300" : "text-cyan-700"}`}>
                        Applied this month
                      </p>
                      <p className={`mt-1 text-[38px] font-bold leading-none ${isDark ? "text-cyan-200" : "text-cyan-800"}`}>
                        {applicationsByMonth[currentMonthTag] || 0}
                      </p>
                      <p className={`mt-2 text-[16px] capitalize ${isDark ? "text-cyan-200/70" : "text-cyan-700/80"}`}>
                        {currentMonthLabel}
                      </p>
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <h2 className={`text-[23px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                            Applications by calendar month
                          </h2>
                          <p className={`text-[17px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            Your applied jobs are kept in the Monthly Application Tracker.
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab("tracker")}
                          className="text-[16px] font-bold text-emerald-600 hover:text-emerald-500 underline cursor-pointer"
                        >
                          Open tracker →
                        </button>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        {applicationMonths.length === 0 ? (
                          <span className={`text-[16px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                            No applications recorded yet.
                          </span>
                        ) : (
                          applicationMonths.map((month) => (
                            <button
                              key={month}
                              onClick={() => {
                                setSelectedMonth(month);
                                setActiveTab("tracker");
                              }}
                              className={`rounded-lg border px-3.5 py-2 text-[16px] font-bold transition cursor-pointer ${month === currentMonthTag
                                ? isDark
                                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                                  : "border-cyan-300 bg-cyan-50 text-cyan-800"
                                : isDark
                                  ? "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-600"
                                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                                }`}
                            >
                              {month}: {applicationsByMonth[month] || 0}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* TAB 1: DAILY FEED */}
                {activeTab === "feed" && (
                  <div className="space-y-5">
                    {/* External Job URL Importer Bar (LinkedIn, Teamtailor, Workday, ATS Portals) */}
                    <div className="bg-[#5c3612]/90 border-2 border-amber-300/60 rounded-2xl p-3.5 sm:p-4 shadow-xl text-amber-100">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm sm:text-base font-extrabold text-amber-300 uppercase tracking-wider flex items-center space-x-2">
                          <span>🔗 Importera Direkt Jobblänk</span>
                          <span className="text-xs font-normal text-amber-200/70 normal-case">(LinkedIn, Teamtailor, Workday, ATS Portal)</span>
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
                        <button
                          type="submit"
                          disabled={importingUrl || !importUrlInput.trim()}
                          className="px-5 py-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-amber-950 font-black text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center space-x-2 shrink-0"
                        >
                          <span>{importingUrl ? "⏳ Importerar..." : "🚀 Importera & Matcha"}</span>
                        </button>
                      </form>
                      {importMessage && (
                        <p className="mt-2 text-xs font-bold text-amber-300 animate-fade-in">
                          {importMessage}
                        </p>
                      )}
                    </div>

                    {/* 💡 Today's Recommendation Synthesized Intelligence Card */}
                    {activeTab === "feed" && (
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
                                  if (target) setSelectedJob(target);
                                } else if (rec.actionType === "OPEN_DOC_UPLOADER") {
                                  setShowDocUploader(true);
                                } else if (rec.actionType === "NAVIGATE_TAB" && rec.targetTab) {
                                  setActiveTab(rec.targetTab);
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
                                <span className="text-amber-400 group-hover:translate-x-1 transition-transform font-bold">➔</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search & Filters */}
                    <div
                      className={`flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center p-3.5 sm:p-4 rounded-2xl border transition ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                        }`}
                    >
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder={t.searchPlaceholder}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className={`w-full border rounded-xl px-4 py-3 text-[17px] focus:outline-none focus:border-amber-500 transition ${isDark
                            ? "bg-[#251304] border-amber-500/40 text-amber-100"
                            : "bg-[#251304] border-amber-500/40 text-amber-100"
                            }`}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[17px] font-medium text-amber-300">Status:</span>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="border border-amber-500/40 rounded-xl px-4 py-3 text-[17px] focus:outline-none focus:ring-1 focus:ring-amber-400 bg-[#251304] text-amber-100 font-bold cursor-pointer"
                        >
                          <option value="ALL">{t.statusAll}</option>
                          <option value="NEW">New Jobs</option>
                          <option value="SAVED">Saved Jobs</option>
                          <option value="APPLIED">{t.statusApplied}</option>
                        </select>
                      </div>
                    </div>

                    {/* Job List Accordions */}
                    {filteredJobs.length === 0 ? (
                      <div
                        className="text-center py-16 rounded-2xl border bg-[#381f09]/80 border-amber-500/40 shadow-xl"
                      >
                        <h3 className="text-[23px] font-bold text-amber-100">{t.noJobsFound}</h3>
                        <p className="text-[17px] mt-1 text-amber-200/70">
                          Try running a job scan or adjusting your search filters.
                        </p>
                        <button
                          onClick={triggerJobScan}
                          className="mt-4 px-6 py-3 bg-linear-to-r from-amber-400 to-orange-500 text-amber-950 text-[17px] font-black rounded-xl hover:opacity-90 transition shadow-lg"
                        >
                          ⚡ {t.runJobScan}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredJobs.map((job) => {
                          const matchedSkillsArr: string[] = JSON.parse(job.matchedSkills || "[]");
                          const domainScoresObj = JSON.parse(job.domainScores || "{}");
                          const isExpanded = expandedJobIds.has(job.id);

                          return (
                            <div
                              key={job.id}
                              className={`rounded-2xl border transition shadow-sm overflow-hidden ${isDark
                                ? "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                                : "bg-white border-slate-200 hover:border-slate-300"
                                }`}
                            >
                              {/* ACCORDION COLLAPSED HEADER */}
                              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  {/* Top Row: Score Badge + Status */}
                                  <div className="flex items-center space-x-3">
                                    <span
                                      className={`px-3.5 py-1 rounded-full text-[16px] font-bold shadow-sm ${job.matchScore >= 75
                                        ? isDark
                                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                          : "bg-emerald-50 text-emerald-700 border border-emerald-300"
                                        : job.matchScore >= 55
                                          ? isDark
                                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                            : "bg-amber-50 text-amber-700 border border-amber-300"
                                          : isDark
                                            ? "bg-slate-800 text-slate-400"
                                            : "bg-slate-100 text-slate-600"
                                        }`}
                                    >
                                      {job.matchScore}% Match
                                    </span>

                                    <span
                                      className={`text-[14px] font-semibold uppercase px-3 py-0.5 rounded-md ${job.status === "APPLIED"
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
                                      className={`text-[13px] font-bold px-2.5 py-0.5 rounded-md border ${job.source.includes("LinkedIn")
                                        ? "bg-blue-600 text-white border-blue-700"
                                        : isDark
                                          ? "bg-slate-800 text-emerald-400 border-slate-700"
                                          : "bg-slate-100 text-slate-700 border-slate-300"
                                        }`}
                                    >
                                      {job.source.includes("LinkedIn") ? "💼 LinkedIn Jobs" : "🏛️ JobTech Platsbanken"}
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
                                    <p className={`text-[16px] font-bold mt-0.5 flex items-center space-x-2 ${isDark ? "text-slate-300" : "text-black"}`}>
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
                                      onClick={() => updateJobStatus(job.id, "NEW")}
                                      className="px-4 py-2 bg-amber-700/90 hover:bg-amber-600 text-white text-[15px] font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center space-x-1.5"
                                      title="Undo accidental application status and return job to active feed"
                                    >
                                      <span>↩️ Undo Applied</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => updateJobStatus(job.id, "APPLIED")}
                                      className="px-4 py-2 bg-cyan-600 text-white hover:bg-cyan-500 text-[15px] font-bold rounded-xl transition cursor-pointer shadow-sm"
                                    >
                                      Mark Applied
                                    </button>
                                  )}

                                  {/* Accordion Menu Toggle Button */}
                                  <button
                                    onClick={() => toggleAccordion(job.id)}
                                    className={`px-4 py-2 text-[16px] font-bold rounded-xl border transition flex items-center space-x-2 cursor-pointer ${isExpanded
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
                                <div className={`p-6 border-t space-y-6 transition-all ${isDark ? "border-slate-800 bg-slate-950/60" : "border-slate-200 bg-slate-50/70"}`}>
                                  {/* 1. ACCORDION ACTION BUTTONS DROPDOWN MENU */}
                                  <div>
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                      {/* Breakdown & Analysis */}
                                      <button
                                        onClick={() => {
                                          setSelectedJob(job);
                                          setModalTab("analysis");
                                        }}
                                        className="px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-500 text-[15px] font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center space-x-1.5"
                                      >
                                        <span>💡 Match Breakdown & Pitch Strategy</span>
                                      </button>

                                      {/* Save Job */}
                                      {job.status !== "SAVED" && (
                                        <button
                                          onClick={() => updateJobStatus(job.id, "SAVED")}
                                          className={`px-4 py-2.5 text-[15px] font-bold rounded-xl transition cursor-pointer border flex items-center space-x-1.5 ${isDark
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
                                          onClick={() => updateJobStatus(job.id, "NEW")}
                                          className="px-4 py-2.5 bg-amber-700/90 hover:bg-amber-600 text-white text-[15px] font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center space-x-1.5"
                                          title="Revert application status"
                                        >
                                          <span>↩️ Undo / Unmark Applied</span>
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => updateJobStatus(job.id, "APPLIED")}
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
                                          className={`px-4 py-2.5 text-[15px] font-bold rounded-xl transition cursor-pointer border flex items-center space-x-1.5 ${isDark
                                            ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                                            : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200"
                                            }`}
                                        >
                                          <span>↗️ Apply on Platsbanken</span>
                                        </a>
                                      )}

                                      {/* DISCARD / DELETE BUTTON */}
                                      <button
                                        onClick={() => updateJobStatus(job.id, "DISCARDED")}
                                        className="px-4 py-2.5 bg-red-600/10 text-red-600 border border-red-200 dark:border-red-500/30 hover:bg-red-600 text-[15px] hover:text-white font-bold rounded-xl transition cursor-pointer flex items-center space-x-1.5"
                                      >
                                        <span>🗑️ Discard & Delete (Never Show Again)</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* 2. DOMAIN BREAKDOWN BADGES */}
                                  <div>
                                    <h4 className={`text-[16px] font-extrabold mb-2 ${isDark ? "text-slate-300" : "text-black"}`}>
                                      Domain Match Fit:
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {domainScoresObj.software > 0 && (
                                        <span className={`text-[14px] px-3 py-1 rounded-md font-extrabold ${isDark ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-100 text-blue-950 border border-blue-300"}`}>
                                          Software ({domainScoresObj.software}%)
                                        </span>
                                      )}
                                      {domainScoresObj.systems > 0 && (
                                        <span className={`text-[14px] px-3 py-1 rounded-md font-extrabold ${isDark ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-purple-100 text-purple-950 border border-purple-300"}`}>
                                          Systems ({domainScoresObj.systems}%)
                                        </span>
                                      )}
                                      {domainScoresObj.quality > 0 && (
                                        <span className={`text-[14px] px-3 py-1 rounded-md font-extrabold ${isDark ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-100 text-emerald-950 border border-emerald-300"}`}>
                                          Quality ({domainScoresObj.quality}%)
                                        </span>
                                      )}
                                      {domainScoresObj.industrial > 0 && (
                                        <span className={`text-[14px] px-3 py-1 rounded-md font-extrabold ${isDark ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-amber-100 text-amber-950 border border-amber-300"}`}>
                                          Manufacturing ({domainScoresObj.industrial}%)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* 3. MATCHED SKILL TAGS */}
                                  {matchedSkillsArr.length > 0 && (
                                    <div>
                                      <h4 className={`text-[16px] font-extrabold mb-2 ${isDark ? "text-slate-300" : "text-black"}`}>
                                        Matched Skills &amp; Keywords:
                                      </h4>
                                      <div className="flex flex-wrap gap-2">
                                        {matchedSkillsArr.map((skill, idx) => (
                                          <span
                                            key={idx}
                                            className={`text-[14px] px-3 py-1 rounded-md border font-bold ${isDark
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
                                    <h4 className={`text-[16px] font-extrabold mb-2 ${isDark ? "text-slate-300" : "text-black"}`}>
                                      Job Overview:
                                    </h4>
                                    <p className={`text-[17px] leading-relaxed whitespace-pre-line font-medium ${isDark ? "text-slate-300" : "text-black"}`}>
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
                )}

                {/* TAB 2: MONTHLY APPLICATION TRACKER */}
                {activeTab === "tracker" && (
                  <div className="space-y-6">
                    {/* Month Tabs Header & Aktivitetsrapport Export */}
                    <div
                      className={`flex flex-col md:flex-row justify-between items-start md:items-center p-6 rounded-2xl border gap-4 transition ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                        }`}
                    >
                      <div>
                        <h2 className={`text-[23px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                          Monthly Job Application Log & Arbetsförmedlingen Compliance
                        </h2>
                        <p className={`text-[17px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                          Track jobs applied each month and generate your official Swedish **Aktivitetsrapport**.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[17px] font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>Select Month:</span>
                          <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className={`border rounded-xl px-4 py-2.5 text-[17px] focus:outline-none focus:border-emerald-600 ${isDark
                              ? "bg-slate-950 border-slate-800 text-slate-200"
                              : "bg-slate-50 border-slate-300 text-slate-900"
                              }`}
                          >
                            {months.length === 0 ? (
                              <option value="">No Month Logs Yet</option>
                            ) : (
                              months.map((m) => (
                                <option key={m} value={m}>
                                  📅 {m}
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        {/* AKTIVITETSRAPPORT EXPORT BUTTON */}
                        <button
                          onClick={() => setShowAktivitetsrapport(true)}
                          className="px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[16px] font-bold rounded-xl transition cursor-pointer shadow-md shadow-emerald-600/20 flex items-center space-x-2"
                        >
                          <span>📄 Export Swedish Aktivitetsrapport (PDF / Print)</span>
                        </button>
                      </div>
                    </div>

                    {/* Applications Table */}
                    {filteredApps.length === 0 ? (
                      <div
                        className={`text-center py-16 rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                          }`}
                      >
                        <p className={`text-[22px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                          No applications logged for {selectedMonth || "this month"}
                        </p>
                        <p className={`text-[17px] mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                          Mark jobs as &quot;Applied&quot; from the Daily Feed tab to start tracking your applications.
                        </p>
                      </div>
                    ) : (
                      <div
                        className={`overflow-x-auto rounded-2xl border shadow-sm transition ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
                          }`}
                      >
                        <table className="w-full text-left text-[17px]">
                          <thead
                            className={`uppercase tracking-wider border-b ${isDark
                              ? "bg-slate-950 text-slate-400 border-slate-800"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                          >
                            <tr>
                              <th className="py-4 px-5 font-bold text-[18px]">Job Title & Company</th>
                              <th className="py-4 px-5 font-bold text-[18px]">Location</th>
                              <th className="py-4 px-5 font-bold text-[18px]">Match %</th>
                              <th className="py-4 px-5 font-bold text-[18px]">Date Applied</th>
                              <th className="py-4 px-5 font-bold text-[18px]">Status</th>
                              <th className="py-4 px-5 font-bold text-[18px]">Resume / CV Version</th>
                              <th className="py-4 px-5 font-bold text-right text-[18px]">Actions</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-200"}`}>
                            {filteredApps.map((app) => (
                              <tr key={app.id} className={isDark ? "hover:bg-slate-800/40 transition" : "hover:bg-slate-50 transition"}>
                                <td className="py-4 px-5">
                                  <p className={`font-bold text-[19px] ${isDark ? "text-white" : "text-slate-900"}`}>{app.job?.title || "Job Title"}</p>
                                  <p className={`text-[16px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>{app.job?.company || "Company"}</p>
                                </td>
                                <td className={`py-4 px-5 text-[17px] ${isDark ? "text-slate-300" : "text-slate-700"}`}>{app.job?.location || "Sweden"}</td>
                                <td className="py-4 px-5">
                                  <span className={`px-3 py-1 rounded font-bold text-[16px] border ${isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                                    {app.job?.matchScore || 0}%
                                  </span>
                                </td>
                                <td className={`py-4 px-5 text-[17px] ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                                  {new Date(app.appliedAt).toLocaleDateString("sv-SE")}
                                </td>
                                <td className="py-4 px-5">
                                  <select
                                    value={app.status}
                                    onChange={(e) => updateAppStatus(app.id, e.target.value as Application["status"])}
                                    className={`text-[16px] font-semibold px-3 py-2 rounded-lg border focus:outline-none ${isDark
                                      ? "bg-slate-950 border-slate-800"
                                      : "bg-slate-50 border-slate-300"
                                      } ${app.status === "APPLIED"
                                        ? "text-cyan-600 font-bold"
                                        : app.status === "INTERVIEWING"
                                          ? "text-purple-600 font-bold"
                                          : app.status === "OFFER"
                                            ? "text-emerald-600 font-bold"
                                            : "text-red-600 font-bold"
                                      }`}
                                  >
                                    <option value="APPLIED">Applied</option>
                                    <option value="INTERVIEWING">Interviewing</option>
                                    <option value="OFFER">Offer Received 🎉</option>
                                    <option value="REJECTED">Rejected</option>
                                  </select>
                                </td>
                                <td className={`py-4 px-5 text-[16px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>{app.resumeVersion}</td>
                                <td className="py-4 px-5 text-right flex items-center justify-end space-x-3">
                                  {app.job?.webpageUrl && (
                                    <a
                                      href={app.job.webpageUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[16px] text-amber-400 hover:text-white font-semibold underline"
                                    >
                                      Ad Link ↗
                                    </a>
                                  )}
                                  <button
                                    onClick={() => updateJobStatus(app.jobId, "NEW")}
                                    className="px-3 py-1.5 bg-amber-800/80 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
                                    title="Undo accidental application status and remove from tracker"
                                  >
                                    ↩️ Undo
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: COMPETENCE PROFILE */}
                {activeTab === "profile" && (
                  <div className="space-y-6 max-w-4xl">
                    <div className={`rounded-2xl p-6 border space-y-6 transition ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                      <div>
                        <h2 className={`text-[23px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                          Manoj John Axelsson — Competence & CV Profile
                        </h2>
                        <p className={`text-[17px] mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                          Target roles and skill taxonomy used to score daily Swedish job ads.
                        </p>
                      </div>

                      {/* Competence Domains */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className={`p-5 rounded-xl border ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                          <h3 className="text-[20px] font-bold text-blue-600 uppercase tracking-wider mb-2">1. Software Engineering</h3>
                          <p className={`text-[17px] leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                            React, TypeScript, Next.js, Node.js, Express, PostgreSQL, SQL, REST APIs, Git/GitHub, Tailwind CSS, Vercel.
                          </p>
                        </div>

                        <div className={`p-5 rounded-xl border ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                          <h3 className="text-[20px] font-bold text-purple-600 uppercase tracking-wider mb-2">2. Systems Engineering & Architecture</h3>
                          <p className={`text-[17px] leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                            Systems Thinking, Software Architecture, Requirements Engineering, Validation & Verification, Technical Documentation, PLM.
                          </p>
                        </div>

                        <div className={`p-5 rounded-xl border ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                          <h3 className="text-[20px] font-bold text-emerald-600 uppercase tracking-wider mb-2">3. Quality & Continuous Improvement</h3>
                          <p className={`text-[17px] leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                            Six Sigma Green Belt (KPMG), DMAIC, FMEA, Poka-Yoke, Root Cause Analysis, QA, Process Optimization, Standard Work.
                          </p>
                        </div>

                        <div className={`p-5 rounded-xl border ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                          <h3 className="text-[20px] font-bold text-amber-600 uppercase tracking-wider mb-2">4. Industrial & Manufacturing</h3>
                          <p className={`text-[17px] leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                            Manufacturing Engineering, Production Development, Lean Manufacturing, Industrial Digitalization, Automation, CNC, CAD/CAM.
                          </p>
                        </div>
                      </div>

                      {/* Scanner Threshold Slider */}
                      <div className={`pt-4 border-t space-y-2 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                        <label className={`text-[17px] font-semibold flex justify-between ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                          <span>Minimum Match Threshold for 12:00 PM Daily Feed:</span>
                          <span className="text-emerald-600 font-bold text-[21px]">{minScore}% Match</span>
                        </label>
                        <input
                          type="range"
                          min="30"
                          max="80"
                          value={minScore}
                          onChange={(e) => setMinScore(Number(e.target.value))}
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                        <p className={`text-[16px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                          Only jobs scoring above {minScore}% match score will be saved to your daily feed.
                        </p>
                      </div>

                      {/* 🚫 Excluded Companies & Employer Blacklist Manager */}
                      <div className={`pt-6 border-t space-y-4 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                        <div>
                          <h3 className="text-[20px] font-extrabold text-red-400 flex items-center space-x-2">
                            <span>🚫 Excluded Companies &amp; Employer Blacklist</span>
                          </h3>
                          <p className={`text-[16px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            Job ads from these employers will be automatically hidden from your daily feed and API scans.
                          </p>
                        </div>

                        {/* Form to add company to blacklist */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (newCompanyToBlock.trim()) {
                              handleToggleCompanyExclusion(newCompanyToBlock);
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
                            <p className="text-xs text-amber-200/60 italic">No companies currently blocked.</p>
                          ) : (
                            excludedCompanies.map((comp) => (
                              <span
                                key={comp}
                                className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-950/90 text-red-200 border border-red-500/40 shadow-sm"
                              >
                                <span>🏢 {comp}</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleCompanyExclusion(comp)}
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
                )}

                {/* TAB 4: SCAN LOGS */}
                {activeTab === "logs" && (
                  <div className="space-y-6">
                    <div className={`rounded-2xl p-6 border transition ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                      <h2 className={`text-[23px] font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
                        Daily 12:00 PM Scanner Logs
                      </h2>
                      <div className="space-y-3">
                        {logsList.length === 0 ? (
                          <p className="text-[17px] text-slate-500">No scan executions logged yet.</p>
                        ) : (
                          logsList.map((log) => (
                            <div
                              key={log.id}
                              className={`p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                                }`}
                            >
                              <div>
                                <p className={`text-[17px] font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                                  📅 Scan Execution: {new Date(log.scannedAt).toLocaleString("sv-SE")}
                                </p>
                                <p className={`text-[16px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>{log.message}</p>
                              </div>
                              <div className="flex items-center space-x-3 text-[16px]">
                                <span className={`px-3 py-0.5 rounded font-semibold border ${isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                                  {log.totalMatched} Matched
                                </span>
                                <span className={`px-3 py-0.5 rounded font-semibold border ${isDark ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-slate-200 text-slate-700 border-slate-300"}`}>
                                  {log.totalFound} Scanned
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: JOBSEEKER INTELLIGENCE SUITE */}
                {activeTab === "intelligence" && (() => {
                  const overview = generateExecutiveCareerOverview(jobsList, appsList);
                  const recruiters = overview.recruiters;
                  const cvPerf = overview.cvPerformance;
                  const upskilling = calculateUpskillingRoadmap(jobsList);

                  return (
                    <div className="space-y-7">
                      {/* JobseekeR Intelligence Suite Umbrella Header */}
                      <div className="bg-[#4d2708]/90 border-2 border-amber-300/80 rounded-2xl p-5 shadow-2xl text-amber-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-4xl">🤖</span>
                          <div>
                            <h2 className="text-2xl font-black text-amber-300 uppercase tracking-wide">
                              JobseekeR™ Intelligence Suite
                            </h2>
                            <p className="text-xs sm:text-sm text-amber-200/90 font-bold italic">
                              "JobseekeR™ is an intelligence platform built to automate job searching."
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-black">
                          <span className="px-3 py-1 rounded-lg bg-amber-400 text-amber-950 shadow-md">🧠 Recruiter</span>
                          <span className="px-3 py-1 rounded-lg bg-amber-400 text-amber-950 shadow-md">🏢 Company</span>
                          <span className="px-3 py-1 rounded-lg bg-amber-400 text-amber-950 shadow-md">📄 Document</span>
                          <span className="px-3 py-1 rounded-lg bg-amber-400 text-amber-950 shadow-md">📈 Market</span>
                          <span className="px-3 py-1 rounded-lg bg-amber-400 text-amber-950 shadow-md">🎓 Learning</span>
                          <span className="px-3 py-1 rounded-lg bg-amber-400 text-amber-950 shadow-md">💰 Salary</span>
                          <span className="px-3 py-1 rounded-lg bg-amber-400 text-amber-950 shadow-md">🎯 Match</span>
                          <span className="px-3 py-1 rounded-lg bg-amber-400 text-amber-950 shadow-md">🔮 Predictive</span>
                        </div>
                      </div>

                      {/* Executive Career Intelligence Overview Card */}
                      <div className="bg-gradient-to-br from-[#4a2408] via-[#63340b] to-[#3a1b05] border-2 border-amber-300/80 rounded-2xl p-6 shadow-2xl text-amber-100 space-y-5">
                        <div className="flex items-center justify-between border-b border-amber-500/30 pb-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-4xl">👑</span>
                            <div>
                              <h3 className="text-2xl font-black text-amber-300 uppercase tracking-wide">
                                Career Intelligence Overview
                              </h3>
                              <p className="text-xs text-amber-200/90 font-medium">
                                Executive Summary &amp; Real-Time Predictive Career Scorecard
                              </p>
                            </div>
                          </div>
                          <span className="px-3.5 py-1 rounded-full bg-amber-400 text-amber-950 font-black text-xs uppercase tracking-widest shadow-md">
                            AI Executive Report
                          </span>
                        </div>

                        {/* Executive Summary Grid Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
                          <div className="p-3 bg-amber-950/80 border border-amber-400/50 rounded-xl">
                            <p className="text-[11px] font-extrabold uppercase text-amber-300/90">Overall Score</p>
                            <p className="text-3xl font-black text-white mt-1">{overview.overallCareerScore}</p>
                            <p className="text-[10px] text-amber-300 font-semibold mt-0.5">/ 100 Excellent</p>
                          </div>

                          <div className="p-3 bg-amber-950/80 border border-amber-400/50 rounded-xl">
                            <p className="text-[11px] font-extrabold uppercase text-amber-300/90">Interview Prob.</p>
                            <p className="text-3xl font-black text-emerald-400 mt-1">{overview.interviewProbabilityPct}%</p>
                            <p className="text-[10px] text-emerald-300 font-semibold mt-0.5">High Likelihood</p>
                          </div>

                          <div className="p-3 bg-amber-950/80 border border-amber-400/50 rounded-xl">
                            <p className="text-[11px] font-extrabold uppercase text-amber-300/90">Valuable Skill</p>
                            <p className="text-lg font-black text-cyan-300 mt-2 truncate">{overview.mostValuableSkill}</p>
                            <p className="text-[10px] text-cyan-200 font-semibold mt-0.5">High Demand</p>
                          </div>

                          <div className="p-3 bg-amber-950/80 border border-amber-400/50 rounded-xl">
                            <p className="text-[11px] font-extrabold uppercase text-amber-300/90">Highest ROI</p>
                            <p className="text-lg font-black text-purple-300 mt-2 truncate">Docker</p>
                            <p className="text-[10px] text-purple-200 font-semibold mt-0.5">+18% Boost</p>
                          </div>

                          <div className="p-3 bg-amber-950/80 border border-amber-400/50 rounded-xl col-span-2 sm:col-span-1">
                            <p className="text-[11px] font-extrabold uppercase text-amber-300/90">Best CV</p>
                            <p className="text-xs font-black text-amber-200 mt-2 truncate">{overview.bestPerformingCv}</p>
                            <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">50% Conversion</p>
                          </div>

                          <div className="p-3 bg-amber-950/80 border border-amber-400/50 rounded-xl col-span-2 sm:col-span-1">
                            <p className="text-[11px] font-extrabold uppercase text-amber-300/90">Responsive Co.</p>
                            <p className="text-xs font-black text-amber-200 mt-2 truncate">{overview.mostResponsiveCompany}</p>
                            <p className="text-[10px] text-amber-400 font-semibold mt-0.5">100% Reply Rate</p>
                          </div>

                          <div className="p-3 bg-amber-950/80 border border-amber-400/50 rounded-xl col-span-2 sm:col-span-4 lg:col-span-1 text-left">
                            <p className="text-[11px] font-extrabold uppercase text-amber-300/90 text-center">Market Trend</p>
                            <div className="text-xs font-bold space-y-0.5 mt-1 text-amber-200 flex flex-wrap justify-around lg:flex-col lg:items-start">
                              {overview.marketTrends.map((t, idx) => (
                                <span key={idx} className="inline-block mr-2 lg:mr-0">
                                  {t.technology} <span className="text-amber-400 font-extrabold">{t.trendSymbol}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 1: RECRUITER BEHAVIOR ANALYTICS */}
                      <div className={`p-6 rounded-2xl border space-y-4 transition ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-slate-900"} flex items-center space-x-2`}>
                              <span>👤 Recruiter Behavior Analytics</span>
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                                Behavioral AI
                              </span>
                            </h3>
                            <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                              Tracks recruiter response speed, communication reliability, portfolio requirements, and hiring seniority preferences.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          {recruiters.map((rec) => (
                            <div key={rec.id} className={`p-4 rounded-xl border space-y-2.5 ${isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"}`}>
                              <div className="flex items-center justify-between">
                                <h4 className="font-extrabold text-base text-amber-400">{rec.name}</h4>
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  {rec.replyRate}% Reply Rate
                                </span>
                              </div>
                              <p className="text-xs font-medium text-amber-200/80">{rec.company}</p>
                              <div className="text-xs space-y-1 pt-2 border-t border-amber-500/20">
                                <p><span className="font-bold text-amber-300">⏱️ Avg Response:</span> {rec.avgResponseDays} days</p>
                                <p><span className="font-bold text-amber-300">🎓 Seniority Pref:</span> {rec.seniorityPreference}</p>
                                <p><span className="font-bold text-amber-300">📁 Portfolio Request:</span> {rec.prefersPortfolio ? "Yes (High frequency)" : "Standard CV"}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* SECTION 2: SALARY INTELLIGENCE & SWEDISH ROLE BENCHMARKS */}
                      <div className={`p-6 rounded-2xl border space-y-4 transition ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                        <h3 className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-slate-900"} flex items-center space-x-2`}>
                          <span>💰 Swedish Salary Intelligence &amp; Market Benchmarks</span>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            SEK Compensation Parser
                          </span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                            <p className="text-xs font-extrabold uppercase text-cyan-400">Fullstack Engineer Benchmark</p>
                            <p className="text-2xl font-black text-white mt-1">52 000 – 68 000 <span className="text-xs font-semibold text-slate-400">SEK/mån</span></p>
                            <p className="text-xs text-slate-400 mt-1">Stockholm &amp; Gothenburg • Senior Level</p>
                          </div>
                          <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                            <p className="text-xs font-extrabold uppercase text-purple-400">Systems Architect Benchmark</p>
                            <p className="text-2xl font-black text-white mt-1">58 000 – 75 000 <span className="text-xs font-semibold text-slate-400">SEK/mån</span></p>
                            <p className="text-xs text-slate-400 mt-1">Industrial R&amp;D &amp; Enterprise IT</p>
                          </div>
                          <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                            <p className="text-xs font-extrabold uppercase text-emerald-400">Quality / Six Sigma Lead</p>
                            <p className="text-2xl font-black text-white mt-1">48 000 – 62 000 <span className="text-xs font-semibold text-slate-400">SEK/mån</span></p>
                            <p className="text-xs text-slate-400 mt-1">Continuous Improvement &amp; QA</p>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 3: UPSKILLING ROI & LEARNING ROADMAP */}
                      <div className={`p-6 rounded-2xl border space-y-4 transition ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-slate-900"} flex items-center space-x-2`}>
                              <span>🚀 Upskilling ROI &amp; Recommended Next Learning Steps</span>
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                Match Boost Engine
                              </span>
                            </h3>
                            <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                              Identifies top missing skills across all scanned Swedish positions and projects your calculated match score boost.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {upskilling.map((trend, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                              <div className="flex items-center space-x-3">
                                <span className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
                                  #{idx + 1}
                                </span>
                                <div>
                                  <h4 className="font-extrabold text-base text-white">{trend.skill}</h4>
                                  <p className="text-xs text-amber-300 font-semibold">{trend.growthVelocity}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                                  +{trend.scoreBoostPct}% Match Score Boost
                                </span>
                                <span className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold">
                                  Appears in {trend.percentage}% of Roles
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* SECTION 4: CV VERSION A/B PERFORMANCE MATRIX */}
                      <div className={`p-6 rounded-2xl border space-y-4 transition ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                        <h3 className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-slate-900"} flex items-center space-x-2`}>
                          <span>📄 CV Version A/B Performance Matrix</span>
                        </h3>
                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                          <table className="w-full text-left text-xs sm:text-sm">
                            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                              <tr>
                                <th className="py-3 px-4">Resume Version</th>
                                <th className="py-3 px-4">Applications</th>
                                <th className="py-3 px-4">Interviews</th>
                                <th className="py-3 px-4">Offers</th>
                                <th className="py-3 px-4 text-right">Interview Conversion Rate</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                              {cvPerf.map((cv, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/40 transition">
                                  <td className="py-3 px-4 font-bold text-white">{cv.resumeVersion}</td>
                                  <td className="py-3 px-4 text-slate-300">{cv.totalApplied}</td>
                                  <td className="py-3 px-4 font-bold text-emerald-400">{cv.interviewsCount}</td>
                                  <td className="py-3 px-4 font-bold text-purple-400">{cv.offersCount}</td>
                                  <td className="py-3 px-4 text-right font-black text-amber-300 text-sm">
                                    {cv.conversionRate}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ⚙️ SETTINGS & USER PREFERENCES TAB */}
                {activeTab === "settings" && (
                  <SettingsPanel
                    profileName={profileName}
                    onOpenOnboarding={() => setShowOnboarding(true)}
                    onTriggerScan={triggerJobScan}
                    scanning={scanning}
                    themeMode={themeMode}
                    setThemeMode={setThemeMode}
                    jobs={jobs}
                    applications={applications}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* FULL JOB & MATCH ANALYSIS MODAL */}
      {selectedJob && jobAnalysis && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-7 space-y-5 border shadow-2xl ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              }`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[16px] font-bold border ${selectedJob.matchScore >= 75
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                  >
                    {selectedJob.matchScore}% Match Score
                  </span>
                  <span className="text-[15px] font-semibold text-slate-500">Source: {selectedJob.source}</span>
                  <button
                    onClick={() => {
                      if (jobAnalysis) {
                        const pitchText = `Jobb: ${selectedJob.title} på ${selectedJob.company}. Matchningspoäng: ${selectedJob.matchScore} procent. Öppningsfras för personligt brev: ${jobAnalysis.analysis.coverLetterPitch.openingHook}`;
                        speakText(pitchText, "sv-SE");
                      }
                    }}
                    className="px-3 py-1 bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Audio Assistance: Read Job Details & Cover Letter Hook Aloud"
                    aria-label="Read job pitch strategy aloud"
                  >
                    🔊 Listen to Pitch
                  </button>
                </div>
                <h2 className={`text-[25px] font-bold mt-2 ${isDark ? "text-white" : "text-slate-900"}`}>{selectedJob.title}</h2>
                <p className={`text-[17px] font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  🏢 {selectedJob.company} • 📍 {selectedJob.location}
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className={`text-[23px] font-bold p-1 cursor-pointer ${isDark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-900"}`}
              >
                ✕
              </button>
            </div>

            {/* Modal Sub Navigation */}
            <div className={`border-b flex space-x-6 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <button
                onClick={() => setModalTab("analysis")}
                className={`pb-3 text-[17px] font-bold border-b-2 transition cursor-pointer ${modalTab === "analysis"
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
                className={`pb-3 text-[17px] font-bold border-b-2 transition cursor-pointer ${modalTab === "description"
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
                {/* 1. WHY THIS JOB MATCHED */}
                <div className={`p-5 rounded-xl border ${isDark ? "bg-slate-950 border-slate-800" : "bg-emerald-50/60 border-emerald-200"}`}>
                  <h3 className="text-[20px] font-bold text-emerald-700 flex items-center space-x-2">
                    <span>✓ Why This Job Matched Your Profile</span>
                  </h3>
                  <div className="mt-3 space-y-2">
                    {jobAnalysis.analysis.whyMatched.map((reason, idx) => (
                      <p key={idx} className={`text-[17px] leading-relaxed ${isDark ? "text-slate-300" : "text-slate-800"}`}>
                        • {reason}
                      </p>
                    ))}
                  </div>
                  {/* Matched Skills Tags */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {jobAnalysis.matchedSkills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[15px] font-semibold rounded-md border border-emerald-300">
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 2. WHAT IS LACKING / GAPS */}
                <div className={`p-5 rounded-xl border ${isDark ? "bg-slate-950 border-slate-800" : "bg-amber-50/60 border-amber-200"}`}>
                  <h3 className="text-[20px] font-bold text-amber-800 flex items-center space-x-2">
                    <span>⚠️ Potential Skill Gaps & What Is Missing</span>
                  </h3>
                  <div className="mt-3 space-y-2">
                    {jobAnalysis.analysis.whatLacking.map((gap, idx) => (
                      <p key={idx} className={`text-[17px] leading-relaxed ${isDark ? "text-slate-300" : "text-slate-800"}`}>
                        • {gap}
                      </p>
                    ))}
                  </div>
                  {/* Missing Skills Tags */}
                  {jobAnalysis.missingSkills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {jobAnalysis.missingSkills.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-amber-100 text-amber-900 text-[15px] font-semibold rounded-md border border-amber-300">
                          ! {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. COVER LETTER PITCH STRATEGY */}
                <div className={`p-5 rounded-xl border ${isDark ? "bg-slate-950 border-slate-800" : "bg-blue-50/60 border-blue-200"}`}>
                  <h3 className="text-[20px] font-bold text-blue-800 flex items-center space-x-2">
                    <span>✍️ Tailored Cover Letter & Application Pitch Strategy</span>
                  </h3>

                  {/* Opening Hook */}
                  <div className="mt-4">
                    <h4 className="text-[17px] font-bold text-slate-900 dark:text-slate-200">Recommended Opening Line for Cover Letter:</h4>
                    <p className="mt-1.5 p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 text-[18px] italic font-bold text-slate-950 dark:text-white leading-relaxed">
                      &quot;{jobAnalysis.analysis.coverLetterPitch.openingHook}&quot;
                    </p>
                  </div>

                  {/* Key Strengths to Lead With */}
                  <div className="mt-4">
                    <h4 className="text-[17px] font-bold text-slate-900 dark:text-slate-200">Core Strengths to Emphasize in Your Resume/Letter:</h4>
                    <ul className="mt-1.5 list-disc list-inside text-[17px] text-slate-800 dark:text-slate-300 space-y-1">
                      {jobAnalysis.analysis.coverLetterPitch.keyStrengthsToLeadWith.map((str, idx) => (
                        <li key={idx} className="font-semibold text-emerald-700 dark:text-emerald-400">{str}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Gap Mitigation Strategy */}
                  <div className="mt-4">
                    <h4 className="text-[17px] font-bold text-slate-900 dark:text-slate-200">How to Frame Missing Qualifications:</h4>
                    <p className="mt-1 text-[17px] text-slate-800 dark:text-slate-300 leading-relaxed">
                      {jobAnalysis.analysis.coverLetterPitch.gapMitigationStrategy}
                    </p>
                  </div>

                  {/* Suggested Copyable Bullet Points */}
                  <div className="mt-4">
                    <h4 className="text-[17px] font-bold text-slate-900 dark:text-slate-200">Suggested Application Bullet Points to Highlight:</h4>
                    <div className="mt-2 space-y-2">
                      {jobAnalysis.analysis.coverLetterPitch.suggestedBulletPoints.map((bp, idx) => (
                        <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[16px] text-slate-800 dark:text-slate-200">
                          📌 {bp}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL TAB 2: FULL DESCRIPTION */}
            {modalTab === "description" && (
              <div className={`p-5 rounded-xl border space-y-3 ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <h3 className={`text-[20px] font-bold uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  Full Job Description Text
                </h3>
                <p className={`text-[18px] leading-relaxed whitespace-pre-line ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  {selectedJob.description}
                </p>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className={`pt-4 border-t flex justify-between items-center ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <div className="flex items-center space-x-3">
                {selectedJob.status !== "APPLIED" ? (
                  <button
                    onClick={() => updateJobStatus(selectedJob.id, "APPLIED")}
                    className="px-5 py-2.5 bg-cyan-600 text-white hover:bg-cyan-500 text-[16px] font-bold rounded-xl transition cursor-pointer shadow-sm"
                  >
                    Mark as Applied Today
                  </button>
                ) : (
                  <span className="text-[16px] font-bold text-emerald-600">✓ Marked as Applied</span>
                )}

                {/* DISCARD BUTTON INSIDE MODAL */}
                <button
                  onClick={() => {
                    updateJobStatus(selectedJob.id, "DISCARDED");
                    setSelectedJob(null);
                  }}
                  className="px-4 py-2.5 bg-red-600/10 text-red-600 border border-red-200 dark:border-red-500/30 hover:bg-red-600 hover:text-white text-[16px] font-bold rounded-xl transition cursor-pointer"
                >
                  🗑️ Discard & Delete
                </button>
              </div>

              {selectedJob.webpageUrl && (
                <a
                  href={selectedJob.webpageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-emerald-600 text-white text-[17px] font-bold rounded-xl hover:bg-emerald-500 transition shadow-sm"
                >
                  Apply on Platsbanken ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SWEDISH AKTIVITETSRAPPORT (ARBETSFÖRMEDLINGEN COMPLIANCE) MODAL */}
      {showAktivitetsrapport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 space-y-6 shadow-2xl border border-slate-300">
            {/* Report Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <span className="text-[14px] font-bold uppercase tracking-wider text-emerald-700">Official Swedish Compliance Export</span>
                <h1 className="text-[28px] font-bold text-slate-950 mt-1">AKTIVITETSRAPPORT — ARBETSFÖRMEDLINGEN</h1>
                <p className="text-[16px] text-slate-600">Månadssammanställning över sökta arbeten för redovisning till Arbetsförmedlingen</p>
              </div>
              <button
                onClick={() => setShowAktivitetsrapport(false)}
                className="text-[24px] font-bold text-slate-500 hover:text-slate-900 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Applicant Summary Meta */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-100 p-4 rounded-xl border border-slate-300 text-[16px]">
              <div>
                <span className="font-bold text-slate-600 block text-[14px]">SÖKANDE / CANDIDATE:</span>
                <span className="font-bold text-slate-950">Manoj John Axelsson</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block text-[14px]">RAPPORTERINGSMÅNAD:</span>
                <span className="font-bold text-emerald-800">{selectedMonth || "Juli 2026"}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block text-[14px]">TOTALT SÖKTA ARBETEN:</span>
                <span className="font-bold text-slate-950">{filteredApps.length} stycken</span>
              </div>
            </div>

            {/* Official Activity Table */}
            <div>
              <h2 className="text-[20px] font-bold text-slate-900 mb-3">Redovisning av sökta arbeten</h2>
              {filteredApps.length === 0 ? (
                <p className="text-[16px] text-slate-600 italic">Inga sökta arbeten registrerade för denna månad ännu.</p>
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
                      {filteredApps.map((app, idx) => (
                        <tr key={app.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-bold">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-950">{app.job?.title || "Sökt roll"}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">{app.job?.company || "Arbetsgivare"}</td>
                          <td className="py-3.5 px-4 text-slate-700">{app.job?.location || "Sverige"}</td>
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
                <span>{copiedReport ? "✓ Kopierat till urklipp!" : "📋 Kopiera text för Arbetsförmedlingen Portal"}</span>
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
      )}
    </div>
  );
}
