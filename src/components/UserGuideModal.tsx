"use client";

import { useState } from "react";

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOnboarding: () => void;
}

export function UserGuideModal({ isOpen, onClose, onOpenOnboarding }: UserGuideModalProps) {
  const [guideTab, setGuideTab] = useState<"quickstart" | "intelligence" | "scanner" | "tracking" | "pwa">("quickstart");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border-2 border-amber-400/60 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative text-amber-100 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-4">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📖</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-300 uppercase tracking-wide">
                JobseekeR™ User Guide &amp; Documentation
              </h2>
              <p className="text-xs text-amber-200/90 font-medium">
                &ldquo;JobseekeR™ is an intelligence platform built to automate job searching.&rdquo;
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/40 text-sm font-bold transition cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* User Guide Tab Navigation Pills */}
        <div className="flex flex-wrap gap-2 text-xs font-bold border-b border-amber-500/20 pb-3">
          <button
            onClick={() => setGuideTab("quickstart")}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
              guideTab === "quickstart"
                ? "bg-amber-400 text-amber-950 font-black shadow-md"
                : "bg-amber-950/60 text-amber-300 hover:bg-amber-900/80 border border-amber-500/30"
            }`}
          >
            🚀 1. Quick Start
          </button>
          <button
            onClick={() => setGuideTab("intelligence")}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
              guideTab === "intelligence"
                ? "bg-amber-400 text-amber-950 font-black shadow-md"
                : "bg-amber-950/60 text-amber-300 hover:bg-amber-900/80 border border-amber-500/30"
            }`}
          >
            🤖 2. Intelligence Suite
          </button>
          <button
            onClick={() => setGuideTab("scanner")}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
              guideTab === "scanner"
                ? "bg-amber-400 text-amber-950 font-black shadow-md"
                : "bg-amber-950/60 text-amber-300 hover:bg-amber-900/80 border border-amber-500/30"
            }`}
          >
            ⚡ 3. Scanner &amp; Importer
          </button>
          <button
            onClick={() => setGuideTab("tracking")}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
              guideTab === "tracking"
                ? "bg-amber-400 text-amber-950 font-black shadow-md"
                : "bg-amber-950/60 text-amber-300 hover:bg-amber-900/80 border border-amber-500/30"
            }`}
          >
            📋 4. Application Tracker
          </button>
          <button
            onClick={() => setGuideTab("pwa")}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
              guideTab === "pwa"
                ? "bg-amber-400 text-amber-950 font-black shadow-md"
                : "bg-amber-950/60 text-amber-300 hover:bg-amber-900/80 border border-amber-500/30"
            }`}
          >
            📱 5. Mobile PWA Install
          </button>
        </div>

        {/* Tab 1: Quick Start Guide */}
        {guideTab === "quickstart" && (
          <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
            <h3 className="text-lg font-extrabold text-amber-300 flex items-center space-x-2">
              <span>🚀 Step-by-Step Quick Start Guide for New Visitors</span>
            </h3>

            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-400/40 space-y-3">
              <div className="flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                <div>
                  <h4 className="font-extrabold text-amber-200">Configure Your Profile &amp; Target Roles</h4>
                  <p className="text-amber-100/80 text-xs mt-0.5">
                    Click <strong>&ldquo;🎯 Competence Profile&rdquo;</strong> in the sidebar to define your target job titles (e.g. <em>Fullstack Developer, Systems Engineer, Software Architect</em>) and set your preferred minimum match threshold (default: 50%).
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                <div>
                  <h4 className="font-extrabold text-amber-200">Upload Your CVs &amp; Competence Certificates</h4>
                  <p className="text-amber-100/80 text-xs mt-0.5">
                    Click <strong>&ldquo;📤 Upload CV &amp; Certs&rdquo;</strong> in the navbar. JobseekeR™ parses your PDF/Word files and extracts key technical skills into your profile taxonomy.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                <div>
                  <h4 className="font-extrabold text-amber-200">Review Daily Matched Feed &amp; Apply</h4>
                  <p className="text-amber-100/80 text-xs mt-0.5">
                    Browse matched jobs scored from 0% to 100%. Click any card to expand full domain score breakdowns, missing skills, audio text-to-speech pitches, and 1-click status toggles.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  onClose();
                  onOpenOnboarding();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 font-black text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition cursor-pointer"
              >
                Launch 5-Step Guided Setup Wizard 🚀
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Intelligence Suite */}
        {guideTab === "intelligence" && (
          <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
            <h3 className="text-lg font-extrabold text-amber-300">
              🤖 The 8 Pillars of JobseekeR™ Intelligence Suite
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/30">
                <h4 className="font-extrabold text-amber-300">🧠 1. Recruiter Intelligence</h4>
                <p className="text-amber-100/80 mt-1">Tracks recruiter response speeds, reply rates (%), portfolio request habits, and preferred hiring seniority levels.</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/30">
                <h4 className="font-extrabold text-amber-300">🏢 2. Company Intelligence</h4>
                <p className="text-amber-100/80 mt-1">Monitors employer callback ratios, response benchmarks, and flags ghosting risk.</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/30">
                <h4 className="font-extrabold text-amber-300">📄 3. Document Intelligence</h4>
                <p className="text-amber-100/80 mt-1">Automated PDF/Word CV parsing, keyword taxonomy extraction, and CV A/B performance matrix.</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/30">
                <h4 className="font-extrabold text-amber-300">📈 4. Market Intelligence</h4>
                <p className="text-amber-100/80 mt-1">Real-time Swedish tech stack demand velocity (React ↑, .NET →, Python ↑, AI ↑) and regional density.</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/30">
                <h4 className="font-extrabold text-amber-300">🎓 5. Learning Intelligence</h4>
                <p className="text-amber-100/80 mt-1">Upskilling recommendations and highest ROI course guidance (e.g. <em>Docker +18% Match Boost</em>).</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/30">
                <h4 className="font-extrabold text-amber-300">💰 6. Salary Intelligence</h4>
                <p className="text-amber-100/80 mt-1">Extracts SEK compensation figures (<em>45 000 – 65 000 SEK/mån</em>) and Swedish role benchmarks.</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/30">
                <h4 className="font-extrabold text-amber-300">🎯 7. Match Intelligence</h4>
                <p className="text-amber-100/80 mt-1">Weighted scoring across Software, Systems, Quality, and Manufacturing domain taxonomies.</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/30">
                <h4 className="font-extrabold text-amber-300">🔮 8. Predictive Intelligence</h4>
                <p className="text-amber-100/80 mt-1">Real-time interview probability predictions (37%) and Overall Career Scorecard (82 / 100).</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Scanner & Importer */}
        {guideTab === "scanner" && (
          <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
            <h3 className="text-lg font-extrabold text-amber-300">
              ⚡ Automated 12:00 PM Scanner &amp; Direct URL Importer
            </h3>
            <p className="text-amber-100/90">
              JobseekeR™ connects directly to official Swedish job portals and allows importing external links from any career website.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/30">
                <h4 className="font-extrabold text-amber-300">🏛️ Arbetsförmedlingen JobTech Automated Scanner</h4>
                <p className="text-amber-100/80 mt-1">
                  Every day at 12:00 PM (or when you click <strong>⚡ Run Scan</strong>), JobseekeR™ fetches all active Swedish postings, filters out blocked companies, and ranks new ads by your match score.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/30">
                <h4 className="font-extrabold text-amber-300">🔗 Direct Job URL Importer</h4>
                <p className="text-amber-100/80 mt-1">
                  Found a job on LinkedIn, Platsbanken, or a company career site? Paste the URL into <strong>&ldquo;🔗 Importera Direkt Jobblänk&rdquo;</strong> at the top of your feed. JobseekeR™ parses OpenGraph metadata, extracts job text, and scores it instantly!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Application Tracker & Aktivitetsrapport */}
        {guideTab === "tracking" && (
          <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
            <h3 className="text-lg font-extrabold text-amber-300">
              📋 Monthly Application Tracker &amp; Aktivitetsrapport
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/30">
                <h4 className="font-extrabold text-amber-300">📋 Monthly Tracker &amp; Accidental Reversal</h4>
                <p className="text-amber-100/80 mt-1">
                  When you mark a job as <strong>Mark Applied</strong>, it logs into your Application Tracker tagged with the current month (e.g. <em>2026-08</em>). Made a mistake? Click <strong>↩️ Undo Applied</strong> anytime to reverse the status!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/30">
                <h4 className="font-extrabold text-amber-300">🇸🇪 1-Click Swedish Aktivitetsrapport</h4>
                <p className="text-amber-100/80 mt-1">
                  Click <strong>🇸🇪 Generera Aktivitetsrapport (Arbetsförmedlingen)</strong> in your Application Tracker. JobseekeR™ formats your monthly applied jobs into a clean report ready to copy into Arbetsförmedlingen!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Mobile PWA Install */}
        {guideTab === "pwa" && (
          <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
            <h3 className="text-lg font-extrabold text-amber-300">
              📱 Installing JobseekeR™ on iPhone, Android, Mac &amp; Laptop
            </h3>
            <p className="text-amber-100/90">
              JobseekeR™ is a Progressive Web App (PWA) that installs directly on your device with 1 click without needing app stores!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/30">
                <h4 className="font-extrabold text-amber-300">📱 iPhone &amp; iPad (Safari)</h4>
                <p className="text-amber-100/80 mt-1">
                  Open Safari → Tap <strong>Share</strong> → Tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>. Creates a native fullscreen app icon on your iPhone!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/30">
                <h4 className="font-extrabold text-amber-300">🤖 Android Phones (Chrome)</h4>
                <p className="text-amber-100/80 mt-1">
                  Open Chrome → Tap the banner <strong>&ldquo;Install JobseekeR App&rdquo;</strong>. Installs like a native Android app.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/30 col-span-1 sm:col-span-2">
                <h4 className="font-extrabold text-amber-300">💻 Mac &amp; Windows Laptops</h4>
                <p className="text-amber-100/80 mt-1">
                  Open Chrome, Edge, or Safari → Click the <strong>&ldquo;Install App&rdquo;</strong> icon in the address bar. Installs into your Mac Applications folder or Windows Start menu!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-amber-500/30 flex items-center justify-between">
          <p className="text-[11px] text-amber-300/80 font-bold">JobseekeR™ OS v1.0 • MIT Open Source</p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs uppercase tracking-wider shadow-md transition cursor-pointer"
          >
            Got It! Return to Platform 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
