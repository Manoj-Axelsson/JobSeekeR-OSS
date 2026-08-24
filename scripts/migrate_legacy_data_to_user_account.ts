import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

const db = new PrismaClient();

function getSqliteRows(tableName: string): any[] {
  const sqliteDbPath = path.join(process.cwd(), "prisma", "dev.db");
  if (!fs.existsSync(sqliteDbPath)) return [];
  try {
    const jsonOutput = execSync(
      `sqlite3 "${sqliteDbPath}" ".mode json" "SELECT * FROM ${tableName};"`,
      { encoding: "utf-8" }
    );
    return jsonOutput.trim() ? JSON.parse(jsonOutput) : [];
  } catch (e) {
    console.warn(`Could not extract table ${tableName} from SQLite:`, e);
    return [];
  }
}

async function main() {
  console.log("🚀 Starting Staged Legacy Migration from SQLite (prisma/dev.db) to PostgreSQL...");

  // 1. Extract SQLite rows
  const sqliteUsers = getSqliteRows("UserAccount");
  const sqliteJobs = getSqliteRows("JobAd");
  const sqliteApps = getSqliteRows("Application");
  const sqliteDocs = getSqliteRows("UserDocument");
  const sqliteProfiles = getSqliteRows("UserProfile");
  const sqliteCareers = getSqliteRows("CareerProfile");
  const sqliteSearch = getSqliteRows("SearchProfile");
  const sqliteLogs = getSqliteRows("ScanLog");

  console.log(`\n📦 Extracted SQLite Baseline Records:`);
  console.log(`- UserAccount:  ${sqliteUsers.length}`);
  console.log(`- JobAd:        ${sqliteJobs.length}`);
  console.log(`- Application:  ${sqliteApps.length}`);
  console.log(`- UserDocument: ${sqliteDocs.length}`);
  console.log(`- UserProfile:  ${sqliteProfiles.length}`);
  console.log(`- CareerProfile:${sqliteCareers.length}`);
  console.log(`- SearchProfile:${sqliteSearch.length}`);
  console.log(`- ScanLog:      ${sqliteLogs.length}\n`);

  // 2. Identify or Create Primary UserAccount in PostgreSQL
  let primaryUser = sqliteUsers[0];
  if (!primaryUser) {
    primaryUser = {
      id: "usr_primary_manoj",
      email: "manoj.axelsson@example.com",
      name: "Manoj John Axelsson",
      passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890",
    };
  }

  const userRecord = await db.userAccount.upsert({
    where: { email: primaryUser.email },
    update: { name: primaryUser.name },
    create: {
      id: primaryUser.id,
      email: primaryUser.email,
      name: primaryUser.name,
      passwordHash: primaryUser.passwordHash,
    },
  });

  console.log(`✅ PostgreSQL Primary Candidate Account: ${userRecord.name} (${userRecord.id})`);

  // 3. Migrate UserProfile
  for (const prof of sqliteProfiles) {
    await db.userProfile.upsert({
      where: { id: prof.id || "user_main" },
      update: {
        name: prof.name,
        headline: prof.headline,
        targetRoles: prof.targetRoles,
        skills: prof.skills,
      },
      create: {
        id: prof.id || "user_main",
        name: prof.name || "Manoj John Axelsson",
        headline: prof.headline || "Software & Systems Engineer",
        targetRoles: prof.targetRoles || "[]",
        skills: prof.skills || "{}",
      },
    });
  }

  // 4. Migrate CareerProfile
  for (const cp of sqliteCareers) {
    await db.careerProfile.upsert({
      where: { userAccountId: userRecord.id },
      update: {
        headline: cp.headline,
        skills: cp.skills,
        experience: cp.experience,
      },
      create: {
        userAccountId: userRecord.id,
        headline: cp.headline || "Software & Systems Engineer",
        skills: cp.skills || "[]",
        experience: cp.experience || "[]",
      },
    });
  }

  // 5. Migrate SearchProfiles
  for (const sp of sqliteSearch) {
    const existing = await db.searchProfile.findFirst({
      where: { userAccountId: userRecord.id, name: sp.name },
    });
    if (!existing) {
      await db.searchProfile.create({
        data: {
          userAccountId: userRecord.id,
          name: sp.name,
          isPrimary: Boolean(sp.isPrimary),
          targetOccupations: sp.targetOccupations || "[]",
          targetIndustries: sp.targetIndustries || "[]",
        },
      });
    }
  }

  // 6. Migrate UserDocuments
  for (const doc of sqliteDocs) {
    const existing = await db.userDocument.findUnique({
      where: { id: doc.id },
    });
    if (!existing) {
      await db.userDocument.create({
        data: {
          id: doc.id,
          userAccountId: userRecord.id,
          filename: doc.filename,
          fileType: doc.fileType,
          extractedText: doc.extractedText || "",
          extractedSkills: doc.extractedSkills || "[]",
          uploadedAt: new Date(doc.uploadedAt || Date.now()),
        },
      });
    }
  }

  // 7. Migrate JobAds (Assigning userAccountId)
  let migratedJobs = 0;
  const jobIdMap = new Map<string, string>(); // old SQLite id -> new PostgreSQL id

  for (const job of sqliteJobs) {
    const externalId = job.externalId || `job_${Date.now()}_${Math.random()}`;
    const existing = await db.jobAd.findFirst({
      where: { userAccountId: userRecord.id, externalId },
    });

    if (existing) {
      jobIdMap.set(job.id, existing.id);
    } else {
      const created = await db.jobAd.create({
        data: {
          userAccountId: userRecord.id,
          externalId,
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          webpageUrl: job.webpageUrl,
          source: job.source || "JobTech Platsbanken",
          publishedAt: new Date(job.publishedAt || Date.now()),
          deadline: job.deadline ? new Date(job.deadline) : null,
          matchScore: Number(job.matchScore || 0),
          matchedSkills: job.matchedSkills || "[]",
          missingSkills: job.missingSkills || "[]",
          domainScores: job.domainScores || "{}",
          status: job.status || "NEW",
        },
      });
      jobIdMap.set(job.id, created.id);
      migratedJobs++;
    }
  }

  // 8. Migrate Applications (Assigning userAccountId)
  let migratedApps = 0;
  for (const app of sqliteApps) {
    const targetJobId = jobIdMap.get(app.jobId);
    if (targetJobId) {
      const existing = await db.application.findFirst({
        where: { userAccountId: userRecord.id, jobId: targetJobId },
      });
      if (!existing) {
        await db.application.create({
          data: {
            userAccountId: userRecord.id,
            jobId: targetJobId,
            status: app.status || "APPLIED",
            appliedAt: new Date(app.appliedAt || Date.now()),
            resumeVersion: app.resumeVersion || "Manoj Axelsson CV",
            notes: app.notes || "Migrated from local storage",
            monthlyTag: app.monthlyTag || "2026-08",
          },
        });
        migratedApps++;
      }
    }
  }

  // 9. Verify PostgreSQL Counts
  const postUserCount = await db.userAccount.count();
  const postJobCount = await db.jobAd.count();
  const postAppCount = await db.application.count();
  const postDocCount = await db.userDocument.count();

  console.log("\n==========================================================");
  console.log("🎉 POSTGRESQL MIGRATION SUMMARY & COMPARISON REPORT");
  console.log("==========================================================");
  console.log(`Metric           | SQLite Source | PostgreSQL Migrated`);
  console.log(`-----------------+---------------+--------------------`);
  console.log(`UserAccount      | ${sqliteUsers.length.toString().padEnd(13)} | ${postUserCount}`);
  console.log(`JobAd            | ${sqliteJobs.length.toString().padEnd(13)} | ${postJobCount}`);
  console.log(`Application      | ${sqliteApps.length.toString().padEnd(13)} | ${postAppCount}`);
  console.log(`UserDocument     | ${sqliteDocs.length.toString().padEnd(13)} | ${postDocCount}`);
  console.log("==========================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Staged migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
