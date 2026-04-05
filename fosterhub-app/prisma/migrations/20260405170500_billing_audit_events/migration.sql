-- CreateEnum
CREATE TYPE "BillingAuditEventType" AS ENUM ('CONTACT_UPDATED', 'PAYMENT_METHOD_UPDATED', 'PLAN_CHANGED', 'COUNTY_ALLOCATION_UPDATED', 'MODULE_UPDATED');

-- CreateTable
CREATE TABLE "BillingAuditEvent" (
    "id" TEXT NOT NULL,
    "organizationSubscriptionId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "eventType" "BillingAuditEventType" NOT NULL,
    "summary" TEXT NOT NULL,
    "snapshotPlanName" TEXT,
    "snapshotStatus" "SubscriptionStatus",
    "snapshotTotalCents" INTEGER,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BillingAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BillingAuditEvent_organizationSubscriptionId_createdAt_idx" ON "BillingAuditEvent"("organizationSubscriptionId", "createdAt");
CREATE INDEX "BillingAuditEvent_organizationId_createdAt_idx" ON "BillingAuditEvent"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "BillingAuditEvent" ADD CONSTRAINT "BillingAuditEvent_organizationSubscriptionId_fkey" FOREIGN KEY ("organizationSubscriptionId") REFERENCES "OrganizationSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingAuditEvent" ADD CONSTRAINT "BillingAuditEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BillingAuditEvent" ADD CONSTRAINT "BillingAuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
