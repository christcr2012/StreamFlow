/*
  Warnings:

  - You are about to drop the column `action` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `actorId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `delta` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `entityType` on the `AuditLog` table. All the data in the column will be lost.
  - The `status` column on the `Lead` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `entity` to the `AuditLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PricingModel" AS ENUM ('PER_LEAD_FIXED', 'TIERED', 'SUBSCRIPTION', 'HYBRID');

-- CreateEnum
CREATE TYPE "public"."LeadStatus" AS ENUM ('NEW', 'CONVERTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."LeadSource" ADD VALUE 'SYSTEM';
ALTER TYPE "public"."LeadSource" ADD VALUE 'EMPLOYEE_REFERRAL';
ALTER TYPE "public"."LeadSource" ADD VALUE 'MANUAL';
ALTER TYPE "public"."LeadSource" ADD VALUE 'LSA';

-- AlterTable
ALTER TABLE "public"."AuditLog" DROP COLUMN "action",
DROP COLUMN "actorId",
DROP COLUMN "delta",
DROP COLUMN "entityType",
ADD COLUMN     "actorUserId" TEXT,
ADD COLUMN     "entity" TEXT NOT NULL,
ADD COLUMN     "field" TEXT,
ADD COLUMN     "newValue" JSONB,
ADD COLUMN     "oldValue" JSONB,
ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "public"."Lead" ADD COLUMN     "convertedAt" TIMESTAMP(3),
ADD COLUMN     "rfp" JSONB,
ADD COLUMN     "systemGenerated" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."LeadStatus" NOT NULL DEFAULT 'NEW';

-- AlterTable
ALTER TABLE "public"."Org" ADD COLUMN     "brandConfig" JSONB DEFAULT '{}',
ADD COLUMN     "settingsJson" JSONB DEFAULT '{}';

-- CreateTable
CREATE TABLE "public"."LeadInvoice" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "number" TEXT NOT NULL,
    "periodFrom" TIMESTAMP(3) NOT NULL,
    "periodTo" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripeInvoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "leadCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LeadInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeadInvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "leadId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceCents" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadInvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderConfig" (
    "id" TEXT NOT NULL,
    "samApiKey" TEXT,
    "stripeSecretKey" TEXT,
    "otherConfig" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PricingPlan" (
    "orgId" TEXT NOT NULL,
    "model" "public"."PricingModel" NOT NULL DEFAULT 'PER_LEAD_FIXED',
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "unitAmount" INTEGER NOT NULL DEFAULT 10000,
    "tiersJson" JSONB,
    "includedUnits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("orgId")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeadInvoice_number_key" ON "public"."LeadInvoice"("number");

-- CreateIndex
CREATE INDEX "LeadInvoiceLine_invoiceId_idx" ON "public"."LeadInvoiceLine"("invoiceId");

-- CreateIndex
CREATE INDEX "LeadInvoiceLine_leadId_idx" ON "public"."LeadInvoiceLine"("leadId");

-- AddForeignKey
ALTER TABLE "public"."LeadInvoice" ADD CONSTRAINT "LeadInvoice_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadInvoiceLine" ADD CONSTRAINT "LeadInvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."LeadInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadInvoiceLine" ADD CONSTRAINT "LeadInvoiceLine_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PricingPlan" ADD CONSTRAINT "PricingPlan_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
