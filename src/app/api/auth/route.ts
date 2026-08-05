import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("jobseeker_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const sessionData = JSON.parse(sessionCookie);
    const user = await db.userAccount.findUnique({ where: { email: sessionData.email } });
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, email, password, name, rememberMe } = await req.json();

    if (action === "logout") {
      const response = NextResponse.json({ success: true, message: "Logged out" });
      response.cookies.set({
        name: "jobseeker_session",
        value: "",
        httpOnly: true,
        maxAge: 0,
        path: "/",
      });
      return response;
    }

    if (action === "register") {
      if (!email || !password || !name) {
        return NextResponse.json({ error: "Name, Email, and Password are required" }, { status: 400 });
      }

      const existing = await db.userAccount.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "Account with this email already exists" }, { status: 400 });
      }

      const passwordHash = Buffer.from(password).toString("base64");

      const user = await db.userAccount.create({
        data: {
          email,
          name,
          passwordHash,
        },
      });

      // Also create matching user profile
      const existingProfile = await db.userProfile.findFirst();
      if (!existingProfile) {
        await db.userProfile.create({
          data: {
            id: "user_main",
            name,
            headline: "Software & Systems Engineer",
            location: "Sweden",
            languages: "English, Swedish",
            targetRoles: JSON.stringify(["Fullstack Developer", "Systems Engineer", "Software Architect"]),
            skills: JSON.stringify({
              software: ["React", "TypeScript", "Next.js", "Node.js"],
              systems: ["Systems Engineering", "Requirements"],
              quality: ["Quality Assurance"],
              industrial: ["Automation"],
            }),
            minMatchScore: 50,
          },
        });
      }

      const userData = { id: user.id, email: user.email, name: user.name };
      const response = NextResponse.json({
        success: true,
        user: userData,
      });

      const maxAgeSeconds = rememberMe !== false ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
      response.cookies.set({
        name: "jobseeker_session",
        value: JSON.stringify(userData),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: maxAgeSeconds,
        path: "/",
      });

      return response;
    }

    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password required" }, { status: 400 });
      }

      const user = await db.userAccount.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      const passwordHash = Buffer.from(password).toString("base64");
      if (user.passwordHash !== passwordHash) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      const userData = { id: user.id, email: user.email, name: user.name };
      const response = NextResponse.json({
        success: true,
        user: userData,
      });

      const maxAgeSeconds = rememberMe !== false ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
      response.cookies.set({
        name: "jobseeker_session",
        value: JSON.stringify(userData),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: maxAgeSeconds,
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Authentication error" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Session ended" });
  response.cookies.set({
    name: "jobseeker_session",
    value: "",
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}
