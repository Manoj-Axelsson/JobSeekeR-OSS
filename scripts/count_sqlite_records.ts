import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

async function main() {
  const sqliteDbPath = path.join(process.cwd(), "prisma", "dev.db");
  console.log(`Checking recoverable SQLite database at: ${sqliteDbPath}`);

  if (!fs.existsSync(sqliteDbPath)) {
    console.error("SQLite database file not found!");
    process.exit(1);
  }

  // Temporary client pointing to local dev.db
  const localDb = new PrismaClient({
    datasources: {
      db: {
        url: `file:${sqliteDbPath}`,
      },
    },
  });

  try {
    const userCount = await localDb.userAccount.count();
    const jobCount = await localDb.jobAd.count();
    const appCount = await localDb.application.count();
    const docCount = await localDb.userDocument.count();
    const profileCount = await localDb.userProfile.count();
    const careerCount = await localDb.careerProfile.count();
    const searchCount = await localDb.searchProfile.count();
    const logCount = await localDb.scanLog.count();

    console.log("\n=== RECOVERABLE SQLITE Baseline Record Counts (prisma/dev.db) ===");
    console.log(`UserAccount:    ${userCount}`);
    console.log(`JobAd:          ${jobCount}`);
    console.log(`Application:    ${appCount}`);
    console.log(`UserDocument:   ${docCount}`);
    console.log(`UserProfile:    ${profileCount}`);
    console.log(`CareerProfile:  ${careerCount}`);
    console.log(`SearchProfile:  ${searchCount}`);
    console.log(`ScanLog:        ${logCount}`);
    console.log("=================================================================\n");
  } catch (err) {
    console.error("Error reading SQLite baseline:", err);
  } finally {
    await localDb.$disconnect();
  }
}

main();
