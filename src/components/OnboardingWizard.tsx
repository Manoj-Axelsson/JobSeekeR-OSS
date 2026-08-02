"use client";

import { useState } from "react";
import { DocumentUploader } from "./DocumentUploader";

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingWizard({ isOpen, onClose, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("Manoj John Axelsson");
  const [headline, setHeadline] = useState("Software & Systems Engineer");
  const [location, setLocation] = useState("Sweden");
  const [targetRolesText, setTargetRolesText] = useState("Fullstack Developer, Systems Engineer, Software Architect, Quality Engineer");
  const [minMatchScore, setMinMatchScore] = useState(50);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = async () => {
    setSaving(true);
    const targetRoles = targetRolesText
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          headline,
          location,
          targetRoles,
          minMatchScore,
        }),
      });

      onComplete();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border-2 border-amber-400/70 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative text-amber-100 space-y-6">
        {/* Header & Step Indicator */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 font-black flex items-center justify-center text-lg shadow-md">
              {step}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-300 uppercase tracking-wide">
                JobseekeR™ Guided Onboarding
              </h2>
              <p className="text-xs sm:text-sm text-amber-200/90 font-bold mt-0.5">
                {step === 1 && "Step 1 of 5: Welcome & Profile Identity"}
                {step === 2 && "Step 2 of 5: Document Intelligence & CV Upload"}
                {step === 3 && "Step 3 of 5: Target Roles & Score Threshold"}
                {step === 4 && "Step 4 of 5: 12:00 PM Scanner & Direct URL Importer"}
                {step === 5 && "Step 5 of 5: 8-Pillar Intelligence Suite & PWA Installation"}
              </p>
            </div>
          </div>
          <span className="text-xs sm:text-sm font-black text-amber-400/90 bg-amber-950/80 border border-amber-500/30 px-3 py-1 rounded-full">
            Step {step} / 5
          </span>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-amber-500/20">
          <div
            className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 h-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>

        {/* Step 1: Welcome & Identity */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-400/40">
              <p className="text-xs sm:text-sm text-amber-200 font-extrabold italic">
                &ldquo;JobseekeR™ is an intelligence platform built to automate job searching.&rdquo;
              </p>
              <p className="text-xs text-amber-100/80 mt-1">
                Let&apos;s set up your profile to score real-time job postings from Sweden&apos;s Arbetsförmedlingen JobTech API!
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                Full Candidate Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-4 py-2.5 text-sm text-amber-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                Professional Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-4 py-2.5 text-sm text-amber-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                Location in Sweden
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-4 py-2.5 text-sm text-amber-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs uppercase tracking-wider shadow-md transition cursor-pointer"
              >
                Next: Document Intelligence &amp; CV Upload →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Document Intelligence */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-amber-300">📄 Document Intelligence &amp; Skill Extraction</h3>
            <p className="text-xs text-amber-100/80">
              Upload your PDF/Word CVs and competence certificates. JobseekeR™ will automatically extract your technical skills into your profile taxonomy.
            </p>

            <DocumentUploader />

            <div className="pt-3 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-amber-950/80 text-amber-300 font-bold text-xs border border-amber-500/30"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs uppercase tracking-wider shadow-md transition cursor-pointer"
              >
                Next: Target Roles &amp; Threshold →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Target Roles & Threshold */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-amber-300">🎯 Target Roles &amp; Minimum Match Threshold</h3>

            <div>
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                Target Job Titles (comma separated)
              </label>
              <textarea
                value={targetRolesText}
                onChange={(e) => setTargetRolesText(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-4 py-2.5 text-sm text-amber-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Minimum Match Score Threshold
                </label>
                <span className="text-sm font-bold text-amber-400">{minMatchScore}%</span>
              </div>
              <input
                type="range"
                min={30}
                max={90}
                step={5}
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <p className="text-[11px] text-amber-200/70 mt-1">
                Only job ads matching {minMatchScore}% or higher will appear in your daily feed.
              </p>
            </div>

            <div className="pt-3 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl bg-amber-950/80 text-amber-300 font-bold text-xs border border-amber-500/30"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs uppercase tracking-wider shadow-md transition cursor-pointer"
              >
                Next: 12:00 PM Scanner &amp; Importer →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Scanner & Direct URL Importer Guide */}
        {step === 4 && (
          <div className="space-y-4 text-xs sm:text-sm">
            <h3 className="text-lg font-extrabold text-amber-300">⚡ Automated 12:00 PM Scanner &amp; URL Importer</h3>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-400/40">
                <h4 className="font-extrabold text-amber-300">🏛️ Daily 12:00 PM Swedish Job Scanner</h4>
                <p className="text-amber-100/80 text-xs mt-1">
                  Every day at 12:00 PM, JobseekeR™ scans Arbetsförmedlingen JobTech API, calculates match scores, and updates your feed automatically.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-400/40">
                <h4 className="font-extrabold text-amber-300">🔗 1-Click Direct Job Link Importer</h4>
                <p className="text-amber-100/80 text-xs mt-1">
                  Have a job link from LinkedIn, Platsbanken, or a company site? Paste it into <strong>&ldquo;🔗 Importera Direkt Jobblänk&rdquo;</strong> to extract text and score it instantly!
                </p>
              </div>
            </div>

            <div className="pt-3 flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-xl bg-amber-950/80 text-amber-300 font-bold text-xs border border-amber-500/30"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(5)}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs uppercase tracking-wider shadow-md transition cursor-pointer"
              >
                Next: Intelligence Suite &amp; PWA →
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Intelligence Suite & Mobile PWA Installation */}
        {step === 5 && (
          <div className="space-y-4 text-xs sm:text-sm">
            <h3 className="text-lg font-extrabold text-amber-300">🤖 Intelligence Suite &amp; Mobile PWA Installation</h3>

            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-400/40 space-y-2">
              <h4 className="font-extrabold text-amber-300">📱 Mobile &amp; Laptop PWA Installation</h4>
              <p className="text-amber-100/80 text-xs">
                Tap <strong>Share → &ldquo;Add to Home Screen&rdquo;</strong> on iPhone, or click <strong>&ldquo;Install App&rdquo;</strong> in Chrome on Android/Mac/Windows to install JobseekeR™ with 1 click!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-400/40 space-y-2">
              <h4 className="font-extrabold text-amber-300">🤖 8-Pillar Intelligence Suite</h4>
              <p className="text-amber-100/80 text-xs">
                Unlock Recruiter Analytics, Company Callback Ratios, Swedish Salary Parsing, Upskilling ROIs, and Predictive Interview Probabilities!
              </p>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(4)}
                className="px-4 py-2 rounded-xl bg-amber-950/80 text-amber-300 font-bold text-xs border border-amber-500/30"
              >
                ← Back
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 hover:scale-105 text-amber-950 font-black text-xs uppercase tracking-wider shadow-xl transition cursor-pointer"
              >
                {saving ? "Saving Profile..." : "Complete Setup & Launch JobseekeR™ 🚀"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
