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
  analysis: {
    whyMatched: string[];
    whatLacking: string[];
    coverLetterPitch: {
      openingHook: string;
      keyStrengthsToLeadWith: string[];
      gapMitigationStrategy: string;
      suggestedBulletPoints: string[];
    };
  };
}

const TAXONOMY = {
  software: [
    "react", "typescript", "next.js", "nextjs", "node.js", "nodejs", "express", 
    "postgresql", "postgres", "sql", "rest", "api", "git", "github", "frontend", 
    "fullstack", "web", "tailwind", "vercel", "render", "javascript", "developer",
    "software engineer", "frontend developer", "backend", "cloud", "aws", "azure", 
    "gcp", "kubernetes", "docker", "python", "terraform", "devops", "infrastructure"
  ],
  systems: [
    "systems engineering", "systems engineer", "systems thinking", "software architecture", 
    "system architecture", "requirements engineering", "requirement engineer", 
    "requirements management", "validation", "verification", "technical documentation", 
    "plm", "business analyst", "system analyst", "lifecycle", "specification", "solutions engineer"
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

// Common tech keywords to detect missing skills
const EXTERNAL_TECH = [
  "docker", "kubernetes", "k8s", "aws", "azure", "gcp", "cloud", "python", "c++", "c#", 
  "java", "go", "rust", "graphql", "kafka", "redis", "mongodb", "jira", "confluence", 
  "scrum", "agile", "devops", "ci/cd", "microservices", "cybersecurity", "iso 13485", 
  "sap", "embedded", "linux", "autosar"
];

export function evaluateJobMatch(
  title: string, 
  description: string, 
  customProfileSkills: string[] = [],
  userName: string = "JobseekeR Candidate",
  userHeadline: string = "Software & Systems Engineer"
): MatchResult {
  const text = `${title} ${description}`.toLowerCase();
  
  const matchedSet = new Set<string>();
  const missingSet = new Set<string>();
  
  const domainScores = {
    software: calculateDomainScore(text, TAXONOMY.software, matchedSet, missingSet),
    systems: calculateDomainScore(text, TAXONOMY.systems, matchedSet, missingSet),
    quality: calculateDomainScore(text, TAXONOMY.quality, matchedSet, missingSet),
    industrial: calculateDomainScore(text, TAXONOMY.industrial, matchedSet, missingSet),
  };

  // Evaluate any custom skills uploaded via CV or user profile
  let customSkillsMatchedCount = 0;
  if (customProfileSkills && customProfileSkills.length > 0) {
    for (const skill of customProfileSkills) {
      const sLower = skill.toLowerCase().trim();
      if (sLower && text.includes(sLower)) {
        customSkillsMatchedCount++;
        matchedSet.add(capitalize(skill));
      }
    }
  }

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
  if (titleLower.includes("developer") || titleLower.includes("engineer") || titleLower.includes("fullstack") || titleLower.includes("system") || titleLower.includes("quality") || titleLower.includes("manufacturing") || titleLower.includes("architect")) {
    titleBonus = 15;
  }

  const customSkillsBonus = Math.min(30, customSkillsMatchedCount * 8);

  const rawScore = Math.round((maxDomainScore * 0.5) + (avgDomainScore * 0.2) + titleBonus + customSkillsBonus);
  const matchScore = Math.min(100, Math.max(20, rawScore));

  // Detect external missing skills mentioned in description
  for (const tech of EXTERNAL_TECH) {
    if (text.includes(tech)) {
      // Check if it's already in matched set
      const isMatched = Array.from(matchedSet).some(m => m.toLowerCase() === tech);
      if (!isMatched) {
        missingSet.add(capitalize(tech));
      }
    }
  }

  const matchedSkills = Array.from(matchedSet).slice(0, 10);
  const missingSkills = Array.from(missingSet).slice(0, 6);

  // Generate Narrative Analysis for Cover Letter & Pitch Strategy
  const whyMatched: string[] = [];
  const whatLacking: string[] = [];
  const keyStrengthsToLeadWith: string[] = [];

  if (domainScores.software >= 40) {
    whyMatched.push("Strong alignment with your Fullstack Software Engineering skills (React, TypeScript, Next.js, Node.js, PostgreSQL). You demonstrate hands-on experience building maintainable applications with clean architecture.");
    keyStrengthsToLeadWith.push("Fullstack development with React, TypeScript & Next.js");
  }
  if (domainScores.systems >= 40) {
    whyMatched.push("Excellent fit for your Systems Engineering & Requirements Management background. The role demands structured systems thinking, specification management, and documentation-as-architecture.");
    keyStrengthsToLeadWith.push("Systems Engineering, Requirements Management & Lifecycle Thinking");
  }
  if (domainScores.quality >= 40) {
    whyMatched.push("Direct match for your Quality Assurance and Quality Engineering experience (Six Sigma, DMAIC, FMEA, Poka-Yoke, root cause analysis).");
    keyStrengthsToLeadWith.push("Quality Assurance & Data-Driven Process Quality Improvement");
  }
  if (domainScores.industrial >= 40) {
    whyMatched.push("Strong relevance to your Industrial & Manufacturing background (Lean production, CNC, CAD/CAM, preventive maintenance, uptime optimization).");
    keyStrengthsToLeadWith.push("Industrial Digitalization & Production Operations Experience");
  }

  if (whyMatched.length === 0) {
    whyMatched.push("General engineering and analytical relevance matching your broad technical background.");
    keyStrengthsToLeadWith.push("Cross-functional engineering problem solving and analytical adaptability");
  }

  // What is lacking analysis
  if (missingSkills.length > 0) {
    whatLacking.push(`Specific tools or technologies requested in the job posting that are not explicitly highlighted in your primary skill list: ${missingSkills.join(", ")}.`);
  } else {
    whatLacking.push("No critical skill gaps identified. Your technical profile covers the core requirements for this position.");
  }

  // Cover Letter Strategy
  const openingHook = `As a candidate with background in ${userHeadline || "Software & Systems Engineering"}, I am drawn to the ${title} role where technical rigor and system architecture drive measurable results.`;

  const gapMitigationStrategy = missingSkills.length > 0
    ? `For missing competencies (${missingSkills.slice(0, 3).join(", ")}), emphasize your rapid learning curve and how your core engineering foundation accelerates onboarding.`
    : "Emphasize how your dual software/systems background allows you to contribute immediately without onboarding delays.";

  const suggestedBulletPoints = [
    `Software & Systems Architecture: Applied React, TypeScript, Next.js, and Node.js within modular application structures (Bulletproof React architecture).`,
    `Quality & Process Engineering: Utilized systematic quality assurance tools and analytical methodology to eliminate bottlenecks and optimize workflows.`,
    `Cross-Functional Communication: Experienced at translating business and technical requirements into maintainable software and structured documentation.`
  ];

  return {
    matchScore,
    matchedSkills,
    missingSkills,
    domainScores,
    analysis: {
      whyMatched,
      whatLacking,
      coverLetterPitch: {
        openingHook,
        keyStrengthsToLeadWith,
        gapMitigationStrategy,
        suggestedBulletPoints,
      },
    },
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
  
  const ratio = count / Math.min(keywords.length, 8);
  return Math.min(100, Math.round(ratio * 100));
}

function capitalize(str: string): string {
  return str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
