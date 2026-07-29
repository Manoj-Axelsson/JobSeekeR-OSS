export interface LinkedInJobAd {
  id: string;
  headline: string;
  company: string;
  location: string;
  description: string;
  webpageUrl: string;
  publicationDate: string;
}

export async function fetchLinkedInSwedishJobs(
  keywords: string[] = ["fullstack", "react typescript", "systems engineer", "manufacturing engineer", "quality engineer", "automation engineer"]
): Promise<LinkedInJobAd[]> {
  const jobs: LinkedInJobAd[] = [];
  const seenIds = new Set<string>();

  for (const q of keywords) {
    try {
      // Query LinkedIn Public Search RSS / HTML endpoint for Sweden
      const searchUrl = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(
        q
      )}&location=${encodeURIComponent("Sweden")}&start=0`;

      const res = await fetch(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9,sv;q=0.8",
        },
        next: { revalidate: 0 },
      });

      if (!res.ok) continue;

      const html = await res.text();
      
      // Parse job card elements from LinkedIn HTML response
      const titleMatches = Array.from(html.matchAll(/<h3 class="base-search-card__title">([\s\S]*?)<\/h3>/g));
      const companyMatches = Array.from(html.matchAll(/<h4 class="base-search-card__subtitle">([\s\S]*?)<\/h4>/g));
      const locationMatches = Array.from(html.matchAll(/<span class="job-search-card__location">([\s\S]*?)<\/span>/g));
      const linkMatches = Array.from(html.matchAll(/<a class="base-card__full-link[^"]*" href="([^"?]*)/g));

      const count = Math.min(titleMatches.length, companyMatches.length, locationMatches.length, linkMatches.length);

      for (let i = 0; i < count; i++) {
        const rawTitle = titleMatches[i][1].replace(/<[^>]*>/g, "").trim();
        const rawCompany = companyMatches[i][1].replace(/<[^>]*>/g, "").trim();
        const rawLocation = locationMatches[i][1].replace(/<[^>]*>/g, "").trim();
        const rawUrl = linkMatches[i][1].trim();

        // Extract LinkedIn Job ID from URL
        const idMatch = rawUrl.match(/-(\d+)/) || rawUrl.match(/view\/(\d+)/);
        const jobId = idMatch ? `li_${idMatch[1]}` : `li_${Math.random().toString(36).substring(2, 10)}`;

        if (!seenIds.has(jobId) && rawTitle && rawCompany) {
          seenIds.add(jobId);
          jobs.push({
            id: jobId,
            headline: rawTitle,
            company: rawCompany,
            location: rawLocation || "Sweden",
            description: `${rawTitle} at ${rawCompany} located in ${rawLocation}. Key skills required for ${q} role.`,
            webpageUrl: rawUrl,
            publicationDate: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching LinkedIn jobs for query "${q}":`, error);
    }
  }

  return jobs;
}
