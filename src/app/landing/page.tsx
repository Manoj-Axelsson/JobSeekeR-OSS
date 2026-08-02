"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { speakText } from "@/lib/services/tts";
import { translations, Language } from "@/lib/services/i18n";

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Language>("sv");

  const t = translations[selectedLang] || translations.sv;

  useEffect(() => {
    // Clean up audio on unmount
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleAudioListen = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setAudioPlaying(false);
      } else {
        setAudioPlaying(true);
        const speechLang = selectedLang === "en" ? "en-US" : selectedLang === "no" ? "no-NO" : selectedLang === "da" ? "da-DK" : "sv-SE";
        speakText(
          `${t.landingTitle}. ${t.landingDescription}`,
          speechLang
        );
      }
    }
  };

  return (
    <div
      style={{ fontFamily: 'Cochin, Georgia, Garamond, "Times New Roman", serif' }}
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#4f280a] via-[#a34e12] to-[#e6842c] text-amber-50 selection:bg-amber-300 selection:text-amber-950 flex flex-col"
    >
      {/* Animated Retro Pixel-Film-Strip Background Canvas Layer */}
      <div className="absolute inset-0 opacity-25 pointer-events-none overflow-hidden">
        {/* Animated Diagonal Film Strip Track 1 */}
        <div className="absolute -top-32 -left-32 w-[160%] h-32 bg-[#4a1f04]/60 border-y-4 border-dashed border-amber-400/40 rotate-[-12deg] animate-[slideTape_25s_linear_infinite] flex items-center space-x-12 px-8">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="w-16 h-20 border-2 border-amber-300/40 rounded flex items-center justify-center font-mono text-[10px] text-amber-200">
              [ 0{i + 1} ]
            </div>
          ))}
        </div>

        {/* Animated Diagonal Film Strip Track 2 */}
        <div className="absolute top-[35%] -left-32 w-[160%] h-40 bg-[#3d1802]/70 border-y-4 border-dotted border-amber-300/50 rotate-[-12deg] animate-[slideTapeReverse_30s_linear_infinite] flex items-center space-x-16 px-8">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="w-24 h-24 border-2 border-amber-400/50 rounded-lg p-2 font-mono text-[9px] text-amber-200 flex flex-col justify-between shadow-inner">
              <div className="w-full h-1 bg-amber-400/60"></div>
              <div className="w-3/4 h-1 bg-amber-400/40"></div>
              <div className="w-1/2 h-1 bg-amber-400/30"></div>
              <div className="text-right text-[8px]">JOBSEEKER</div>
            </div>
          ))}
        </div>

        {/* Animated Diagonal Timeline Ruler Track 3 */}
        <div className="absolute -bottom-20 -left-32 w-[160%] h-28 bg-[#522407]/60 border-t-4 border-amber-400/50 rotate-[-12deg] flex items-end justify-around px-8">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className={`bg-amber-300/60 ${i % 5 === 0 ? "h-12 w-1" : "h-6 w-0.5"}`}></div>
          ))}
        </div>
      </div>

      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#230f03]/85 border-b border-amber-500/30 px-4 md:px-8 py-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Prominent Title */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="flex items-center space-x-3">
              <span className="text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-md">
                JobseekeR<span className="text-amber-400 text-lg align-super font-bold">™</span>
              </span>
              <div className="hidden sm:inline-flex flex-col px-3 py-1 rounded-xl bg-[#361804]/90 border border-amber-400/60 shadow-md text-left">
                <span className="text-[11px] font-extrabold tracking-wide text-amber-300">Open Source Scanner</span>
                <span className="text-[10px] font-semibold text-amber-200/90 border-t border-amber-500/30 pt-0.5 mt-0.5">SE Job Tech API</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-bold text-amber-100 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <a
              href="#features"
              className="text-sm font-bold text-amber-200/80 hover:text-white transition-colors"
            >
              Capabilities
            </a>
            <a
              href="#open-source"
              className="text-sm font-bold text-amber-200/80 hover:text-white transition-colors"
            >
              Open Source
            </a>
            {/* Language Translator Dropdown Select (Swedish Default, English, Norwegian, Danish) */}
            <div className="bg-[#361603]/80 border border-amber-500/40 rounded-xl px-2 py-1 flex items-center">
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value as Language)}
                className="bg-transparent text-xs font-bold text-amber-200 focus:outline-none cursor-pointer"
                aria-label="Välj språk / Choose Language"
              >
                <option value="sv" className="bg-[#230f03] text-amber-100">🇸🇪 Svenska (Default)</option>
                <option value="en" className="bg-[#230f03] text-amber-100">🇬🇧 English</option>
                <option value="no" className="bg-[#230f03] text-amber-100">🇳🇴 Norsk</option>
                <option value="da" className="bg-[#230f03] text-amber-100">🇩🇰 Dansk</option>
              </select>
            </div>

            {/* Accessibility Audio TTS Button */}
            <button
              onClick={handleAudioListen}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                audioPlaying
                  ? "bg-amber-400 text-amber-950 border-amber-300 shadow-lg shadow-amber-400/30"
                  : "bg-amber-950/80 text-amber-200 border-amber-500/40 hover:bg-amber-900"
              }`}
              title="EU Accessibility: Read Page Summary Aloud"
            >
              🔊 {audioPlaying ? "Stoppa" : "Lyssna (Audio)"}
            </button>

            <Link
              href="/"
              className="px-5 py-2.5 text-sm font-bold text-amber-950 bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 hover:opacity-95 rounded-xl shadow-xl shadow-amber-950/40 transition-all border border-amber-200/60"
            >
              Launch App 🚀
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-amber-200 hover:text-white p-2"
            aria-label="Toggle menu"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-amber-500/30 flex flex-col gap-4">
            <Link href="/" className="text-sm font-bold text-amber-100">
              Dashboard
            </Link>
            <a href="#features" className="text-sm font-bold text-amber-200/80">
              Capabilities
            </a>
            <button
              onClick={handleAudioListen}
              className="text-left text-xs font-bold text-amber-300"
            >
              🔊 Lyssna på sammanfattning
            </button>
            <Link
              href="/"
              className="px-4 py-2.5 text-center text-sm font-bold text-amber-950 bg-amber-400 rounded-xl"
            >
              Launch App 🚀
            </Link>
          </div>
        )}
      </nav>

      {/* Main Hero Section */}
      <section className="relative z-10 pt-10 pb-20 px-4 md:px-8 max-w-6xl mx-auto text-center flex-1 flex flex-col justify-center items-center">
        {/* Prominent Official Mascot Logo Illustration Displayed Proportionately (Enlarged Size) */}
        <div className="mb-8 relative w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 to-orange-500/20 rounded-full blur-2xl animate-pulse pointer-events-none"></div>
          <img
            src="/logo.png"
            alt="JobseekeR Platform Logo"
            className="w-full h-full object-contain filter drop-shadow-2xl hover:scale-105 transition-transform duration-300 relative z-10"
          />
        </div>

        {/* Pulsing Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3d1803]/90 border border-amber-400/50 text-amber-300 text-xs font-bold tracking-wider uppercase mb-6 shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
          Direct API Connection to Arbetsförmedlingen JobTech
        </div>

        {/* Prominent Hero Title */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white leading-none drop-shadow-2xl">
          JobseekeR<span className="text-amber-400 text-3xl sm:text-4xl align-super font-bold">™</span>
        </h1>

        <h2 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-extrabold text-amber-200 tracking-tight max-w-4xl leading-tight">
          Automated Daily Swedish Job Scanner &amp; Competence Engine
        </h2>

        <p className="mt-6 text-lg sm:text-xl text-amber-100/90 max-w-2xl font-normal leading-relaxed">
          Evaluates real-time Swedish job postings daily at 12:00 PM against your uploaded CVs &amp; competence certificates, calculates weighted match scores, and maintains an automated 12-month rolling data archive.
        </p>

        {/* Hero Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/"
            className="w-full sm:w-auto px-8 py-4 text-lg font-black text-amber-950 bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 hover:scale-105 rounded-2xl shadow-2xl shadow-amber-950/60 transition-all border border-amber-200/60 text-center"
          >
            Launch JobseekeR™ Dashboard 🚀
          </Link>

          <Link
            href="/?onboarding=true"
            className="w-full sm:w-auto px-8 py-4 text-lg font-bold text-amber-100 bg-[#361603]/80 border-2 border-amber-400/50 hover:border-amber-300 hover:bg-[#4a1f05] rounded-2xl transition-all text-center backdrop-blur-md"
          >
            ⚙️ Onboarding Wizard
          </Link>
        </div>

        {/* Feature Showcase: Direct Job Link Importer (LinkedIn, Teamtailor, Workday, ATS) */}
        <div className="mt-14 w-full max-w-3xl mx-auto p-6 rounded-3xl bg-[#3a1803]/90 border-2 border-amber-400/60 shadow-2xl backdrop-blur-xl text-left">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center font-black text-amber-950 text-2xl shadow-md shrink-0">
              🔗
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Direct Job Link Importer (LinkedIn, Teamtailor, Workday, ATS)</h3>
              <p className="text-xs sm:text-sm text-amber-300/90 font-medium">
                Found a job posting on LinkedIn or any external career site? Paste any URL to parse &amp; score it instantly!
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              readOnly
              value="https://careers.example-company.com/jobs/fullstack-engineer"
              className="flex-1 bg-[#230f03] border border-amber-500/40 rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-amber-200 select-all focus:outline-none"
            />
            <Link
              href="/"
              className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-amber-950 font-black text-xs sm:text-sm rounded-xl transition shadow-lg flex items-center justify-center space-x-2 shrink-0"
            >
              <span>🚀 Try Importer in App</span>
            </Link>
          </div>
          <p className="mt-2.5 text-xs text-amber-200/70 font-medium italic">
            *Imports job details from external career pages, parses required competences, and calculates automated candidate match scores.
          </p>
        </div>

        {/* Feature Cards Grid (Amber Terracotta Retro Pixel Card Styling) */}
        <div id="features" className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left w-full">
          <div className="p-6 rounded-2xl bg-[#311403]/80 border-2 border-amber-500/40 backdrop-blur-md hover:border-amber-400 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center text-2xl mb-4 font-bold">
              🎯
            </div>
            <h3 className="text-xl font-extrabold text-white">Multi-Domain AI Matcher</h3>
            <p className="mt-2 text-sm text-amber-200/80 leading-relaxed">
              Evaluates Software, Systems Engineering, Quality Assurance (Six Sigma), and Manufacturing roles with weighted domain algorithms.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#311403]/80 border-2 border-amber-500/40 backdrop-blur-md hover:border-amber-400 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center text-2xl mb-4 font-bold">
              🔗
            </div>
            <h3 className="text-xl font-extrabold text-white">Direct URL Importer</h3>
            <p className="mt-2 text-sm text-amber-200/80 leading-relaxed">
              Import job postings directly from LinkedIn, Sellpy, Teamtailor, or corporate ATS portals to calculate instant candidate match scores.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#311403]/80 border-2 border-amber-500/40 backdrop-blur-md hover:border-amber-400 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center text-2xl mb-4 font-bold">
              📄
            </div>
            <h3 className="text-xl font-extrabold text-white">CV &amp; Certificate Extraction</h3>
            <p className="mt-2 text-sm text-amber-200/80 leading-relaxed">
              Upload PDF or text CVs and educational diplomas to automatically parse technical competences into your search taxonomy.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#311403]/80 border-2 border-amber-500/40 backdrop-blur-md hover:border-amber-400 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center text-2xl mb-4 font-bold">
              ⏱️
            </div>
            <h3 className="text-xl font-extrabold text-white">12-Month Auto Retention</h3>
            <p className="mt-2 text-sm text-amber-200/80 leading-relaxed">
              Automated data pruning service purges non-saved job ads older than 365 days, maintaining a clean 12-month rolling search database.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="open-source" className="relative z-10 border-t border-amber-500/30 py-8 px-4 text-center text-xs text-amber-200/70 bg-[#1c0c03]/80 backdrop-blur-md">
        <p>
          JobseekeR™ is Open Source software released under the <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noreferrer" className="underline hover:text-white">MIT License</a>.
        </p>
      </footer>

      {/* Tailwind Keyframe CSS Animations */}
      <style jsx global>{`
        @keyframes slideTape {
          0% { transform: translateX(0) rotate(-12deg); }
          100% { transform: translateX(-50%) rotate(-12deg); }
        }
        @keyframes slideTapeReverse {
          0% { transform: translateX(-50%) rotate(-12deg); }
          100% { transform: translateX(0) rotate(-12deg); }
        }
      `}</style>
    </div>
  );
}
