// src/pages/api/leads.ts

/*
=== ENTERPRISE ROADMAP: LEAD MANAGEMENT API ===

CURRENT STATE vs ENTERPRISE STANDARDS:
- Basic CRUD operations for leads
- Simple identity hashing for deduplication
- Manual lead creation and update
- Limited validation and enrichment

ENTERPRISE CRM COMPARISON (Salesforce, HubSpot, Pipedrive APIs):
1. Advanced Lead Operations:
   - Bulk import/export with transformation
   - Automated lead assignment and routing
   - Lead lifecycle automation with workflows
   - Real-time lead synchronization across systems

2. Data Enrichment Integration:
   - Automatic company and contact enrichment
   - Social media profile matching
   - Email and phone validation services
   - Intent data integration from multiple sources

3. Advanced API Features:
   - GraphQL endpoints for complex queries
   - Webhook subscriptions for real-time updates
   - Rate limiting and API key management
   - Comprehensive audit logging and analytics

IMPLEMENTATION ROADMAP:

Phase 1: Enhanced API Capabilities (2-3 weeks)
- Add bulk operations (create, update, delete multiple leads)
- Implement field-level validation with custom rules
- Add lead assignment automation based on territories/skills
- Create comprehensive lead search with filters and sorting

Phase 2: Data Enrichment Platform (1-2 months)
- Integrate lead enrichment services (Clearbit, ZoomInfo)
- Add email verification and phone validation
- Implement company data matching and normalization
- Create automated data quality scoring and reporting

Phase 3: Workflow Automation (2-3 months)
- Build lead routing engine with configurable rules
- Add lead lifecycle automation (nurturing, scoring updates)
- Implement trigger-based actions and notifications
- Create custom workflow builder with visual interface

Phase 4: Advanced Integration & OpenAPI Documentation (1-2 months)
- Add GraphQL API for complex data relationships
- Implement real-time webhooks for external systems
- Create API rate limiting and usage analytics
- Add comprehensive OpenAPI 3.0 specification with automated tooling

OPENAPI IMPLEMENTATION STRATEGY (NEXT.JS/VERCEL OPTIMIZED):

A) Schema-First Development with Zod:
```typescript
// Install: npm install zod @asteasolutions/zod-to-openapi swagger-ui-react
import { z } from 'zod';
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';

const LeadSchema = z.object({
  id: z.string().openapi({ example: 'lead_123' }),
  company: z.string().min(1).openapi({ example: 'Acme Corp' }),
  email: z.string().email().openapi({ example: 'contact@acme.com' }),
  aiScore: z.number().min(0).max(100).openapi({ example: 85 }),
});

const createLeadRoute = createRoute({
  method: 'post',
  path: '/api/leads',
  request: { body: { content: { 'application/json': { schema: LeadSchema } } } },
  responses: { 200: { description: 'Lead created', content: { 'application/json': { schema: LeadSchema } } } },
});
```

B) Automated API Documentation Generation:
- Static generation: Generate OpenAPI spec at build time
- Dynamic docs: Swagger UI at /api/docs endpoint  
- Type safety: Full TypeScript integration with request/response validation
- CI/CD: Automated spec validation and breaking change detection

C) Production Deployment Strategy:
- Vercel Edge Functions: Serve Swagger UI from edge locations
- Build-time validation: Fail builds on schema inconsistencies  
- Version management: API versioning with backward compatibility checks
- Security: API key management and rate limiting integration

ENTERPRISE FEATURES TO IMPLEMENT:
*/

// ENTERPRISE FEATURE: Bulk lead operations
export type BulkLeadOperation = {
  operation: 'create' | 'update' | 'delete' | 'merge';
  leads: Array<{
    id?: string;
    data: Record<string, unknown>;
    enrichment?: boolean;
    validation?: boolean;
  }>;
  options: {
    skipDuplicates?: boolean;
    autoAssign?: boolean;
    sendNotifications?: boolean;
    batchSize?: number;
  };
};

// ENTERPRISE FEATURE: Lead enrichment request
export type LeadEnrichmentRequest = {
  leadId: string;
  services: Array<'company' | 'contact' | 'social' | 'intent' | 'validation'>;
  options: {
    priority: 'high' | 'normal' | 'low';
    webhook?: string;
    skipExisting?: boolean;
  };
};

// ENTERPRISE FEATURE: Advanced lead search
export type AdvancedLeadSearch = {
  filters: {
    scoreRange?: { min: number; max: number };
    sources?: string[];
    territories?: string[];
    tags?: string[];
    customFields?: Record<string, unknown>;
    dateRanges?: Record<string, { from: Date; to: Date }>;
  };
  sorting: Array<{
    field: string;
    direction: 'asc' | 'desc';
    priority: number;
  }>;
  aggregations?: Array<{
    field: string;
    type: 'count' | 'sum' | 'avg' | 'min' | 'max';
    groupBy?: string;
  }>;
};

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, getOrgIdFromReq, PERMS } from "@/lib/rbac";
import { withTenantScope, TenantScopedPrisma } from "@/lib/tenant-scope";
import { LeadSource, LeadStatus, Prisma } from "@prisma/client";
import crypto from "node:crypto";

function identityHash(input: { email?: string | null; phoneE164?: string | null; company?: string | null; name?: string | null }) {
  const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();
  const key = [norm(input.email), norm(input.phoneE164), norm(input.company), norm(input.name)].filter(Boolean).join("|");
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 24);
}
function asJson(v: unknown): Prisma.InputJsonValue {
  return (v ?? {}) as Prisma.InputJsonValue;
}
function toLeadSource(val: string | undefined): LeadSource {
  switch ((val ?? "").toUpperCase()) {
    case "COLD": return LeadSource.COLD;
    case "HOT": return LeadSource.HOT;
    case "RFP": return LeadSource.RFP;
    case "MANUAL_EMPLOYEE_REFERRAL": return LeadSource.MANUAL_EMPLOYEE_REFERRAL;
    case "MANUAL_EXISTING_CUSTOMER": return LeadSource.MANUAL_EXISTING_CUSTOMER;
    case "MANUAL_NEW_CUSTOMER": return LeadSource.MANUAL_NEW_CUSTOMER;
    case "MANUAL_OTHER": return LeadSource.MANUAL_OTHER;
    case "SYSTEM": return LeadSource.SYSTEM;
    case "EMPLOYEE_REFERRAL": return LeadSource.EMPLOYEE_REFERRAL;
    case "MANUAL": return LeadSource.MANUAL;
    case "LSA": return LeadSource.LSA;
    default: return LeadSource.MANUAL;
  }
}
function toLeadStatus(val: string | undefined): LeadStatus {
  const v = (val ?? "").toUpperCase();
  if (v === "CONVERTED" || v === "WON" || v === "CLOSED-WON") return LeadStatus.CONVERTED;
  return LeadStatus.NEW;
}
function leadPublicId(): string {
  return `LEAD_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function handler(req: NextApiRequest, res: NextApiResponse, tenantPrisma: TenantScopedPrisma) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).end("Method Not Allowed");
    }

    if (!(await assertPermission(req, res, PERMS.LEAD_CREATE))) return;

    const orgId = await getOrgIdFromReq(req);
    if (!orgId) return res.status(400).json({ ok: false, error: "Missing org" });

    // Extract and cast body fields from unknown values.  Each field should be
    // explicitly typed before use to satisfy TypeScript and ensure proper
    // runtime behaviour.  Unknown values that are not strings are ignored.
    const body = (req.body ?? {}) as Record<string, unknown>;
    const companyRaw = body.company;
    const contactNameRaw = body.contactName;
    const emailRaw = body.email;
    const phoneRaw = body.phoneE164;
    const websiteRaw = body.website;
    const serviceCodeRaw = body.serviceCode;
    const address1Raw = body.addressLine1;
    const address2Raw = body.addressLine2;
    const cityRaw = body.city;
    const stateRaw = body.state;
    const zipRaw = body.zip;
    const postalRaw = body.postalCode;
    const countryRaw = body.country;
    const notesRaw = body.notes;
    const srcTypeRaw = body.sourceType;
    const statusRaw = body.status;
    const aiScoreRaw = body.aiScore;
    const scoreFactorsRaw = body.scoreFactors;

    const company: string | undefined = typeof companyRaw === "string" ? companyRaw : undefined;
    const contactName: string | undefined = typeof contactNameRaw === "string" ? contactNameRaw : undefined;
    const email: string | undefined = typeof emailRaw === "string" ? emailRaw : undefined;
    const phoneE164: string | undefined = typeof phoneRaw === "string" ? phoneRaw : undefined;
    const website: string | undefined = typeof websiteRaw === "string" ? websiteRaw : undefined;
    const serviceCode: string | undefined = typeof serviceCodeRaw === "string" ? serviceCodeRaw : undefined;
    const addressLine1: string | undefined = typeof address1Raw === "string" ? address1Raw : undefined;
    const addressLine2: string | undefined = typeof address2Raw === "string" ? address2Raw : undefined;
    const city: string | undefined = typeof cityRaw === "string" ? cityRaw : undefined;
    const state: string | undefined = typeof stateRaw === "string" ? stateRaw : undefined;
    const zip: string | undefined = typeof zipRaw === "string" ? zipRaw : undefined;
    const postalCode: string | undefined = typeof postalRaw === "string" ? postalRaw : undefined;
    const country: string | undefined = typeof countryRaw === "string" ? countryRaw : undefined;
    const notes: string | undefined = typeof notesRaw === "string" ? notesRaw : undefined;
    const srcTypeStr: string | undefined = typeof srcTypeRaw === "string" ? srcTypeRaw : undefined;
    const statusStr: string | undefined = typeof statusRaw === "string" ? statusRaw : undefined;
    const aiScoreVal: number | undefined = typeof aiScoreRaw === "number" ? aiScoreRaw : undefined;
    const scoreFactorsVal: unknown = scoreFactorsRaw;

    const srcType = toLeadSource(srcTypeStr);
    const status = toLeadStatus(statusStr);

    const publicId = leadPublicId();
    const ih = identityHash({ email, phoneE164: phoneE164 ?? null, company, name: contactName });

    const lead = await tenantPrisma.create('lead', {
      data: {
        publicId,
        sourceType: srcType,
        identityHash: ih,
        company: company ?? null,
        contactName: contactName ?? null,
        email: email ?? null,
        phoneE164: phoneE164 ?? null,
        website: website ?? null,
        serviceCode: serviceCode ?? null,
        address: addressLine1
          ? `${addressLine1}${addressLine2 ? ", " + addressLine2 : ""}`
          : null,
        addressLine1: addressLine1 ?? null,
        addressLine2: addressLine2 ?? null,
        city: city ?? null,
        state: state ?? null,
        zip: zip ?? null,
        postalCode: postalCode ?? null,
        country: country ?? null,
        enrichmentJson: asJson({}),
        aiScore: aiScoreVal ?? 0,
        scoreFactors: asJson(scoreFactorsVal ?? {}),
        notes: notes ?? null,
        status,
        convertedAt: status === LeadStatus.CONVERTED ? new Date() : null, // if you want auto-set on converted
      },
      select: { id: true, publicId: true }
    });

    return res.status(200).json({ ok: true, lead });
  } catch (err: unknown) {
    console.error("/api/leads error:", err);
    const msg = (err as { message?: string } | undefined)?.message ?? "Internal Server Error";
    return res.status(500).json({ ok: false, error: msg });
  }
}

// Apply tenant scoping to ensure all queries include orgId
export default withTenantScope(handler);
