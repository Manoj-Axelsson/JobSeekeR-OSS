export interface DocumentIntelligenceMetric {
  totalDocuments: number;
  extractedSkillsCount: number;
  lastUploadedCv: string;
}

export function getDocumentIntelligenceStats(): DocumentIntelligenceMetric {
  return {
    totalDocuments: 3,
    extractedSkillsCount: 24,
    lastUploadedCv: "Manoj Axelsson - Fullstack Architecture CV",
  };
}
