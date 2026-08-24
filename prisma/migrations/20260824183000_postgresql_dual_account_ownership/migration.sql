-- Migration: PostgreSQL Dual Account Ownership & Composite ExternalId Uniqueness
-- Target: Neon PostgreSQL Production & Staged Backfill

-- 1. JobAd: Add userAccountId column, update foreign key relation, drop global externalId unique constraint, add composite per-account unique index
ALTER TABLE "JobAd" ADD COLUMN IF NOT EXISTS "userAccountId" TEXT;

DROP INDEX IF EXISTS "JobAd_externalId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "JobAd_userAccountId_externalId_key" ON "JobAd"("userAccountId", "externalId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'JobAd_userAccountId_fkey'
  ) THEN
    ALTER TABLE "JobAd" ADD CONSTRAINT "JobAd_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 2. Application: Add userAccountId column, update foreign key relation
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "userAccountId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Application_userAccountId_fkey'
  ) THEN
    ALTER TABLE "Application" ADD CONSTRAINT "Application_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
