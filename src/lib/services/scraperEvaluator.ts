import { evaluateOpportunityAssessment } from "@/lib/services/matcher";
import { resolveCanonicalJob } from "@/lib/services/identity";

export interface ProcessVacancyParams {
  db: any;
  externalId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  webpageUrl: string;
  source: string;
  publishedAt: Date;
  deadline: Date | null;
  activeSearchProfiles: any[];
  activeCareerProfile: any;
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
  const {
    db,
    externalId,
    title,
    company,
    location,
    description,
    webpageUrl,
    source,
    publishedAt,
    deadline,
    activeSearchProfiles,
    activeCareerProfile,
    candidateSkills,
  } = params;

  const { job: jobRecord, isNew: isNewJob } = await resolveCanonicalJob(db, {
    externalId,
    title,
    company,
    location,
    description,
    webpageUrl,
    source,
    publishedAt,
    deadline,
    status: "NEW",
  });

  let highestOverallMatchScore = 0;
  let primaryFeedType: "PRIMARY" | "DISCOVERY" = "DISCOVERY";
  let latestMatchResult: any = null;
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

    let territory = undefined;
    if (sp.territory) {
      try {
        territory = {
          countries: JSON.parse(sp.territory.countries || '["SE"]'),
          regions: JSON.parse(sp.territory.regions || "[]"),
          municipalities: JSON.parse(sp.territory.municipalities || "[]"),
          cities: JSON.parse(sp.territory.cities || "[]"),
          remotePolicy: sp.territory.remotePolicy as any,
          discoveryPolicy: sp.territory.discoveryPolicy as any,
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
        name: activeCareerProfile?.headline || "Manoj Axelsson",
        headline: activeCareerProfile?.headline || "Software & Systems Engineer",
        skills: candidateSkills,
        targetRoles: prefs?.targetOccupations || ["Software Engineer"],
        preferredLocations: territory?.cities || ["Stockholm", "Linköping"],
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
        assessmentConfidence: latestMatchResult?.newAssessment?.confidence.assessmentConfidence || null,
        canonicalLocation: location,
        hardRequirements: latestMatchResult?.newAssessment?.eligibility.hardRequirements
          ? JSON.stringify(latestMatchResult.newAssessment.eligibility.hardRequirements)
          : null,
        matchedRequirements: JSON.stringify(latestMatchResult?.matchedSkills || []),
        missingRequirements: JSON.stringify(latestMatchResult?.missingSkills || []),
        enrichmentData: latestMatchResult?.enrichment ? JSON.stringify(latestMatchResult.enrichment) : null,
        positioningData: latestMatchResult?.positioning ? JSON.stringify(latestMatchResult.positioning) : null,
        legacyMatchScore: latestMatchResult?.legacyMatchScore ?? null,
      },
    });

    return { isMatched: true, isNew: isNewJob };
  }

  return { isMatched: false, isNew: isNewJob };
}
