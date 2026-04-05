-- CreateEnum
CREATE TYPE "BillingModuleCategory" AS ENUM ('CORE', 'ADD_ON');

-- AlterTable
ALTER TABLE "BillingModule" ADD COLUMN "category" "BillingModuleCategory" NOT NULL DEFAULT 'CORE';
