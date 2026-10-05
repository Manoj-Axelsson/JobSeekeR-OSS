-- AlterTable: Add Phase 12 Assessment Persistence Fields to JobAd
ALTER TABLE "JobAd" ADD COLUMN IF NOT EXISTS "assessmentVersion" TEXT DEFAULT '3.0.0';
ALTER TABLE "JobAd" ADD COLUMN IF NOT EXISTS "matchGrade" TEXT;
ALTER TABLE "JobAd" ADD COLUMN IF NOT EXISTS "assessmentConfidence" TEXT;
ALTER TABLE "JobAd" ADD COLUMN IF NOT EXISTS "canonicalLocation" TEXT;
ALTER TABLE "JobAd" ADD COLUMN IF NOT EXISTS "locationConflict" BOOLEAN DEFAULT false;
ALTER TABLE "JobAd" ADD COLUMN IF NOT EXISTS "hardRequirements" TEXT;
ALTER TABLE "JobAd" ADD COLUMN IF NOT EXISTS "matchedRequirements" TEXT;
ALTER TABLE "JobAd" ADD COLUMN IF NOT EXISTS "missingRequirements" TEXT;
ALTER TABLE "JobAd" ADD COLUMN IF NOT EXISTS "enrichmentData" TEXT;
ALTER TABLE "JobAd" ADD COLUMN IF NOT EXISTS "positioningData" TEXT;
ALTER TABLE "JobAd" ADD COLUMN IF NOT EXISTS "legacyMatchScore" INTEGER;

-- AlterTable: Add Phase 5 Canonical Identity Fields to JobAd
ALTER TABLE "JobAd" ADD COLUMN IF NOT EXISTS "canonicalHash" TEXT;
ALTER TABLE "JobAd" ADD COLUMN IF NOT EXISTS "canonicalUrl" TEXT;

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "JobAd_canonicalHash_idx" ON "JobAd"("canonicalHash");
CREATE INDEX IF NOT EXISTS "JobAd_canonicalUrl_idx" ON "JobAd"("canonicalUrl");
