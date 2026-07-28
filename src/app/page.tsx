"use client";

import { useEffect, useState } from "react";

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
  const [activeTab, setActiveTab] = useState<"feed" | "tracker" | "profile" | "logs">("feed");
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("light");
  const [isDark, setIsDark] = useState(false);

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

  // Profile states
  const [minScore, setMinScore] = useState(45);

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

  async function fetchData() {
    setLoading(true);
    try {
      const [jobsRes, appsRes, logsRes] = await Promise.all([
        fetch("/api/jobs"),
        fetch("/api/applications"),
        fetch("/api/scans"),
      ]);

      const jobsData = await jobsRes.json();
      const appsData = await appsRes.json();
      const logsData = await logsRes.json();

      if (jobsData.success) setJobs(jobsData.jobs);
      if (appsData.success) {
        setApplications(appsData.applications);
        setMonths(appsData.months);
        if (appsData.months.length > 0 && !selectedMonth) {
          setSelectedMonth(appsData.months[0]);
        }
      }
      if (logsData.success) setScanLogs(logsData.scanLogs);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function triggerScan() {
    setScanning(true);
    try {
      const res = await fetch("/api/cron/scrape", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (error) {
      console.error("Scan error:", error);
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

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredApps = applications.filter((app) => {
    if (!selectedMonth) return true;
    return app.monthlyTag === selectedMonth;
  });

  return (
    <div
      style={{ fontFamily: 'Cochin, Georgia, serif', fontSize: '19px' }}
      className={`min-h-screen transition-colors duration-200 antialiased ${
        isDark
          ? "bg-slate-950 text-slate-100"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Top Header */}
      <header
        className={`border-b sticky top-0 z-40 backdrop-blur-md transition-colors duration-200 ${
          isDark
            ? "border-slate-800 bg-slate-900/80"
            : "border-slate-200 bg-white/90 shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white text-[22px] shadow-md shadow-emerald-500/20">
              AT
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className={`text-[28px] font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                  Atlas Talent Navigator
                </h1>
                <span
                  className={`px-3 py-0.5 text-[15px] font-semibold rounded-full border ${
                    isDark
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  SE Job Scanner
                </span>
              </div>
              <p className={`text-[17px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Automated 12:00 PM Swedish Job Market Scanner •{" "}
                <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  Manoj John Axelsson
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Theme Switcher Toggle */}
            <div
              className={`p-1 rounded-xl border flex items-center space-x-1 ${
                isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
              }`}
            >
              <button
                onClick={() => setThemeMode("light")}
                title="Light Mode"
                className={`px-3.5 py-1.5 rounded-lg text-[16px] font-semibold transition cursor-pointer ${
                  themeMode === "light"
                    ? isDark
                      ? "bg-slate-800 text-white shadow-sm"
                      : "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ☀️ Light
              </button>
              <button
                onClick={() => setThemeMode("dark")}
                title="Dark Mode"
                className={`px-3.5 py-1.5 rounded-lg text-[16px] font-semibold transition cursor-pointer ${
                  themeMode === "dark"
                    ? isDark
                      ? "bg-slate-800 text-white shadow-sm"
                      : "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🌙 Dark
              </button>
              <button
                onClick={() => setThemeMode("system")}
                title="System Default Mode"
                className={`px-3.5 py-1.5 rounded-lg text-[16px] font-semibold transition cursor-pointer ${
                  themeMode === "system"
                    ? isDark
                      ? "bg-slate-800 text-white shadow-sm"
                      : "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                💻 System
              </button>
            </div>

            {/* Scan Button */}
            <button
              onClick={triggerScan}
              disabled={scanning}
              className="inline-flex items-center space-x-2 px-4.5 py-2.5 rounded-xl text-[17px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              <svg className={`w-5 h-5 ${scanning ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{scanning ? "Scanning JobTech API..." : "Scan Jobs (12:00 PM)"}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t ${isDark ? "border-slate-800/60" : "border-slate-200"}`}>
          <nav className="flex space-x-8 -mb-px">
            <button
              onClick={() => setActiveTab("feed")}
              className={`py-4 text-[18px] font-semibold border-b-2 flex items-center space-x-2 cursor-pointer transition ${
                activeTab === "feed"
                  ? "border-emerald-600 text-emerald-600 font-bold"
                  : isDark
                  ? "border-transparent text-slate-400 hover:text-slate-200"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>📌 Daily Feed ({jobs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("tracker")}
              className={`py-4 text-[18px] font-semibold border-b-2 flex items-center space-x-2 cursor-pointer transition ${
                activeTab === "tracker"
                  ? "border-emerald-600 text-emerald-600 font-bold"
                  : isDark
                  ? "border-transparent text-slate-400 hover:text-slate-200"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>📋 Monthly Application Tracker ({applications.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-4 text-[18px] font-semibold border-b-2 flex items-center space-x-2 cursor-pointer transition ${
                activeTab === "profile"
                  ? "border-emerald-600 text-emerald-600 font-bold"
                  : isDark
                  ? "border-transparent text-slate-400 hover:text-slate-200"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>🎯 Competence Profile & Skills</span>
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`py-4 text-[18px] font-semibold border-b-2 flex items-center space-x-2 cursor-pointer transition ${
                activeTab === "logs"
                  ? "border-emerald-600 text-emerald-600 font-bold"
                  : isDark
                  ? "border-transparent text-slate-400 hover:text-slate-200"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>⚡ Scanner Monitor Logs</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className={`mt-4 text-[18px] font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Loading Swedish Job Scanner Dashboard...
            </p>
          </div>
        ) : (
          <>
            {/* TAB 1: DAILY FEED */}
            {activeTab === "feed" && (
              <div className="space-y-7">
                {/* Search & Filters */}
                <div
                  className={`flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center p-5 rounded-2xl border transition ${
                    isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                  }`}
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Filter by title, company, or location (e.g. Stockholm, Fullstack, Systems)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full border rounded-xl px-4 py-3 text-[17px] focus:outline-none focus:border-emerald-600 transition ${
                        isDark
                          ? "bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500"
                          : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                      }`}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[17px] font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className={`border rounded-xl px-4 py-3 text-[17px] focus:outline-none focus:border-emerald-600 ${
                        isDark
                          ? "bg-slate-950 border-slate-800 text-slate-200"
                          : "bg-slate-50 border-slate-300 text-slate-900"
                      }`}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="NEW">New (Unreviewed)</option>
                      <option value="SAVED">Saved</option>
                      <option value="APPLIED">Applied</option>
                      <option value="DISCARDED">Discarded</option>
                    </select>
                  </div>
                </div>

                {/* Job List */}
                {filteredJobs.length === 0 ? (
                  <div
                    className={`text-center py-16 rounded-2xl border ${
                      isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                    }`}
                  >
                    <h3 className={`text-[23px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>No matching jobs found</h3>
                    <p className={`text-[17px] mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                      Try running the 12:00 PM scanner or adjusting your search filters.
                    </p>
                    <button
                      onClick={triggerScan}
                      className="mt-4 px-5 py-3 bg-emerald-600 text-white text-[17px] font-semibold rounded-xl hover:bg-emerald-500 transition shadow-sm"
                    >
                      Scan JobTech API Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.map((job) => {
                      const matchedSkillsArr: string[] = JSON.parse(job.matchedSkills || "[]");
                      const domainScoresObj = JSON.parse(job.domainScores || "{}");

                      return (
                        <div
                          key={job.id}
                          className={`rounded-2xl p-6 border flex flex-col justify-between space-y-4 transition shadow-sm relative group ${
                            isDark
                              ? "bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-black/40"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                          }`}
                        >
                          <div>
                            {/* Match Badge & Status */}
                            <div className="flex items-center justify-between">
                              <span
                                className={`px-3 py-1 rounded-full text-[16px] font-bold ${
                                  job.matchScore >= 75
                                    ? isDark
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : job.matchScore >= 55
                                    ? isDark
                                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                    : isDark
                                    ? "bg-slate-800 text-slate-400"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {job.matchScore}% Match
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
                            </div>

                            {/* Title & Company */}
                            <h2
                              className={`text-[22px] font-bold mt-3 line-clamp-2 leading-snug transition ${
                                isDark
                                  ? "text-white group-hover:text-emerald-400"
                                  : "text-slate-900 group-hover:text-emerald-700"
                              }`}
                            >
                              {job.title}
                            </h2>
                            <p className={`text-[16px] font-medium mt-1.5 flex items-center space-x-1.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                              <span>🏢 {job.company}</span>
                              <span>•</span>
                              <span>📍 {job.location}</span>
                            </p>

                            {/* Domain Breakdown Badges */}
                            <div className="mt-3.5 flex flex-wrap gap-1.5">
                              {domainScoresObj.software > 0 && (
                                <span className={`text-[15px] px-2.5 py-0.5 rounded ${isDark ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                                  Software ({domainScoresObj.software}%)
                                </span>
                              )}
                              {domainScoresObj.systems > 0 && (
                                <span className={`text-[15px] px-2.5 py-0.5 rounded ${isDark ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-purple-50 text-purple-700 border border-purple-200"}`}>
                                  Systems ({domainScoresObj.systems}%)
                                </span>
                              )}
                              {domainScoresObj.quality > 0 && (
                                <span className={`text-[15px] px-2.5 py-0.5 rounded ${isDark ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                                  Quality ({domainScoresObj.quality}%)
                                </span>
                              )}
                              {domainScoresObj.industrial > 0 && (
                                <span className={`text-[15px] px-2.5 py-0.5 rounded ${isDark ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                                  Manufacturing ({domainScoresObj.industrial}%)
                                </span>
                              )}
                            </div>

                            {/* Matched Skill Tags */}
                            {matchedSkillsArr.length > 0 && (
                              <div className="mt-3.5 flex flex-wrap gap-1.5">
                                {matchedSkillsArr.slice(0, 5).map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className={`text-[15px] px-2.5 py-0.5 rounded border ${
                                      isDark
                                        ? "bg-slate-950 text-slate-300 border-slate-800"
                                        : "bg-slate-100 text-slate-700 border-slate-200"
                                    }`}
                                  >
                                    ✓ {skill}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Snippet Description */}
                            <p className={`text-[18px] mt-4 line-clamp-3 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                              {job.description}
                            </p>
                          </div>

                          {/* Footer Actions */}
                          <div className={`pt-4 border-t flex items-center justify-between gap-2 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                            <button
                              onClick={() => setSelectedJob(job)}
                              className={`text-[17px] font-semibold underline underline-offset-4 cursor-pointer ${
                                isDark ? "text-slate-300 hover:text-white" : "text-slate-700 hover:text-slate-950"
                              }`}
                            >
                              View Full Details
                            </button>

                            <div className="flex items-center space-x-2">
                              {job.status !== "APPLIED" && (
                                <button
                                  onClick={() => updateJobStatus(job.id, "APPLIED")}
                                  className="px-3.5 py-2 bg-cyan-600 text-white hover:bg-cyan-500 text-[15px] font-semibold rounded-xl transition cursor-pointer shadow-sm"
                                >
                                  Mark Applied
                                </button>
                              )}
                              {job.status === "NEW" && (
                                <button
                                  onClick={() => updateJobStatus(job.id, "SAVED")}
                                  className={`px-3.5 py-2 text-[15px] font-semibold rounded-xl transition cursor-pointer border ${
                                    isDark
                                      ? "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20"
                                      : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                  }`}
                                >
                                  Save
                                </button>
                              )}
                              {job.webpageUrl && (
                                <a
                                  href={job.webpageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`px-3.5 py-2 text-[15px] font-semibold rounded-xl transition cursor-pointer border ${
                                    isDark
                                      ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                                      : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200"
                                  }`}
                                >
                                  Apply ↗
                                </a>
                              )}
                            </div>
                          </div>
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
                {/* Month Tabs Header */}
                <div
                  className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-2xl border gap-4 transition ${
                    isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                  }`}
                >
                  <div>
                    <h2 className={`text-[23px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      Monthly Job Application Log
                    </h2>
                    <p className={`text-[17px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Track and manage jobs you have searched and applied to each month.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-[17px] font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>Select Month:</span>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className={`border rounded-xl px-4 py-2.5 text-[17px] focus:outline-none focus:border-emerald-600 ${
                        isDark
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
                </div>

                {/* Applications Table */}
                {filteredApps.length === 0 ? (
                  <div
                    className={`text-center py-16 rounded-2xl border ${
                      isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                    }`}
                  >
                    <p className={`text-[22px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      No applications logged for {selectedMonth || "this month"}
                    </p>
                    <p className={`text-[17px] mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                      Mark jobs as "Applied" from the Daily Feed tab to start tracking your applications.
                    </p>
                  </div>
                ) : (
                  <div
                    className={`overflow-x-auto rounded-2xl border shadow-sm transition ${
                      isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
                    }`}
                  >
                    <table className="w-full text-left text-[17px]">
                      <thead
                        className={`uppercase tracking-wider border-b ${
                          isDark
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
                                className={`text-[16px] font-semibold px-3 py-2 rounded-lg border focus:outline-none ${
                                  isDark
                                    ? "bg-slate-950 border-slate-800"
                                    : "bg-slate-50 border-slate-300"
                                } ${
                                  app.status === "APPLIED"
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
                            <td className="py-4 px-5 text-right">
                              {app.job?.webpageUrl && (
                                <a
                                  href={app.job.webpageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[16px] text-emerald-600 hover:text-emerald-500 font-semibold underline"
                                >
                                  Ad Link ↗
                                </a>
                              )}
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
                    {scanLogs.length === 0 ? (
                      <p className="text-[17px] text-slate-500">No scan executions logged yet.</p>
                    ) : (
                      scanLogs.map((log) => (
                        <div
                          key={log.id}
                          className={`p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${
                            isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
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
          </>
        )}
      </main>

      {/* Full Job Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-7 space-y-4 border shadow-2xl ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <span className={`px-3 py-1 rounded-full text-[16px] font-bold border ${
                  isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}>
                  {selectedJob.matchScore}% Match Score
                </span>
                <h2 className={`text-[23px] font-bold mt-2 ${isDark ? "text-white" : "text-slate-900"}`}>{selectedJob.title}</h2>
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

            <div className={`pt-3 border-t space-y-3 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <h3 className={`text-[20px] font-bold uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Full Job Description
              </h3>
              <p className={`text-[18px] leading-relaxed whitespace-pre-line ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                {selectedJob.description}
              </p>
            </div>

            <div className={`pt-4 border-t flex justify-end space-x-3 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
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
    </div>
  );
}
