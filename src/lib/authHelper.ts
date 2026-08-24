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

    if ("cookies" in req && typeof (req as NextRequest).cookies?.get === "function") {
      sessionCookie = (req as NextRequest).cookies.get("jobseeker_session")?.value;
    }
    
    if (!sessionCookie && req.headers && typeof req.headers.get === "function") {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(/jobseeker_session=([^;]+)/);
      if (match) {
        sessionCookie = match[1];
      }
    }

    if (!sessionCookie) {
      return null;
    }

    if (sessionCookie.includes("%")) {
      try {
        sessionCookie = decodeURIComponent(sessionCookie);
      } catch {}
    }

    let sessionData = JSON.parse(sessionCookie);
    if (typeof sessionData === "string") {
      try {
        sessionData = JSON.parse(sessionData);
      } catch {}
    }

    const rawEmail = sessionData?.email;
    if (!rawEmail || typeof rawEmail !== "string") {
      return null;
    }

    const normalizedEmail = rawEmail.trim().toLowerCase();
    const user = await db.userAccount.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}
