import crypto from "crypto";

export function normalizeUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith("www.")) hostname = hostname.slice(4);
    const protocol = parsed.protocol.toLowerCase();

    const trackingParams = new Set([
      "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
      "gclid", "fbclid", "ref", "referrer", "trackingid", "refid", "trk",
      "sf_id", "mid", "originalsubdomain", "lipi", "licu",
    ]);

    const cleanParams = new URLSearchParams();
    parsed.searchParams.forEach((val, key) => {
      if (!trackingParams.has(key.toLowerCase())) cleanParams.append(key, val);
    });

    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) pathname = pathname.slice(0, -1);

    const queryString = cleanParams.toString();
    return `${protocol}//${hostname}${pathname}${queryString ? `?${queryString}` : ""}`;
  } catch {
    return trimmed
      .replace(/(\?|&)(utm_[^&]+|gclid=[^&]+|fbclid=[^&]+|ref=[^&]+|trackingId=[^&]+)/gi, "")
      .replace(/\/$/, "");
  }
}

export function normalizeText(text: string | null | undefined): string {
  if (!text || typeof text !== "string") return "";
  return text.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

export function computeCanonicalHash(company: string, title: string, location: string): string {
  const normCompany = normalizeText(company);
  const normTitle = normalizeText(title);
  const normLocation = normalizeText(location);
  return crypto.createHash("sha256").update(`${normCompany}::${normTitle}::${normLocation}`, "utf8").digest("hex");
}

export interface IngestionVacancyInput {
  externalId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  webpageUrl?: string | null;
  source: string;
  publishedAt: Date;
  deadline?: Date | null;
  userAccountId?: string | null;
  status?: string;
  matchScore?: number;
  matchedSkills?: string;
  missingSkills?: string;
  domainScores?: string;
}

export interface IdentityResolutionResult {
  job: any;
  isNew: boolean;
  canonicalUrl: string | null;
  canonicalHash: string;
}

const resolutionLocks = new Map<string, Promise<void>>();

export function getActiveLockCount(): number {
  return resolutionLocks.size;
}

async function acquireCanonicalLock(key: string): Promise<() => void> {
  const currentLock = resolutionLocks.get(key) || Promise.resolve();
  let releaseNext: () => void;
  const nextLock = currentLock.then(() => new Promise<void>((resolve) => { releaseNext = resolve; }));
  resolutionLocks.set(key, nextLock);
  await currentLock.catch(() => {});
  return () => {
    releaseNext!();
    if (resolutionLocks.get(key) === nextLock) resolutionLocks.delete(key);
  };
}

function hashStringToBigInt(str: string): string {
  let hash = BigInt(0);
  const factor = BigInt(31);
  for (let i = 0; i < str.length; i++) {
    hash = BigInt.asIntN(64, hash * factor + BigInt(str.charCodeAt(i)));
  }
  return hash.toString();
}

export async function resolveCanonicalJob(
  dbClient: any,
  input: IngestionVacancyInput
): Promise<IdentityResolutionResult> {
  const canonicalUrl = normalizeUrl(input.webpageUrl);
  const canonicalHash = computeCanonicalHash(input.company, input.title, input.location);
  const release = await acquireCanonicalLock(canonicalHash);

  try {
    const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || "";
    const isPostgres = dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://");

    const runResolution = async (client: any) => {
      if (isPostgres && typeof client.$executeRawUnsafe === "function") {
        const lockId = hashStringToBigInt(canonicalHash);
        await client.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${lockId});`);
      }

      const targetUserAccountId = input.userAccountId ?? null;

      let existingJob = await client.jobAd.findFirst({
        where: {
          externalId: input.externalId,
          OR: [{ userAccountId: targetUserAccountId }, { userAccountId: null }],
        },
        orderBy: { createdAt: "desc" },
      });

      if (!existingJob && canonicalUrl) {
        existingJob = await client.jobAd.findFirst({
          where: {
            canonicalUrl,
            OR: [{ userAccountId: targetUserAccountId }, { userAccountId: null }],
          },
          orderBy: { createdAt: "desc" },
        });
      }

      if (!existingJob && canonicalHash) {
        existingJob = await client.jobAd.findFirst({
          where: {
            canonicalHash,
            OR: [{ userAccountId: targetUserAccountId }, { userAccountId: null }],
          },
          orderBy: { createdAt: "desc" },
        });
      }

      if (existingJob) {
        let mergedSource = existingJob.source;
        if (input.source && !existingJob.source.includes(input.source)) {
          mergedSource = `${existingJob.source} | ${input.source}`;
        }
        const updatedUserAccountId = existingJob.userAccountId || targetUserAccountId;
        const updatedJob = await client.jobAd.update({
          where: { id: existingJob.id },
          data: {
            canonicalHash: existingJob.canonicalHash || canonicalHash,
            canonicalUrl: existingJob.canonicalUrl || canonicalUrl,
            userAccountId: updatedUserAccountId,
            source: mergedSource,
            webpageUrl: existingJob.webpageUrl || input.webpageUrl,
            status: input.status && input.status !== "NEW" ? input.status : existingJob.status,
          },
        });
        return { job: updatedJob, isNew: false, canonicalUrl: updatedJob.canonicalUrl, canonicalHash: updatedJob.canonicalHash };
      }

      const newJob = await client.jobAd.create({
        data: {
          externalId: input.externalId, title: input.title, company: input.company, location: input.location,
          description: input.description.slice(0, 3000), webpageUrl: input.webpageUrl || null,
          source: input.source, publishedAt: input.publishedAt, deadline: input.deadline || null,
          userAccountId: targetUserAccountId, canonicalHash, canonicalUrl,
          matchScore: input.matchScore ?? 0, matchedSkills: input.matchedSkills ?? "[]",
          missingSkills: input.missingSkills ?? "[]", domainScores: input.domainScores ?? "{}",
          status: input.status ?? "NEW",
        },
      });
      return { job: newJob, isNew: true, canonicalUrl, canonicalHash };
    };

    if (typeof dbClient.$transaction === "function") {
      return await dbClient.$transaction(async (tx: any) => runResolution(tx));
    }
    return await runResolution(dbClient);
  } finally {
    release();
  }
}
