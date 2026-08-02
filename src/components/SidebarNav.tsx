"use client";

import Link from "next/link";
import { translations, Language } from "@/lib/services/i18n";

interface SidebarNavProps {
  activeTab: "feed" | "tracker" | "profile" | "logs" | "intelligence" | "settings";
  setActiveTab: (tab: "feed" | "tracker" | "profile" | "logs" | "intelligence" | "settings") => void;
  jobCount: number;
  appCount: number;
  currentLang?: Language;
  onOpenUserGuide?: () => void;
}

export function SidebarNav({
  activeTab,
  setActiveTab,
  jobCount,
  appCount,
  currentLang = "sv",
  onOpenUserGuide,
}: SidebarNavProps) {
  const t = translations[currentLang] || translations.sv;

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-4 lg:sticky lg:top-28 self-start z-30">
      {/* Warm Rich Golden Amber Sidebar Navigation Panel */}
      <div className="bg-[#5c3612]/95 backdrop-blur-xl border-2 border-amber-300/60 rounded-2xl p-3.5 shadow-2xl space-y-2 text-amber-100">
        <div className="px-3 py-1.5 border-b border-amber-500/30 mb-2 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Navigation Menu
          </span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        </div>

        {/* 📌 Daily Feed Tab */}
        <button
          onClick={() => setActiveTab("feed")}
          className={`w-full p-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-between group ${
            activeTab === "feed"
              ? "bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 text-amber-950 shadow-xl shadow-amber-950/60 border border-amber-200/50 font-black scale-[1.02]"
              : "bg-[#4e2c0e]/80 hover:bg-[#613712] text-amber-200 border border-amber-500/30"
          }`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-lg">📌</span>
            <span>{t.dailyFeed}</span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
              activeTab === "feed"
                ? "bg-amber-950 text-amber-300"
                : "bg-amber-900/60 text-amber-300 border border-amber-500/30"
            }`}
          >
            {jobCount}
          </span>
        </button>

        {/* 📋 Monthly Application Tracker Tab */}
        <button
          onClick={() => setActiveTab("tracker")}
          className={`w-full p-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-between group ${
            activeTab === "tracker"
              ? "bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 text-amber-950 shadow-xl shadow-amber-950/60 border border-amber-200/50 font-black scale-[1.02]"
              : "bg-[#4e2c0e]/80 hover:bg-[#613712] text-amber-200 border border-amber-500/30"
          }`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-lg">📋</span>
            <span>{t.applications}</span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
              activeTab === "tracker"
                ? "bg-amber-950 text-amber-300"
                : "bg-amber-900/60 text-amber-300 border border-amber-500/30"
            }`}
          >
            {appCount}
          </span>
        </button>

        {/* 🎯 Competence Profile & Skills Tab */}
        <button
          onClick={() => setActiveTab("profile")}
          className={`w-full p-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-between ${
            activeTab === "profile"
              ? "bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 text-amber-950 shadow-xl shadow-amber-950/60 border border-amber-200/50 font-black scale-[1.02]"
              : "bg-[#4e2c0e]/80 hover:bg-[#613712] text-amber-200 border border-amber-500/30"
          }`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-lg">🎯</span>
            <span>{t.competenceProfile}</span>
          </div>
        </button>

        {/* 🤖 JobseekeR Intelligence Suite Tab */}
        <button
          onClick={() => setActiveTab("intelligence")}
          className={`w-full p-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-between ${
            activeTab === "intelligence"
              ? "bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 text-amber-950 shadow-xl shadow-amber-950/60 border border-amber-200/50 font-black scale-[1.02]"
              : "bg-[#4e2c0e]/80 hover:bg-[#613712] text-amber-200 border border-amber-500/30"
          }`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-lg">🤖</span>
            <span>Intelligence Suite</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 uppercase tracking-wider">
            8 AI
          </span>
        </button>

        {/* ⚡ Monitor Logs Tab */}
        <button
          onClick={() => setActiveTab("logs")}
          className={`w-full p-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-between ${
            activeTab === "logs"
              ? "bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 text-amber-950 shadow-xl shadow-amber-950/60 border border-amber-200/50 font-black scale-[1.02]"
              : "bg-[#4e2c0e]/80 hover:bg-[#613712] text-amber-200 border border-amber-500/30"
          }`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-lg">⚡</span>
            <span>{t.monitorLogs}</span>
          </div>
        </button>

        {/* ⚙️ Settings & Preferences Tab */}
        <button
          onClick={() => setActiveTab("settings")}
          className={`w-full p-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-between ${
            activeTab === "settings"
              ? "bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 text-amber-950 shadow-xl shadow-amber-950/60 border border-amber-200/50 font-black scale-[1.02]"
              : "bg-[#4e2c0e]/80 hover:bg-[#613712] text-amber-200 border border-amber-500/30"
          }`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-lg">⚙️</span>
            <span>Settings &amp; Preferences</span>
          </div>
        </button>

        {/* Home Link to Landing Page & User Guide */}
        <div className="pt-2 border-t border-amber-500/30 space-y-2">
          {onOpenUserGuide && (
            <button
              onClick={onOpenUserGuide}
              className="w-full p-3 rounded-xl font-bold text-sm bg-[#5c330c]/90 hover:bg-[#703f10] text-amber-200 border border-amber-400/50 flex items-center justify-between transition-all cursor-pointer shadow-md"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">📖</span>
                <span className="font-extrabold text-amber-300">User Guide &amp; Docs</span>
              </div>
              <span className="text-xs font-semibold text-amber-400">↗</span>
            </button>
          )}

          <Link
            href="/landing"
            className="w-full p-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-900/80 to-orange-950/80 hover:from-amber-800 hover:to-orange-900 text-amber-200 border border-amber-500/40 flex items-center justify-between transition-all"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">🏠</span>
              <span>Landing Page</span>
            </div>
            <span className="text-xs font-semibold text-amber-400">↗</span>
          </Link>
        </div>

        {/* Official Mascot Logo Card — Transparent Emblem Morphing into Background */}
        <div className="pt-3 border-t border-amber-500/40 text-center">
          <div className="p-3 bg-amber-950/40 border-2 border-amber-400/40 rounded-2xl shadow-2xl flex flex-col items-center justify-center space-y-2 backdrop-blur-md">
            <div className="w-32 h-32 relative flex items-center justify-center">
              <img
                src="/logo.png"
                alt="JobseekeR Platform Logo"
                className="w-full h-full object-contain filter drop-shadow-2xl hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div>
              <p className="text-xs font-black text-amber-300 uppercase tracking-widest">JobseekeR™ OS</p>
              <p className="text-[11px] text-amber-200/80 font-semibold mt-0.5">Talent Navigator Platform</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
