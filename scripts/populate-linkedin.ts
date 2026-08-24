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

      const existing = await db.jobAd.findFirst({ where: { externalId: ad.id } });
      if (existing) {
        await db.jobAd.update({
          where: { id: existing.id },
          data: {
            matchScore: match.matchScore,
            matchedSkills: JSON.stringify(match.matchedSkills),
            domainScores: JSON.stringify(match.domainScores),
          },
        });
      } else {
        await db.jobAd.create({
          data: {
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
}

  console.log(`LinkedIn scan complete! Saved ${matched} matching LinkedIn jobs to dev.db.`);
}

run()
  .catch(console.error)
  .finally(() => db.$disconnect());
