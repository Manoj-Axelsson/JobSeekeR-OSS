import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    let profile = await db.userProfile.findFirst();

    if (!profile) {
      // Create initial profile if none exists
      profile = await db.userProfile.create({
        data: {
          id: "user_main",
          name: "Candidate",
          headline: "Software & Systems Engineer",
          location: "Sweden",
          languages: "English, Swedish",
          targetRoles: JSON.stringify([
            "Fullstack Developer",
            "Systems Engineer",
            "Software Architect",
            "Quality Assurance Engineer",
            "Manufacturing Engineer"
          ]),
          skills: JSON.stringify({
            software: ["React", "TypeScript", "Next.js", "Node.js", "PostgreSQL"],
            systems: ["Systems Engineering", "Requirements Management", "PLM"],
            quality: ["Six Sigma", "Lean", "FMEA"],
            industrial: ["Automation", "CAD/CAM"],
            custom: []
          }),
          minMatchScore: 50,
        },
      });
    }

    return NextResponse.json({
      ...profile,
      targetRoles: JSON.parse(profile.targetRoles || "[]"),
      skills: JSON.parse(profile.skills || "{}"),
      excludedCompanies: JSON.parse(profile.excludedCompanies || "[]"),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { name, headline, location, languages, targetRoles, skills, minMatchScore, excludedCompanies } = body;

    let profile = await db.userProfile.findFirst();

    const dataToSave = {
      name: name || profile?.name || "JobseekeR User",
      headline: headline || profile?.headline || "Software & Systems Engineer",
      location: location || profile?.location || "Sweden",
      languages: languages || profile?.languages || "English, Swedish",
      targetRoles: JSON.stringify(targetRoles || []),
      skills: JSON.stringify(skills || {}),
      minMatchScore: minMatchScore ?? (profile?.minMatchScore || 50),
      excludedCompanies: JSON.stringify(excludedCompanies ?? (profile?.excludedCompanies ? JSON.parse(profile.excludedCompanies) : [])),
    };

    if (profile) {
      profile = await db.userProfile.update({
        where: { id: profile.id },
        data: dataToSave,
      });
    } else {
      profile = await db.userProfile.create({
        data: {
          id: "user_main",
          ...dataToSave,
        },
      });
    }

    return NextResponse.json({
      ...profile,
      targetRoles: JSON.parse(profile.targetRoles || "[]"),
      skills: JSON.parse(profile.skills || "{}"),
      excludedCompanies: JSON.parse(profile.excludedCompanies || "[]"),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
