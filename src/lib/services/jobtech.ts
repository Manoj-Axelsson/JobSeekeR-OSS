import { SourceVacancy } from "@/lib/services/identity";

import { getPublicationCutoff, isFreshPublicationDate } from "@/lib/services/publicationFreshness";

export interface JobTechAd {
  id: string;
  headline: string;
  description: { text: string };
  employer: { name: string };
  workplace_address: { city?: string; municipality?: string; region?: string };
  webpage_url?: string;
  publication_date: string;
  application_deadline?: string;
  must_have?: { skills?: Array<{ label: string }> };
  nice_to_have?: { skills?: Array<{ label: string }> };
}

export function jobTechAdToSourceVacancy(ad: JobTechAd): SourceVacancy {
  const city = ad.workplace_address?.city || ad.workplace_address?.municipality || "Sweden";
  const descText = ad.description?.text || "";
  const companyName = ad.employer?.name || "Unknown Company";
  const webpageUrl = ad.webpage_url || `https://platsbanken.se/arbetsforetag/${ad.id}`;

  return {
    externalId: ad.id,
    title: ad.headline,
    company: companyName,
    location: city,
    description: descText,
    webpageUrl,
    source: "Arbetsförmedlingen JobTech",
    publishedAt: new Date(ad.publication_date || Date.now()),
    deadline: ad.application_deadline ? new Date(ad.application_deadline) : null,
  };
}

export interface FetchJobsParams {
  keywords?: string[];
  limit?: number;
}

export async function fetchSwedishJobs(
  keywords: string[] = [
    "fullstack",
    "developer",
    "engineer",
    "software",
    "systems",
    "frontend",
    "backend",
    "web",
    "cloud",
    "python",
    "react",
    "node",
    "automation",
    "quality",
  ],
  cutoff: Date = getPublicationCutoff()
): Promise<JobTechAd[]> {
  const allAds: JobTechAd[] = [];
  const seenIds = new Set<string>();
  const addFreshAds = (hits: JobTechAd[] = []) => {
    for (const hit of hits) {
      if (
        !hit?.id ||
        !isFreshPublicationDate(hit.publication_date, cutoff) ||
        seenIds.has(hit.id)
      ) {
        continue;
      }
      seenIds.add(hit.id);
      allAds.push(hit);
    }
  };

  for (const q of keywords) {
    try {
      const publishedAfter = cutoff.toISOString().split(".")[0];
      const url = `https://jobsearch.api.jobtechdev.se/search?q=${encodeURIComponent(q)}&limit=25&offset=0&published-after=${publishedAfter}`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "JobSeekeR/1.0",
        },
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        // Fallback without published-after filter if today's count is small
        const fallbackUrl = `https://jobsearch.api.jobtechdev.se/search?q=${encodeURIComponent(q)}&limit=25&offset=0`;
        const fbRes = await fetch(fallbackUrl, {
          headers: { Accept: "application/json" },
        });
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          addFreshAds(fbData.hits || []);
        }
        continue;
      }

      const data = await res.json();
      addFreshAds(data.hits || []);
    } catch (error) {
      console.error(`Error fetching jobs for query "${q}":`, error);
    }
  }

  // If no fresh ads are found, perform a general fallback search
  if (allAds.length === 0) {
    try {
      const url = `https://jobsearch.api.jobtechdev.se/search?q=engineer%20developer&limit=50`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const data = await res.json();
        addFreshAds(data.hits || []);
      }
    } catch (e) {
      console.error("Fallback search error:", e);
    }
  }

  return allAds;
}
