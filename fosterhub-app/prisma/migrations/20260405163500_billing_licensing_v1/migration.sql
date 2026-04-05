-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'ANNUAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PaymentMethodProvider" AS ENUM ('STRIPE', 'MANUAL', 'INVOICE_ONLY');

-- CreateEnum
CREATE TYPE "BillingInvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE');

-- CreateEnum
CREATE TYPE "InvoiceLineItemType" AS ENUM ('BASE_PLAN', 'SEAT', 'COUNTY', 'MODULE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "CountySubscriptionAllocationStatus" AS ENUM ('ACTIVE', 'PENDING', 'REMOVED');

-- CreateTable
CREATE TABLE "BillingPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "billingInterval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "basePriceCents" INTEGER NOT NULL DEFAULT 0,
    "perSeatPriceCents" INTEGER NOT NULL DEFAULT 0,
    "countyIncludedCount" INTEGER NOT NULL DEFAULT 0,
    "additionalCountyPriceCents" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BillingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingModule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "defaultIncluded" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BillingModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingPlanModule" (
    "id" TEXT NOT NULL,
    "billingPlanId" TEXT NOT NULL,
    "billingModuleId" TEXT NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "seatLimit" INTEGER,
    "countyLimit" INTEGER,
    CONSTRAINT "BillingPlanModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationSubscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "billingPlanId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "renewalDate" TIMESTAMP(3),
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "seatCountPurchased" INTEGER NOT NULL DEFAULT 0,
    "seatCountInUse" INTEGER NOT NULL DEFAULT 0,
    "countyCountCovered" INTEGER NOT NULL DEFAULT 0,
    "billingContactName" TEXT,
    "billingContactEmail" TEXT,
    "billingContactPhone" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrganizationSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationSubscriptionModule" (
    "id" TEXT NOT NULL,
    "organizationSubscriptionId" TEXT NOT NULL,
    "billingModuleId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "seatLimit" INTEGER,
    "countyLimit" INTEGER,
    "priceOverrideCents" INTEGER,
    CONSTRAINT "OrganizationSubscriptionModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "organizationSubscriptionId" TEXT NOT NULL,
    "provider" "PaymentMethodProvider" NOT NULL DEFAULT 'STRIPE',
    "providerPaymentMethodId" TEXT,
    "brand" TEXT,
    "last4" TEXT,
    "expMonth" INTEGER,
    "expYear" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "billingName" TEXT,
    "billingEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingInvoice" (
    "id" TEXT NOT NULL,
    "organizationSubscriptionId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "providerInvoiceId" TEXT,
    "status" "BillingInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "hostedInvoiceUrl" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BillingInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingInvoiceLineItem" (
    "id" TEXT NOT NULL,
    "billingInvoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "lineType" "InvoiceLineItemType" NOT NULL DEFAULT 'ADJUSTMENT',
    CONSTRAINT "BillingInvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionCountyAllocation" (
    "id" TEXT NOT NULL,
    "organizationSubscriptionId" TEXT NOT NULL,
    "countyOrganizationId" TEXT NOT NULL,
    "status" "CountySubscriptionAllocationStatus" NOT NULL DEFAULT 'PENDING',
    "seatLimit" INTEGER,
    "seatInUse" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SubscriptionCountyAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionSeatAssignment" (
    "id" TEXT NOT NULL,
    "organizationSubscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "countyOrganizationId" TEXT,
    "billingModuleId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "SubscriptionSeatAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingPlan_code_key" ON "BillingPlan"("code");
CREATE UNIQUE INDEX "BillingModule_code_key" ON "BillingModule"("code");
CREATE UNIQUE INDEX "BillingPlanModule_billingPlanId_billingModuleId_key" ON "BillingPlanModule"("billingPlanId", "billingModuleId");
CREATE INDEX "OrganizationSubscription_organizationId_status_idx" ON "OrganizationSubscription"("organizationId", "status");
CREATE UNIQUE INDEX "OrganizationSubscriptionModule_organizationSubscriptionId_billi_key" ON "OrganizationSubscriptionModule"("organizationSubscriptionId", "billingModuleId");
CREATE INDEX "PaymentMethod_organizationSubscriptionId_isDefault_idx" ON "PaymentMethod"("organizationSubscriptionId", "isDefault");
CREATE UNIQUE INDEX "BillingInvoice_invoiceNumber_key" ON "BillingInvoice"("invoiceNumber");
CREATE INDEX "BillingInvoice_organizationSubscriptionId_status_idx" ON "BillingInvoice"("organizationSubscriptionId", "status");
CREATE UNIQUE INDEX "SubscriptionCountyAllocation_organizationSubscriptionId_countyOrgan_key" ON "SubscriptionCountyAllocation"("organizationSubscriptionId", "countyOrganizationId");
CREATE INDEX "SubscriptionCountyAllocation_countyOrganizationId_status_idx" ON "SubscriptionCountyAllocation"("countyOrganizationId", "status");
CREATE INDEX "SubscriptionSeatAssignment_organizationSubscriptionId_active_idx" ON "SubscriptionSeatAssignment"("organizationSubscriptionId", "active");
CREATE INDEX "SubscriptionSeatAssignment_userId_active_idx" ON "SubscriptionSeatAssignment"("userId", "active");

-- AddForeignKey
ALTER TABLE "BillingPlanModule" ADD CONSTRAINT "BillingPlanModule_billingPlanId_fkey" FOREIGN KEY ("billingPlanId") REFERENCES "BillingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingPlanModule" ADD CONSTRAINT "BillingPlanModule_billingModuleId_fkey" FOREIGN KEY ("billingModuleId") REFERENCES "BillingModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationSubscription" ADD CONSTRAINT "OrganizationSubscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrganizationSubscription" ADD CONSTRAINT "OrganizationSubscription_billingPlanId_fkey" FOREIGN KEY ("billingPlanId") REFERENCES "BillingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrganizationSubscriptionModule" ADD CONSTRAINT "OrganizationSubscriptionModule_organizationSubscriptionId_fkey" FOREIGN KEY ("organizationSubscriptionId") REFERENCES "OrganizationSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationSubscriptionModule" ADD CONSTRAINT "OrganizationSubscriptionModule_billingModuleId_fkey" FOREIGN KEY ("billingModuleId") REFERENCES "BillingModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_organizationSubscriptionId_fkey" FOREIGN KEY ("organizationSubscriptionId") REFERENCES "OrganizationSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_organizationSubscriptionId_fkey" FOREIGN KEY ("organizationSubscriptionId") REFERENCES "OrganizationSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingInvoiceLineItem" ADD CONSTRAINT "BillingInvoiceLineItem_billingInvoiceId_fkey" FOREIGN KEY ("billingInvoiceId") REFERENCES "BillingInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubscriptionCountyAllocation" ADD CONSTRAINT "SubscriptionCountyAllocation_organizationSubscriptionId_fkey" FOREIGN KEY ("organizationSubscriptionId") REFERENCES "OrganizationSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubscriptionCountyAllocation" ADD CONSTRAINT "SubscriptionCountyAllocation_countyOrganizationId_fkey" FOREIGN KEY ("countyOrganizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubscriptionSeatAssignment" ADD CONSTRAINT "SubscriptionSeatAssignment_organizationSubscriptionId_fkey" FOREIGN KEY ("organizationSubscriptionId") REFERENCES "OrganizationSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubscriptionSeatAssignment" ADD CONSTRAINT "SubscriptionSeatAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubscriptionSeatAssignment" ADD CONSTRAINT "SubscriptionSeatAssignment_billingModuleId_fkey" FOREIGN KEY ("billingModuleId") REFERENCES "BillingModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
