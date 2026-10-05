-- AlterTable: Add nullable userAccountId foreign key to UserProfile
ALTER TABLE "UserProfile" ADD COLUMN "userAccountId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userAccountId_key" ON "UserProfile"("userAccountId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
