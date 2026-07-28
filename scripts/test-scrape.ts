import { fetchSwedishJobs } from "../src/lib/services/jobtech";
import { evaluateJobMatch } from "../src/lib/services/matcher";
import { db } from "../src/lib/db";

async function run() {
  console.log("Fetching jobs from Arbetsförmedlingen JobTech API...");
  const ads = await fetchSwedishJobs(["developer", "fullstack", "react", "systems engineer", "manufacturing engineer", "quality engineer", "automation"]);
  console.log(`Retrieved ${ads.length} job ads from JobTech API.`);

  let matched = 0;
  for (const ad of ads) {
    const descText = ad.description?.text || "";
    const match = evaluateJobMatch(ad.headline, descText);

    if (match.matchScore >= 40) {
      matched++;
      const city = ad.workplace_address?.city || ad.workplace_address?.municipality || "Sweden";

      await db.jobAd.upsert({
        where: { externalId: ad.id },
        update: {
          matchScore: match.matchScore,
          matchedSkills: JSON.stringify(match.matchedSkills),
          domainScores: JSON.stringify(match.domainScores),
        },
        create: {
          externalId: ad.id,
          title: ad.headline,
          company: ad.employer?.name || "Swedish Employer",
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

  await db.scanLog.create({
    data: {
      scannedAt: new Date(),
      totalFound: ads.length,
      totalMatched: matched,
      newAdded: matched,
      status: "SUCCESS",
      message: `Initial test scan completed. Found ${ads.length} ads, matched ${matched} jobs.`,
    },
  });

  console.log(`Scan complete! ${matched} matching jobs stored in SQLite database dev.db.`);
}

run()
  .catch(console.error)
  .finally(() => db.$disconnect());
