-- BINDER4 CRM ENHANCEMENTS
-- Generated: 2025-10-02
-- Purpose: Add Note, Attachment, Versioning, and Idempotency support for CRM

-- ============================================================================
-- NOTES (Polymorphic)
-- ============================================================================
CREATE TABLE "Note" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL, -- 'lead', 'contact', 'organization', 'opportunity', 'workorder', etc.
  "entityId" TEXT NOT NULL,
  "userId" TEXT NOT NULL, -- User who created the note
  "body" TEXT NOT NULL,
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "Note_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE
);

CREATE INDEX "Note_orgId_entityType_entityId_idx" ON "Note"("orgId", "entityType", "entityId");
CREATE INDEX "Note_userId_idx" ON "Note"("userId");
CREATE INDEX "Note_createdAt_idx" ON "Note"("createdAt");
CREATE INDEX "Note_isPinned_idx" ON "Note"("isPinned");

-- ============================================================================
-- ATTACHMENTS (Polymorphic)
-- ============================================================================
CREATE TABLE "Attachment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL, -- 'lead', 'contact', 'organization', 'opportunity', 'workorder', etc.
  "entityId" TEXT NOT NULL,
  "userId" TEXT NOT NULL, -- User who uploaded the file
  "fileName" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL, -- Size in bytes
  "mimeType" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL, -- S3/storage key
  "url" TEXT, -- Public URL if applicable
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "Attachment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE
);

CREATE INDEX "Attachment_orgId_entityType_entityId_idx" ON "Attachment"("orgId", "entityType", "entityId");
CREATE INDEX "Attachment_userId_idx" ON "Attachment"("userId");
CREATE INDEX "Attachment_createdAt_idx" ON "Attachment"("createdAt");

-- ============================================================================
-- IDEMPOTENCY TRACKING
-- ============================================================================
CREATE TABLE "IdempotencyKey" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "key" TEXT NOT NULL, -- The idempotency key from request
  "endpoint" TEXT NOT NULL, -- API endpoint
  "requestHash" TEXT NOT NULL, -- Hash of request body
  "responseStatus" INTEGER NOT NULL, -- HTTP status code
  "responseBody" TEXT, -- Cached response
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL, -- TTL for cleanup
  
  CONSTRAINT "IdempotencyKey_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "IdempotencyKey_orgId_key_idx" ON "IdempotencyKey"("orgId", "key");
CREATE INDEX "IdempotencyKey_expiresAt_idx" ON "IdempotencyKey"("expiresAt");

-- ============================================================================
-- ADD VERSIONING TO EXISTING MODELS
-- ============================================================================

-- Add version field to Lead
ALTER TABLE "Lead" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX "Lead_version_idx" ON "Lead"("version");

-- Add version field to Contact
ALTER TABLE "Contact" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX "Contact_version_idx" ON "Contact"("version");

-- Add version field to Organization
ALTER TABLE "Organization" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX "Organization_version_idx" ON "Organization"("version");

-- Add version field to Opportunity
ALTER TABLE "Opportunity" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX "Opportunity_version_idx" ON "Opportunity"("version");

-- ============================================================================
-- ADD BUSINESS UNIT SUPPORT TO CRM MODELS
-- ============================================================================

-- Add buId to Lead (optional - some leads may not be assigned to a BU yet)
ALTER TABLE "Lead" ADD COLUMN "buId" TEXT;
CREATE INDEX "Lead_buId_idx" ON "Lead"("buId");

-- Add buId to Contact (optional)
ALTER TABLE "Contact" ADD COLUMN "buId" TEXT;
CREATE INDEX "Contact_buId_idx" ON "Contact"("buId");

-- Add buId to Organization (optional)
ALTER TABLE "Organization" ADD COLUMN "buId" TEXT;
CREATE INDEX "Organization_buId_idx" ON "Organization"("buId");

-- Add buId to Opportunity (optional)
ALTER TABLE "Opportunity" ADD COLUMN "buId" TEXT;
CREATE INDEX "Opportunity_buId_idx" ON "Opportunity"("buId");

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- No seed data needed for this migration

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify Note table
-- SELECT COUNT(*) FROM "Note";

-- Verify Attachment table
-- SELECT COUNT(*) FROM "Attachment";

-- Verify IdempotencyKey table
-- SELECT COUNT(*) FROM "IdempotencyKey";

-- Verify versioning fields
-- SELECT id, version FROM "Lead" LIMIT 5;
-- SELECT id, version FROM "Contact" LIMIT 5;
-- SELECT id, version FROM "Organization" LIMIT 5;
-- SELECT id, version FROM "Opportunity" LIMIT 5;

-- Verify buId fields
-- SELECT id, buId FROM "Lead" WHERE buId IS NOT NULL LIMIT 5;
-- SELECT id, buId FROM "Contact" WHERE buId IS NOT NULL LIMIT 5;
-- SELECT id, buId FROM "Organization" WHERE buId IS NOT NULL LIMIT 5;
-- SELECT id, buId FROM "Opportunity" WHERE buId IS NOT NULL LIMIT 5;

