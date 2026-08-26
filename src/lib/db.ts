import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string {
  let url = process.env.DATABASE_URL;

  if (!url) {
    const isProduction = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
    if (isProduction) {
      throw new Error("FATAL: DATABASE_URL environment variable is required in production mode.");
    }
    // Fallback for local development if DATABASE_URL not set
    url = process.env.LOCAL_DATABASE_URL || "file:./prisma/dev.db";
  }

  // Ensure PostgreSQL connections have adequate connect_timeout for Neon compute wake-ups
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    if (!url.includes("connect_timeout=")) {
      const separator = url.includes("?") ? "&" : "?";
      url = `${url}${separator}connect_timeout=30`;
    }
  }

  return url;
}

const dbUrl = getDatabaseUrl();

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
