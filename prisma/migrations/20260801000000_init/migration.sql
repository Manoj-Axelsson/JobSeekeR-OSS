-- CreateTable: UserAccount
CREATE TABLE "UserAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserProfile
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Candidate',
    "headline" TEXT NOT NULL DEFAULT 'Software & Systems Engineer',
    "location" TEXT NOT NULL DEFAULT 'Sweden',
    "languages" TEXT NOT NULL DEFAULT 'English, Swedish',
    "targetRoles" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "minMatchScore" INTEGER NOT NULL DEFAULT 50,
    "excludedCompanies" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CareerProfile
CREATE TABLE "CareerProfile" (
    "id" TEXT NOT NULL,
    "userAccountId" TEXT,
    "headline" TEXT NOT NULL DEFAULT 'Software & Systems Engineer',
    "summary" TEXT,
    "skills" TEXT NOT NULL DEFAULT '[]',
    "experience" TEXT NOT NULL DEFAULT '[]',
    "qualifications" TEXT NOT NULL DEFAULT '[]',
    "currentRoles" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SearchTerritory
CREATE TABLE "SearchTerritory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Sweden Primary Territory',
    "countries" TEXT NOT NULL DEFAULT '["SE"]',
    "regions" TEXT NOT NULL DEFAULT '[]',
    "municipalities" TEXT NOT NULL DEFAULT '[]',
    "cities" TEXT NOT NULL DEFAULT '[]',
    "maxCommuteMinutes" INTEGER NOT NULL DEFAULT 60,
    "commuteMode" TEXT NOT NULL DEFAULT 'PUBLIC_TRANSIT',
    "remotePolicy" TEXT NOT NULL DEFAULT 'ALLOWED',
    "discoveryPolicy" TEXT NOT NULL DEFAULT 'SHOW_SEPARATELY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchTerritory_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SearchProfile
CREATE TABLE "SearchProfile" (
    "id" TEXT NOT NULL,
    "userAccountId" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Primary Track',
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "targetOccupations" TEXT NOT NULL DEFAULT '[]',
    "targetIndustries" TEXT NOT NULL DEFAULT '[]',
    "workModes" TEXT NOT NULL DEFAULT '["HYBRID", "REMOTE", "ON_SITE"]',
    "employmentPreferences" TEXT NOT NULL DEFAULT '["FULL_TIME", "CONTRACT"]',
    "minMatchScore" INTEGER NOT NULL DEFAULT 45,
    "mustHave" TEXT NOT NULL DEFAULT '[]',
    "prefer" TEXT NOT NULL DEFAULT '[]',
    "niceToHave" TEXT NOT NULL DEFAULT '[]',
    "exclude" TEXT NOT NULL DEFAULT '[]',
    "explore" TEXT NOT NULL DEFAULT '[]',
    "territoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserDocument
CREATE TABLE "UserDocument" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "extractedText" TEXT NOT NULL,
    "extractedSkills" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Recruiter
CREATE TABLE "Recruiter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "linkedinUrl" TEXT,
    "avgResponseDays" DOUBLE PRECISION NOT NULL DEFAULT 6.0,
    "replyRate" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "prefersPortfolio" BOOLEAN NOT NULL DEFAULT false,
    "seniorityPreference" TEXT NOT NULL DEFAULT 'SENIOR',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recruiter_pkey" PRIMARY KEY ("id")
);

-- CreateTable: JobAd
CREATE TABLE "JobAd" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "webpageUrl" TEXT,
    "source" TEXT NOT NULL DEFAULT 'JobTech Platsbanken',
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "deadline" TIMESTAMP(3),
    "matchScore" INTEGER NOT NULL,
    "matchedSkills" TEXT NOT NULL,
    "missingSkills" TEXT NOT NULL,
    "domainScores" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "feedType" TEXT NOT NULL DEFAULT 'PRIMARY',
    "eligibilityStatus" TEXT NOT NULL DEFAULT 'ELIGIBLE',
    "capabilityScore" INTEGER NOT NULL DEFAULT 0,
    "intentScore" INTEGER NOT NULL DEFAULT 0,
    "probableOccupations" TEXT NOT NULL DEFAULT '[]',
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryCurrency" TEXT DEFAULT 'SEK',
    "salaryRawText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobAd_pkey" PRIMARY KEY ("id")
);

-- CreateTable: JobAdSearchProfile
CREATE TABLE "JobAdSearchProfile" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "searchProfileId" TEXT NOT NULL,
    "feedType" TEXT NOT NULL DEFAULT 'PRIMARY',
    "eligibilityStatus" TEXT NOT NULL DEFAULT 'ELIGIBLE',
    "capabilityScore" INTEGER NOT NULL DEFAULT 0,
    "intentScore" INTEGER NOT NULL DEFAULT 0,
    "totalMatchScore" INTEGER NOT NULL DEFAULT 0,
    "matchedSkills" TEXT NOT NULL DEFAULT '[]',
    "missingSkills" TEXT NOT NULL DEFAULT '[]',
    "probableOccupations" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobAdSearchProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Application
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "recruiterId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "responseOutcome" TEXT,
    "responseTimeDays" INTEGER,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resumeVersion" TEXT NOT NULL DEFAULT 'Manoj Axelsson - Fullstack Architecture CV',
    "notes" TEXT,
    "monthlyTag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ScanLog
CREATE TABLE "ScanLog" (
    "id" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalFound" INTEGER NOT NULL DEFAULT 0,
    "totalMatched" INTEGER NOT NULL DEFAULT 0,
    "newAdded" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "message" TEXT,

    CONSTRAINT "ScanLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes & Unique Constraints
CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");
CREATE UNIQUE INDEX "CareerProfile_userAccountId_key" ON "CareerProfile"("userAccountId");
CREATE UNIQUE INDEX "JobAd_externalId_key" ON "JobAd"("externalId");
CREATE UNIQUE INDEX "JobAdSearchProfile_jobId_searchProfileId_key" ON "JobAdSearchProfile"("jobId", "searchProfileId");

-- AddForeignKeys
ALTER TABLE "CareerProfile" ADD CONSTRAINT "CareerProfile_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SearchProfile" ADD CONSTRAINT "SearchProfile_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SearchProfile" ADD CONSTRAINT "SearchProfile_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "SearchTerritory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JobAdSearchProfile" ADD CONSTRAINT "JobAdSearchProfile_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobAd"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobAdSearchProfile" ADD CONSTRAINT "JobAdSearchProfile_searchProfileId_fkey" FOREIGN KEY ("searchProfileId") REFERENCES "SearchProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobAd"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Recruiter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
