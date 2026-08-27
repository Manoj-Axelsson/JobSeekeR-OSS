/**
 * Phase 2 — Job Requirement Model Engine
 * JobSeekR Intelligence Framework v3.0
 *
 * Extracts structured, prioritized requirements from raw job postings.
 * Integrates Location Normalisation Gate:
 * Resolves `canonicalLocation` from title + description + metadata while preserving
 * `sourceLocation` metadata untouched.
 */

import { RequirementPriority } from "./contract";
import { resolveCanonicalLocation, CanonicalLocationResolution } from "./locationResolver";

export interface RequirementItem {
  id: string;
  name: string;
  category:
    | "CITIZENSHIP_WORK_AUTH"
    | "EDUCATION"
    | "CERTIFICATION"
    | "LANGUAGE"
    | "LOCATION"
    | "EXPERIENCE"
    | "SECURITY"
    | "TECHNOLOGY"
    | "SENIORITY"
    | "ROLE"
    | "OTHER";
  priority: RequirementPriority;
  rawText?: string;
  value?: string;
}

export interface StructuredJobRequirementModel {
  title: string;
  company: string;
  location: string; // Resolved canonical location
  locationResolution: CanonicalLocationResolution; // Preserves sourceLocation & details
  seniority: "Junior" | "Mid" | "Senior" | "Lead" | "Executive" | "Unspecified";
  coreWorkDescription: string;
  requirements: RequirementItem[];
  technologies: {
    required: string[];
    preferred: string[];
    desired: string[];
  };
  languages: {
    required: string[];
    preferred: string[];
  };
  citizenshipRequirements: {
    required: string[];
    preferred: string[];
  };
  experience: {
    minYears?: number;
    requiredArea?: string;
    level: "Junior" | "Mid" | "Senior" | "Any";
  };
  education: {
    priority: RequirementPriority;
    field?: string;
  };
  securityClearanceRequired: boolean;
  workingModel: "REMOTE" | "HYBRID" | "ON_SITE";
}

function normalizeLanguageName(raw: string): string {
  const clean = raw.trim().toLowerCase();
  if (clean === "svenska" || clean === "swedish") return "Swedish";
  if (clean === "engelska" || clean === "english") return "English";
  if (clean === "tyska" || clean === "german") return "German";
  if (clean === "franska" || clean === "french") return "French";
  if (clean === "spanska" || clean === "spanish") return "Spanish";
  if (clean === "finska" || clean === "finnish") return "Finnish";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function extractGenericLanguages(text: string): { required: string[]; preferred: string[]; reqItems: RequirementItem[] } {
  const required: string[] = [];
  const preferred: string[] = [];
  const reqItems: RequirementItem[] = [];
  const textLower = text.toLowerCase();

  const langPatterns = [
    /([a-zäöåA-ZÄÖÅ]+)\s+i\s+tal\s+och\s+skrift/g,
    /flytande\s+([a-zäöåA-ZÄÖÅ]+)/g,
    /krav\s+på\s+([a-zäöåA-ZÄÖÅ]+)/g,
    /skall-krav:\s*([a-zäöåA-ZÄÖÅ]+)/g,
    /must\s+speak\s+([a-zäöåA-ZÄÖÅ]+)/g,
    /fluent\s+in\s+([a-zäöåA-ZÄÖÅ]+)/g,
  ];

  const foundLangs = new Set<string>();

  for (const pattern of langPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(textLower)) !== null) {
      const candidateWord = match[1].trim();
      if (candidateWord.length >= 4 && !["god", "goda", "både", "samt", "eller", "säkerhet", "säkerhetsklassinplacering", "visst"].includes(candidateWord)) {
        foundLangs.add(candidateWord);
      }
    }
  }

  for (const rawLang of foundLangs) {
    const langName = normalizeLanguageName(rawLang);

    const langIndex = textLower.indexOf(rawLang.toLowerCase());
    const meriterandeIndex = textLower.indexOf("meriterande");
    const isPreferred = meriterandeIndex !== -1 && langIndex > meriterandeIndex;

    const priority: RequirementPriority = isPreferred ? "PREFERRED" : "REQUIRED";

    if (priority === "REQUIRED") {
      if (!required.includes(langName)) required.push(langName);
    } else {
      if (!preferred.includes(langName)) preferred.push(langName);
    }

    reqItems.push({
      id: `req-lang-${langName.toLowerCase()}`,
      name: `${langName} Language`,
      category: "LANGUAGE",
      priority,
      rawText: rawLang,
      value: langName,
    });
  }

  return { required, preferred, reqItems };
}

function extractGenericCitizenships(text: string): { required: string[]; preferred: string[]; reqItems: RequirementItem[] } {
  const required: string[] = [];
  const preferred: string[] = [];
  const reqItems: RequirementItem[] = [];
  const textLower = text.toLowerCase();

  const citizenshipPatterns = [
    /(us|american|usa)\s+citizen(?:ship)?/g,
    /(svenskt|swedish|se)\s+medborgarskap/g,
    /(german|deutsch)\s+citizenship/g,
    /(eu)\s+citizenship/g,
    /citizenship\s+required:\s*([a-zäöåA-ZÄÖÅ]+)/g,
  ];

  for (const pattern of citizenshipPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(textLower)) !== null) {
      const rawMatch = (match[1] || match[0]).toLowerCase();
      let isoCode = "OTHER";

      if (rawMatch.includes("us") || rawMatch.includes("american") || rawMatch.includes("usa")) {
        isoCode = "US";
      } else if (rawMatch.includes("svensk") || rawMatch.includes("swedish") || rawMatch === "se") {
        isoCode = "SE";
      } else if (rawMatch.includes("german") || rawMatch.includes("deutsch")) {
        isoCode = "DE";
      } else if (rawMatch.includes("eu")) {
        isoCode = "EU";
      } else {
        isoCode = rawMatch.toUpperCase();
      }

      const matchIndex = match.index;
      const meriterandeIndex = textLower.indexOf("meriterande");
      const preferredIndex = textLower.indexOf("preferred");

      const isPreferred =
        (meriterandeIndex !== -1 && matchIndex > meriterandeIndex) ||
        (preferredIndex !== -1 && matchIndex > preferredIndex);

      const priority: RequirementPriority = isPreferred ? "PREFERRED" : "REQUIRED";

      if (priority === "REQUIRED") {
        if (!required.includes(isoCode)) required.push(isoCode);
      } else {
        if (!preferred.includes(isoCode)) preferred.push(isoCode);
      }

      reqItems.push({
        id: `req-citizenship-${isoCode.toLowerCase()}`,
        name: `${isoCode} Citizenship Requirement`,
        category: "CITIZENSHIP_WORK_AUTH",
        priority,
        rawText: match[0],
        value: isoCode,
      });
    }
  }

  return { required, preferred, reqItems };
}

export function extractJobRequirements(
  title: string,
  description: string,
  rawLocation: string = "Sweden",
  company: string = "Employer"
): StructuredJobRequirementModel {
  const textLower = `${title} ${description}`.toLowerCase();
  const requirements: RequirementItem[] = [];

  // Location Normalisation Gate
  const locationResolution = resolveCanonicalLocation(title, description, rawLocation);
  const location = locationResolution.canonicalLocation;

  // 1. Detect Seniority
  let seniority: StructuredJobRequirementModel["seniority"] = "Unspecified";
  if (textLower.includes("junior") || textLower.includes("entry level") || textLower.includes("nyutexaminerad")) {
    seniority = "Junior";
  } else if (textLower.includes("senior") || textLower.includes("lead") || textLower.includes("principal")) {
    seniority = textLower.includes("lead") ? "Lead" : "Senior";
  } else if (textLower.includes("mid-level") || textLower.includes("erfaren")) {
    seniority = "Mid";
  }
  requirements.push({
    id: "req-seniority",
    name: `Seniority Level: ${seniority}`,
    category: "SENIORITY",
    priority: seniority === "Junior" ? "ACCEPTED" : "PREFERRED",
  });

  // 2. Generic Language Extraction
  const langExtraction = extractGenericLanguages(`${title} ${description}`);
  requirements.push(...langExtraction.reqItems);

  // 3. Generic Citizenship Extraction
  const citizenshipExtraction = extractGenericCitizenships(`${title} ${description}`);
  requirements.push(...citizenshipExtraction.reqItems);

  // Security Clearance Detection
  const securityClearanceRequired =
    textLower.includes("säkerhetsprövning") ||
    textLower.includes("security clearance") ||
    textLower.includes("registerkontroll") ||
    textLower.includes("skyddsobjekt");

  if (securityClearanceRequired) {
    requirements.push({
      id: "req-sec-clearance",
      name: "Security Clearance / Registerkontroll",
      category: "SECURITY",
      priority: "REQUIRED",
    });
  }

  // 4. Extract Technologies & Categorize
  const reqTech: { required: string[]; preferred: string[]; desired: string[] } = {
    required: [],
    preferred: [],
    desired: [],
  };

  const knownTech = [
    "react", "typescript", "javascript", "next.js", "nextjs", "node.js", "nodejs",
    "express", "postgresql", "postgres", "sql", "rest", "api", "git", "github",
    "python", "docker", "kubernetes", "aws", "azure", "gcp", "tailwind", "c#",
    "java", "c++", "plc", "cad", "cnc", "six sigma", "lean"
  ];

  const reqSection = textLower.includes("krav") || textLower.includes("requirements") ? textLower : "";
  const preferSection = textLower.includes("meriterande") || textLower.includes("nice to have") || textLower.includes("preferred") ? textLower : "";

  for (const tech of knownTech) {
    const displayTech = capitalizeTech(tech);
    if (!textLower.includes(tech)) continue;

    const isExplicitKrav =
      (reqSection.includes(`krav:`) || reqSection.includes("skall")) &&
      reqSection.indexOf(tech) !== -1 &&
      (preferSection === "" || reqSection.indexOf(tech) < (textLower.indexOf("meriterande") !== -1 ? textLower.indexOf("meriterande") : 999999));

    if (isExplicitKrav || (title.toLowerCase().includes(tech) && !textLower.includes(`meriterande: ${tech}`))) {
      reqTech.required.push(displayTech);
      requirements.push({
        id: `req-tech-${tech}`,
        name: displayTech,
        category: "TECHNOLOGY",
        priority: "REQUIRED",
      });
    } else if (textLower.includes(`meriterande`) && textLower.indexOf(tech) > textLower.indexOf("meriterande")) {
      reqTech.desired.push(displayTech);
      requirements.push({
        id: `req-tech-${tech}`,
        name: displayTech,
        category: "TECHNOLOGY",
        priority: "DESIRED",
      });
    } else {
      reqTech.preferred.push(displayTech);
      requirements.push({
        id: `req-tech-${tech}`,
        name: displayTech,
        category: "TECHNOLOGY",
        priority: "PREFERRED",
      });
    }
  }

  // 5. Working Model
  let workingModel: StructuredJobRequirementModel["workingModel"] = "ON_SITE";
  const isExplicitNoRemote =
    textLower.includes("inget distans") ||
    textLower.includes("ej distans") ||
    textLower.includes("no remote") ||
    textLower.includes("100% på plats");

  if (!isExplicitNoRemote && (textLower.includes("remote") || textLower.includes("distans") || textLower.includes("work from home"))) {
    workingModel = textLower.includes("hybrid") ? "HYBRID" : "REMOTE";
  } else if (textLower.includes("hybrid") || textLower.includes("flexibel arbetsplats")) {
    workingModel = "HYBRID";
  }

  // 6. Experience & Education
  let minYears: number | undefined = undefined;
  const yearsMatch = textLower.match(/(\d+)\+?\s*(?:års|years?)/);
  if (yearsMatch) {
    minYears = parseInt(yearsMatch[1], 10);
  }

  const eduPriority: RequirementPriority =
    textLower.includes("examen") || textLower.includes("degree") || textLower.includes("högskoleutbildning")
      ? textLower.includes("krav på examen") ? "REQUIRED" : "DESIRED"
      : "ACCEPTED";

  return {
    title,
    company,
    location,
    locationResolution,
    seniority,
    coreWorkDescription: title,
    requirements,
    technologies: reqTech,
    languages: {
      required: langExtraction.required,
      preferred: langExtraction.preferred,
    },
    citizenshipRequirements: {
      required: citizenshipExtraction.required,
      preferred: citizenshipExtraction.preferred,
    },
    experience: {
      minYears,
      level: seniority === "Senior" || seniority === "Lead" ? "Senior" : seniority === "Junior" ? "Junior" : "Mid",
    },
    education: {
      priority: eduPriority,
      field: textLower.includes("datateknik") ? "Computer Science / Engineering" : "Engineering / IT",
    },
    securityClearanceRequired,
    workingModel,
  };
}

function capitalizeTech(str: string): string {
  if (str === "react") return "React";
  if (str === "typescript") return "TypeScript";
  if (str === "javascript") return "JavaScript";
  if (str === "next.js" || str === "nextjs") return "Next.js";
  if (str === "node.js" || str === "nodejs") return "Node.js";
  if (str === "postgresql" || str === "postgres") return "PostgreSQL";
  if (str === "sql") return "SQL";
  if (str === "aws") return "AWS";
  if (str === "gcp") return "GCP";
  if (str === "c#") return "C#";
  if (str === "c++") return "C++";
  if (str === "plc") return "PLC";
  if (str === "cad") return "CAD";
  if (str === "cnc") return "CNC";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
