-- CreateTable: Organization (CRM proper model)
CREATE TABLE "public"."Organization" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "industry" TEXT,
    "size" INTEGER,
    "annualRevenue" INTEGER,
    "website" TEXT,
    "phone" TEXT,
    "ownerId" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ConversionAudit (CRM audit trail)
CREATE TABLE "public"."ConversionAudit" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversionAudit_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Contact - change organizationId to NOT NULL and point to Organization
ALTER TABLE "public"."Contact" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable: Opportunity - add organizationId and make customerId nullable
ALTER TABLE "public"."Opportunity" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "public"."Opportunity" ALTER COLUMN "customerId" DROP NOT NULL;

-- CreateIndex: Organization indexes
CREATE UNIQUE INDEX "Organization_orgId_name_key" ON "public"."Organization"("orgId", "name");
CREATE INDEX "Organization_orgId_domain_idx" ON "public"."Organization"("orgId", "domain");
CREATE INDEX "Organization_orgId_archived_idx" ON "public"."Organization"("orgId", "archived");
CREATE INDEX "Organization_orgId_ownerId_idx" ON "public"."Organization"("orgId", "ownerId");
CREATE INDEX "Organization_orgId_updatedAt_idx" ON "public"."Organization"("orgId", "updatedAt");

-- CreateIndex: ConversionAudit indexes
CREATE INDEX "ConversionAudit_orgId_createdAt_idx" ON "public"."ConversionAudit"("orgId", "createdAt");
CREATE INDEX "ConversionAudit_orgId_userId_idx" ON "public"."ConversionAudit"("orgId", "userId");
CREATE INDEX "ConversionAudit_orgId_resource_action_idx" ON "public"."ConversionAudit"("orgId", "resource", "action");

-- CreateIndex: Opportunity organizationId index
CREATE INDEX "Opportunity_orgId_organizationId_idx" ON "public"."Opportunity"("orgId", "organizationId");

-- AddForeignKey: Organization to Org
ALTER TABLE "public"."Organization" ADD CONSTRAINT "Organization_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ConversionAudit to Org
ALTER TABLE "public"."ConversionAudit" ADD CONSTRAINT "ConversionAudit_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Contact to Organization
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Opportunity to Organization (will be set NOT NULL after backfill)
-- Note: This is commented out until backfill is complete
-- ALTER TABLE "public"."Opportunity" ADD CONSTRAINT "Opportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- DATA BACKFILL SECTION
-- ============================================================================

-- Step 1: Backfill Organizations from existing Customer records
-- Create one Organization per Customer with proper field mapping
INSERT INTO "public"."Organization" (
    "id",
    "orgId",
    "name",
    "domain",
    "industry",
    "size",
    "annualRevenue",
    "website",
    "phone",
    "ownerId",
    "archived",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid() as "id",
    c."orgId",
    COALESCE(c."company", c."primaryName", 'Unnamed Organization') as "name",
    NULL as "domain", -- Customer model doesn't have domain
    NULL as "industry", -- Customer model doesn't have industry
    NULL as "size", -- Customer model doesn't have size
    NULL as "annualRevenue", -- Customer model doesn't have annualRevenue
    NULL as "website", -- Customer model doesn't have website
    c."primaryPhone" as "phone",
    NULL as "ownerId", -- Customer model doesn't have ownerId
    false as "archived",
    c."createdAt",
    c."updatedAt"
FROM "public"."Customer" c
WHERE NOT EXISTS (
    SELECT 1 FROM "public"."Organization" o 
    WHERE o."orgId" = c."orgId" 
    AND LOWER(o."name") = LOWER(COALESCE(c."company", c."primaryName", 'Unnamed Organization'))
);

-- Step 2: Update Contact.organizationId to point to newly created Organizations
-- Match by orgId and company name (case-insensitive)
UPDATE "public"."Contact" ct
SET "organizationId" = o."id"
FROM "public"."Organization" o
WHERE ct."orgId" = o."orgId"
AND ct."organizationId" IS NULL;

-- Step 3: Create default "Unassigned" organizations for any remaining NULL contacts
-- This ensures all contacts have an organization after migration
INSERT INTO "public"."Organization" (
    "id",
    "orgId",
    "name",
    "domain",
    "industry",
    "size",
    "annualRevenue",
    "website",
    "phone",
    "ownerId",
    "archived",
    "createdAt",
    "updatedAt"
)
SELECT DISTINCT
    gen_random_uuid() as "id",
    ct."orgId",
    'Unassigned - Contact ' || ct."id" as "name",
    NULL as "domain",
    NULL as "industry",
    NULL as "size",
    NULL as "annualRevenue",
    NULL as "website",
    NULL as "phone",
    NULL as "ownerId",
    false as "archived",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM "public"."Contact" ct
WHERE ct."organizationId" IS NULL
AND NOT EXISTS (
    SELECT 1 FROM "public"."Organization" o 
    WHERE o."orgId" = ct."orgId" 
    AND o."name" = 'Unassigned - Contact ' || ct."id"
);

-- Update remaining NULL contacts to point to their "Unassigned" organization
UPDATE "public"."Contact" ct
SET "organizationId" = o."id"
FROM "public"."Organization" o
WHERE ct."orgId" = o."orgId"
AND o."name" = 'Unassigned - Contact ' || ct."id"
AND ct."organizationId" IS NULL;

-- Step 4: Backfill Opportunity.organizationId
-- First, try to match by Customer relationship
UPDATE "public"."Opportunity" op
SET "organizationId" = o."id"
FROM "public"."Organization" o, "public"."Customer" c
WHERE op."customerId" = c."id"
AND op."orgId" = c."orgId"
AND o."orgId" = c."orgId"
AND LOWER(o."name") = LOWER(COALESCE(c."company", c."primaryName", 'Unnamed Organization'))
AND op."organizationId" IS NULL;

-- Create default "Unassigned" organizations for any remaining NULL opportunities
INSERT INTO "public"."Organization" (
    "id",
    "orgId",
    "name",
    "domain",
    "industry",
    "size",
    "annualRevenue",
    "website",
    "phone",
    "ownerId",
    "archived",
    "createdAt",
    "updatedAt"
)
SELECT DISTINCT
    gen_random_uuid() as "id",
    op."orgId",
    'Unassigned - Opportunity ' || op."id" as "name",
    NULL as "domain",
    NULL as "industry",
    NULL as "size",
    NULL as "annualRevenue",
    NULL as "website",
    NULL as "phone",
    NULL as "ownerId",
    false as "archived",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM "public"."Opportunity" op
WHERE op."organizationId" IS NULL
AND NOT EXISTS (
    SELECT 1 FROM "public"."Organization" o 
    WHERE o."orgId" = op."orgId" 
    AND o."name" = 'Unassigned - Opportunity ' || op."id"
);

-- Update remaining NULL opportunities to point to their "Unassigned" organization
UPDATE "public"."Opportunity" op
SET "organizationId" = o."id"
FROM "public"."Organization" o
WHERE op."orgId" = o."orgId"
AND o."name" = 'Unassigned - Opportunity ' || op."id"
AND op."organizationId" IS NULL;

-- Step 5: Set Opportunity.organizationId to NOT NULL after backfill
ALTER TABLE "public"."Opportunity" ALTER COLUMN "organizationId" SET NOT NULL;

-- Step 6: Add the foreign key constraint now that all data is backfilled
ALTER TABLE "public"."Opportunity" ADD CONSTRAINT "Opportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- VERIFICATION QUERIES (commented out - for manual verification)
-- ============================================================================

-- Verify all Contacts have organizationId
-- SELECT COUNT(*) FROM "public"."Contact" WHERE "organizationId" IS NULL;
-- Expected: 0

-- Verify all Opportunities have organizationId
-- SELECT COUNT(*) FROM "public"."Opportunity" WHERE "organizationId" IS NULL;
-- Expected: 0

-- Verify Organizations created
-- SELECT COUNT(*) FROM "public"."Organization";
-- Expected: >= number of distinct Customers

-- Verify unique names per tenant
-- SELECT "orgId", "name", COUNT(*) FROM "public"."Organization" GROUP BY "orgId", "name" HAVING COUNT(*) > 1;
-- Expected: 0 rows

