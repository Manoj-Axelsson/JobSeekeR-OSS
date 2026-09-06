import crypto from "crypto";

/**
 * Normalizes web URLs by removing tracking noise while preserving meaningful path and vacancy parameters.
 */
export function normalizeUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith("www.")) {
      hostname = hostname.slice(4);
    }

    const protocol = parsed.protocol.toLowerCase();

    // Query parameters to strip (tracking/referral noise)
    const trackingParams = new Set([
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "gclid",
      "fbclid",
      "ref",
      "referrer",
      "trackingid",
      "refid",
      "trk",
      "sf_id",
      "mid",
      "originalsubdomain",
      "lipi",
      "licu",
    ]);

    const cleanParams = new URLSearchParams();
    parsed.searchParams.forEach((val, key) => {
      if (!trackingParams.has(key.toLowerCase())) {
        cleanParams.append(key, val);
      }
    });

    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    const queryString = cleanParams.toString();
    return `${protocol}//${hostname}${pathname}${queryString ? `?${queryString}` : ""}`;
  } catch {
    // If URL parsing fails, perform regex fallback cleaning
    return trimmed
      .replace(/(\?|&)(utm_[^&]+|gclid=[^&]+|fbclid=[^&]+|ref=[^&]+|trackingId=[^&]+)/gi, "")
      .replace(/\/$/, "");
  }
}

/**
 * Unicode-aware, case-folded, whitespace-normalized string normalization.
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text || typeof text !== "string") return "";
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Computes deterministic SHA-256 hash for real-world job identity.
 * Combines normalized company, title, canonical location, and description signature
 * to prevent over-merging distinct vacancies.
 */
export function computeCanonicalHash(
  company: string,
  title: string,
  location: string,
  description?: string
): string {
  const normCompany = normalizeText(company);
  const normTitle = normalizeText(title);
  const normLocation = normalizeText(location);

  let descSignature = "";
  if (description) {
    const cleanDesc = normalizeText(description);
    // Take first 150 characters of normalized description as stable vacancy signature
    descSignature = cleanDesc.slice(0, 150);
  }

  const rawString = `${normCompany}::${normTitle}::${normLocation}::${descSignature}`;
  return crypto.createHash("sha256").update(rawString, "utf8").digest("hex");
}
