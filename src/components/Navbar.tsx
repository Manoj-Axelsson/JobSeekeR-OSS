"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { translations, Language } from "@/lib/services/i18n";

interface NavbarProps {
  activeTab: "feed" | "tracker" | "profile" | "logs" | "intelligence" | "settings";
  setActiveTab: (tab: "feed" | "tracker" | "profile" | "logs" | "intelligence" | "settings") => void;
  profileName: string;
  jobCount: number;
  appCount: number;
  scanning: boolean;
  onTriggerScan: () => void;
  onToggleDocUploader: () => void;
  onOpenOnboarding: () => void;
  onOpenAuth: () => void;
  onOpenUserGuide?: () => void;
  onLogout?: () => void;
  currentUser: { name: string; email: string } | null;
  themeMode: "light" | "dark" | "system";
  setThemeMode: (mode: "light" | "dark" | "system") => void;
  isDark: boolean;
  currentLang?: Language;
  onLanguageChange?: (lang: Language) => void;
}

// 100% Uniform Button Design System Class for Navbar
const navBtnClass =
  "h-11 px-4 text-xs sm:text-sm font-black text-amber-950 bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 hover:from-amber-200 hover:to-orange-300 hover:scale-[1.02] transition-all duration-200 shadow-lg shadow-amber-950/40 rounded-xl cursor-pointer flex items-center justify-center space-x-2 border border-amber-200/70 active:scale-95 shrink-0";

export function Navbar({
  profileName,
  jobCount,
  appCount,
  scanning,
  onTriggerScan,
  onToggleDocUploader,
  onOpenOnboarding,
  onOpenAuth,
  onOpenUserGuide,
  onLogout,
  currentUser,
  themeMode,
  setThemeMode,
  isDark,
  currentLang = "sv",
  onLanguageChange,
}: NavbarProps) {
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Language>(currentLang);

  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const t = translations[selectedLang] || translations.sv;

  const handleLangSelect = (l: Language) => {
    setSelectedLang(l);
    if (onLanguageChange) onLanguageChange(l);
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
        setToolsDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [downloadCount, setDownloadCount] = useState<string>("142+");

  useEffect(() => {
    fetch("/api/analytics/downloads")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.formattedCount) {
          setDownloadCount(data.formattedCount);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-gradient-to-r from-[#5c3510] via-[#7a4816] to-[#5c3510] border-b-2 border-amber-300/60 text-amber-50 shadow-2xl transition-colors duration-200">
      <div className="w-full max-w-[98%] mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-24">
          {/* Brand & Identity (Enlarged JobseekeR title with stacked rectangular badges & Public Download Counter) */}
          <div className="flex items-center space-x-3.5 sm:space-x-5">
            <Link href="/" className="flex items-center space-x-3.5 group">
              <div>
                <div className="flex items-center space-x-3">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-xl">
                    JobseekeR<span className="text-amber-400 text-lg sm:text-2xl align-super font-extrabold ml-0.5">™</span>
                  </span>
                  <div className="hidden sm:inline-flex flex-col px-3.5 py-1.5 rounded-xl bg-[#361804]/90 border border-amber-400/60 shadow-md text-left">
                    <span className="text-xs font-extrabold tracking-wide text-amber-300">Open Source Scanner</span>
                    <span className="text-[11px] font-semibold text-amber-200/90 border-t border-amber-500/30 pt-0.5 mt-0.5">SE Job Tech API</span>
                  </div>
                  <a
                    href="https://github.com/Manoj-Axelsson/JobSeekeR-OSS"
                    target="_blank"
                    rel="noreferrer"
                    title="Live Public GitHub Downloads & Clones Counter"
                    className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-400/60 shadow-md text-left hover:bg-emerald-900/90 transition cursor-pointer"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-black text-emerald-300">📦 {downloadCount}</span>
                    <span className="text-[10px] font-semibold text-emerald-200/80">Downloads</span>
                  </a>
                </div>
              </div>
            </Link>
          </div>

          {/* 100% Uniform Top Action Buttons (Identical Height, Size, Design Pattern) */}
          <div className="flex items-center space-x-3">
            {/* 1. 🏠 Home Button */}
            <Link
              href="/landing"
              className={navBtnClass}
              title="Navigate to Landing Page"
            >
              <span>🏠</span>
              <span>Home</span>
            </Link>

            {/* 2. ⚡ Single Job Scan Button */}
            <button
              onClick={onTriggerScan}
              disabled={scanning}
              className={`${navBtnClass} disabled:opacity-50`}
            >
              <span className={scanning ? "animate-spin" : ""}>⚡</span>
              <span>{scanning ? t.scanning : t.runJobScan}</span>
            </button>

            {/* 3. 👤 Interactive Register Now / Login Button & User Dropdown */}
            <div className="relative" ref={userDropdownRef}>
              {currentUser ? (
                /* Logged-In User Button with Interactive Profile Menu */
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={navBtnClass}
                  title="View Logged-In Profile & Account Options"
                >
                  <span>👤</span>
                  <span className="truncate max-w-[140px]">{currentUser.name}</span>
                  <span className="text-[10px] ml-0.5">▼</span>
                </button>
              ) : (
                /* Guest Mode: Register Now / Login Button */
                <button
                  onClick={onOpenAuth}
                  className={navBtnClass}
                  title="Register Now or Sign In"
                >
                  <span>👤</span>
                  <span>{t.registerLogin}</span>
                </button>
              )}

              {/* Logged-In Interactive User Profile Dropdown Card */}
              {currentUser && userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#361c07] border-2 border-amber-400/50 shadow-2xl p-4 z-50 text-amber-100 space-y-3 backdrop-blur-xl">
                  {/* User Account Identity Banner */}
                  <div className="pb-3 border-b border-amber-500/30 flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center font-black text-amber-950 text-xl shadow-md border border-amber-200/60 shrink-0">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-sm text-white truncate">{currentUser.name}</p>
                      <p className="text-xs text-amber-300/80 truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ✓ Verified Candidate
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Links */}
                  <div className="space-y-1.5 pt-1">
                    {onOpenUserGuide && (
                      <button
                        onClick={() => {
                          onOpenUserGuide();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold bg-[#5c330c] hover:bg-[#724010] text-amber-200 border border-amber-400/50 flex items-center justify-between cursor-pointer transition-all shadow-sm"
                      >
                        <div className="flex items-center space-x-2">
                          <span>📖</span>
                          <span className="font-extrabold text-amber-300">User Guide &amp; Docs</span>
                        </div>
                        <span className="text-amber-400 font-bold">↗</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onOpenOnboarding();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold bg-[#4c290a] hover:bg-[#5f340d] text-amber-200 border border-amber-400/30 flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="flex items-center space-x-2">
                        <span>⚙️</span>
                        <span>Profile &amp; Guided Setup</span>
                      </div>
                      <span className="text-amber-400">↗</span>
                    </button>

                    <button
                      onClick={() => {
                        onToggleDocUploader();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold bg-[#4c290a] hover:bg-[#5f340d] text-amber-200 border border-amber-400/30 flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="flex items-center space-x-2">
                        <span>📁</span>
                        <span>{t.uploadFiles}</span>
                      </div>
                      <span className="text-amber-400">↗</span>
                    </button>

                    {/* Sign Out Button */}
                    {onLogout && (
                      <button
                        onClick={() => {
                          onLogout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/40 flex items-center justify-between cursor-pointer transition-all mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <span>🚪</span>
                          <span>Sign Out / Log Out</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. ⚙️ Tools & Options Dropdown Menu Button */}
            <div className="relative" ref={toolsDropdownRef}>
              <button
                onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                className={navBtnClass}
                aria-label="Tools and options dropdown"
              >
                <span>⚙️</span>
                <span>Menu</span>
                <span className="text-[10px] ml-0.5">▼</span>
              </button>

              {toolsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#361c07] border-2 border-amber-400/50 shadow-2xl p-3 z-50 text-amber-100 space-y-3 backdrop-blur-xl">
                  {/* Upload Files Option */}
                  <button
                    onClick={() => {
                      onToggleDocUploader();
                      setToolsDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold bg-[#4c290a] hover:bg-[#5f340d] text-amber-200 border border-amber-400/40 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <span>{t.uploadFiles}</span>
                    <span className="text-amber-400">↗</span>
                  </button>

                  {/* Language Selector */}
                  <div className="pt-2 border-t border-amber-500/30">
                    <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                      Language / Språk
                    </label>
                    <select
                      value={selectedLang}
                      onChange={(e) => handleLangSelect(e.target.value as Language)}
                      className="w-full bg-[#241203] text-xs font-bold text-amber-100 p-2 rounded-xl border border-amber-500/40 focus:outline-none cursor-pointer"
                    >
                      <option value="sv">🇸🇪 Svenska (Default)</option>
                      <option value="en">🇬🇧 English</option>
                      <option value="no">🇳🇴 Norsk</option>
                      <option value="da">🇩🇰 Dansk</option>
                    </select>
                  </div>

                  {/* Accessibility & Audio Assistance */}
                  <div className="pt-2 border-t border-amber-500/30 space-y-2">
                    <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                      Accessibility &amp; Audio
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const root = document.documentElement;
                          const currentSize = parseFloat(getComputedStyle(root).getPropertyValue("--base-font-size") || "19px");
                          const nextSize = currentSize >= 25 ? 17 : currentSize + 2;
                          root.style.setProperty("--base-font-size", `${nextSize}px`);
                          document.body.style.fontSize = `${nextSize}px`;
                        }}
                        className="flex-1 px-3 py-2 text-xs font-bold rounded-xl bg-[#241203] text-amber-200 border border-amber-500/40 hover:bg-amber-900/50 cursor-pointer text-center"
                        title="Increase text size"
                      >
                        A+ Font
                      </button>

                      <button
                        onClick={() => {
                          if (typeof window !== "undefined" && "speechSynthesis" in window) {
                            if (window.speechSynthesis.speaking) {
                              window.speechSynthesis.cancel();
                            } else {
                              const ttsText = `Välkommen till JobseekeR. Sidan innehåller ${jobCount} lediga jobb och ${appCount} ansökningar.`;
                              const u = new SpeechSynthesisUtterance(ttsText);
                              u.lang = selectedLang === "en" ? "en-US" : selectedLang === "no" ? "no-NO" : selectedLang === "da" ? "da-DK" : "sv-SE";
                              window.speechSynthesis.speak(u);
                            }
                          }
                        }}
                        className="flex-1 px-3 py-2 text-xs font-bold rounded-xl bg-[#241203] text-amber-300 border border-amber-500/40 hover:bg-amber-900/50 cursor-pointer text-center"
                        title="Read page summary aloud"
                      >
                        🔊 {t.listenAudio}
                      </button>
                    </div>

                    <button
                      onClick={() => setThemeMode(isDark ? "light" : "dark")}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-[#241203] text-amber-200 border border-amber-500/40 hover:bg-amber-900/50 cursor-pointer flex items-center justify-between"
                    >
                      <span>Theme Mode</span>
                      <span>{isDark ? "☀️ Light" : "🌙 Dark"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
