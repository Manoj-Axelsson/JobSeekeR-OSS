export interface DocumentIntelligenceMetric {
  totalDocuments: number;
  extractedSkillsCount: number;
  lastUploadedCv: string;
}

export interface DocumentUserProfileInput {
  skills?: string | Record<string, string[]> | null;
  cvFile?: string | null;
}

export function getDocumentIntelligenceStats(
  userProfile?: DocumentUserProfileInput | null
): DocumentIntelligenceMetric {
  const skillsJson = userProfile?.skills;
  let count = 0;
  if (skillsJson) {
    try {
      const parsed = typeof skillsJson === "string" ? JSON.parse(skillsJson) : skillsJson;
      if (typeof parsed === "object" && parsed !== null) {
        Object.values(parsed).forEach((arr: unknown) => {
          if (Array.isArray(arr)) count += arr.length;
        });
      }
    } catch {
      // fallback
    }
  }

  const cvName =
    userProfile?.cvFile || (count > 0 ? "Parsed Candidate Competence Profile" : "No CV Uploaded");

  return {
    totalDocuments: count > 0 ? 1 : 0,
    extractedSkillsCount: count,
    lastUploadedCv: cvName,
  };
}
