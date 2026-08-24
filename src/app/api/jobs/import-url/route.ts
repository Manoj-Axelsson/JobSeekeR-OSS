import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { evaluateJobMatch } from "@/lib/services/matcher";

export async function POST(req: Request) {
  try {
    const { url, status: requestedStatus, notes } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ success: false, error: "Please provide a valid Job URL" }, { status: 400 });
    }

    const jobStatus = requestedStatus && ["NEW", "SAVED", "APPLIED", "DISCARDED"].includes(requestedStatus)
      ? requestedStatus
      : "NEW";

    // Check if job already exists in database
    const existing = await db.jobAd.findFirst({
      where: { webpageUrl: url },
    });

    if (existing) {
      let updated = existing;
      if (jobStatus !== existing.status) {
        updated = await db.jobAd.update({
          where: { id: existing.id },
          data: { status: jobStatus },
        });
      }

      if (jobStatus === "APPLIED") {
        const now = new Date();
        const monthlyTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const existingApp = await db.application.findFirst({ where: { jobId: existing.id } });
        if (!existingApp) {
          await db.application.create({
            data: {
              jobId: existing.id,
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
            data: { status: "APPLIED", appliedAt: now },
          });
        }
      }

      return NextResponse.json({
        success: true,
        alreadyImported: true,
        message: jobStatus === "APPLIED" ? "Job marked as APPLIED and saved to tracker!" : "Job already imported into feed!",
        job: {
          ...updated,
          matchedSkills: JSON.parse(updated.matchedSkills || "[]"),
          missingSkills: JSON.parse(updated.missingSkills || "[]"),
          domainScores: JSON.parse(updated.domainScores || "{}"),
        },
      });
    }

    // Fetch webpage HTML
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch URL (HTTP ${res.status})` },
        { status: 400 }
      );
    }

    const html = await res.text();

    // Parse domain name generically
    let domain = "Career Portal";
    try {
      domain = new URL(url).hostname.replace(/^www\./, "");
    } catch (e) {
      // ignore
    }

    // Extract OpenGraph / Meta tags
    let title = extractMeta(html, "og:title") || extractTitleTag(html) || "Imported Position";
    let company = extractMeta(html, "og:site_name") || extractMeta(html, "author") || extractCompanyFromTitle(title) || domain;
    let description = extractMeta(html, "og:description") || extractMeta(html, "description") || stripHtml(html).slice(0, 1500);
    let location = extractLocation(html) || "Sweden";

    // Clean up title generically (e.g. "Fullstack Developer - Company AB" -> title="Fullstack Developer", company="Company AB")
    if (title.includes(" - ")) {
      const parts = title.split(" - ");
      title = parts[0].trim();
      if (!company || company === domain) {
        company = parts[1]?.trim() || company;
      }
    }

    // Get candidate profile from DB
    const profile = await db.userProfile.findFirst();

    // Calculate Match Score using Matcher Engine
    const match = evaluateJobMatch(title, description, [], profile?.name || "JobseekeR Candidate", profile?.headline || "Software Engineer");

    // Save to Database
    const saved = await db.jobAd.create({
      data: {
        externalId: `imported_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        title,
        company,
        location,
        description,
        source: `${domain} (Direct Import)`,
        webpageUrl: url,
        publishedAt: new Date(),
        matchScore: match.matchScore,
        matchedSkills: JSON.stringify(match.matchedSkills),
        missingSkills: JSON.stringify(match.missingSkills || []),
        domainScores: JSON.stringify(match.domainScores),
        status: jobStatus,
      },
    });

    if (jobStatus === "APPLIED") {
      const now = new Date();
      const monthlyTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      await db.application.create({
        data: {
          jobId: saved.id,
          status: "APPLIED",
          appliedAt: now,
          resumeVersion: "JobseekeR Candidate CV",
          notes: notes || "Applied via direct URL import",
          monthlyTag,
        },
      });
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
  } catch (error: any) {
    console.error("Error importing job URL:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to import job" }, { status: 500 });
  }
}

function extractMeta(html: string, property: string): string | null {
  const reg1 = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, "i");
  const reg2 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, "i");
  const reg3 = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, "i");
  const reg4 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, "i");

  const m = html.match(reg1) || html.match(reg2) || html.match(reg3) || html.match(reg4);
  return m ? m[1].trim() : null;
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
  return html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
}
