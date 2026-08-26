import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureV2ProfilesExist } from "@/lib/services/pipeline/seedV2";
import { getAuthenticatedUser } from "@/lib/authHelper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureV2ProfilesExist(user.id);

    let profile = await db.userProfile.findFirst();
    const careerProfile = await db.careerProfile.findFirst({
      where: { userAccountId: user.id },
    });
    const searchProfiles = await db.searchProfile.findMany({
      where: { userAccountId: user.id },
      include: { territory: true },
    });

    if (!profile) {
      profile = await db.userProfile.create({
        data: {
          id: "user_main",
          name: user.name || "Candidate",
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
      name: user.name || profile.name,
      targetRoles: JSON.parse(profile.targetRoles || "[]"),
      skills: JSON.parse(profile.skills || "{}"),
      excludedCompanies: JSON.parse(profile.excludedCompanies || "[]"),
      v2: {
        careerProfile: careerProfile ? {
          ...careerProfile,
          skills: JSON.parse(careerProfile.skills || "[]"),
          experience: JSON.parse(careerProfile.experience || "[]"),
          qualifications: JSON.parse(careerProfile.qualifications || "[]"),
          currentRoles: JSON.parse(careerProfile.currentRoles || "[]"),
        } : null,
        searchProfiles: searchProfiles.map(sp => ({
          ...sp,
          targetOccupations: JSON.parse(sp.targetOccupations || "[]"),
          targetIndustries: JSON.parse(sp.targetIndustries || "[]"),
          workModes: JSON.parse(sp.workModes || "[]"),
          employmentPreferences: JSON.parse(sp.employmentPreferences || "[]"),
          mustHave: JSON.parse(sp.mustHave || "[]"),
          prefer: JSON.parse(sp.prefer || "[]"),
          niceToHave: JSON.parse(sp.niceToHave || "[]"),
          exclude: JSON.parse(sp.exclude || "[]"),
          explore: JSON.parse(sp.explore || "[]"),
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, headline, location, languages, targetRoles, skills, minMatchScore, excludedCompanies } = body;

    let profile = await db.userProfile.findFirst();

    const dataToSave = {
      name: name || user.name || profile?.name || "JobseekeR User",
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

    // Keep CareerProfile headline synchronized for authenticated user
    const career = await db.careerProfile.findFirst({
      where: { userAccountId: user.id },
    });
    if (career) {
      await db.careerProfile.update({
        where: { id: career.id },
        data: { headline: dataToSave.headline },
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
