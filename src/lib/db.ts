import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const isProduction = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  if (isProduction) {
    throw new Error("FATAL: DATABASE_URL environment variable is required in production mode.");
  }

  // Fallback for local development if DATABASE_URL not set
  return process.env.LOCAL_DATABASE_URL || "file:./prisma/dev.db";
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
