-- CRM + FSM Bridge System Migration
-- Adds foreign keys and indexes to link CRM entities with FSM entities

-- ============================================================================
-- 1. Add CRM links to JobTicket
-- ============================================================================

-- Add organizationId to link jobs to CRM organizations
ALTER TABLE "JobTicket" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add contactId to link jobs to CRM contacts
ALTER TABLE "JobTicket" ADD COLUMN IF NOT EXISTS "contactId" TEXT;

-- Add opportunityId to link jobs to CRM opportunities
ALTER TABLE "JobTicket" ADD COLUMN IF NOT EXISTS "opportunityId" TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "JobTicket_orgId_organizationId_idx" ON "JobTicket"("orgId", "organizationId");
CREATE INDEX IF NOT EXISTS "JobTicket_orgId_contactId_idx" ON "JobTicket"("orgId", "contactId");
CREATE INDEX IF NOT EXISTS "JobTicket_orgId_opportunityId_idx" ON "JobTicket"("orgId", "opportunityId");

-- ============================================================================
-- 2. Add conversion tracking to Lead
-- ============================================================================

-- Track when lead was converted to customer
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "convertedToCustomerId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "convertedToOrganizationId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "convertedToContactId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "convertedAt" TIMESTAMP;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "conversionAuditId" TEXT;

-- Add index for finding converted leads
CREATE INDEX IF NOT EXISTS "Lead_convertedToCustomerId_idx" ON "Lead"("convertedToCustomerId");
CREATE INDEX IF NOT EXISTS "Lead_convertedAt_idx" ON "Lead"("convertedAt");

-- ============================================================================
-- 3. Add CRM fields to Opportunity
-- ============================================================================

-- Add title field for opportunity name
ALTER TABLE "Opportunity" ADD COLUMN IF NOT EXISTS "title" TEXT;

-- Add probability field for win probability
ALTER TABLE "Opportunity" ADD COLUMN IF NOT EXISTS "probability" INTEGER;

-- Add closeDate field for expected close date
ALTER TABLE "Opportunity" ADD COLUMN IF NOT EXISTS "closeDate" TIMESTAMP;

-- Add leadId to track source lead
ALTER TABLE "Opportunity" ADD COLUMN IF NOT EXISTS "leadId" TEXT;

-- Add index for lead tracking
CREATE INDEX IF NOT EXISTS "Opportunity_leadId_idx" ON "Opportunity"("leadId");

-- ============================================================================
-- 4. Add organizationId to Contact (if not exists)
-- ============================================================================

-- Contact already has organizationId, but ensure it's indexed
CREATE INDEX IF NOT EXISTS "Contact_orgId_organizationId_idx" ON "Contact"("orgId", "organizationId");

-- ============================================================================
-- 5. Add customerId to Contact for FSM link
-- ============================================================================

-- Link contacts to FSM customers
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "customerId" TEXT;

-- Add index
CREATE INDEX IF NOT EXISTS "Contact_customerId_idx" ON "Contact"("customerId");

-- ============================================================================
-- 6. Add stage field to Lead (if not exists)
-- ============================================================================

-- Add stage for lead pipeline
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "stage" TEXT DEFAULT 'new';

-- Add ownerId for lead assignment
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;

-- Add archived flag
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN DEFAULT false;

-- Add indexes
CREATE INDEX IF NOT EXISTS "Lead_stage_idx" ON "Lead"("stage");
CREATE INDEX IF NOT EXISTS "Lead_ownerId_idx" ON "Lead"("ownerId");
CREATE INDEX IF NOT EXISTS "Lead_archived_idx" ON "Lead"("archived");

-- ============================================================================
-- 7. Create Organization table (if not exists)
-- ============================================================================

-- Note: We already have Customer table which serves as Organization
-- But we'll create a proper Organization table for CRM
CREATE TABLE IF NOT EXISTS "Organization" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "domain" TEXT,
  "industry" TEXT,
  "size" TEXT,
  "annualRevenue" DECIMAL(12,2),
  "website" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "address" JSONB,
  "customerId" TEXT,  -- Link to FSM Customer
  "ownerId" TEXT,
  "notes" TEXT,
  "archived" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_orgId_id_key" ON "Organization"("orgId", "id");

-- Add indexes
CREATE INDEX IF NOT EXISTS "Organization_orgId_idx" ON "Organization"("orgId");
CREATE INDEX IF NOT EXISTS "Organization_customerId_idx" ON "Organization"("customerId");
CREATE INDEX IF NOT EXISTS "Organization_name_idx" ON "Organization"("name");
CREATE INDEX IF NOT EXISTS "Organization_archived_idx" ON "Organization"("archived");

-- ============================================================================
-- 8. Add Quote/Estimate table (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Quote" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "opportunityId" TEXT,  -- Link to CRM Opportunity
  "customerId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "items" JSONB NOT NULL DEFAULT '[]',
  "subtotal" DECIMAL(12,2) NOT NULL,
  "tax" DECIMAL(12,2) DEFAULT 0,
  "total" DECIMAL(12,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',  -- draft, sent, accepted, rejected, expired
  "validUntil" TIMESTAMP,
  "acceptedAt" TIMESTAMP,
  "rejectedAt" TIMESTAMP,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "Quote_orgId_id_key" ON "Quote"("orgId", "id");

-- Add indexes
CREATE INDEX IF NOT EXISTS "Quote_orgId_idx" ON "Quote"("orgId");
CREATE INDEX IF NOT EXISTS "Quote_opportunityId_idx" ON "Quote"("opportunityId");
CREATE INDEX IF NOT EXISTS "Quote_customerId_idx" ON "Quote"("customerId");
CREATE INDEX IF NOT EXISTS "Quote_status_idx" ON "Quote"("status");

-- ============================================================================
-- 9. Add Activity table for notes/timeline (if not exists)
-- ============================================================================

-- Note: We already have LeadActivity, but we need a generic Activity table
CREATE TABLE IF NOT EXISTS "Activity" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,  -- lead, opportunity, contact, organization, job
  "entityId" TEXT NOT NULL,
  "type" TEXT NOT NULL,  -- note, call, email, meeting, task
  "title" TEXT,
  "body" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "Activity_orgId_entityType_entityId_idx" ON "Activity"("orgId", "entityType", "entityId");
CREATE INDEX IF NOT EXISTS "Activity_createdAt_idx" ON "Activity"("createdAt");

-- ============================================================================
-- 10. Add Task table for follow-ups (if not exists)
-- ============================================================================

-- Note: We already have LeadTask, but we need a generic Task table
CREATE TABLE IF NOT EXISTS "Task" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "entityType" TEXT,  -- lead, opportunity, contact, organization, job (nullable for standalone tasks)
  "entityId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',  -- pending, in_progress, completed, cancelled
  "priority" TEXT NOT NULL DEFAULT 'medium',  -- low, medium, high, urgent
  "dueAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "assigneeId" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "Task_orgId_entityType_entityId_idx" ON "Task"("orgId", "entityType", "entityId");
CREATE INDEX IF NOT EXISTS "Task_assigneeId_status_idx" ON "Task"("assigneeId", "status");
CREATE INDEX IF NOT EXISTS "Task_dueAt_idx" ON "Task"("dueAt");

-- ============================================================================
-- 11. Add ConversionAudit table for tracking lead conversions
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ConversionAudit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "organizationId" TEXT,
  "contactId" TEXT,
  "convertedBy" TEXT NOT NULL,
  "conversionData" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "ConversionAudit_leadId_idx" ON "ConversionAudit"("leadId");
CREATE INDEX IF NOT EXISTS "ConversionAudit_customerId_idx" ON "ConversionAudit"("customerId");
CREATE INDEX IF NOT EXISTS "ConversionAudit_createdAt_idx" ON "ConversionAudit"("createdAt");

-- ============================================================================
-- 12. Add comments
-- ============================================================================

COMMENT ON COLUMN "JobTicket"."organizationId" IS 'CRM Organization link';
COMMENT ON COLUMN "JobTicket"."contactId" IS 'CRM Contact link';
COMMENT ON COLUMN "JobTicket"."opportunityId" IS 'CRM Opportunity link';
COMMENT ON COLUMN "Lead"."convertedToCustomerId" IS 'FSM Customer created from this lead';
COMMENT ON COLUMN "Lead"."convertedToOrganizationId" IS 'CRM Organization created from this lead';
COMMENT ON COLUMN "Lead"."convertedToContactId" IS 'CRM Contact created from this lead';
COMMENT ON COLUMN "Quote"."opportunityId" IS 'CRM Opportunity link';
COMMENT ON TABLE "ConversionAudit" IS 'Tracks lead to customer conversions with full audit trail';

