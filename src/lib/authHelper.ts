import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { UserAccount } from "@prisma/client";
import { HEX_TOKEN_REGEX, hashToken } from "@/lib/sessionService";

/**
 * Canonical authentication helper validating database-backed session tokens.
 * Enforces strict 64-char hex token validation, duplicate cookie header rejection,
 * SHA-256 token hash lookup, and inclusive expiresAt <= now boundary check.
 */
export async function getAuthenticatedUser(
  req: NextRequest | Request
): Promise<UserAccount | null> {
  try {
    let rawToken: string | undefined;

    if (req.headers && typeof req.headers.get === "function") {
      const cookieHeader = req.headers.get("cookie") || "";

      // Match all occurrences of jobseeker_session cookies in the header string
      const matches = Array.from(cookieHeader.matchAll(/(?:^|;\s*)jobseeker_session=([^;]+)/g));

      // Reject ambiguous or duplicate cookie entries
      if (matches.length > 1) {
        return null;
      }

      if (matches.length === 1) {
        rawToken = matches[0][1];
      }
    }

    if (
      !rawToken &&
      "cookies" in req &&
      typeof (req as NextRequest).cookies?.get === "function"
    ) {
      rawToken = (req as NextRequest).cookies.get("jobseeker_session")?.value;
    }

    // Strict 64-character hex format validation prior to hashing or DB query
    if (!rawToken || !HEX_TOKEN_REGEX.test(rawToken)) {
      return null;
    }

    // Compute SHA-256 hash of raw cookie token
    const sessionTokenHash = hashToken(rawToken);

    // Single captured timestamp for consistent boundary checking
    const now = new Date();

    const session = await db.userSession.findUnique({
      where: { sessionTokenHash },
      include: { userAccount: true },
    });

    // Reject if session does not exist or if expiresAt <= now
    if (!session || session.expiresAt <= now) {
      return null;
    }

    return session.userAccount;
  } catch {
    return null;
  }
}
