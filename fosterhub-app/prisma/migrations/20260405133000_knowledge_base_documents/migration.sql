-- CreateEnum
CREATE TYPE "KnowledgeDocumentAccessScope" AS ENUM ('ORGANIZATION_ONLY', 'INHERIT_TO_CHILDREN');

-- CreateEnum
CREATE TYPE "KnowledgeDocumentStatus" AS ENUM ('DRAFT', 'READY', 'ARCHIVED');

-- CreateTable
CREATE TABLE "KnowledgeDocumentSource" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "accessScope" "KnowledgeDocumentAccessScope" NOT NULL DEFAULT 'ORGANIZATION_ONLY',
    "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "versionLabel" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "fileName" TEXT,
    "fileUrl" TEXT,
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDocumentSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeDocumentSection" (
    "id" TEXT NOT NULL,
    "knowledgeDocumentSourceId" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "sectionKey" TEXT,
    "pageNumber" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDocumentSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeDocumentSource_organizationId_accessScope_status_idx" ON "KnowledgeDocumentSource"("organizationId", "accessScope", "status");

-- CreateIndex
CREATE INDEX "KnowledgeDocumentSection_knowledgeDocumentSourceId_sortOrder_idx" ON "KnowledgeDocumentSection"("knowledgeDocumentSourceId", "sortOrder");

-- AddForeignKey
ALTER TABLE "KnowledgeDocumentSource" ADD CONSTRAINT "KnowledgeDocumentSource_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocumentSource" ADD CONSTRAINT "KnowledgeDocumentSource_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocumentSection" ADD CONSTRAINT "KnowledgeDocumentSection_knowledgeDocumentSourceId_fkey" FOREIGN KEY ("knowledgeDocumentSourceId") REFERENCES "KnowledgeDocumentSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
