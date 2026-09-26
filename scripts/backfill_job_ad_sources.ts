import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

export async function backfillJobAdSources() {
  console.log("Starting JobAdSource backfill...");
  
  const jobs = await db.jobAd.findMany({
    select: {
      id: true,
      source: true,
      externalId: true,
      webpageUrl: true,
      publishedAt: true,
      deadline: true,
    },
  });

  console.log(`Found ${jobs.length} JobAd records to evaluate for backfill.`);
  let createdCount = 0;
  let skippedCount = 0;

  for (const job of jobs) {
    if (!job.source || !job.externalId) {
      skippedCount++;
      continue;
    }

    // Split concatenated sources if legacy merged string exists (e.g. "JobTech | LinkedIn")
    const sourceParts = job.source.split("|").map(s => s.trim()).filter(Boolean);
    const primarySource = sourceParts[0] || "Unknown Source";

    try {
      await db.jobAdSource.upsert({
        where: {
          source_externalId: {
            source: primarySource,
            externalId: job.externalId,
          },
        },
        create: {
          jobId: job.id,
          source: primarySource,
          externalId: job.externalId,
          webpageUrl: job.webpageUrl || null,
          publishedAt: job.publishedAt,
          deadline: job.deadline || null,
        },
        update: {
          jobId: job.id,
          webpageUrl: job.webpageUrl || null,
          publishedAt: job.publishedAt,
          deadline: job.deadline || null,
        },
      });
      createdCount++;
    } catch (err) {
      console.error(`Error backfilling job ${job.id}:`, err);
    }
  }

  console.log(`JobAdSource backfill completed. ${createdCount} source observations processed, ${skippedCount} skipped.`);
}

if (require.main === module) {
  backfillJobAdSources()
    .then(() => db.$disconnect())
    .catch((err) => {
      console.error("Backfill failed:", err);
      db.$disconnect();
      process.exit(1);
    });
}
