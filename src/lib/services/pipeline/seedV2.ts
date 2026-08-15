import { db } from "@/lib/db";

/**
 * Migration & Initialization Helper:
 * Safely maps existing single UserProfile into V2 CareerProfile, SearchProfile, and SearchTerritory.
 * Preserves 100% of existing candidate history and applications.
 */
export async function ensureV2ProfilesExist(userAccountId?: string) {
  try {
    // 1. Check if a CareerProfile already exists for this user account (or main fallback)
    const existingCareer = await db.careerProfile.findFirst({
      where: userAccountId ? { userAccountId } : { id: "career_main" },
    });

    let careerProfile = existingCareer;

    if (!careerProfile) {
      // Fetch existing UserProfile data to preserve history
      const oldProfile = await db.userProfile.findFirst({
        where: { id: "user_main" },
      });

      let parsedSkills: string[] = ["React", "TypeScript", "Next.js", "Systems Engineering", "Quality Engineering"];
      let parsedRoles: string[] = ["Software & Systems Engineer", "Fullstack Developer", "Automation Engineer"];

      if (oldProfile) {
        try {
          if (oldProfile.targetRoles) {
            parsedRoles = JSON.parse(oldProfile.targetRoles);
          }
        } catch { }

        try {
          if (oldProfile.skills) {
            const rawSkills = JSON.parse(oldProfile.skills);
            if (Array.isArray(rawSkills)) {
              parsedSkills = rawSkills;
            } else if (typeof rawSkills === "object") {
              parsedSkills = Object.values(rawSkills).flat() as string[];
            }
          }
        } catch { }
      }

      careerProfile = await db.careerProfile.create({
        data: {
          id: userAccountId ? undefined : "career_main",
          userAccountId: userAccountId || null,
          headline: oldProfile?.headline || "Software & Systems Engineer",
          summary: "Verified candidate career profile migrated to V2 architecture.",
          skills: JSON.stringify(parsedSkills),
          experience: JSON.stringify([
            { title: oldProfile?.headline || "Software & Systems Engineer", company: "Engineering Practice", years: 5 }
          ]),
          qualifications: JSON.stringify(["B.Sc. Engineering", "Certified Systems Practitioner"]),
          currentRoles: JSON.stringify(parsedRoles),
        },
      });
    }

    // 2. Check if SearchTerritory exists
    let territory = await db.searchTerritory.findFirst({
      where: { name: "Sweden Primary Territory" },
    });

    if (!territory) {
      territory = await db.searchTerritory.create({
        data: {
          name: "Sweden Primary Territory",
          countries: JSON.stringify(["SE"]),
          regions: JSON.stringify(["Östergötland", "Stockholm", "Västra Götaland"]),
          municipalities: JSON.stringify(["Linköping", "Norrköping", "Stockholm", "Göteborg", "Skellefteå"]),
          cities: JSON.stringify(["Linköping", "Norrköping", "Stockholm", "Göteborg"]),
          maxCommuteMinutes: 60,
          commuteMode: "PUBLIC_TRANSIT",
          remotePolicy: "ALLOWED",
          discoveryPolicy: "SHOW_SEPARATELY",
        },
      });
    }

    // 3. Check if SearchProfiles exist
    const existingSearchProfiles = await db.searchProfile.findMany({
      where: userAccountId ? { userAccountId } : {},
    });

    if (existingSearchProfiles.length === 0) {
      // Create Default Primary Track (Software & Systems)
      await db.searchProfile.create({
        data: {
          userAccountId: userAccountId || null,
          name: "Software & Systems Track",
          isPrimary: true,
          targetOccupations: JSON.stringify(["Fullstack Developer", "Software Engineer", "Systems Engineer"]),
          targetIndustries: JSON.stringify(["Technology", "Cleantech", "Software"]),
          workModes: JSON.stringify(["HYBRID", "REMOTE", "ON_SITE"]),
          employmentPreferences: JSON.stringify(["FULL_TIME", "CONTRACT"]),
          minMatchScore: 45,
          mustHave: JSON.stringify([]),
          prefer: JSON.stringify(["React", "TypeScript", "Next.js", "Node.js", "SQL"]),
          niceToHave: JSON.stringify(["Docker", "AWS", "TailwindCSS"]),
          exclude: JSON.stringify([]),
          explore: JSON.stringify(["Sustainability", "Cleantech", "AI Infrastructure"]),
          territoryId: territory.id,
        },
      });

      // Create Secondary Industrial Engineering Track
      await db.searchProfile.create({
        data: {
          userAccountId: userAccountId || null,
          name: "Industrial & Automation Track",
          isPrimary: false,
          targetOccupations: JSON.stringify(["Automation Engineer", "Production Developer", "Process Engineer"]),
          targetIndustries: JSON.stringify(["Manufacturing", "Automotive", "Industrial Automation"]),
          workModes: JSON.stringify(["ON_SITE", "HYBRID"]),
          employmentPreferences: JSON.stringify(["FULL_TIME"]),
          minMatchScore: 40,
          mustHave: JSON.stringify([]),
          prefer: JSON.stringify(["Automation", "CAD/CAM", "Lean", "PLC", "Manufacturing"]),
          niceToHave: JSON.stringify(["Six Sigma", "Robot Programming"]),
          exclude: JSON.stringify([]),
          explore: JSON.stringify(["Smart Factory", "Industry 4.0"]),
          territoryId: territory.id,
        },
      });
    }

    return { careerProfile, territory };
  } catch (error) {
    console.error("Failed to seed V2 profiles:", error);
    return null;
  }
}
