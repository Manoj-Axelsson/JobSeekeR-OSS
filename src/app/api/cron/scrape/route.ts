import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchSwedishJobs } from "@/lib/services/jobtech";
import { fetchLinkedInSwedishJobs } from "@/lib/services/linkedin";
import { ensureV2ProfilesExist } from "@/lib/services/pipeline/seedV2";
import { processScrapedVacancy } from "@/lib/services/scraperEvaluator";

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
    await ensureV2ProfilesExist();

    const activeSearchProfiles = await db.searchProfile.findMany({
      include: { territory: true },
    });

    const activeCareerProfile = await db.careerProfile.findFirst();

    let candidateSkills: string[] = ["React", "TypeScript", "Next.js", "Systems Engineering"];
    if (activeCareerProfile?.skills) {
      try {
        const raw = JSON.parse(activeCareerProfile.skills);
        if (Array.isArray(raw)) candidateSkills = raw;
      } catch {}
    }

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

    const rawJobTechAds = await fetchSwedishJobs(searchTermsArray);
    const rawLinkedInAds = await fetchLinkedInSwedishJobs(searchTermsArray);

    totalFound = rawJobTechAds.length + rawLinkedInAds.length;

    for (const ad of rawJobTechAds) {
      const city = ad.workplace_address?.city || ad.workplace_address?.municipality || "Sweden";
      const descText = ad.description?.text || "";
      const companyName = ad.employer?.name || "Unknown Company";

      const res = await processScrapedVacancy({
        db,
        externalId: ad.id,
        title: ad.headline,
        company: companyName,
        location: city,
        description: descText,
        webpageUrl: ad.webpage_url || `https://platsbanken.se/arbetsforetag/${ad.id}`,
        source: "Arbetsförmedlingen JobTech",
        publishedAt: new Date(ad.publication_date || Date.now()),
        deadline: ad.application_deadline ? new Date(ad.application_deadline) : null,
        activeSearchProfiles,
        activeCareerProfile,
        candidateSkills,
      });

      if (res.isMatched) totalMatched++;
      if (res.isNew && res.isMatched) newAdded++;
    }

    for (const ad of rawLinkedInAds) {
      const res = await processScrapedVacancy({
        db,
        externalId: ad.id,
        title: ad.headline,
        company: ad.company,
        location: ad.location,
        description: ad.description,
        webpageUrl: ad.webpageUrl,
        source: "LinkedIn Jobs",
        publishedAt: new Date(ad.publicationDate || Date.now()),
        deadline: null,
        activeSearchProfiles,
        activeCareerProfile,
        candidateSkills,
      });

      if (res.isMatched) totalMatched++;
      if (res.isNew && res.isMatched) newAdded++;
    }

    const allNewJobs = await db.jobAd.findMany({ where: { status: "NEW" } });
    
    const primaryJobs = allNewJobs
      .filter(j => j.feedType === "PRIMARY" && j.eligibilityStatus === "ELIGIBLE")
      .sort((a, b) => b.matchScore - a.matchScore);

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
