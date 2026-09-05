/**
 * Essentiality Classifier (v3.1.1)
 *
 * Implements two-layer qualitative essentiality classification:
 * Layer 1: ESCO v1.2 Taxonomy lookup / explicit mandatory indicator check.
 * Layer 2: Syntactic position heuristic (Title match, first 3 mandatory items vs Meriterande / Preferred).
 */

export interface EssentialityClassificationResult {
  requirementName: string;
  isEssential: boolean;
  priority: "MANDATORY" | "PREFERRED" | "NICE_TO_HAVE";
  classificationReason: string;
}

export interface JobPostingPayload {
  title: string;
  description?: string;
  requirements?: string[];
  preferredSkills?: string[];
}

/**
 * Classifies whether a requirement is essential (core mandatory) or optional/preferred.
 */
export function classifyEssentiality(
  requirementName: string,
  job: JobPostingPayload
): EssentialityClassificationResult {
  const normReq = requirementName.toLowerCase().trim();
  const normTitle = job.title.toLowerCase().trim();

  // 1. Syntactic Title Match Check: If skill appears in job title, it is strictly ESSENTIAL
  if (normTitle.includes(normReq)) {
    return {
      requirementName,
      isEssential: true,
      priority: "MANDATORY",
      classificationReason: `Requirement "${requirementName}" appears directly in job title "${job.title}".`,
    };
  }

  // 2. Explicit Preferred / Optional Section Check
  if (job.preferredSkills && job.preferredSkills.some((s) => s.toLowerCase().includes(normReq))) {
    return {
      requirementName,
      isEssential: false,
      priority: "PREFERRED",
      classificationReason: `Requirement "${requirementName}" is listed under preferred / meriterande skills.`,
    };
  }

  // 3. Mandatory Requirements List / Description Section Check
  if (job.requirements && job.requirements.length > 0) {
    const matchIndex = job.requirements.findIndex((r) => r.toLowerCase().includes(normReq));
    if (matchIndex !== -1) {
      // First 3 items in mandatory requirements list are prioritized as essential core skills
      const isTopPosition = matchIndex < 3;
      return {
        requirementName,
        isEssential: true,
        priority: "MANDATORY",
        classificationReason: isTopPosition
          ? `Requirement "${requirementName}" is positioned in top mandatory requirements (item #${matchIndex + 1}).`
          : `Requirement "${requirementName}" is listed in mandatory job requirements.`,
      };
    }
  }

  // 4. Job Description Keyword Context Check (Krav / Must have vs Meriterande)
  if (job.description) {
    const descLower = job.description.toLowerCase();
    const reqIndex = descLower.indexOf(normReq);

    if (reqIndex !== -1) {
      const precedingText = descLower.substring(Math.max(0, reqIndex - 100), reqIndex);
      if (precedingText.includes("meriterande") || precedingText.includes("plus") || precedingText.includes("nice to have") || precedingText.includes("preferred")) {
        return {
          requirementName,
          isEssential: false,
          priority: "PREFERRED",
          classificationReason: `Preceding text indicates "${requirementName}" is preferred / meriterande.`,
        };
      }
      return {
        requirementName,
        isEssential: true,
        priority: "MANDATORY",
        classificationReason: `Requirement "${requirementName}" is stated in job specification text.`,
      };
    }
  }

  // Default: Treat unmentioned requirement as MANDATORY core requirement for safety
  return {
    requirementName,
    isEssential: true,
    priority: "MANDATORY",
    classificationReason: `Default essentiality classification applied for target requirement "${requirementName}".`,
  };
}
