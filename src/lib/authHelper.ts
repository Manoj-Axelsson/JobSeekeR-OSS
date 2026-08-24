import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { UserAccount } from "@prisma/client";

/**
 * Shared authentication helper that extracts and validates the jobseeker_session cookie.
 * Uses exact authentication parsing semantics consistent with /api/auth.
 */
export async function getAuthenticatedUser(req: NextRequest | Request): Promise<UserAccount | null> {
  try {
    let sessionCookie: string | undefined;

    if (req.headers && typeof req.headers.get === "function") {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(/jobseeker_session=([^;]+)/);
      if (match) {
        sessionCookie = match[1];
      }
    }

    if (!sessionCookie && "cookies" in req && typeof (req as NextRequest).cookies?.get === "function") {
      sessionCookie = (req as NextRequest).cookies.get("jobseeker_session")?.value;
    }

    if (!sessionCookie) {
      return null;
    }

    if (sessionCookie.includes("%")) {
      try {
        sessionCookie = decodeURIComponent(sessionCookie);
      } catch {}
    }

    const sessionData = JSON.parse(sessionCookie);

    const email = (sessionData?.email || "").trim().toLowerCase();
    if (!email) {
      return null;
    }

    const user = await db.userAccount.findUnique({ where: { email } });
    return user;
  } catch {
    return null;
  }
}
