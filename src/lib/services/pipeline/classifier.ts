export interface OccupationCandidate {
  title: string;
  ssykCode?: string;
  confidence: number; // 0.0 to 1.0
}

const OCCUPATION_MAP: Record<string, { ssyk: string; keywords: string[] }> = {
  "Software Engineer / Fullstack Developer": {
    ssyk: "2512",
    keywords: ["software", "fullstack", "frontend", "backend", "web developer", "react", "typescript", "node", "systemutvecklare", "mjukvaruutvecklare"],
  },
  "DevOps & Infrastructure Engineer": {
    ssyk: "2513",
    keywords: ["devops", "infrastructure", "cloud", "aws", "azure", "kubernetes", "docker", "sysadmin", "driftsingenjör"],
  },
  "Systems & Solutions Engineer": {
    ssyk: "2151",
    keywords: ["systems engineer", "systemarkitekt", "solution architect", "requirements engineer", "valideringsingenjör", "systems architecture"],
  },
  "Industrial Automation Engineer": {
    ssyk: "2144",
    keywords: ["automation", "automation engineer", "automationsingenjör", "plc", "scada", "cnc", "cad/cam", "robotik", "processingenjör"],
  },
  "Quality & Process Assurance Engineer": {
    ssyk: "2149",
    keywords: ["quality engineer", "kvaltetsingenjör", "qa", "six sigma", "lean", "dmaic", "fmea", "iso 9001", "provningsingenjör"],
  },
  "Production & Manufacturing Developer": {
    ssyk: "2141",
    keywords: ["production developer", "produktionsutvecklare", "manufacturing engineer", "production engineer", "monteringsledare", "industry 4.0"],
  },
};

/**
 * Classifies raw job title into candidate occupation mappings with confidence scores.
 * Pragmatic, deterministic first implementation as requested in ADR-004.
 */
export function classifyOccupation(title: string, description: string = ""): OccupationCandidate[] {
  const text = `${title} ${description}`.toLowerCase();
  const candidates: OccupationCandidate[] = [];

  for (const [occTitle, config] of Object.entries(OCCUPATION_MAP)) {
    let hits = 0;
    for (const kw of config.keywords) {
      if (text.includes(kw)) {
        hits++;
      }
    }

    if (hits > 0) {
      // Calculate confidence based on keyword density
      const rawRatio = hits / Math.min(config.keywords.length, 4);
      const confidence = Math.min(0.95, Math.max(0.40, parseFloat((rawRatio * 0.85 + 0.15).toFixed(2))));
      
      candidates.push({
        title: occTitle,
        ssykCode: config.ssyk,
        confidence,
      });
    }
  }

  // Sort descending by confidence
  candidates.sort((a, b) => b.confidence - a.confidence);

  // Fallback if no specific category matched
  if (candidates.length === 0) {
    candidates.push({
      title: title || "General Engineering Vacancy",
      ssykCode: "2149",
      confidence: 0.50,
    });
  }

  return candidates.slice(0, 3);
}
