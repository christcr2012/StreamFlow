-- CreateEnum
CREATE TYPE "public"."AiPlan" AS ENUM ('BASE', 'PRO', 'ELITE');

-- AlterTable
ALTER TABLE "public"."Org" ADD COLUMN     "aiAlerts" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "aiCreditBalance" INTEGER NOT NULL DEFAULT 50000,
ADD COLUMN     "aiMonthlyBudgetCents" INTEGER NOT NULL DEFAULT 5000,
ADD COLUMN     "aiPlan" "public"."AiPlan" NOT NULL DEFAULT 'BASE';

-- CreateTable
CREATE TABLE "public"."AiUsageEvent" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "feature" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokensIn" INTEGER NOT NULL,
    "tokensOut" INTEGER NOT NULL,
    "costUsd" DECIMAL(8,6) NOT NULL,
    "creditsUsed" INTEGER NOT NULL,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AiMonthlySummary" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "callCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiMonthlySummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiUsageEvent_orgId_createdAt_idx" ON "public"."AiUsageEvent"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "AiUsageEvent_orgId_feature_idx" ON "public"."AiUsageEvent"("orgId", "feature");

-- CreateIndex
CREATE INDEX "AiMonthlySummary_monthKey_idx" ON "public"."AiMonthlySummary"("monthKey");

-- CreateIndex
CREATE UNIQUE INDEX "AiMonthlySummary_orgId_monthKey_key" ON "public"."AiMonthlySummary"("orgId", "monthKey");

-- CreateIndex
CREATE INDEX "Lead_orgId_createdAt_idx" ON "public"."Lead"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_orgId_convertedAt_idx" ON "public"."Lead"("orgId", "convertedAt");

-- CreateIndex
CREATE INDEX "Lead_orgId_status_idx" ON "public"."Lead"("orgId", "status");

-- AddForeignKey
ALTER TABLE "public"."AiUsageEvent" ADD CONSTRAINT "AiUsageEvent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiMonthlySummary" ADD CONSTRAINT "AiMonthlySummary_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
