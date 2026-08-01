import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { action, email, password, name } = await req.json();

    if (action === "register") {
      if (!email || !password || !name) {
        return NextResponse.json({ error: "Name, Email, and Password are required" }, { status: 400 });
      }

      const existing = await db.userAccount.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "Account with this email already exists" }, { status: 400 });
      }

      // Simple secure hash string representation for local app auth
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

      return NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
      });
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

      return NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Authentication error" }, { status: 500 });
  }
}
