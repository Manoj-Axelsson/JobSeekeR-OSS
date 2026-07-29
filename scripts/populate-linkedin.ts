import { fetchLinkedInSwedishJobs } from "../src/lib/services/linkedin";
import { evaluateJobMatch } from "../src/lib/services/matcher";
import { db } from "../src/lib/db";

async function run() {
  console.log("Fetching LinkedIn Jobs in Sweden...");
  const ads = await fetchLinkedInSwedishJobs(["fullstack", "systems engineer", "manufacturing engineer", "quality engineer", "automation engineer"]);
  console.log(`Retrieved ${ads.length} job ads from LinkedIn.`);

  let matched = 0;
  for (const ad of ads) {
    const match = evaluateJobMatch(ad.headline, ad.description);

    if (match.matchScore >= 40) {
      matched++;

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
          company: ad.company,
          location: ad.location,
          description: ad.description,
          webpageUrl: ad.webpageUrl,
          source: "LinkedIn Jobs",
          publishedAt: new Date(ad.publicationDate || Date.now()),
          deadline: null,
          matchScore: match.matchScore,
          matchedSkills: JSON.stringify(match.matchedSkills),
          missingSkills: JSON.stringify(match.missingSkills),
          domainScores: JSON.stringify(match.domainScores),
          status: "NEW",
        },
      });
    }
  }

  console.log(`LinkedIn scan complete! Saved ${matched} matching LinkedIn jobs to dev.db.`);
}

run()
  .catch(console.error)
  .finally(() => db.$disconnect());
