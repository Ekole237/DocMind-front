-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'INDEXED', 'DISABLED', 'ERROR');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('PENDING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "Confidentiality" AS ENUM ('PUBLIC');

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "driveUrl" TEXT,
    "filePath" TEXT,
    "mimeType" TEXT,
    "confidentiality" "Confidentiality" NOT NULL DEFAULT 'PUBLIC',
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "lastModified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueryLog" (
    "id" TEXT NOT NULL,
    "userIdHash" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sourceDocId" TEXT,
    "sourceDocName" TEXT,
    "sourceDriveUrl" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "isIgnorance" BOOLEAN NOT NULL DEFAULT false,
    "responseTimeMs" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "queryLogId" TEXT NOT NULL,
    "comment" TEXT,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- CreateIndex
CREATE INDEX "Document_createdAt_idx" ON "Document"("createdAt");

-- CreateIndex
CREATE INDEX "QueryLog_userIdHash_idx" ON "QueryLog"("userIdHash");

-- CreateIndex
CREATE INDEX "QueryLog_timestamp_idx" ON "QueryLog"("timestamp");

-- CreateIndex
CREATE INDEX "QueryLog_isFlagged_idx" ON "QueryLog"("isFlagged");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_queryLogId_key" ON "Feedback"("queryLogId");

-- CreateIndex
CREATE INDEX "Feedback_status_idx" ON "Feedback"("status");

-- AddForeignKey
ALTER TABLE "QueryLog" ADD CONSTRAINT "QueryLog_sourceDocId_fkey" FOREIGN KEY ("sourceDocId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_queryLogId_fkey" FOREIGN KEY ("queryLogId") REFERENCES "QueryLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
