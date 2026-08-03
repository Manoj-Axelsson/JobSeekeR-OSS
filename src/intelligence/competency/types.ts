/**
 * JobSeekR Intelligence Framework v2.0
 * Phase 0 & 1: Competency Domain Model & Taxonomy Specifications
 */

export type CompetencyCategory =
  | "QUALITY_OPERATIONAL_EXCELLENCE"
  | "SYSTEMS_MANUFACTURING"
  | "SOFTWARE_ENGINEERING"
  | "DATA_ANALYTICS"
  | "PROJECT_GOVERNANCE";

export type CompetencyType =
  | "METHODOLOGY"   // e.g., DMAIC, Agile, Kaizen
  | "TOOL"          // e.g., Minitab, Git, Jira, PLC
  | "FRAMEWORK"     // e.g., Six Sigma, ISO 9001, Scrum
  | "CONCEPT"       // e.g., Root Cause Analysis, Operational Excellence
  | "STANDARD";     // e.g., IATF 16949, EN 50128

export type RelationshipType =
  | "REQUIRES"       // Competency A requires understanding of Competency B
  | "IS_CHILD_OF"    // Competency A is a sub-discipline of Competency B
  | "ENABLES"        // Competency A empowers/enables Competency B
  | "EQUIVALENT_TO"; // Competency A and B are domain-equivalent

export interface CompetencyNode {
  id: string;                      // Unique canonical key (e.g. "dmaic")
  name: string;                    // Human-readable title ("DMAIC")
  category: CompetencyCategory;
  type: CompetencyType;
  aliases: string[];               // Synonyms & abbreviations
  description: string;             // Domain definition for explainability
}

export interface CompetencyRelationship {
  sourceId: string;                // e.g. "dmaic"
  targetId: string;                // e.g. "lean_six_sigma"
  relationship: RelationshipType;
  weight: number;                  // Relationship strength (0.0 to 1.0)
  rationale: string;               // Explainable reasoning for Anna
}

export interface TransferabilityResult {
  sourceCompetency: CompetencyNode;
  targetCompetency: CompetencyNode;
  transferWeight: number;           // 0.0 to 1.0 multiplier
  relationshipType: RelationshipType | "DIRECT";
  rationale: string;               // Plain language explanation for Anna
}
