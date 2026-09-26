-- CreateTable
CREATE TABLE "JobAdSource" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "webpageUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobAdSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobAdSource_jobId_idx" ON "JobAdSource"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "JobAdSource_source_externalId_key" ON "JobAdSource"("source", "externalId");

-- AddForeignKey
ALTER TABLE "JobAdSource" ADD CONSTRAINT "JobAdSource_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobAd"("id") ON DELETE CASCADE ON UPDATE CASCADE;
