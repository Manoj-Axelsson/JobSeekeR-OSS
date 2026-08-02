"use client";

import { useState } from "react";

interface SettingsPanelProps {
  profileName: string;
  onOpenOnboarding: () => void;
  onTriggerScan: () => void;
  scanning: boolean;
  themeMode: "light" | "dark" | "system";
  setThemeMode: (mode: "light" | "dark" | "system") => void;
  jobs: any[];
  applications: any[];
}

export function SettingsPanel({
  profileName,
  onOpenOnboarding,
  onTriggerScan,
  scanning,
  themeMode,
  setThemeMode,
  jobs,
  applications,
}: SettingsPanelProps) {
  const [settingsSection, setSettingsSection] = useState<"account" | "career" | "automation" | "accessibility" | "privacy" | "about">("account");

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/80 via-orange-950/90 to-amber-900/80 border-2 border-amber-400/50 shadow-xl text-amber-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-amber-300 uppercase tracking-wide flex items-center space-x-2">
            <span>⚙️</span>
            <span>Settings &amp; Preferences</span>
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/90 mt-1">
            Consolidated configuration for account, search criteria, automation, accessibility, privacy, and system diagnostics.
          </p>
        </div>
      </div>

      {/* Settings Navigation Pills */}
      <div className="flex flex-wrap gap-2 text-xs font-bold border-b border-amber-500/20 pb-3">
        <button
          onClick={() => setSettingsSection("account")}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
            settingsSection === "account"
              ? "bg-amber-400 text-amber-950 font-black shadow-md"
              : "bg-amber-950/60 text-amber-300 hover:bg-amber-900/80 border border-amber-500/30"
          }`}
        >
          👤 Account
        </button>
        <button
          onClick={() => setSettingsSection("career")}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
            settingsSection === "career"
              ? "bg-amber-400 text-amber-950 font-black shadow-md"
              : "bg-amber-950/60 text-amber-300 hover:bg-amber-900/80 border border-amber-500/30"
          }`}
        >
          🎯 Career &amp; Roles
        </button>
        <button
          onClick={() => setSettingsSection("automation")}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
            settingsSection === "automation"
              ? "bg-amber-400 text-amber-950 font-black shadow-md"
              : "bg-amber-950/60 text-amber-300 hover:bg-amber-900/80 border border-amber-500/30"
          }`}
        >
          ⚡ Automation
        </button>
        <button
          onClick={() => setSettingsSection("accessibility")}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
            settingsSection === "accessibility"
              ? "bg-amber-400 text-amber-950 font-black shadow-md"
              : "bg-amber-950/60 text-amber-300 hover:bg-amber-900/80 border border-amber-500/30"
          }`}
        >
          👁️ Accessibility
        </button>
        <button
          onClick={() => setSettingsSection("privacy")}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
            settingsSection === "privacy"
              ? "bg-amber-400 text-amber-950 font-black shadow-md"
              : "bg-amber-950/60 text-amber-300 hover:bg-amber-900/80 border border-amber-500/30"
          }`}
        >
          🔒 Privacy
        </button>
        <button
          onClick={() => setSettingsSection("about")}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
            settingsSection === "about"
              ? "bg-amber-400 text-amber-950 font-black shadow-md"
              : "bg-amber-950/60 text-amber-300 hover:bg-amber-900/80 border border-amber-500/30"
          }`}
        >
          ℹ️ About
        </button>
      </div>

      {/* Section 1: Account */}
      {settingsSection === "account" && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 text-amber-100 space-y-4">
          <h3 className="font-black text-amber-300 text-base">Candidate Profile Identity</h3>
          <div>
            <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
              Active Candidate Name
            </label>
            <input
              type="text"
              readOnly
              value={profileName}
              className="w-full max-w-md bg-slate-950 border border-amber-500/40 rounded-xl px-4 py-2.5 text-sm text-amber-100"
            />
          </div>
          <button
            onClick={onOpenOnboarding}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
          >
            Restart Guided Setup Wizard 🚀
          </button>
        </div>
      )}

      {/* Section 2: Career & Roles */}
      {settingsSection === "career" && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 text-amber-100 space-y-4">
          <h3 className="font-black text-amber-300 text-base">Target Roles &amp; Match Threshold</h3>
          <p className="text-xs text-amber-100/80 leading-relaxed">
            Target job titles (e.g. <em>Fullstack Developer, Systems Engineer, Software Architect</em>) and preferred match threshold (default: 50%).
          </p>
          <button
            onClick={onOpenOnboarding}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
          >
            Configure Target Criteria 🎯
          </button>
        </div>
      )}

      {/* Section 3: Automation */}
      {settingsSection === "automation" && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 text-amber-100 space-y-4">
          <h3 className="font-black text-amber-300 text-base">Scanner Auto-Execution</h3>
          <p className="text-xs text-amber-100/80 leading-relaxed">
            JobseekeR™ scans Arbetsförmedlingen JobTech API automatically every day at 12:00 PM.
          </p>
          <button
            onClick={onTriggerScan}
            disabled={scanning}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md disabled:opacity-50"
          >
            {scanning ? "⏳ Scanning JobTech..." : "Run Scanner Manual Scan ⚡"}
          </button>
        </div>
      )}

      {/* Section 4: Accessibility */}
      {settingsSection === "accessibility" && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 text-amber-100 space-y-4">
          <h3 className="font-black text-amber-300 text-base">Accessibility &amp; High Contrast</h3>
          <p className="text-xs text-amber-100/80 leading-relaxed">
            All text rendered on white/light backgrounds strictly uses high-contrast pitch black (`text-black font-extrabold`). Use the A+ button in the header for up to 200% font resizer scaling.
          </p>
        </div>
      )}

      {/* Section 5: Privacy */}
      {settingsSection === "privacy" && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 text-amber-100 space-y-4">
          <h3 className="font-black text-amber-300 text-base">Local-First SQLite Storage &amp; Data Backup</h3>
          <p className="text-xs text-amber-100/80 leading-relaxed">
            All career data is stored locally on your device in an embedded SQLite database (`prisma/dev.db`). No telemetry or personal information is transmitted to external tracking servers.
          </p>
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ jobs, applications, profileName }));
              const downloadAnchor = document.createElement("a");
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `jobseeker-backup-${new Date().toISOString().slice(0, 10)}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="px-4 py-2 rounded-xl bg-amber-950 border border-amber-400/40 text-amber-300 font-bold text-xs hover:bg-amber-900 transition cursor-pointer"
          >
            📥 Export Local Backup (JSON)
          </button>
        </div>
      )}

      {/* Section 6: About & Developer Diagnostics */}
      {settingsSection === "about" && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 text-amber-100 space-y-4">
          <h3 className="font-black text-amber-300 text-base">About JobseekeR™ &amp; Developer Diagnostics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/30">
              <p className="font-extrabold text-amber-300">Version</p>
              <p className="text-amber-100 mt-0.5">v1.0.0-rc1 (Release Candidate)</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/30">
              <p className="font-extrabold text-amber-300">License</p>
              <p className="text-amber-100 mt-0.5">MIT Open Source</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/30 sm:col-span-2">
              <p className="font-extrabold text-amber-300">Developer Diagnostics</p>
              <p className="text-amber-100/80 mt-0.5">Database: SQLite (`prisma/dev.db`) • API: Arbetsförmedlingen JobTech Open Source Scanner</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
