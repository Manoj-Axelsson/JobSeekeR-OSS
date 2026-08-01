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
  const [name, setName] = useState("JobseekeR User");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative text-slate-100">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
              {step}
            </div>
            <span className="text-sm font-bold text-slate-200">
              {step === 1 && "Basic Profile Details"}
              {step === 2 && "CV & Competence Upload"}
              {step === 3 && "Job Match Threshold & Target Roles"}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-semibold">Step {step} of 3</span>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Welcome to JobseekeR™!</h2>
            <p className="text-xs text-slate-400">
              Let&apos;s set up your profile to match job postings from Sweden&apos;s Arbetsförmedlingen API.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Professional Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Preferred Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
              >
                Next: Upload CV →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Upload Your CV &amp; Certificates</h2>
            <p className="text-xs text-slate-400">
              JobseekeR™ will automatically extract your technical skills to improve match accuracy.
            </p>

            <DocumentUploader />

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
              >
                Next: Roles &amp; Threshold →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Target Roles &amp; Match Threshold</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Target Job Titles (comma separated)
              </label>
              <textarea
                value={targetRolesText}
                onChange={(e) => setTargetRolesText(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Minimum Match Score Threshold
                </label>
                <span className="text-sm font-bold text-indigo-400">{minMatchScore}%</span>
              </div>
              <input
                type="range"
                min={30}
                max={90}
                step={5}
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Only job postings matching {minMatchScore}% or higher will appear in your daily feed.
              </p>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm"
              >
                ← Back
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all"
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
