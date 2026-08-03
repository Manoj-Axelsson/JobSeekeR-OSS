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
  "sap", "embedded", "linux", "autosar", "plc", "scada", "robotics"
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
  if (titleLower.includes("developer") || titleLower.includes("engineer") || titleLower.includes("fullstack") || titleLower.includes("system") || titleLower.includes("quality") || titleLower.includes("manufacturing") || titleLower.includes("architect") || titleLower.includes("automation")) {
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

  if (domainScores.software >= 30) {
    whyMatched.push("Strong alignment with your Software Engineering competencies. You demonstrate hands-on capability in software development and clean architecture.");
    keyStrengthsToLeadWith.push("Software Engineering & Modular Architecture");
  }
  if (domainScores.systems >= 30) {
    whyMatched.push("Excellent fit for your Systems Engineering & Requirements Management background. The role demands structured systems thinking and lifecycle management.");
    keyStrengthsToLeadWith.push("Systems Engineering & Requirements Management");
  }
  if (domainScores.quality >= 30) {
    whyMatched.push("Direct match for your Quality Assurance and Quality Engineering experience (Six Sigma, DMAIC, FMEA, continuous improvement).");
    keyStrengthsToLeadWith.push("Quality Assurance & Data-Driven Process Quality Improvement");
  }
  if (domainScores.industrial >= 30) {
    whyMatched.push("Strong relevance to your Industrial & Manufacturing background (Automation, Lean production, CAD/CAM, assembly optimization).");
    keyStrengthsToLeadWith.push("Industrial Automation & Production Operations Experience");
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

  // Contextual Cover Letter Pitch Strategy
  const matchedSkillsList = matchedSkills.length > 0 ? matchedSkills.slice(0, 4).join(", ") : "technical problem solving";
  const openingHook = `As a candidate with a strong background in ${userHeadline || "Engineering"}, I am highly motivated by the ${title} position. My proven track record in ${matchedSkillsList} directly aligns with your technical and operational requirements.`;

  const gapMitigationStrategy = missingSkills.length > 0
    ? `For missing competencies (${missingSkills.slice(0, 3).join(", ")}), emphasize your rapid technical adaptability, fast learning curve, and cross-domain engineering foundation.`
    : "Emphasize how your technical background allows you to contribute immediately without onboarding delays.";

  // Dynamic Bullet Points based on matched domains & skills
  const suggestedBulletPoints: string[] = [];

  if (domainScores.industrial >= 30) {
    const indSkills = matchedSkills.filter(s => ["automation", "manufacturing", "assembly", "cad", "cam", "lean", "plant"].some(k => s.toLowerCase().includes(k))).join(", ") || "automation & production engineering";
    suggestedBulletPoints.push(
      `Automation & Production Operations: Applied ${indSkills} to optimize throughput, maintain operational reliability, and streamline assembly workflows.`
    );
  }

  if (domainScores.quality >= 30) {
    const qualSkills = matchedSkills.filter(s => ["quality", "qa", "sigma", "fmea", "lean", "audit", "validation"].some(k => s.toLowerCase().includes(k))).join(", ") || "quality engineering";
    suggestedBulletPoints.push(
      `Quality Assurance & Process Control: Utilized ${qualSkills} methodology to eliminate bottlenecks, ensure ISO/industry compliance, and drive continuous process improvement.`
    );
  }

  if (domainScores.systems >= 30) {
    const sysSkills = matchedSkills.filter(s => ["systems", "requirement", "validation", "verification", "architecture"].some(k => s.toLowerCase().includes(k))).join(", ") || "systems engineering";
    suggestedBulletPoints.push(
      `Systems Engineering & Requirements Management: Managed ${sysSkills} and technical specifications across complex multi-disciplinary lifecycles.`
    );
  }

  if (domainScores.software >= 30) {
    const softSkills = matchedSkills.filter(s => ["react", "typescript", "next", "node", "sql", "git", "python", "docker"].some(k => s.toLowerCase().includes(k))).join(", ") || "modern software engineering";
    suggestedBulletPoints.push(
      `Software Engineering & Tooling: Built scalable software applications using ${softSkills} with clean modular architecture.`
    );
  }

  // Fallback bullet point if domain score matches were generic
  if (suggestedBulletPoints.length === 0) {
    suggestedBulletPoints.push(
      `Technical Execution & Problem Solving: Leveraged ${matchedSkillsList} to deliver measurable outcomes in high-rigor engineering environments.`
    );
    suggestedBulletPoints.push(
      `Cross-Functional Collaboration: Translated complex operational and client requirements into clear, actionable technical specifications.`
    );
  }

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
        suggestedBulletPoints: suggestedBulletPoints.slice(0, 3),
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
