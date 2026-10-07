import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/authHelper";
import {
  createDatabaseSession,
  setSessionCookie,
  clearSessionCookie,
  hashToken,
  isValidTokenFormat,
} from "@/lib/sessionService";
import {
  hashPassword,
  verifyPassword,
  isLegacyHash,
  verifyLegacyPassword,
} from "@/lib/services/passwordService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, email, password, name, rememberMe } = await req.json();
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (action === "logout") {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(/(?:^|;\s*)jobseeker_session=([0-9a-fA-F]{64})(?:;|$)/);
      const rawToken = match ? match[1] : req.cookies.get("jobseeker_session")?.value;

      if (rawToken && isValidTokenFormat(rawToken)) {
        const sessionTokenHash = hashToken(rawToken);
        await db.userSession.deleteMany({ where: { sessionTokenHash } });
      }

      const response = NextResponse.json({ success: true, message: "Logged out" });
      return clearSessionCookie(response);
    }

    if (action === "register") {
      if (!normalizedEmail || !password || !name) {
        return NextResponse.json(
          { error: "Name, Email, and Password are required" },
          { status: 400 }
        );
      }

      const existing = await db.userAccount.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        return NextResponse.json(
          { error: "Account with this email already exists" },
          { status: 400 }
        );
      }

      const passwordHash = await hashPassword(password);
      const isRemember = rememberMe !== false;

      const { user, rawToken } = await db.$transaction(async (tx) => {
        const newUser = await tx.userAccount.create({
          data: {
            email: normalizedEmail,
            name,
            passwordHash,
          },
        });

        await tx.userProfile.create({
          data: {
            userAccountId: newUser.id,
            name,
            headline: "Software & Systems Engineer",
            location: "Sweden",
            languages: "English, Swedish",
            targetRoles: JSON.stringify([
              "Fullstack Developer",
              "Systems Engineer",
              "Software Architect",
            ]),
            skills: JSON.stringify({
              software: ["React", "TypeScript", "Next.js", "Node.js"],
              systems: ["Systems Engineering", "Requirements"],
              quality: ["Quality Assurance"],
              industrial: ["Automation"],
            }),
            minMatchScore: 50,
          },
        });

        const { rawToken } = await createDatabaseSession(
          tx as unknown as Parameters<typeof createDatabaseSession>[0],
          newUser.id,
          isRemember
        );
        return { user: newUser, rawToken };
      });

      const userData = { id: user.id, email: user.email, name: user.name };
      const response = NextResponse.json({
        success: true,
        user: userData,
      });

      return setSessionCookie(response, rawToken, isRemember);
    }

    if (action === "login") {
      if (!normalizedEmail || !password) {
        return NextResponse.json({ error: "Email and password required" }, { status: 400 });
      }

      const user = await db.userAccount.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      let isValid = false;
      let needsUpgrade = false;

      if (isLegacyHash(user.passwordHash)) {
        isValid = verifyLegacyPassword(password, user.passwordHash);
        if (isValid) {
          needsUpgrade = true;
        }
      } else {
        isValid = await verifyPassword(password, user.passwordHash);
      }

      if (!isValid) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      if (needsUpgrade) {
        try {
          const upgradedHash = await hashPassword(password);
          await db.userAccount.update({
            where: { id: user.id },
            data: { passwordHash: upgradedHash },
          });
        } catch (upgradeErr) {
          console.error("Failed to upgrade legacy password hash:", upgradeErr);
        }
      }

      const isRemember = rememberMe !== false;
      const { rawToken } = await createDatabaseSession(db, user.id, isRemember);

      const userData = { id: user.id, email: user.email, name: user.name };
      const response = NextResponse.json({
        success: true,
        user: userData,
      });

      return setSessionCookie(response, rawToken, isRemember);
    }

    if (action === "reset-password") {
      if (!normalizedEmail || !password) {
        return NextResponse.json({ error: "Email and new password are required" }, { status: 400 });
      }

      const user = await db.userAccount.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        return NextResponse.json(
          { error: "No account found with this email address" },
          { status: 404 }
        );
      }

      const passwordHash = await hashPassword(password);

      // Atomic password update and multi-device session revocation
      await db.$transaction(async (tx) => {
        await tx.userAccount.update({
          where: { email: normalizedEmail },
          data: { passwordHash },
        });

        await tx.userSession.deleteMany({
          where: { userAccountId: user.id },
        });
      });

      const response = NextResponse.json({
        success: true,
        message: "Password reset successfully. You may now log in with your new password.",
      });

      return clearSessionCookie(response);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const rawError = error instanceof Error ? error.message : "";
    const isDbUnreachable =
      rawError.includes("Can't reach database server") ||
      rawError.includes("P1001") ||
      rawError.includes("P1002");

    const userFacingError = isDbUnreachable
      ? "Database server is temporarily unreachable. Please check your database connection."
      : rawError || "Authentication error";

    return NextResponse.json({ error: userFacingError }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|;\s*)jobseeker_session=([0-9a-fA-F]{64})(?:;|$)/);
    const rawToken = match ? match[1] : req.cookies.get("jobseeker_session")?.value;

    if (rawToken && isValidTokenFormat(rawToken)) {
      const sessionTokenHash = hashToken(rawToken);
      await db.userSession.deleteMany({ where: { sessionTokenHash } });
    }
  } catch {}

  const response = NextResponse.json({ success: true, message: "Session ended" });
  return clearSessionCookie(response);
}
