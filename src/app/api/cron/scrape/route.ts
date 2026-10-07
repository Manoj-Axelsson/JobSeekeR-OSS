import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchSwedishJobs, jobTechAdToSourceVacancy } from "@/lib/services/jobtech";
import { fetchLinkedInSwedishJobs, linkedInAdToSourceVacancy } from "@/lib/services/linkedin";
import { fetchWebbjobbVacancies } from "@/lib/services/webbjobb";
import { ensureV2ProfilesExist } from "@/lib/services/pipeline/seedV2";
import { processScrapedVacancy } from "@/lib/services/scraperEvaluator";
import { SourceVacancy } from "@/lib/services/identity";
import { getPublicationCutoff, isFreshPublicationDate } from "@/lib/services/publicationFreshness";
import { selectFeedJobs } from "@/lib/services/feedSelection";
import { getAuthenticatedUser } from "@/lib/authHelper";

export const dynamic = "force-dynamic";

async function verifyScraperAuthorization(req: NextRequest): Promise<NextResponse | null> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const manualHeader = req.headers.get("x-jobseeker-trigger");

  // Path 1: Scheduled Vercel Cron call with Bearer Token
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return null;
  }

  // Path 2: Manual UI call with Session Auth
  if (manualHeader === "manual") {
    const user = await getAuthenticatedUser(req);
    if (user) {
      return null;
    }
  }

  // Fail closed: Return 401 Unauthorized for invalid/missing bearer token or unauthenticated session
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const authError = await verifyScraperAuthorization(req);
  if (authError) return authError;
  return handleScrape();
}

export async function POST(req: NextRequest) {
  const authError = await verifyScraperAuthorization(req);
  if (authError) return authError;
  return handleScrape();
}

async function handleScrape() {
  const startTime = new Date();
  const publicationCutoff = getPublicationCutoff(startTime);

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

        if (Array.isArray(raw)) {
          candidateSkills = raw;
        }
      } catch {}
    }

    const combinedSearchTerms = new Set<string>();

    activeSearchProfiles.forEach((sp) => {
      try {
        const occupations = JSON.parse(sp.targetOccupations || "[]");
        const preferences = JSON.parse(sp.prefer || "[]");

        occupations.forEach((occupation: string) => {
          if (occupation) {
            combinedSearchTerms.add(occupation);
          }
        });

        preferences.forEach((preference: string) => {
          if (preference) {
            combinedSearchTerms.add(preference);
          }
        });
      } catch {}
    });

    const searchTermsArray = Array.from(combinedSearchTerms);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const expireResult = await db.jobAd.updateMany({
      where: {
        status: "NEW",
        OR: [{ publishedAt: { lt: fourteenDaysAgo } }, { deadline: { lt: startTime } }],
      },
      data: {
        status: "DISCARDED",
      },
    });

    expiredCount = expireResult.count;

    const rawJobTechAds = await fetchSwedishJobs(searchTermsArray, publicationCutoff);

    const rawLinkedInAds = await fetchLinkedInSwedishJobs(searchTermsArray, publicationCutoff);

    const webbjobbVacancies = await fetchWebbjobbVacancies(undefined, publicationCutoff);

    const jobTechVacancies = rawJobTechAds.map(jobTechAdToSourceVacancy);
    const linkedInVacancies = rawLinkedInAds.map(linkedInAdToSourceVacancy);

    const allVacancies: SourceVacancy[] = [
      ...jobTechVacancies,
      ...linkedInVacancies,
      ...webbjobbVacancies,
    ];

    totalFound = allVacancies.length;

    for (const vacancy of allVacancies) {
      if (!isFreshPublicationDate(vacancy.publishedAt, publicationCutoff, startTime)) {
        continue;
      }

      const res = await processScrapedVacancy({
        db,
        sourceVacancy: vacancy,
        activeSearchProfiles,
        activeCareerProfile,
        candidateSkills,
      });

      if (res.isMatched) {
        totalMatched++;
      }

      if (res.isNew && res.isMatched) {
        newAdded++;
      }
    }

    const allNewJobs = await db.jobAd.findMany({
      where: { status: "NEW" },
    });

    const { surplusToDemote } = selectFeedJobs(allNewJobs, 15, 10);

    for (const job of surplusToDemote) {
      await db.jobAd.update({
        where: { id: job.id },
        data: { feedType: "DISCOVERY" },
      });
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

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
