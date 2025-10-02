-- BINDER5 ENHANCEMENTS
-- Generated: 2025-10-02
-- Purpose: Add Asset tracking, Rate limiting, Work order lifecycle, DVIR enhancements

-- ============================================================================
-- ASSETS & QR TRACKING
-- ============================================================================
CREATE TABLE "Asset" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "buId" TEXT, -- Business Unit assignment
  "assetNumber" TEXT NOT NULL, -- Unique asset number (e.g., "AST-001")
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL, -- 'equipment', 'tool', 'vehicle', 'material', 'other'
  "status" TEXT NOT NULL DEFAULT 'active', -- 'active', 'maintenance', 'retired', 'lost'
  
  -- QR Code
  "qrCode" TEXT NOT NULL UNIQUE, -- QR code value (UUID or custom)
  "qrCodeUrl" TEXT, -- URL to QR code image
  
  -- Location & Assignment
  "locationId" TEXT, -- Current location (JobSite, BusinessUnit, etc.)
  "locationType" TEXT, -- 'jobsite', 'bu', 'warehouse', 'vehicle'
  "assignedToUserId" TEXT, -- Currently assigned to user
  "assignedToVehicleId" TEXT, -- Currently assigned to vehicle
  
  -- Financial
  "purchasePrice" INTEGER, -- Purchase price in cents
  "currentValue" INTEGER, -- Current value in cents
  "purchaseDate" TIMESTAMP(3),
  "warrantyExpiry" TIMESTAMP(3),
  
  -- Maintenance
  "lastMaintenanceAt" TIMESTAMP(3),
  "nextMaintenanceAt" TIMESTAMP(3),
  "maintenanceIntervalDays" INTEGER,
  
  -- Metadata
  "serialNumber" TEXT,
  "manufacturer" TEXT,
  "model" TEXT,
  "customFields" TEXT DEFAULT '{}', -- JSON
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "Asset_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "Asset_orgId_assetNumber_idx" ON "Asset"("orgId", "assetNumber");
CREATE INDEX "Asset_orgId_category_idx" ON "Asset"("orgId", "category");
CREATE INDEX "Asset_orgId_status_idx" ON "Asset"("orgId", "status");
CREATE INDEX "Asset_qrCode_idx" ON "Asset"("qrCode");
CREATE INDEX "Asset_assignedToUserId_idx" ON "Asset"("assignedToUserId");
CREATE INDEX "Asset_buId_idx" ON "Asset"("buId");

-- ============================================================================
-- ASSET HISTORY (Track movements, assignments, scans)
-- ============================================================================
CREATE TABLE "AssetHistory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "userId" TEXT, -- User who performed action
  "action" TEXT NOT NULL, -- 'scan', 'assign', 'unassign', 'move', 'maintenance', 'status_change'
  "fromValue" TEXT, -- Previous value (location, user, status, etc.)
  "toValue" TEXT, -- New value
  "notes" TEXT,
  "location" TEXT, -- GPS coordinates or location description
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "AssetHistory_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE,
  CONSTRAINT "AssetHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE
);

CREATE INDEX "AssetHistory_assetId_createdAt_idx" ON "AssetHistory"("assetId", "createdAt");
CREATE INDEX "AssetHistory_orgId_userId_idx" ON "AssetHistory"("orgId", "userId");
CREATE INDEX "AssetHistory_action_idx" ON "AssetHistory"("action");

-- ============================================================================
-- RATE LIMITING
-- ============================================================================
CREATE TABLE "RateLimit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "buId" TEXT, -- Optional: Business Unit specific limits
  "key" TEXT NOT NULL, -- Rate limit key (e.g., 'api:leads:create', 'ai:chat')
  "limitPerMinute" INTEGER NOT NULL DEFAULT 60,
  "limitPerHour" INTEGER NOT NULL DEFAULT 1000,
  "limitPerDay" INTEGER NOT NULL DEFAULT 10000,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "RateLimit_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "RateLimit_orgId_buId_key_idx" ON "RateLimit"("orgId", "buId", "key");
CREATE INDEX "RateLimit_enabled_idx" ON "RateLimit"("enabled");

-- ============================================================================
-- RATE LIMIT USAGE (Track actual usage)
-- ============================================================================
CREATE TABLE "RateLimitUsage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "buId" TEXT,
  "key" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL, -- Start of time window
  "windowType" TEXT NOT NULL, -- 'minute', 'hour', 'day'
  "count" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "RateLimitUsage_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "RateLimitUsage_orgId_key_windowStart_windowType_idx" ON "RateLimitUsage"("orgId", "key", "windowStart", "windowType");
CREATE INDEX "RateLimitUsage_windowStart_idx" ON "RateLimitUsage"("windowStart");

-- ============================================================================
-- WORK ORDER LIFECYCLE ENHANCEMENTS
-- ============================================================================

-- Add lifecycle fields to WorkOrder
ALTER TABLE "WorkOrder" ADD COLUMN "pausedAt" TIMESTAMP(3);
ALTER TABLE "WorkOrder" ADD COLUMN "resumedAt" TIMESTAMP(3);
ALTER TABLE "WorkOrder" ADD COLUMN "pauseReason" TEXT;
ALTER TABLE "WorkOrder" ADD COLUMN "completedBy" TEXT; -- User who completed
ALTER TABLE "WorkOrder" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1; -- Optimistic locking

CREATE INDEX "WorkOrder_status_idx" ON "WorkOrder"("status");
CREATE INDEX "WorkOrder_completedBy_idx" ON "WorkOrder"("completedBy");

-- ============================================================================
-- WORK ORDER TIME TRACKING
-- ============================================================================
CREATE TABLE "WorkOrderTimeEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "userId" TEXT NOT NULL, -- Tech who logged time
  "startedAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "durationMinutes" INTEGER, -- Calculated duration
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "WorkOrderTimeEntry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE,
  CONSTRAINT "WorkOrderTimeEntry_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE
);

CREATE INDEX "WorkOrderTimeEntry_workOrderId_idx" ON "WorkOrderTimeEntry"("workOrderId");
CREATE INDEX "WorkOrderTimeEntry_userId_idx" ON "WorkOrderTimeEntry"("userId");
CREATE INDEX "WorkOrderTimeEntry_startedAt_idx" ON "WorkOrderTimeEntry"("startedAt");

-- ============================================================================
-- DVIR (Driver Vehicle Inspection Report) ENHANCEMENTS
-- ============================================================================

-- Add DVIR status to FleetVehicle
ALTER TABLE "FleetVehicle" ADD COLUMN "dvirStatus" TEXT DEFAULT 'pass'; -- 'pass', 'fail', 'pending'
ALTER TABLE "FleetVehicle" ADD COLUMN "lastDvirAt" TIMESTAMP(3);
ALTER TABLE "FleetVehicle" ADD COLUMN "nextDvirDue" TIMESTAMP(3);

CREATE INDEX "FleetVehicle_dvirStatus_idx" ON "FleetVehicle"("dvirStatus");
CREATE INDEX "FleetVehicle_nextDvirDue_idx" ON "FleetVehicle"("nextDvirDue");

-- ============================================================================
-- SYNC QUEUE (for offline-first Field PWA)
-- ============================================================================
CREATE TABLE "SyncQueue" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deviceId" TEXT, -- Device identifier
  "action" TEXT NOT NULL, -- 'create', 'update', 'delete'
  "entityType" TEXT NOT NULL, -- 'workorder', 'timeentry', 'note', etc.
  "entityId" TEXT,
  "payload" TEXT NOT NULL, -- JSON payload
  "status" TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'synced', 'failed'
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "syncedAt" TIMESTAMP(3),
  
  CONSTRAINT "SyncQueue_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE
);

CREATE INDEX "SyncQueue_orgId_userId_status_idx" ON "SyncQueue"("orgId", "userId", "status");
CREATE INDEX "SyncQueue_status_createdAt_idx" ON "SyncQueue"("status", "createdAt");
CREATE INDEX "SyncQueue_deviceId_idx" ON "SyncQueue"("deviceId");

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- No seed data needed for this migration

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify Asset table
-- SELECT COUNT(*) FROM "Asset";

-- Verify AssetHistory table
-- SELECT COUNT(*) FROM "AssetHistory";

-- Verify RateLimit table
-- SELECT COUNT(*) FROM "RateLimit";

-- Verify WorkOrder enhancements
-- SELECT id, pausedAt, resumedAt, version FROM "WorkOrder" LIMIT 5;

-- Verify WorkOrderTimeEntry table
-- SELECT COUNT(*) FROM "WorkOrderTimeEntry";

-- Verify SyncQueue table
-- SELECT COUNT(*) FROM "SyncQueue";

