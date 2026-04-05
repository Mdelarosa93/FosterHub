-- CreateTable
CREATE TABLE "KnowledgeDocumentAuditEvent" (
    "id" TEXT NOT NULL,
    "knowledgeDocumentSourceId" TEXT,
    "organizationId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "eventType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "snapshotTitle" TEXT NOT NULL,
    "snapshotVersionLabel" TEXT,
    "snapshotStatus" "KnowledgeDocumentStatus",
    "snapshotSectionCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeDocumentAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeDocumentAuditEvent_knowledgeDocumentSourceId_createdAt_idx" ON "KnowledgeDocumentAuditEvent"("knowledgeDocumentSourceId", "createdAt");

-- CreateIndex
CREATE INDEX "KnowledgeDocumentAuditEvent_organizationId_createdAt_idx" ON "KnowledgeDocumentAuditEvent"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "KnowledgeDocumentAuditEvent" ADD CONSTRAINT "KnowledgeDocumentAuditEvent_knowledgeDocumentSourceId_fkey" FOREIGN KEY ("knowledgeDocumentSourceId") REFERENCES "KnowledgeDocumentSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocumentAuditEvent" ADD CONSTRAINT "KnowledgeDocumentAuditEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocumentAuditEvent" ADD CONSTRAINT "KnowledgeDocumentAuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
