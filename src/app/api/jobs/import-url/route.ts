import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { evaluateOpportunityAssessment } from "@/lib/services/matcher";
import { getAuthenticatedUser } from "@/lib/authHelper";
import { resolveCanonicalJob } from "@/lib/services/identity";
import { fetchJobPageHtml, SsrfSecurityError } from "@/lib/services/urlImporterSecurity";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, status: requestedStatus, notes } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "Please provide a valid Job URL" },
        { status: 400 }
      );
    }

    const jobStatus =
      requestedStatus && ["NEW", "SAVED", "APPLIED", "DISCARDED"].includes(requestedStatus)
        ? requestedStatus
        : "NEW";

    // Fetch webpage HTML with multi-layered SSRF protection
    let html: string;
    let finalUrl = url;
    try {
      const fetchResult = await fetchJobPageHtml(url);
      html = fetchResult.html;
      finalUrl = fetchResult.finalUrl;
    } catch (err: unknown) {
      const isSsrf =
        err instanceof SsrfSecurityError ||
        (err instanceof Error &&
          (err.name === "SsrfSecurityError" ||
            err.message.includes("SSRF") ||
            err.message.includes("forbidden") ||
            err.message.includes("private") ||
            err.message.includes("reserved")));
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch URL for job import";
      return NextResponse.json(
        {
          success: false,
          error: isSsrf
            ? "Security Error: Access to private, local, or disallowed URL is forbidden."
            : errorMessage,
        },
        { status: 400 }
      );
    }

    let domain = "Career Portal";
    try {
      domain = new URL(finalUrl).hostname.replace(/^www\./, "");
    } catch {
      // ignore
    }

    let title = extractMeta(html, "og:title") || extractTitleTag(html) || "Imported Position";
    let company =
      extractMeta(html, "og:site_name") ||
      extractMeta(html, "author") ||
      extractCompanyFromTitle(title) ||
      domain;
    const description =
      extractMeta(html, "og:description") ||
      extractMeta(html, "description") ||
      stripHtml(html).slice(0, 1500);
    const location = extractLocation(html) || "Sweden";

    if (title.includes(" - ")) {
      const parts = title.split(" - ");
      title = parts[0].trim();
      if (!company || company === domain) {
        company = parts[1]?.trim() || company;
      }
    }

    const profile = await db.userProfile.findFirst({
      where: { userAccountId: user.id },
    });

    // Calculate Match Score using Opportunity Assessment Framework
    const match = evaluateOpportunityAssessment(
      {
        id: `import-${Date.now()}`,
        title,
        company,
        location,
        description,
      },
      {
        name: profile?.name || "Candidate",
        headline: profile?.headline || "Professional",
        skills: ["React", "TypeScript", "Systems Engineering"],
      }
    );

    // Save/Resolve Canonical Job using centralized identity service
    const { job: saved } = await resolveCanonicalJob(db, {
      externalId: `imported_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      title,
      company,
      location,
      description,
      webpageUrl: finalUrl,
      source: `${domain} (Direct Import)`,
      publishedAt: extractJobPostedDate(html) || new Date(),
      userAccountId: user.id,
      status: jobStatus,
      matchScore: match.matchScore,
      matchedSkills: JSON.stringify(match.matchedSkills),
      missingSkills: JSON.stringify(match.missingSkills || []),
      domainScores: JSON.stringify(match.domainScores),
    });

    if (jobStatus === "APPLIED") {
      const now = new Date();
      const monthlyTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const existingApp = await db.application.findFirst({
        where: { jobId: saved.id, OR: [{ userAccountId: user.id }, { userAccountId: null }] },
      });
      if (!existingApp) {
        await db.application.create({
          data: {
            userAccountId: user.id,
            jobId: saved.id,
            status: "APPLIED",
            appliedAt: now,
            resumeVersion: "JobseekeR Candidate CV",
            notes: notes || "Applied via direct URL import",
            monthlyTag,
          },
        });
      } else {
        await db.application.update({
          where: { id: existingApp.id },
          data: { userAccountId: user.id, status: "APPLIED", appliedAt: now },
        });
      }
    }

    return NextResponse.json({
      success: true,
      job: {
        ...saved,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills || [],
        domainScores: match.domainScores,
      },
    });
  } catch (error: unknown) {
    console.error("Error importing job URL:", error);
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { success: false, error: message || "Failed to import job" },
      { status: 500 }
    );
  }
}

function extractMeta(html: string, property: string): string | null {
  const reg1 = new RegExp(
    `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`,
    "i"
  );
  const reg2 = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`,
    "i"
  );
  const reg3 = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, "i");
  const reg4 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, "i");

  const m = html.match(reg1) || html.match(reg2) || html.match(reg3) || html.match(reg4);
  return m ? m[1].trim() : null;
}

function extractJobPostedDate(html: string): Date | null {
  const scripts = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  if (!scripts) return null;

  for (const script of scripts) {
    const content = script
      .replace(/^<script[^>]*>/i, "")
      .replace(/<\/script>$/i, "")
      .trim();

    try {
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        const type = item?.["@type"];
        const isJobPosting =
          type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"));

        if (isJobPosting && item.datePosted) {
          const date = new Date(item.datePosted);

          if (!Number.isNaN(date.getTime())) {
            return date;
          }
        }
      }
    } catch {
      // Ignore invalid JSON-LD blocks and continue.
    }
  }

  return null;
}

function extractTitleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : null;
}

function extractCompanyFromTitle(title: string): string | null {
  if (title.includes(" - ")) {
    return title.split(" - ")[1].trim();
  }
  if (title.includes(" at ")) {
    return title.split(" at ")[1].trim();
  }
  return null;
}

function extractLocation(html: string): string | null {
  if (html.includes("Stockholm")) return "Stockholm, Sweden";
  if (html.includes("Gothenburg") || html.includes("Göteborg")) return "Gothenburg, Sweden";
  if (html.includes("Malmö")) return "Malmö, Sweden";
  if (html.includes("Remote")) return "Remote, Sweden";
  return "Sweden";
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}
