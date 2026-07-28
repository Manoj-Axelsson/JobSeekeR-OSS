"use client";

import { useState } from "react";

interface Candidate {
  id: string;
  name: string;
  role: string;
  company: string;
  location: string;
  matchScore: number;
  skills: string[];
  experience: string;
  availability: string;
  avatar: string;
  featured?: boolean;
}

const SAMPLE_TALENT: Candidate[] = [
  {
    id: "1",
    name: "Elena Rostova",
    role: "Staff AI/ML Engineer",
    company: "Ex-DeepMind",
    location: "Stockholm, Sweden (Remote)",
    matchScore: 98,
    skills: ["Python", "PyTorch", "LLMs", "Distributed Systems", "Kubernetes"],
    experience: "9+ yrs exp",
    availability: "Immediate",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    featured: true,
  },
  {
    id: "2",
    name: "Marcus Vance",
    role: "Principal Frontend Architect",
    company: "Ex-Stripe",
    location: "London, UK (Hybrid)",
    matchScore: 95,
    skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Web Performance"],
    experience: "11+ yrs exp",
    availability: "2 Weeks Notice",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    featured: true,
  },
  {
    id: "3",
    name: "Aria Chen",
    role: "Lead Product Designer",
    company: "Ex-Figma",
    location: "San Francisco, CA (Remote)",
    matchScore: 93,
    skills: ["Design Systems", "UI/UX", "Prototyping", "User Research", "Figma"],
    experience: "8+ yrs exp",
    availability: "Immediate",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "4",
    name: "Devon Lindqvist",
    role: "Senior Backend & Infrastructure Lead",
    company: "Ex-Spotify",
    location: "Gothenburg, Sweden (Remote)",
    matchScore: 91,
    skills: ["Go", "Rust", "Kafka", "PostgreSQL", "Cloud Native"],
    experience: "7+ yrs exp",
    availability: "1 Month Notice",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "5",
    name: "Sophia Martinez",
    role: "Head of Engineering",
    company: "Ex-Revolut",
    location: "Berlin, Germany (Hybrid)",
    matchScore: 89,
    skills: ["Engineering Leadership", "System Design", "Agile", "Scaling Teams"],
    experience: "14+ yrs exp",
    availability: "Negotiable",
    avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "6",
    name: "Kaito Tanaka",
    role: "Senior DevOps & Platform Engineer",
    company: "Ex-Datadog",
    location: "Tokyo, Japan (Remote)",
    matchScore: 87,
    skills: ["Terraform", "AWS", "Docker", "CI/CD Pipelines", "Observability"],
    experience: "6+ yrs exp",
    availability: "Immediate",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [savedCandidates, setSavedCandidates] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"directory" | "analytics" | "matrix">("directory");

  const allSkills = Array.from(
    new Set(SAMPLE_TALENT.flatMap((c) => c.skills))
  ).slice(0, 8);

  const filteredTalent = SAMPLE_TALENT.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSkill = selectedSkill ? c.skills.includes(selectedSkill) : true;
    return matchesSearch && matchesSkill;
  });

  const toggleSave = (id: string) => {
    setSavedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Background Radial Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-500 via-cyan-400 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <svg className="w-6 h-6 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-linear-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                Atlas Talent Navigator
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v3.0 AI
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab("directory")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "directory"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
            >
              Talent Directory
            </button>
            <button
              onClick={() => setActiveTab("matrix")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "matrix"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
            >
              Skills Matrix
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "analytics"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
            >
              Market Insights
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-400">Saved Candidates</div>
              <div className="text-sm font-semibold text-indigo-400">{savedCandidates.size} Bookmarked</div>
            </div>
            <button className="px-4 py-2 text-sm font-semibold rounded-xl bg-linear-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-slate-950 shadow-md shadow-indigo-500/20 transition-all active:scale-95">
              + Post Role
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Real-time Technical Talent Match Index
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Navigate Global Talent <br className="hidden sm:inline" />
            <span className="bg-linear-to-r from-indigo-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">
              With AI Precision
            </span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            Discover verified senior engineers, designers, and tech leaders benchmarked against your tech stack, team dynamics, and hiring criteria.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl shadow-slate-950 backdrop-blur-xl mb-12">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by role, name, or skill (e.g. PyTorch, Staff Engineer, Next.js)..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
            {selectedSkill && (
              <button
                onClick={() => setSelectedSkill(null)}
                className="px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-2 hover:bg-indigo-500/20"
              >
                Filtered: {selectedSkill} ✕
              </button>
            )}
          </div>

          {/* Quick Skill Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400 mr-2">Top Skills:</span>
            {allSkills.map((skill) => (
              <button
                key={skill}
                onClick={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${selectedSkill === skill
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                  }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "directory" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Candidate Profiles
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {filteredTalent.length} matches
                </span>
              </h2>
            </div>

            {/* Talent Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTalent.map((candidate) => {
                const isSaved = savedCandidates.has(candidate.id);
                return (
                  <div
                    key={candidate.id}
                    className="group bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={candidate.avatar}
                            alt={candidate.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-700/80 group-hover:border-indigo-400 transition-colors"
                          />
                          <div>
                            <h3 className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                              {candidate.name}
                            </h3>
                            <p className="text-xs text-slate-400">{candidate.company}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleSave(candidate.id)}
                          className={`p-2 rounded-xl border transition-all ${isSaved
                              ? "bg-indigo-500/20 border-indigo-500 text-indigo-400"
                              : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                            }`}
                          title={isSaved ? "Remove bookmark" : "Bookmark candidate"}
                        >
                          <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                      </div>

                      {/* Role & Match Badge */}
                      <div className="flex items-center justify-between mb-3 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/60">
                        <span className="text-xs font-semibold text-slate-200 truncate">{candidate.role}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                          {candidate.matchScore}% Match
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center justify-between mb-4 px-1">
                        <span>📍 {candidate.location}</span>
                        <span>⏳ {candidate.availability}</span>
                      </div>

                      {/* Skill Pills */}
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {candidate.skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/70 border border-slate-700/60 text-slate-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-800/60">
                      <button className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors">
                        View Profile
                      </button>
                      <button className="flex-1 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-colors">
                        Connect
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "matrix" && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Skills Matrix & Benchmark Analysis</h3>
            <p className="text-slate-400 text-sm mb-6">
              Compare candidate skill coverage directly against your team&apos;s architecture requirements (e.g. Distributed Systems vs Frontend Performance).
            </p>
            <div className="space-y-4 text-left">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>AI / Machine Learning Engineering</span>
                  <span className="text-indigo-400">92% Supply Match</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-[92%] rounded-full"></div>
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Cloud & Platform Infrastructure</span>
                  <span className="text-cyan-400">86% Supply Match</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full w-[86%] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
              <div className="text-xs text-slate-400 mb-1">Average Time to Hire</div>
              <div className="text-3xl font-extrabold text-white mb-2">12.4 Days</div>
              <div className="text-xs text-emerald-400">↓ 35% faster than tech industry benchmark</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
              <div className="text-xs text-slate-400 mb-1">Vetted Candidates</div>
              <div className="text-3xl font-extrabold text-white mb-2">48,200+</div>
              <div className="text-xs text-indigo-400">Verified GitHub & System Design records</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
              <div className="text-xs text-slate-400 mb-1">Offer Acceptance Rate</div>
              <div className="text-3xl font-extrabold text-white mb-2">94.2%</div>
              <div className="text-xs text-cyan-400">Aligned with market salary expectations</div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500 relative z-10">
        <p>© 2026 Atlas Talent Navigator. Powered by Next.js & Tailwind CSS v4.</p>
      </footer>
    </div>
  );
}
