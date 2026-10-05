-- Reconcile Schema and Ownership Constraints Migration

-- 1. Create UserSession Table
CREATE TABLE IF NOT EXISTS "UserSession" (
    "id" TEXT NOT NULL,
    "sessionTokenHash" TEXT NOT NULL,
    "userAccountId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes for UserSession
CREATE UNIQUE INDEX IF NOT EXISTS "UserSession_sessionTokenHash_key" ON "UserSession"("sessionTokenHash");
CREATE INDEX IF NOT EXISTS "UserSession_userAccountId_idx" ON "UserSession"("userAccountId");

-- Foreign Key Constraint for UserSession -> UserAccount
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserSession_userAccountId_fkey'
  ) THEN
    ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userAccountId_fkey"
      FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 2. Add Foreign Key Constraint for UserDocument -> UserAccount
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserDocument_userAccountId_fkey'
  ) THEN
    ALTER TABLE "UserDocument" ADD CONSTRAINT "UserDocument_userAccountId_fkey"
      FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
