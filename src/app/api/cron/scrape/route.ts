import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchSwedishJobs } from "@/lib/services/jobtech";
import { fetchLinkedInSwedishJobs } from "@/lib/services/linkedin";
import { evaluateOpportunityAssessment } from "@/lib/services/matcher";
import { ensureV2ProfilesExist } from "@/lib/services/pipeline/seedV2";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleScrape();
}

export async function POST() {
  return handleScrape();
}

async function handleScrape() {
  const startTime = new Date();
  let totalFound = 0;
  let totalMatched = 0;
  let newAdded = 0;
  let expiredCount = 0;

  try {
    // 1. Ensure V2 CareerProfile, SearchProfile(s), and SearchTerritory exist
    await ensureV2ProfilesExist();

    const activeSearchProfiles = await db.searchProfile.findMany({
      include: { territory: true },
    });

    const activeCareerProfile = await db.careerProfile.findFirst();

    // Parse candidate skills from CareerProfile
    let candidateSkills: string[] = ["React", "TypeScript", "Next.js", "Systems Engineering"];
    if (activeCareerProfile?.skills) {
      try {
        const raw = JSON.parse(activeCareerProfile.skills);
        if (Array.isArray(raw)) candidateSkills = raw;
      } catch {}
    }

    // Dynamic Ingestion Terms: Aggregate targetOccupations and prefer terms across ALL active SearchProfiles
    const combinedSearchTerms = new Set<string>();
    activeSearchProfiles.forEach((sp) => {
      try {
        const occs = JSON.parse(sp.targetOccupations || "[]");
        const prefs = JSON.parse(sp.prefer || "[]");
        occs.forEach((o: string) => o && combinedSearchTerms.add(o));
        prefs.forEach((p: string) => p && combinedSearchTerms.add(p));
      } catch {}
    });

    const searchTermsArray = Array.from(combinedSearchTerms);

    // Enforce 14-Day Cutoff Policy on existing jobs
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const expireResult = await db.jobAd.updateMany({
      where: {
        status: "NEW",
        OR: [
          { publishedAt: { lt: fourteenDaysAgo } },
          { deadline: { lt: startTime } },
        ],
      },
      data: {
        status: "DISCARDED",
      },
    });

    expiredCount = expireResult.count;

    // 2. Fetch fresh listings using dynamic SearchProfile terms
    const rawJobTechAds = await fetchSwedishJobs(searchTermsArray);
    const rawLinkedInAds = await fetchLinkedInSwedishJobs(searchTermsArray);

    totalFound = rawJobTechAds.length + rawLinkedInAds.length;

    // Helper to process and persist a raw job ad against active Search Profiles
    async function processVacancy(
      externalId: string,
      title: string,
      company: string,
      location: string,
      description: string,
      webpageUrl: string,
      source: string,
      publishedAt: Date,
      deadline: Date | null
    ) {
      const existingJob = await db.jobAd.findFirst({
        where: { externalId },
      });

      let jobRecord = existingJob;
      let isNewJob = false;

      let highestOverallMatchScore = 0;
      let primaryFeedType: "PRIMARY" | "DISCOVERY" = "DISCOVERY";
      let latestMatchResult: any = null;

      if (!jobRecord) {
        isNewJob = true;
        jobRecord = await db.jobAd.create({
          data: {
            externalId,
            title,
            company,
            location, // Preserves raw sourceLocation metadata
            description: description.slice(0, 3000),
            webpageUrl,
            source,
            publishedAt,
            deadline,
            matchScore: 0,
            matchedSkills: "[]",
            missingSkills: "[]",
            domainScores: "{}",
            status: "NEW",
          },
        });
      }

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
              countries: JSON.parse(sp.territory.countries || "[\"SE\"]"),
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
        totalMatched++;
        if (isNewJob) newAdded++;

        // Persist Authoritative Score & Versioned Assessment Fields
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
            
            // Phase 12 Additive Structurally Versioned Fields
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
      }
    }

    // Process JobTech ads
    for (const ad of rawJobTechAds) {
      const city = ad.workplace_address?.city || ad.workplace_address?.municipality || "Sweden";
      const descText = ad.description?.text || "";
      const companyName = ad.employer?.name || "Unknown Company";

      await processVacancy(
        ad.id,
        ad.headline,
        companyName,
        city,
        descText,
        ad.webpage_url || `https://platsbanken.se/arbetsforetag/${ad.id}`,
        "Arbetsförmedlingen JobTech",
        new Date(ad.publication_date || Date.now()),
        ad.application_deadline ? new Date(ad.application_deadline) : null
      );
    }

    // Process LinkedIn ads
    for (const ad of rawLinkedInAds) {
      await processVacancy(
        ad.id,
        ad.headline,
        ad.company,
        ad.location,
        ad.description,
        ad.webpageUrl,
        "LinkedIn Jobs",
        new Date(ad.publicationDate || Date.now()),
        null
      );
    }

    // Enforce Constitutional Selection Caps (<=15 Primary, <=5 Discovery)
    const allNewJobs = await db.jobAd.findMany({ where: { status: "NEW" } });
    
    const primaryJobs = allNewJobs
      .filter(j => j.feedType === "PRIMARY" && j.eligibilityStatus === "ELIGIBLE")
      .sort((a, b) => b.matchScore - a.matchScore);

    // Keep top 15 Primary; demote surplus Primary candidates to DISCOVERY
    if (primaryJobs.length > 15) {
      const surplusPrimary = primaryJobs.slice(15);
      for (const sj of surplusPrimary) {
        await db.jobAd.update({
          where: { id: sj.id },
          data: { feedType: "DISCOVERY" },
        });
      }
    }

    const scanLog = await db.scanLog.create({
      data: {
        scannedAt: startTime,
        totalFound,
        totalMatched,
        newAdded,
        status: "SUCCESS",
        message: `Phase 12 Scanned ${totalFound} jobs against ${activeSearchProfiles.length} Search Profiles. ${totalMatched} matched (${newAdded} new added).`,
      },
    });

    return NextResponse.json({
      success: true,
      scannedAt: startTime,
      totalFound,
      totalMatched,
      newAdded,
      expiredCount,
      activeProfilesCount: activeSearchProfiles.length,
      scanLog,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to execute Phase 12 scan";
    console.error("Scrape error:", error);
    await db.scanLog.create({
      data: {
        scannedAt: startTime,
        totalFound,
        totalMatched,
        newAdded,
        status: "ERROR",
        message,
      },
    });

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
