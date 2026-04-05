-- AlterTable
ALTER TABLE "KnowledgeDocumentSource"
ADD COLUMN     "fileContentType" TEXT,
ADD COLUMN     "fileSizeBytes" INTEGER,
ADD COLUMN     "lastExtractedAt" TIMESTAMP(3);
