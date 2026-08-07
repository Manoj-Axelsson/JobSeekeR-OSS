import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const sourceDbPath = path.join(process.cwd(), "prisma", "dev.db");
  const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

  if (isVercel) {
    const tmpDbPath = path.join("/tmp", "dev.db");
    try {
      if (!fs.existsSync(tmpDbPath) && fs.existsSync(sourceDbPath)) {
        fs.copyFileSync(sourceDbPath, tmpDbPath);
      }
      return `file:${tmpDbPath}`;
    } catch (error) {
      console.error("Failed to copy database to /tmp:", error);
    }
  }

  return `file:${sourceDbPath}`;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
