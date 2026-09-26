import { SourceVacancy } from "@/lib/services/identity";

export interface WebbjobbRssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

/**
 * Deterministically parses a raw Webbjobb title line to extract title and location.
 * Examples:
 *   "Senior Requirements Analyst  Sundsvall" -> { title: "Senior Requirements Analyst", location: "Sundsvall" }
 *   "Java Developer  Luleå, Sweden" -> { title: "Java Developer", location: "Luleå, Sweden" }
 *   "Developer" -> { title: "Developer", location: "Sweden" }
 */
export function parseWebbjobbTitleAndLocation(rawTitle: string): { title: string; location: string } {
  const trimmed = rawTitle.trim();
  
  // Check for double space separator or trailing city name pattern
  if (trimmed.includes("  ")) {
    const parts = trimmed.split(/\s{2,}/);
    if (parts.length >= 2) {
      const title = parts.slice(0, -1).join(" ").trim();
      const location = parts[parts.length - 1].trim();
      if (title && location) {
        return { title, location };
      }
    }
  }

  // Check for trailing " - Location" pattern
  if (trimmed.includes(" - ")) {
    const parts = trimmed.split(" - ");
    const title = parts[0].trim();
    const location = parts[1].trim();
    if (title && location) {
      return { title, location };
    }
  }

  return { title: trimmed, location: "Sweden" };
}

/**
 * Deterministically extracts company name from Webbjobb RSS item description or title.
 * Returns empty string if company cannot be established without guessing.
 * Examples:
 *   "Company description: Ericsson AB Job description: ..." -> "Ericsson AB"
 *   "Product Designer till PRIMUS-SILVA i Bromma" -> "PRIMUS-SILVA"
 */
export function parseWebbjobbCompany(descriptionText: string, rawTitle?: string): string {
  const match = descriptionText.match(/Company description:\s*(.*?)(?=\s*Job description:|\n|$)/i);
  if (match && match[1] && match[1].trim()) {
    return match[1].trim();
  }
  if (rawTitle && rawTitle.includes(" till ")) {
    const titleMatch = rawTitle.match(/till\s+(.*?)(?:\s+i\s+|$)/i);
    if (titleMatch && titleMatch[1] && titleMatch[1].trim()) {
      return titleMatch[1].trim();
    }
  }
  return "";
}


/**
 * Deterministically extracts externalId from Webbjobb job URL.
 * Example:
 *   "https://webbjobb.io/jobb/347508/systemadministrator..." -> "wj_347508"
 */
export function parseWebbjobbExternalId(linkUrl: string): string {
  const match = linkUrl.match(/\/jobb\/(\d+)/i);
  if (match && match[1]) {
    return `wj_${match[1]}`;
  }
  // Fallback hash if URL format differs unexpectedly
  let hash = 0;
  for (let i = 0; i < linkUrl.length; i++) {
    hash = (hash << 5) - hash + linkUrl.charCodeAt(i);
    hash |= 0;
  }
  return `wj_${Math.abs(hash)}`;
}

/**
 * Parses XML text into WebbjobbRssItem list.
 */
export function parseWebbjobbRssXml(xmlText: string): WebbjobbRssItem[] {
  const items: WebbjobbRssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];
    
    const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/i);
    const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/i);
    const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

    const title = titleMatch ? titleMatch[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim() : "";
    const link = linkMatch ? linkMatch[1].replace(/&amp;/g, "&").trim() : "";
    const rawDesc = descMatch ? descMatch[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").trim() : "";
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : "";

    if (title && link) {
      items.push({ title, link, description: rawDesc, pubDate });
    }
  }

  return items;
}

/**
 * Converts a raw Webbjobb RSS Item into a normalized SourceVacancy.
 */
export function webbjobbItemToSourceVacancy(item: WebbjobbRssItem): SourceVacancy {
  const externalId = parseWebbjobbExternalId(item.link);
  const { title, location } = parseWebbjobbTitleAndLocation(item.title);
  const company = parseWebbjobbCompany(item.description, item.title);

  
  const cleanDescription = item.description
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const webpageUrl = item.link.split("?")[0];
  const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

  return {
    externalId,
    title,
    company,
    location,
    description: cleanDescription,
    webpageUrl,
    source: "Webbjobb.io",
    publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
    deadline: null,
  };
}

/**
 * Primary source adapter function for Webbjobb.io.
 * Fetches public RSS feed and returns normalized SourceVacancy array.
 */
export async function fetchWebbjobbVacancies(feedUrl: string = "https://webbjobb.io/rss/jobb.xml"): Promise<SourceVacancy[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: {
        "Accept": "application/rss+xml, application/xml, text/xml",
        "User-Agent": "JobSeekeR/1.0",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error(`Failed to fetch Webbjobb RSS feed (HTTP ${res.status})`);
      return [];
    }

    const xmlText = await res.text();
    const items = parseWebbjobbRssXml(xmlText);
    return items.map(webbjobbItemToSourceVacancy);
  } catch (error) {
    console.error("Error fetching Webbjobb RSS vacancies:", error);
    return [];
  }
}
