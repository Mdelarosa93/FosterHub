-- CreateTable
CREATE TABLE "KnowledgeDocumentSectionSnapshot" (
    "id" TEXT NOT NULL,
    "knowledgeDocumentSourceId" TEXT NOT NULL,
    "auditEventId" TEXT,
    "versionNumber" INTEGER NOT NULL,
    "sectionCount" INTEGER NOT NULL,
    "addedCount" INTEGER NOT NULL DEFAULT 0,
    "removedCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "snapshotJson" JSONB NOT NULL,
    "changedHeadingsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeDocumentSectionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeDocumentSectionSnapshot_knowledgeDocumentSourceId_versionN_key" ON "KnowledgeDocumentSectionSnapshot"("knowledgeDocumentSourceId", "versionNumber");

-- CreateIndex
CREATE INDEX "KnowledgeDocumentSectionSnapshot_knowledgeDocumentSourceId_createdAt_idx" ON "KnowledgeDocumentSectionSnapshot"("knowledgeDocumentSourceId", "createdAt");

-- AddForeignKey
ALTER TABLE "KnowledgeDocumentSectionSnapshot" ADD CONSTRAINT "KnowledgeDocumentSectionSnapshot_knowledgeDocumentSourceId_fkey" FOREIGN KEY ("knowledgeDocumentSourceId") REFERENCES "KnowledgeDocumentSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocumentSectionSnapshot" ADD CONSTRAINT "KnowledgeDocumentSectionSnapshot_auditEventId_fkey" FOREIGN KEY ("auditEventId") REFERENCES "KnowledgeDocumentAuditEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
