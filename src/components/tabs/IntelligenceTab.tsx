"use client";

import type { JobAd, Application } from "@/types/domain";
import {
  generateExecutiveCareerOverview,
  calculateUpskillingRoadmap,
  calculateSalaryBenchmarks,
} from "@/intelligence";

export interface UserProfileSummary {
  skills?: {
    custom?: string[];
  };
  targetRoles?: string[];
}

export interface IntelligenceTabProps {
  jobsList: JobAd[];
  appsList: Application[];
  userProfile: UserProfileSummary | null;
  profileName: string;
  isDark: boolean;
  showDocUploader: boolean;
  onToggleDocUploader: () => void;
  onOpenOnboarding: () => void;
}

export function IntelligenceTab({
  jobsList,
  appsList,
  userProfile,
  profileName,
  isDark,
  showDocUploader,
  onToggleDocUploader,
  onOpenOnboarding,
}: IntelligenceTabProps) {
  const overview = generateExecutiveCareerOverview(jobsList, appsList);
  const recruiters = overview.recruiters;
  const cvPerf = overview.cvPerformance;
  const upskilling = calculateUpskillingRoadmap(jobsList);
  const salaryBenchmarks = calculateSalaryBenchmarks(
    userProfile?.targetRoles || [],
    jobsList
  );

  // Calculate profile setup completeness score
  const customSkillsCount = userProfile?.skills?.custom?.length || 0;
  const targetRolesCount = userProfile?.targetRoles?.length || 0;
  const isNameSet =
    profileName &&
    profileName !== "JobseekeR Candidate" &&
    profileName !== "Candidate";

  let completenessScore = 25;
  if (isNameSet) completenessScore += 25;
  if (targetRolesCount > 0) completenessScore += 25;
  if (customSkillsCount > 0) completenessScore += 25;

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
              &quot;JobseekeR™ is an intelligence platform built to automate job
              searching.&quot;
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="px-3 py-1 rounded-lg bg-amber-400 text-amber-950 shadow-md">
            🧠 Recruiter
          </span>
          <span className="px-3 py-1 rounded-lg bg-amber-400 text-amber-950 shadow-md">
            🏢 Company
          </span>
          <span className="px-3 py-1 rounded-lg bg-amber-400 text-amber-950 shadow-md">
            📄 Document
          </span>
          <span className="px-3 py-1 rounded-lg bg-amber-400 text-amber-950 shadow-md">
            📈 Market
          </span>
          <span className="px-3 py-1 rounded-lg bg-amber-400 text-amber-950 shadow-md">
            🎓 Learning
          </span>
          <span className="px-3 py-1 rounded-lg bg-amber-400 text-amber-950 shadow-md">
            💰 Salary
          </span>
          <span className="px-3 py-1 rounded-lg bg-amber-400 text-amber-950 shadow-md">
            🎯 Match
          </span>
          <span className="px-3 py-1 rounded-lg bg-amber-400 text-amber-950 shadow-md">
            🔮 Predictive
          </span>
        </div>
      </div>

      {/* Candidate Profile Setup Guidance Banner */}
      {completenessScore < 100 && (
        <div
          className={`p-5 rounded-2xl border-2 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
            isDark
              ? "bg-gradient-to-r from-amber-950/90 via-amber-900/70 to-slate-900 border-amber-400/50 text-amber-100"
              : "bg-gradient-to-r from-amber-500/10 via-amber-100/70 to-amber-50 border-amber-400 text-amber-950 shadow-md"
          }`}
        >
          <div className="flex items-start space-x-3.5">
            <span className="text-3xl sm:text-4xl shrink-0">🎯</span>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg">
                  Candidate Profile Setup:{" "}
                  <span className="text-amber-400 font-black">
                    {completenessScore}% Complete
                  </span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  Action Needed
                </span>
              </div>
              <p className="text-xs sm:text-sm opacity-90 leading-relaxed max-w-2xl">
                {customSkillsCount === 0
                  ? "Upload your CV documents to extract your technical skills and unlock personalized candidate match scoring, recruiter analytics, and Swedish salary benchmarks."
                  : "Configure your candidate profile and target roles to maximize search scanner accuracy and career AI insights."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
            <button
              onClick={onToggleDocUploader}
              className="flex-1 md:flex-none px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <span>📁</span>
              <span>
                {showDocUploader ? "Hide Uploader" : "Upload CV & Docs"}
              </span>
            </button>
            <button
              onClick={onOpenOnboarding}
              className="flex-1 md:flex-none px-4 py-2.5 bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-400/50 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <span>⚙️</span>
              <span>Configure Profile</span>
            </button>
          </div>
        </div>
      )}

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
            <p className="text-[11px] font-extrabold uppercase text-amber-300/90">
              Overall Score
            </p>
            <p className="text-3xl font-black text-white mt-1">
              {overview.overallCareerScore}
            </p>
            <p className="text-[10px] text-amber-300 font-semibold mt-0.5">
              / 100 Excellent
            </p>
          </div>

          <div className="p-3 bg-amber-950/80 border border-amber-400/50 rounded-xl">
            <p className="text-[11px] font-extrabold uppercase text-amber-300/90">
              Interview Prob.
            </p>
            <p className="text-3xl font-black text-emerald-400 mt-1">
              {overview.interviewProbabilityPct}%
            </p>
            <p className="text-[10px] text-emerald-300 font-semibold mt-0.5">
              High Likelihood
            </p>
          </div>

          <div className="p-3 bg-amber-950/80 border border-amber-400/50 rounded-xl">
            <p className="text-[11px] font-extrabold uppercase text-amber-300/90">
              Valuable Skill
            </p>
            <p className="text-lg font-black text-cyan-300 mt-2 truncate">
              {overview.mostValuableSkill}
            </p>
            <p className="text-[10px] text-cyan-200 font-semibold mt-0.5">
              High Demand
            </p>
          </div>

          <div className="p-3 bg-amber-950/80 border border-amber-400/50 rounded-xl">
            <p className="text-[11px] font-extrabold uppercase text-amber-300/90">
              Highest ROI
            </p>
            <p
              className="text-xs font-black text-purple-300 mt-2 truncate"
              title={overview.highestRoiCourse}
            >
              {overview.highestRoiCourse}
            </p>
            <p className="text-[10px] text-purple-200 font-semibold mt-0.5">
              Top Skill Demand
            </p>
          </div>

          <div className="p-3 bg-amber-950/80 border border-amber-400/50 rounded-xl col-span-2 sm:col-span-1">
            <p className="text-[11px] font-extrabold uppercase text-amber-300/90">
              Best CV
            </p>
            <p className="text-xs font-black text-amber-200 mt-2 truncate">
              {overview.bestPerformingCv}
            </p>
            <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
              {cvPerf.length > 0
                ? `${cvPerf[0].conversionRate}% Conversion`
                : "Target Fit"}
            </p>
          </div>

          <div className="p-3 bg-amber-950/80 border border-amber-400/50 rounded-xl col-span-2 sm:col-span-1">
            <p className="text-[11px] font-extrabold uppercase text-amber-300/90">
              Responsive Co.
            </p>
            <p className="text-xs font-black text-amber-200 mt-2 truncate">
              {overview.mostResponsiveCompany}
            </p>
            <p className="text-[10px] text-amber-400 font-semibold mt-0.5">
              Tracked Applications
            </p>
          </div>

          <div className="p-3 bg-amber-950/80 border border-amber-400/50 rounded-xl col-span-2 sm:col-span-4 lg:col-span-1 text-left">
            <p className="text-[11px] font-extrabold uppercase text-amber-300/90 text-center">
              Market Trend
            </p>
            <div className="text-xs font-bold space-y-0.5 mt-1 text-amber-200 flex flex-wrap justify-around lg:flex-col lg:items-start">
              {overview.marketTrends.map((t, idx) => (
                <span key={idx} className="inline-block mr-2 lg:mr-0">
                  {t.technology}{" "}
                  <span className="text-amber-400 font-extrabold">
                    {t.trendSymbol}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: RECRUITER BEHAVIOR ANALYTICS */}
      <div
        className={`p-6 rounded-2xl border space-y-4 transition ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3
              className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-slate-900"} flex items-center space-x-2`}
            >
              <span>👤 Recruiter Behavior Analytics</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                Behavioral AI
              </span>
            </h3>
            <p
              className={`text-xs sm:text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              Tracks recruiter response speed, communication reliability,
              portfolio requirements, and hiring seniority preferences.
            </p>
          </div>
        </div>

        {recruiters.length === 0 ? (
          <div
            className={`p-5 rounded-xl border text-center space-y-2 ${isDark ? "bg-slate-950/60 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}
          >
            <p className="text-sm font-bold text-amber-400">
              👤 No tracked applications yet
            </p>
            <p className="text-xs">
              Mark job ads as{" "}
              <strong className="text-emerald-400">&quot;Applied&quot;</strong> in your
              Daily Feed to start tracking recruiter response rates, average reply
              times, and hiring preference analytics!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {recruiters.map((rec) => (
              <div
                key={rec.id}
                className={`p-4 rounded-xl border space-y-2.5 ${isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-100 border-slate-300 text-black"}`}
              >
                <div className="flex items-center justify-between">
                  <h4
                    className={`font-black text-base ${isDark ? "text-amber-300" : "text-black"}`}
                  >
                    {rec.name}
                  </h4>
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded border ${isDark ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-emerald-100 text-emerald-950 border-emerald-300"}`}
                  >
                    {rec.replyRate}% Reply Rate
                  </span>
                </div>
                <p
                  className={`text-xs font-extrabold ${isDark ? "text-amber-200/80" : "text-slate-800"}`}
                >
                  {rec.company}
                </p>
                <div
                  className={`text-xs font-bold space-y-1 pt-2 border-t ${isDark ? "border-amber-500/20 text-slate-300" : "border-slate-300 text-black"}`}
                >
                  <p>
                    <span
                      className={`font-black ${isDark ? "text-amber-300" : "text-black"}`}
                    >
                      ⏱️ Avg Response:
                    </span>{" "}
                    {rec.avgResponseDays} days
                  </p>
                  <p>
                    <span
                      className={`font-black ${isDark ? "text-amber-300" : "text-black"}`}
                    >
                      🎓 Seniority Pref:
                    </span>{" "}
                    {rec.seniorityPreference}
                  </p>
                  <p>
                    <span
                      className={`font-black ${isDark ? "text-amber-300" : "text-black"}`}
                    >
                      📁 Portfolio Request:
                    </span>{" "}
                    {rec.prefersPortfolio
                      ? "Yes (High frequency)"
                      : "Standard CV"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: SALARY INTELLIGENCE & SWEDISH ROLE BENCHMARKS */}
      <div
        className={`p-6 rounded-2xl border space-y-4 transition ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}
      >
        <h3
          className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-slate-900"} flex items-center space-x-2`}
        >
          <span>💰 Swedish Salary Intelligence &amp; Market Benchmarks</span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${isDark ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-emerald-100 text-emerald-950 border-emerald-300"}`}
          >
            SEK Compensation Engine
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {salaryBenchmarks.map((bm, idx) => {
            const colors = [
              { badge: isDark ? "text-cyan-400" : "text-cyan-900" },
              { badge: isDark ? "text-purple-400" : "text-purple-900" },
              { badge: isDark ? "text-emerald-400" : "text-emerald-900" },
            ][idx % 3];

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-300 text-black"}`}
              >
                <p className={`text-xs font-black uppercase ${colors.badge}`}>
                  {bm.roleTitle}
                </p>
                <p
                  className={`text-2xl font-black mt-1 ${isDark ? "text-white" : "text-black"}`}
                >
                  {bm.minSalary.toLocaleString("sv-SE")} –{" "}
                  {bm.maxSalary.toLocaleString("sv-SE")}{" "}
                  <span
                    className={`text-xs font-bold ${isDark ? "text-slate-400" : "text-slate-700"}`}
                  >
                    {bm.currency}
                  </span>
                </p>
                <p
                  className={`text-xs font-bold mt-1 ${isDark ? "text-slate-400" : "text-slate-800"}`}
                >
                  {bm.scope}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: UPSKILLING ROI & LEARNING ROADMAP */}
      <div
        className={`p-6 rounded-2xl border space-y-4 transition ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3
              className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-slate-900"} flex items-center space-x-2`}
            >
              <span>🚀 Upskilling ROI &amp; Recommended Next Learning Steps</span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${isDark ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-purple-100 text-purple-950 border-purple-300"}`}
              >
                Match Boost Engine
              </span>
            </h3>
            <p
              className={`text-xs sm:text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              Identifies top missing skills across all scanned Swedish positions
              and projects your calculated match score boost.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {upskilling.map((trend, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-300 text-black"}`}
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 border ${isDark ? "bg-amber-400/20 border-amber-400/40 text-amber-300" : "bg-amber-300 border-amber-500 text-amber-950"}`}
                >
                  #{idx + 1}
                </span>
                <div>
                  <h4
                    className={`font-black text-base ${isDark ? "text-white" : "text-black"}`}
                  >
                    {trend.skill}
                  </h4>
                  <p
                    className={`text-xs font-bold ${isDark ? "text-amber-300" : "text-amber-900"}`}
                  >
                    {trend.growthVelocity}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-black border ${isDark ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-emerald-200 text-emerald-950 border-emerald-400"}`}
                >
                  +{trend.scoreBoostPct}% Match Score Boost
                </span>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-black border ${isDark ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-200 text-blue-950 border-blue-400"}`}
                >
                  Appears in {trend.percentage}% of Roles
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: CV VERSION A/B PERFORMANCE MATRIX */}
      <div
        className={`p-6 rounded-2xl border space-y-4 transition ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}
      >
        <h3
          className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-slate-900"} flex items-center space-x-2`}
        >
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
                <th className="py-3 px-4 text-right">
                  Interview Conversion Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/50">
              {cvPerf.map((cv, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-bold text-white">
                    {cv.resumeVersion}
                  </td>
                  <td className="py-3 px-4 text-slate-300">{cv.totalApplied}</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">
                    {cv.interviewsCount}
                  </td>
                  <td className="py-3 px-4 font-bold text-purple-400">
                    {cv.offersCount}
                  </td>
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
}
