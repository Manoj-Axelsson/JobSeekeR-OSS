import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchSwedishJobs } from "@/lib/services/jobtech";
import { evaluateJobMatch } from "@/lib/services/matcher";

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
    // 1. Enforce 14-Day Strict Cutoff Policy on existing NEW and SAVED jobs
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Update unapplied jobs older than 14 days or past application deadline to EXPIRED
    const expireResult = await db.jobAd.updateMany({
      where: {
        status: { in: ["NEW", "SAVED"] },
        OR: [
          { publishedAt: { lt: fourteenDaysAgo } },
          { deadline: { lt: startTime } },
        ],
      },
      data: {
        status: "DISCARDED", // Move to discarded so they never show up in active daily feeds
      },
    });

    expiredCount = expireResult.count;

    // 2. Fetch fresh Swedish job listings from Arbetsförmedlingen JobTech API
    const rawAds = await fetchSwedishJobs();
    totalFound = rawAds.length;

    const userProfile = await db.userProfile.findUnique({ where: { id: "user_manoj" } });
    const minScore = userProfile?.minMatchScore ?? 45;

    for (const ad of rawAds) {
      const city = ad.workplace_address?.city || ad.workplace_address?.municipality || "Sweden";
      const descText = ad.description?.text || "";
      const match = evaluateJobMatch(ad.headline, descText);

      if (match.matchScore >= minScore) {
        totalMatched++;

        const existing = await db.jobAd.findUnique({
          where: { externalId: ad.id },
        });

        if (!existing) {
          newAdded++;
          await db.jobAd.create({
            data: {
              externalId: ad.id,
              title: ad.headline,
              company: ad.employer?.name || "Unknown Company",
              location: city,
              description: descText.slice(0, 3000),
              webpageUrl: ad.webpage_url || `https://platsbanken.se/arbetsforetag/${ad.id}`,
              source: "Arbetsförmedlingen JobTech",
              publishedAt: new Date(ad.publication_date || Date.now()),
              deadline: ad.application_deadline ? new Date(ad.application_deadline) : null,
              matchScore: match.matchScore,
              matchedSkills: JSON.stringify(match.matchedSkills),
              missingSkills: JSON.stringify(match.missingSkills),
              domainScores: JSON.stringify(match.domainScores),
              status: "NEW",
            },
          });
        }
      }
    }

    const scanLog = await db.scanLog.create({
      data: {
        scannedAt: startTime,
        totalFound,
        totalMatched,
        newAdded,
        status: "SUCCESS",
        message: `Scanned ${totalFound} Swedish job ads. ${totalMatched} matched criteria (${newAdded} new added, ${expiredCount} expired after 14-day limit).`,
      },
    });

    return NextResponse.json({
      success: true,
      scannedAt: startTime,
      totalFound,
      totalMatched,
      newAdded,
      expiredCount,
      scanLog,
    });
  } catch (error: any) {
    console.error("Scrape error:", error);
    await db.scanLog.create({
      data: {
        scannedAt: startTime,
        totalFound,
        totalMatched,
        newAdded,
        status: "ERROR",
        message: error?.message || "Failed to execute scan",
      },
    });

    return NextResponse.json(
      { success: false, error: error?.message || "Scan failed" },
      { status: 500 }
    );
  }
}
