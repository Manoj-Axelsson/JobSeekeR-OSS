/**
 * Shared Domain Types for JobSeekeR-OSS
 */

export interface JobProfileEvaluation {
  id: string;
  jobId: string;
  searchProfileId: string;
  feedType: "PRIMARY" | "DISCOVERY";
  eligibilityStatus: "ELIGIBLE" | "INELIGIBLE" | "DISCARDED";
  capabilityScore: number;
  intentScore: number;
  totalMatchScore: number;
  searchProfile?: {
    id: string;
    name: string;
    isPrimary: boolean;
  };
}

export interface JobAd {
  id: string;
  externalId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  webpageUrl: string | null;
  source: string;
  publishedAt: string;
  deadline: string | null;
  matchScore: number;
  matchedSkills: string; // JSON string array
  missingSkills: string; // JSON string array
  domainScores: string; // JSON string object
  status: "NEW" | "SAVED" | "APPLIED" | "DISCARDED";
  feedType?: "PRIMARY" | "DISCOVERY";
  eligibilityStatus?: "ELIGIBLE" | "INELIGIBLE" | "DISCARDED";
  capabilityScore?: number;
  intentScore?: number;
  probableOccupations?: string; // JSON string array
  applications?: Application[];
  profileEvaluations?: JobProfileEvaluation[];
}

export interface Application {
  id: string;
  jobId: string;
  status: "APPLIED" | "INTERVIEWING" | "OFFER" | "REJECTED";
  appliedAt: string;
  resumeVersion: string;
  notes: string | null;
  monthlyTag: string;
  job?: JobAd;
}
