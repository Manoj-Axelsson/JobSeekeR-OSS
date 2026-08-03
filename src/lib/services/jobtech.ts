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

export interface FetchJobsParams {
  keywords?: string[];
  limit?: number;
}

export async function fetchSwedishJobs(keywords: string[] = [
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
  "quality"
]): Promise<JobTechAd[]> {
  const allAds: JobTechAd[] = [];
  const seenIds = new Set<string>();

  for (const q of keywords) {
    try {
      const url = `https://jobsearch.api.jobtechdev.se/search?q=${encodeURIComponent(q)}&limit=25&offset=0&published-after=${getTodayNoonIso()}`;
      const res = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "JobSeekeR/1.0",
        },
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        // Fallback without published-after filter if today's count is small
        const fallbackUrl = `https://jobsearch.api.jobtechdev.se/search?q=${encodeURIComponent(q)}&limit=25&offset=0`;
        const fbRes = await fetch(fallbackUrl, {
          headers: { "Accept": "application/json" },
        });
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          for (const hit of fbData.hits || []) {
            if (!seenIds.has(hit.id)) {
              seenIds.add(hit.id);
              allAds.push(hit);
            }
          }
        }
        continue;
      }

      const data = await res.json();
      for (const hit of data.hits || []) {
        if (!seenIds.has(hit.id)) {
          seenIds.add(hit.id);
          allAds.push(hit);
        }
      }
    } catch (error) {
      console.error(`Error fetching jobs for query "${q}":`, error);
    }
  }

  // If no ads found for today, do a general recent query
  if (allAds.length === 0) {
    try {
      const url = `https://jobsearch.api.jobtechdev.se/search?q=engineer%20developer&limit=50`;
      const res = await fetch(url, { headers: { "Accept": "application/json" } });
      if (res.ok) {
        const data = await res.json();
        for (const hit of data.hits || []) {
          if (!seenIds.has(hit.id)) {
            seenIds.add(hit.id);
            allAds.push(hit);
          }
        }
      }
    } catch (e) {
      console.error("Fallback search error:", e);
    }
  }

  return allAds;
}

function getTodayNoonIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0); // Start of today
  return d.toISOString().split(".")[0];
}
