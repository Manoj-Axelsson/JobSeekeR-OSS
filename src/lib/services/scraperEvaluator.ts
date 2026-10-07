import type { PrismaClient, Prisma, CareerProfile } from "@prisma/client";
import { evaluateOpportunityAssessment, MatchResult } from "@/lib/services/matcher";
import { resolveCanonicalJob, SourceVacancy, createIngestionInput } from "@/lib/services/identity";
import type { TerritoryConfig } from "@/lib/services/pipeline/eligibility";

export type SearchProfileWithTerritory = Prisma.SearchProfileGetPayload<{
  include: { territory: true };
}>;

export interface ProcessVacancyParams {
  db: PrismaClient;
  sourceVacancy?: SourceVacancy;
  externalId?: string;
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  webpageUrl?: string | null;
  source?: string;
  publishedAt?: Date;
  deadline?: Date | null;
  activeSearchProfiles: SearchProfileWithTerritory[];
  activeCareerProfile: CareerProfile | null;
  candidateSkills: string[];
}

export interface ProcessVacancyResult {
  isMatched: boolean;
  isNew: boolean;
}

/**
 * Encapsulates multi-profile vacancy assessment and canonical job persistence during scraping.
 */
export async function processScrapedVacancy(
  params: ProcessVacancyParams
): Promise<ProcessVacancyResult> {
  const { db, sourceVacancy, activeSearchProfiles, activeCareerProfile, candidateSkills } = params;

  const vacancy: SourceVacancy = sourceVacancy || {
    externalId: params.externalId!,
    title: params.title!,
    company: params.company!,
    location: params.location!,
    description: params.description!,
    webpageUrl: params.webpageUrl || null,
    source: params.source!,
    publishedAt: params.publishedAt || new Date(),
    deadline: params.deadline || null,
  };

  const ingestionInput = createIngestionInput(vacancy, { status: "NEW" });

  const { job: jobRecord, isNew: isNewJob } = await resolveCanonicalJob(db, ingestionInput);

  const { externalId, title, company, location, description } = vacancy;

  let highestOverallMatchScore = 0;
  let primaryFeedType: "PRIMARY" | "DISCOVERY" = "DISCOVERY";
  let latestMatchResult: MatchResult | null = null;
  let evaluatedProfileCount = 0;

  for (const sp of activeSearchProfiles) {
    let prefs = undefined;
    try {
      prefs = {
        mustHave: JSON.parse(sp.mustHave || "[]"),
        prefer: JSON.parse(sp.prefer || "[]"),
        niceToHave: JSON.parse(sp.niceToHave || "[]"),
        exclude: JSON.parse(sp.exclude || "[]"),
        explore: JSON.parse(sp.explore || "[]"),
        targetOccupations: JSON.parse(sp.targetOccupations || "[]"),
      };
    } catch {}

    let territory: TerritoryConfig | undefined = undefined;
    if (sp.territory) {
      try {
        territory = {
          countries: JSON.parse(sp.territory.countries || '["SE"]'),
          regions: JSON.parse(sp.territory.regions || "[]"),
          municipalities: JSON.parse(sp.territory.municipalities || "[]"),
          cities: JSON.parse(sp.territory.cities || "[]"),
          remotePolicy: (sp.territory.remotePolicy as TerritoryConfig["remotePolicy"]) || "ALLOWED",
          discoveryPolicy: (sp.territory.discoveryPolicy as TerritoryConfig["discoveryPolicy"]) || "SHOW_SEPARATELY",
        };
      } catch {}
    }

    const match = evaluateOpportunityAssessment(
      {
        id: jobRecord.id,
        externalId,
        title,
        company,
        location,
        description,
      },
      {
        name: "Candidate",
        headline: activeCareerProfile?.headline || "Professional",
        skills: candidateSkills,
        targetRoles: prefs?.targetOccupations || [],
        preferredLocations: territory?.cities || [],
      }
    );

    latestMatchResult = match;

    if (match.matchScore > highestOverallMatchScore) {
      highestOverallMatchScore = match.matchScore;
      if (sp.isPrimary) primaryFeedType = match.feedType;
    }

    if (match.matchScore >= (sp.minMatchScore ?? 40) && match.eligibilityStatus !== "DISCARDED") {
      evaluatedProfileCount++;

      await db.jobAdSearchProfile.upsert({
        where: {
          jobId_searchProfileId: {
            jobId: jobRecord.id,
            searchProfileId: sp.id,
          },
        },
        create: {
          jobId: jobRecord.id,
          searchProfileId: sp.id,
          feedType: match.feedType,
          eligibilityStatus: match.eligibilityStatus,
          capabilityScore: match.capabilityScore,
          intentScore: match.intentScore,
          totalMatchScore: match.matchScore,
          matchedSkills: JSON.stringify(match.matchedSkills),
          missingSkills: JSON.stringify(match.missingSkills),
          probableOccupations: JSON.stringify(match.probableOccupations),
        },
        update: {
          feedType: match.feedType,
          eligibilityStatus: match.eligibilityStatus,
          capabilityScore: match.capabilityScore,
          intentScore: match.intentScore,
          totalMatchScore: match.matchScore,
          matchedSkills: JSON.stringify(match.matchedSkills),
          missingSkills: JSON.stringify(match.missingSkills),
          probableOccupations: JSON.stringify(match.probableOccupations),
        },
      });
    }
  }

  if (evaluatedProfileCount > 0) {
    await db.jobAd.update({
      where: { id: jobRecord.id },
      data: {
        matchScore: highestOverallMatchScore,
        feedType: primaryFeedType,
        eligibilityStatus: latestMatchResult?.eligibilityStatus || "ELIGIBLE",
        capabilityScore: latestMatchResult?.capabilityScore || 0,
        intentScore: latestMatchResult?.intentScore || 0,
        matchedSkills: JSON.stringify(latestMatchResult?.matchedSkills || []),
        missingSkills: JSON.stringify(latestMatchResult?.missingSkills || []),
        assessmentVersion: "3.0.0",
        matchGrade: latestMatchResult?.newAssessment?.match.grade || null,
        assessmentConfidence:
          latestMatchResult?.newAssessment?.confidence.assessmentConfidence || null,
        canonicalLocation: location,
        hardRequirements: latestMatchResult?.newAssessment?.eligibility.hardRequirements
          ? JSON.stringify(latestMatchResult.newAssessment.eligibility.hardRequirements)
          : null,
        matchedRequirements: JSON.stringify(latestMatchResult?.matchedSkills || []),
        missingRequirements: JSON.stringify(latestMatchResult?.missingSkills || []),
        enrichmentData: latestMatchResult?.enrichment
          ? JSON.stringify(latestMatchResult.enrichment)
          : null,
        positioningData: latestMatchResult?.positioning
          ? JSON.stringify(latestMatchResult.positioning)
          : null,
        legacyMatchScore: latestMatchResult?.legacyMatchScore ?? null,
      },
    });

    return { isMatched: true, isNew: isNewJob };
  }

  return { isMatched: false, isNew: isNewJob };
}
