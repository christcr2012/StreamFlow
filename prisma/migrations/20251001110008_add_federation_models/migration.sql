-- CreateTable
CREATE TABLE "public"."TenantDomain" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "txtRecord" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "cnameTarget" TEXT NOT NULL DEFAULT 'tenant.streamflow.com',
    "sslEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sslIssuedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "activatedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TenantProfitability" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "monthlyRevenueCents" INTEGER NOT NULL DEFAULT 0,
    "creditsPurchased" INTEGER NOT NULL DEFAULT 0,
    "aiCostCents" INTEGER NOT NULL DEFAULT 0,
    "infraCostCents" INTEGER NOT NULL DEFAULT 0,
    "storageCostCents" INTEGER NOT NULL DEFAULT 0,
    "marginPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adoptionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgCreditsPerUser" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiRecommendations" JSONB,
    "lastAnalyzedAt" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantProfitability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemNotice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetAll" BOOLEAN NOT NULL DEFAULT true,
    "targetOrgs" JSONB,
    "dismissible" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemNotice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantDomain_orgId_key" ON "public"."TenantDomain"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantDomain_domain_key" ON "public"."TenantDomain"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "TenantDomain_subdomain_key" ON "public"."TenantDomain"("subdomain");

-- CreateIndex
CREATE INDEX "TenantDomain_domain_idx" ON "public"."TenantDomain"("domain");

-- CreateIndex
CREATE INDEX "TenantDomain_subdomain_idx" ON "public"."TenantDomain"("subdomain");

-- CreateIndex
CREATE INDEX "TenantDomain_status_idx" ON "public"."TenantDomain"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TenantProfitability_orgId_key" ON "public"."TenantProfitability"("orgId");

-- CreateIndex
CREATE INDEX "TenantProfitability_orgId_periodStart_idx" ON "public"."TenantProfitability"("orgId", "periodStart");

-- CreateIndex
CREATE INDEX "TenantProfitability_marginPercent_idx" ON "public"."TenantProfitability"("marginPercent");

-- CreateIndex
CREATE INDEX "SystemNotice_active_startAt_endAt_idx" ON "public"."SystemNotice"("active", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "SystemNotice_type_priority_idx" ON "public"."SystemNotice"("type", "priority");

-- AddForeignKey
ALTER TABLE "public"."TenantDomain" ADD CONSTRAINT "TenantDomain_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantProfitability" ADD CONSTRAINT "TenantProfitability_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
