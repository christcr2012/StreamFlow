-- ConversionAudit Migration (Binder2 - Option C - Authoritative)
-- Tracks all CRM entity conversions and mutations for compliance

-- Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS "ConversionAudit" CASCADE;

-- Create ConversionAudit table
CREATE TABLE "ConversionAudit" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" TEXT NOT NULL,
  "organizationId" TEXT NULL,
  "userId" TEXT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  meta JSONB NULL,
  ip TEXT NULL,
  "userAgent" TEXT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE "ConversionAudit"
  ADD CONSTRAINT fk_conv_audit_tenant 
  FOREIGN KEY ("tenantId") REFERENCES "Org"(id) ON DELETE CASCADE;

ALTER TABLE "ConversionAudit"
  ADD CONSTRAINT fk_conv_audit_org 
  FOREIGN KEY ("organizationId") REFERENCES "Organization"(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS ix_conv_audit_tenant_created 
  ON "ConversionAudit" ("tenantId", "createdAt");

CREATE INDEX IF NOT EXISTS ix_conv_audit_tenant_resource 
  ON "ConversionAudit" ("tenantId", resource);

CREATE INDEX IF NOT EXISTS ix_conv_audit_tenant_org 
  ON "ConversionAudit" ("tenantId", "organizationId");

-- Optional: Enable RLS (Row Level Security) if used elsewhere
-- Uncomment if RLS is enabled in your database
/*
DO $$ 
BEGIN
  -- Check if table exists
  IF EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'ConversionAudit' AND n.nspname = 'public'
  ) THEN
    -- Enable RLS
    ALTER TABLE "ConversionAudit" ENABLE ROW LEVEL SECURITY;
    
    -- Create policy if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE polname = 'conv_audit_tenant_rls' 
      AND tablename = 'ConversionAudit'
    ) THEN
      CREATE POLICY conv_audit_tenant_rls ON "ConversionAudit"
        USING ("tenantId" = current_setting('app.tenant_id', true))
        WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
    END IF;
  END IF;
END $$;
*/

