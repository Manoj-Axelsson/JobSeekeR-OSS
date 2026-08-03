export interface LinkedInJobAd {
  id: string;
  headline: string;
  company: string;
  location: string;
  description: string;
  webpageUrl: string;
  publicationDate: string;
}

async function fetchLinkedInJobDetails(jobIdNumeric: string): Promise<string | null> {
  try {
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobIdNumeric}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,sv;q=0.8",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    // Extract main job description section from LinkedIn HTML
    const markupMatch =
      html.match(/<div class="show-more-less-html__markup[^"]*">([\s\S]*?)<\/div>/i) ||
      html.match(/<section class="description">([\s\S]*?)<\/section>/i) ||
      html.match(/<div class="description__text[^"]*">([\s\S]*?)<\/div>/i);

    if (markupMatch && markupMatch[1]) {
      const cleanText = markupMatch[1]
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return cleanText;
    }
  } catch {
    // Ignore detail fetch errors and use synthesized description fallback
  }
  return null;
}

export async function fetchLinkedInSwedishJobs(
  keywords: string[] = ["fullstack", "react typescript", "systems engineer", "manufacturing engineer", "quality engineer", "automation engineer"]
): Promise<LinkedInJobAd[]> {
  const jobs: LinkedInJobAd[] = [];
  const seenIds = new Set<string>();

  for (const q of keywords) {
    try {
      // Query LinkedIn Public Search endpoint for Sweden
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
        const numericId = idMatch ? idMatch[1] : null;
        const jobId = numericId ? `li_${numericId}` : `li_${Math.random().toString(36).substring(2, 10)}`;

        if (!seenIds.has(jobId) && rawTitle && rawCompany) {
          seenIds.add(jobId);

          let fullDesc: string | null = null;
          if (numericId) {
            fullDesc = await fetchLinkedInJobDetails(numericId);
          }

          const description = fullDesc && fullDesc.length > 50
            ? fullDesc
            : `${rawTitle} position at ${rawCompany} in ${rawLocation || "Sweden"}. Key domain responsibilities, skills, and qualifications for ${q} engineering role.`;

          jobs.push({
            id: jobId,
            headline: rawTitle,
            company: rawCompany,
            location: rawLocation || "Sweden",
            description,
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
