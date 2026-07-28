import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    let profile = await db.userProfile.findUnique({
      where: { id: "user_manoj" },
    });

    if (!profile) {
      profile = await db.userProfile.create({
        data: {
          id: "user_manoj",
          name: "Manoj John Axelsson",
          headline: "Systems Engineer | Fullstack Developer | Manufacturing & Quality Improvement",
          location: "Sweden",
          languages: "English, Swedish, Malayalam",
          targetRoles: JSON.stringify(["Fullstack Developer", "Systems Engineer", "Manufacturing Engineer", "QA Engineer"]),
          skills: JSON.stringify({ software: ["React", "TypeScript", "Next.js"], systems: ["Systems Thinking"], quality: ["Six Sigma"], industrial: ["Lean"] }),
          minMatchScore: 45,
        },
      });
    }

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { headline, location, minMatchScore, targetRoles, skills } = body;

    const profile = await db.userProfile.update({
      where: { id: "user_manoj" },
      data: {
        headline,
        location,
        minMatchScore,
        targetRoles: typeof targetRoles === "string" ? targetRoles : JSON.stringify(targetRoles),
        skills: typeof skills === "string" ? skills : JSON.stringify(skills),
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
