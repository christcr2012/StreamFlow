-- CreateTable
CREATE TABLE "public"."AiGoldenDataset" (
    "id" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiGoldenDataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AiEvaluation" (
    "id" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "actualOutput" TEXT NOT NULL,
    "expectedOutput" TEXT,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AiModelVersion" (
    "id" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'shadow',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiModelVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiGoldenDataset_agentType_actionType_idx" ON "public"."AiGoldenDataset"("agentType", "actionType");

-- CreateIndex
CREATE INDEX "AiEvaluation_agentType_modelVersion_idx" ON "public"."AiEvaluation"("agentType", "modelVersion");

-- CreateIndex
CREATE INDEX "AiEvaluation_createdAt_idx" ON "public"."AiEvaluation"("createdAt");

-- CreateIndex
CREATE INDEX "AiModelVersion_agentType_status_idx" ON "public"."AiModelVersion"("agentType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AiModelVersion_agentType_version_key" ON "public"."AiModelVersion"("agentType", "version");
