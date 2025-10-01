-- CreateTable
CREATE TABLE "public"."AiPowerProfile" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "globalDefault" TEXT NOT NULL DEFAULT 'ECO',
    "overrides" JSONB NOT NULL DEFAULT '{}',
    "roleCeilings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiPowerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AiTask" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "agentType" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "role" TEXT,
    "powerLevel" TEXT NOT NULL,
    "tokensIn" INTEGER NOT NULL,
    "tokensOut" INTEGER NOT NULL,
    "rawCostCents" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "errorCode" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CreditLedger" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "relatedId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UsageMeter" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "meterType" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageMeter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerticalConfig" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "enabledAiTasks" JSONB NOT NULL DEFAULT '[]',
    "customFields" JSONB NOT NULL DEFAULT '{}',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerticalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TrialConfig" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "trialType" TEXT NOT NULL,
    "trialEndsAt" TIMESTAMP(3) NOT NULL,
    "aiCreditsCents" INTEGER NOT NULL DEFAULT 1000,
    "features" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'active',
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrialConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiPowerProfile_orgId_key" ON "public"."AiPowerProfile"("orgId");

-- CreateIndex
CREATE INDEX "AiPowerProfile_orgId_idx" ON "public"."AiPowerProfile"("orgId");

-- CreateIndex
CREATE INDEX "AiTask_orgId_createdAt_idx" ON "public"."AiTask"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "AiTask_orgId_agentType_idx" ON "public"."AiTask"("orgId", "agentType");

-- CreateIndex
CREATE INDEX "AiTask_orgId_status_idx" ON "public"."AiTask"("orgId", "status");

-- CreateIndex
CREATE INDEX "AiTask_userId_createdAt_idx" ON "public"."AiTask"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CreditLedger_orgId_createdAt_idx" ON "public"."CreditLedger"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "CreditLedger_orgId_type_idx" ON "public"."CreditLedger"("orgId", "type");

-- CreateIndex
CREATE INDEX "UsageMeter_orgId_meterType_periodStart_idx" ON "public"."UsageMeter"("orgId", "meterType", "periodStart");

-- CreateIndex
CREATE INDEX "UsageMeter_orgId_periodEnd_idx" ON "public"."UsageMeter"("orgId", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "VerticalConfig_orgId_key" ON "public"."VerticalConfig"("orgId");

-- CreateIndex
CREATE INDEX "VerticalConfig_orgId_idx" ON "public"."VerticalConfig"("orgId");

-- CreateIndex
CREATE INDEX "VerticalConfig_vertical_idx" ON "public"."VerticalConfig"("vertical");

-- CreateIndex
CREATE UNIQUE INDEX "TrialConfig_orgId_key" ON "public"."TrialConfig"("orgId");

-- CreateIndex
CREATE INDEX "TrialConfig_orgId_idx" ON "public"."TrialConfig"("orgId");

-- CreateIndex
CREATE INDEX "TrialConfig_trialEndsAt_idx" ON "public"."TrialConfig"("trialEndsAt");

-- CreateIndex
CREATE INDEX "TrialConfig_status_idx" ON "public"."TrialConfig"("status");

-- AddForeignKey
ALTER TABLE "public"."AiPowerProfile" ADD CONSTRAINT "AiPowerProfile_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiTask" ADD CONSTRAINT "AiTask_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiTask" ADD CONSTRAINT "AiTask_orgId_userId_fkey" FOREIGN KEY ("orgId", "userId") REFERENCES "public"."User"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreditLedger" ADD CONSTRAINT "CreditLedger_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UsageMeter" ADD CONSTRAINT "UsageMeter_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VerticalConfig" ADD CONSTRAINT "VerticalConfig_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrialConfig" ADD CONSTRAINT "TrialConfig_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
