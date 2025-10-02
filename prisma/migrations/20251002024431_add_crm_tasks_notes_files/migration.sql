/*
  Warnings:

  - You are about to drop the column `customerId` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the `Activity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ConversionAudit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Organization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `stage` on table `Lead` required. This step will fail if there are existing NULL values in that column.
  - Made the column `archived` on table `Lead` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tax` on table `Quote` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."Contact_customerId_idx";

-- DropIndex
DROP INDEX "public"."Lead_archived_idx";

-- DropIndex
DROP INDEX "public"."Lead_convertedAt_idx";

-- DropIndex
DROP INDEX "public"."Lead_convertedToCustomerId_idx";

-- DropIndex
DROP INDEX "public"."Lead_ownerId_idx";

-- DropIndex
DROP INDEX "public"."Lead_stage_idx";

-- AlterTable
ALTER TABLE "public"."Contact" DROP COLUMN "customerId";

-- AlterTable
ALTER TABLE "public"."Lead" ALTER COLUMN "stage" SET NOT NULL,
ALTER COLUMN "archived" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Opportunity" ALTER COLUMN "closeDate" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Quote" ALTER COLUMN "tax" SET NOT NULL,
ALTER COLUMN "validUntil" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "acceptedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "rejectedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- DropTable
DROP TABLE "public"."Activity";

-- DropTable
DROP TABLE "public"."ConversionAudit";

-- DropTable
DROP TABLE "public"."Organization";

-- DropTable
DROP TABLE "public"."Task";

-- CreateTable
CREATE TABLE "public"."CrmTask" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "assigneeUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CrmNote" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CrmFile" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrmTask_orgId_entityType_entityId_idx" ON "public"."CrmTask"("orgId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "CrmTask_orgId_assigneeUserId_status_idx" ON "public"."CrmTask"("orgId", "assigneeUserId", "status");

-- CreateIndex
CREATE INDEX "CrmTask_orgId_dueAt_idx" ON "public"."CrmTask"("orgId", "dueAt");

-- CreateIndex
CREATE INDEX "CrmTask_orgId_updatedAt_idx" ON "public"."CrmTask"("orgId", "updatedAt");

-- CreateIndex
CREATE INDEX "CrmNote_orgId_entityType_entityId_createdAt_idx" ON "public"."CrmNote"("orgId", "entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "CrmNote_orgId_createdBy_idx" ON "public"."CrmNote"("orgId", "createdBy");

-- CreateIndex
CREATE INDEX "CrmNote_orgId_updatedAt_idx" ON "public"."CrmNote"("orgId", "updatedAt");

-- CreateIndex
CREATE INDEX "CrmFile_orgId_entityType_entityId_createdAt_idx" ON "public"."CrmFile"("orgId", "entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "CrmFile_orgId_storageKey_idx" ON "public"."CrmFile"("orgId", "storageKey");

-- CreateIndex
CREATE INDEX "CrmFile_orgId_createdAt_idx" ON "public"."CrmFile"("orgId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Quote" ADD CONSTRAINT "Quote_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quote" ADD CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quote" ADD CONSTRAINT "Quote_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "public"."Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CrmTask" ADD CONSTRAINT "CrmTask_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CrmNote" ADD CONSTRAINT "CrmNote_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CrmFile" ADD CONSTRAINT "CrmFile_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
