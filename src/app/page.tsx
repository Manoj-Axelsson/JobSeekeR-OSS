"use client";

import { useEffect, useState } from "react";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { AuthModal } from "@/components/AuthModal";
import { DocumentUploader } from "@/components/DocumentUploader";
import { UserGuideModal } from "@/components/UserGuideModal";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Navbar } from "@/components/Navbar";
import { SidebarNav } from "@/components/SidebarNav";
import { translations, Language } from "@/lib/services/i18n";
import type { JobAd, Application } from "@/types/domain";
import {
  DailyFeedTab,
  type SearchProfile,
  filterEligibleJobs,
  partitionFeeds,
} from "@/components/tabs/DailyFeedTab";
import { IntelligenceTab } from "@/components/tabs/IntelligenceTab";
import { AktivitetsrapportModal } from "@/components/modals/AktivitetsrapportModal";
import { ScanLogsTab, type ScanLog } from "@/components/tabs/ScanLogsTab";
import {
  CompetenceProfileTab,
  toggleExcludedCompany,
} from "@/components/tabs/CompetenceProfileTab";
import { ApplicationsTrackerTab } from "@/components/tabs/ApplicationsTrackerTab";
import { JobDetailsModal } from "@/components/modals/JobDetailsModal";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<
    "feed" | "tracker" | "profile" | "logs" | "intelligence" | "settings"
  >("feed");
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

  // Onboarding & Auth & User Guide Modals state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [showDocUploader, setShowDocUploader] = useState(false);

  // Aktivitetsrapport State
  const [showAktivitetsrapport, setShowAktivitetsrapport] = useState(false);

  // User profile state for intelligence and guidance
  const [userProfile, setUserProfile] = useState<any>(null);

  // Track jobs opened in external tabs awaiting confirmation
  const [appliedConfirmJobIds, setAppliedConfirmJobIds] = useState<Set<string>>(new Set());

  // V2 Constitutional Feed Separation & Search Profile Track State
  const [searchProfilesList, setSearchProfilesList] = useState<SearchProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("ALL");

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

  const handleToggleCompanyExclusion = async (companyName: string) => {
    const updated = toggleExcludedCompany(excludedCompanies, companyName);
    if (updated === excludedCompanies) return;
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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      setCurrentUser(null);
    }
  };

  async function fetchData() {
    setLoading(true);
    try {
      // Check persistent auth session
      try {
        const authRes = await fetch("/api/auth");
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.authenticated && authData.user) {
            setCurrentUser(authData.user);
          }
        }
      } catch (e) {
        console.error("Session restore error:", e);
      }

      // Fetch profile
      const profRes = await fetch("/api/profile");
      if (profRes.ok) {
        const profData = await profRes.json();
        setUserProfile(profData);
        if (profData.name) setProfileName(profData.name);
        if (profData.minMatchScore) setMinScore(profData.minMatchScore);
        if (Array.isArray(profData.excludedCompanies))
          setExcludedCompanies(profData.excludedCompanies);
        if (profData.searchProfiles && Array.isArray(profData.searchProfiles)) {
          setSearchProfilesList(profData.searchProfiles);
        }
      }

      // Fetch jobs
      const jobsRes = await fetch("/api/jobs");
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        const jobsList = Array.isArray(jobsData.jobs)
          ? jobsData.jobs
          : Array.isArray(jobsData)
            ? jobsData
            : [];
        setJobs(jobsList);
      }

      // Fetch applications
      const appsRes = await fetch("/api/applications");
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        const appsList: Application[] = Array.isArray(appsData.applications)
          ? appsData.applications
          : Array.isArray(appsData)
            ? appsData
            : [];
        setApplications(appsList);

        const sortedMonths = Array.isArray(appsData.months)
          ? appsData.months
          : Array.from(new Set(appsList.map((a) => a.monthlyTag).filter(Boolean)))
              .sort()
              .reverse();
        setMonths(sortedMonths);
        if (sortedMonths.length > 0 && !selectedMonth) {
          setSelectedMonth(sortedMonths[0]);
        }
      }

      // Fetch scan logs
      const logsRes = await fetch("/api/scans");
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        const logsList = Array.isArray(logsData.scanLogs)
          ? logsData.scanLogs
          : Array.isArray(logsData)
            ? logsData
            : [];
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
      const res = await fetch("/api/cron/scrape", {
        method: "POST",
        headers: { "x-jobseeker-trigger": "manual" },
      });
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

  const jobsList = Array.isArray(jobs) ? jobs : [];
  const appsList = Array.isArray(applications) ? applications : [];
  const logsList = Array.isArray(scanLogs) ? scanLogs : [];

  const eligibleJobs = filterEligibleJobs(
    jobsList,
    searchQuery,
    statusFilter,
    0,
    excludedCompanies
  );

  const { primaryJobs, discoveryJobs } = partitionFeeds(eligibleJobs, selectedProfileId);
  const filteredJobs = statusFilter === "ALL" ? [...primaryJobs, ...discoveryJobs] : eligibleJobs;

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
  const applicationMonths = Array.from(new Set([currentMonthTag, ...months]))
    .sort()
    .reverse();

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
        onLogout={handleLogout}
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
          key={showOnboarding ? `${currentUser?.name || profileName}-${userProfile?.headline || ""}` : "closed"}
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={fetchData}
          initialName={currentUser?.name || (profileName !== "JobseekeR Candidate" ? profileName : "")}
          initialHeadline={userProfile?.headline || ""}
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
                <p
                  className={`mt-4 text-[18px] font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Loading JobseekeR™ Dashboard...
                </p>
              </div>
            ) : (
              <>
                {/* APPLICATION SUMMARY */}
                <section
                  aria-label="Monthly application summary"
                  className={`mb-5 rounded-2xl border p-3.5 sm:p-4 transition ${
                    isDark
                      ? "bg-slate-900/80 border-slate-800"
                      : "bg-white border-slate-200 shadow-sm"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div
                      className={`min-w-55 rounded-xl border p-3.5 ${
                        isDark ? "bg-cyan-500/10 border-cyan-500/30" : "bg-cyan-50 border-cyan-200"
                      }`}
                    >
                      <p
                        className={`text-[16px] font-bold uppercase tracking-wide ${isDark ? "text-cyan-300" : "text-cyan-700"}`}
                      >
                        Applied this month
                      </p>
                      <p
                        className={`mt-1 text-[38px] font-bold leading-none ${isDark ? "text-cyan-200" : "text-cyan-800"}`}
                      >
                        {applicationsByMonth[currentMonthTag] || 0}
                      </p>
                      <p
                        className={`mt-2 text-[16px] capitalize ${isDark ? "text-cyan-200/70" : "text-cyan-700/80"}`}
                      >
                        {currentMonthLabel}
                      </p>
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <h2
                            className={`text-[23px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            Applications by calendar month
                          </h2>
                          <p
                            className={`text-[17px] ${isDark ? "text-slate-400" : "text-slate-600"}`}
                          >
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
                          <span
                            className={`text-[16px] ${isDark ? "text-slate-500" : "text-slate-500"}`}
                          >
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
                              className={`rounded-lg border px-3.5 py-2 text-[16px] font-bold transition cursor-pointer ${
                                month === currentMonthTag
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
                  <DailyFeedTab
                    jobs={jobsList}
                    applications={appsList}
                    primaryJobs={primaryJobs}
                    discoveryJobs={discoveryJobs}
                    eligibleJobs={eligibleJobs}
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    searchProfilesList={searchProfilesList}
                    selectedProfileId={selectedProfileId}
                    onSelectProfileId={setSelectedProfileId}
                    appliedConfirmJobIds={appliedConfirmJobIds}
                    onSetAppliedConfirm={(jobId, confirmed) => {
                      setAppliedConfirmJobIds((prev) => {
                        const next = new Set(prev);
                        if (confirmed) {
                          next.add(jobId);
                        } else {
                          next.delete(jobId);
                        }
                        return next;
                      });
                    }}
                    onSelectJob={setSelectedJob}
                    onUpdateJobStatus={updateJobStatus}
                    onToggleCompanyExclusion={handleToggleCompanyExclusion}
                    onTriggerScan={triggerJobScan}
                    onOpenDocUploader={() => setShowDocUploader(true)}
                    onNavigateTab={setActiveTab}
                    onRefreshData={fetchData}
                    isDark={isDark}
                    t={t}
                  />
                )}

                {/* TAB 2: MONTHLY APPLICATION TRACKER */}
                {activeTab === "tracker" && (
                  <ApplicationsTrackerTab
                    applications={filteredApps}
                    selectedMonth={selectedMonth}
                    onSelectMonth={setSelectedMonth}
                    months={months}
                    onOpenAktivitetsrapport={() => setShowAktivitetsrapport(true)}
                    onUpdateAppStatus={updateAppStatus}
                    onUndoApplication={(jobId) => updateJobStatus(jobId, "NEW")}
                    isDark={isDark}
                  />
                )}

                {/* TAB 3: COMPETENCE PROFILE */}
                {activeTab === "profile" && (
                  <CompetenceProfileTab
                    profileName={profileName}
                    minScore={minScore}
                    onMinScoreChange={setMinScore}
                    excludedCompanies={excludedCompanies}
                    onToggleCompanyExclusion={handleToggleCompanyExclusion}
                    onOpenOnboarding={() => setShowOnboarding(true)}
                    isDark={isDark}
                  />
                )}

                {/* TAB 4: SCAN LOGS */}
                {activeTab === "logs" && (
                  <ScanLogsTab scanLogs={logsList} isDark={isDark} />
                )}

                {/* TAB 5: JOBSEEKER INTELLIGENCE SUITE */}
                {activeTab === "intelligence" && (
                  <IntelligenceTab
                    jobsList={jobsList}
                    appsList={appsList}
                    userProfile={userProfile}
                    profileName={profileName}
                    isDark={isDark}
                    showDocUploader={showDocUploader}
                    onToggleDocUploader={() => setShowDocUploader((prev) => !prev)}
                    onOpenOnboarding={() => setShowOnboarding(true)}
                  />
                )}

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

      {/* Footer */}
      <footer
        className={`py-6 px-4 border-t text-center text-xs transition-colors ${
          isDark
            ? "border-slate-800 text-slate-400 bg-slate-950"
            : "border-slate-200 text-slate-600 bg-slate-100/50"
        }`}
      >
        <p>
          © {new Date().getFullYear()}{" "}
          <strong className={isDark ? "text-slate-300" : "text-slate-700"}>RubberDuckWorks</strong>{" "}
          • Developed by{" "}
          <strong className={isDark ? "text-slate-300" : "text-slate-700"}>Manoj Axelsson</strong>.
          JobseekeR™ is Open Source software released under the{" "}
          <a
            href="https://opensource.org/licenses/MIT"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-amber-500 transition-colors"
          >
            MIT License
          </a>
          .
        </p>
      </footer>

      {/* FULL JOB & MATCH ANALYSIS MODAL */}
      <JobDetailsModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onUpdateJobStatus={updateJobStatus}
        appliedConfirmJobIds={appliedConfirmJobIds}
        onSetAppliedConfirm={(jobId, confirmed) => {
          setAppliedConfirmJobIds((prev) => {
            const next = new Set(prev);
            if (confirmed) {
              next.add(jobId);
            } else {
              next.delete(jobId);
            }
            return next;
          });
        }}
        isDark={isDark}
      />

      {/* SWEDISH AKTIVITETSRAPPORT (ARBETSFÖRMEDLINGEN COMPLIANCE) MODAL */}
      <AktivitetsrapportModal
        isOpen={showAktivitetsrapport}
        onClose={() => setShowAktivitetsrapport(false)}
        applications={filteredApps}
        selectedMonth={selectedMonth}
        candidateName={currentUser?.name || profileName}
      />
    </div>
  );
}
