-- CreateTable
CREATE TABLE "cleaning_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "feature" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "payload" JSONB,
    "result" JSONB,
    "cost_cents" INTEGER NOT NULL DEFAULT 0,
    "tokens_in" INTEGER NOT NULL DEFAULT 0,
    "tokens_out" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cleaning_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fencing_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "feature" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "payload" JSONB,
    "result" JSONB,
    "cost_cents" INTEGER NOT NULL DEFAULT 0,
    "tokens_in" INTEGER NOT NULL DEFAULT 0,
    "tokens_out" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fencing_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cleaning_events_tenant_id_feature_created_at_idx" ON "cleaning_events"("tenant_id", "feature", "created_at");

-- CreateIndex
CREATE INDEX "cleaning_events_request_id_idx" ON "cleaning_events"("request_id");

-- CreateIndex
CREATE INDEX "fencing_events_tenant_id_feature_created_at_idx" ON "fencing_events"("tenant_id", "feature", "created_at");

-- CreateIndex
CREATE INDEX "fencing_events_request_id_idx" ON "fencing_events"("request_id");

