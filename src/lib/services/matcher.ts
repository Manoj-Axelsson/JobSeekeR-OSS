export interface MatchResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  domainScores: {
    software: number;
    systems: number;
    quality: number;
    industrial: number;
  };
}

const TAXONOMY = {
  software: [
    "react", "typescript", "next.js", "nextjs", "node.js", "nodejs", "express", 
    "postgresql", "postgres", "sql", "rest", "api", "git", "github", "frontend", 
    "fullstack", "web", "tailwind", "vercel", "render", "javascript", "developer",
    "software engineer", "frontend developer", "backend"
  ],
  systems: [
    "systems engineering", "systems engineer", "systems thinking", "software architecture", 
    "system architecture", "requirements engineering", "requirement engineer", 
    "requirements management", "validation", "verification", "technical documentation", 
    "plm", "business analyst", "system analyst", "lifecycle", "specification"
  ],
  quality: [
    "six sigma", "lean", "dmaic", "fmea", "poka-yoke", "root cause", "quality assurance", 
    "qa", "process optimization", "standard work", "continuous improvement", "validation", 
    "quality engineer", "test engineer", "verification engineer", "iso 9001", "audit"
  ],
  industrial: [
    "manufacturing", "manufacturing engineer", "production developer", "production engineer", 
    "industrial digitalization", "industry 4.0", "automation", "automation engineer", 
    "cnc", "cad", "cam", "cad/cam", "preventive maintenance", "uptime", "plant", "factory", "assembly"
  ]
};

export function evaluateJobMatch(title: string, description: string): MatchResult {
  const text = `${title} ${description}`.toLowerCase();
  
  const matchedSet = new Set<string>();
  const missingSet = new Set<string>();
  
  const domainScores = {
    software: calculateDomainScore(text, TAXONOMY.software, matchedSet, missingSet),
    systems: calculateDomainScore(text, TAXONOMY.systems, matchedSet, missingSet),
    quality: calculateDomainScore(text, TAXONOMY.quality, matchedSet, missingSet),
    industrial: calculateDomainScore(text, TAXONOMY.industrial, matchedSet, missingSet),
  };

  // Weighted overall match score calculation
  const maxDomainScore = Math.max(
    domainScores.software, 
    domainScores.systems, 
    domainScores.quality, 
    domainScores.industrial
  );
  
  const avgDomainScore = (domainScores.software + domainScores.systems + domainScores.quality + domainScores.industrial) / 4;

  // Title bonus matching
  let titleBonus = 0;
  const titleLower = title.toLowerCase();
  if (titleLower.includes("developer") || titleLower.includes("engineer") || titleLower.includes("fullstack") || titleLower.includes("system") || titleLower.includes("quality") || titleLower.includes("manufacturing")) {
    titleBonus = 15;
  }

  const rawScore = Math.round((maxDomainScore * 0.6) + (avgDomainScore * 0.25) + titleBonus);
  const matchScore = Math.min(100, Math.max(20, rawScore));

  return {
    matchScore,
    matchedSkills: Array.from(matchedSet).slice(0, 10),
    missingSkills: Array.from(missingSet).slice(0, 5),
    domainScores,
  };
}

function calculateDomainScore(
  text: string, 
  keywords: string[], 
  matchedSet: Set<string>, 
  missingSet: Set<string>
): number {
  let count = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) {
      count++;
      matchedSet.add(capitalize(kw));
    }
  }
  
  // Calculate percentage of domain matched
  const ratio = count / Math.min(keywords.length, 8);
  return Math.min(100, Math.round(ratio * 100));
}

function capitalize(str: string): string {
  return str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
