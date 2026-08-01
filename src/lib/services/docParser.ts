import { db } from "../db";

export interface ParsedDocumentResult {
  id: string;
  filename: string;
  fileType: string;
  extractedText: string;
  extractedSkills: string[];
  uploadedAt: Date;
}

const KNOWN_COMPETENCIES = [
  "React", "TypeScript", "JavaScript", "Next.js", "Node.js", "Express", "Python",
  "Java", "C++", "C#", "SQL", "PostgreSQL", "MongoDB", "Redis", "Docker",
  "Kubernetes", "AWS", "Azure", "GCP", "Linux", "Git", "GitHub", "CI/CD",
  "Systems Engineering", "Requirements Engineering", "Quality Assurance",
  "Six Sigma", "Lean Manufacturing", "FMEA", "DMAIC", "Poka-Yoke", "CAD", "CAM",
  "Automation", "PLC", "Scrum", "Agile", "DevOps", "Cybersecurity", "REST API"
];

/**
 * Extract text and technical competencies from uploaded CVs and Certificate documents.
 */
export async function parseAndSaveDocument(
  filename: string,
  buffer: Buffer,
  fileType: "CV" | "CERTIFICATE" | "COVER_LETTER" = "CV"
): Promise<ParsedDocumentResult> {
  let extractedText = "";

  if (filename.toLowerCase().endsWith(".pdf")) {
    try {
      // Dynamic import to handle optional node module gracefully
      const pdfParse = require("pdf-parse");
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text || "";
    } catch {
      // Fallback text extraction if PDF parser is unavailable or encounters binary format
      extractedText = buffer.toString("utf-8");
    }
  } else {
    extractedText = buffer.toString("utf-8");
  }

  // Extract skills by matching text against known competencies
  const textLower = extractedText.toLowerCase();
  const extractedSkillsSet = new Set<string>();

  for (const skill of KNOWN_COMPETENCIES) {
    if (textLower.includes(skill.toLowerCase())) {
      extractedSkillsSet.add(skill);
    }
  }

  const extractedSkills = Array.from(extractedSkillsSet);

  // Save to SQLite database
  const docRecord = await db.userDocument.create({
    data: {
      filename,
      fileType,
      extractedText,
      extractedSkills: JSON.stringify(extractedSkills),
    },
  });

  return {
    id: docRecord.id,
    filename: docRecord.filename,
    fileType: docRecord.fileType,
    extractedText: docRecord.extractedText,
    extractedSkills,
    uploadedAt: docRecord.uploadedAt,
  };
}
