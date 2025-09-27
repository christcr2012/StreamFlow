// src/pages/api/admin/export.json.ts

/*
=== ENTERPRISE ROADMAP: DATA EXPORT & ANALYTICS API ===

CURRENT STATE vs ENTERPRISE STANDARDS:
- Basic JSON export with simple filtering and pagination
- Manual query construction with limited optimization
- No data transformation or enrichment during export
- Basic permission checking without data governance

ENTERPRISE DATA EXPORT COMPARISON (Tableau, Power BI, Looker, AWS QuickSight):
1. Advanced Data Processing:
   - Real-time streaming exports with incremental updates
   - Complex data transformations and aggregations
   - Multi-format export (JSON, CSV, Parquet, XML, Excel)
   - Data compression and encryption at rest/transit

2. Enterprise Analytics Features:
   - Self-service analytics with drag-and-drop interface
   - Automated report generation and scheduling
   - Interactive dashboards with drill-down capabilities
   - Data lineage tracking and impact analysis

3. Data Governance & Security:
   - Column-level security with dynamic masking
   - Data classification and sensitivity labeling
   - Audit logging with user attribution
   - GDPR compliance with right to be forgotten

IMPLEMENTATION ROADMAP:

🔥 Phase 1: Enhanced Export Foundation (Week 1-2)
1. MULTI-FORMAT EXPORT SYSTEM:
   - Support for CSV, Excel, Parquet, and streaming formats
   - Configurable data transformation pipelines
   - Compression and encryption for large datasets
   - Resumable downloads with progress tracking

2. ADVANCED QUERY ENGINE:
   - GraphQL-style field selection for optimal queries
   - Intelligent query optimization and caching
   - Parallel processing for large dataset exports
   - Query cost estimation and resource management

⚡ Phase 2: Analytics & Intelligence (Week 3-4)
3. REAL-TIME ANALYTICS PLATFORM:
   - Live data streaming with WebSocket connections
   - Event-driven analytics with real-time aggregations
   - Interactive chart generation and visualization
   - Automated insight generation with ML analysis

4. SELF-SERVICE ANALYTICS:
   - Visual query builder with drag-and-drop interface
   - Saved reports and dashboard creation
   - Collaborative analytics with sharing and comments
   - Alert system for threshold breaches and anomalies

🚀 Phase 3: Enterprise Data Platform (Month 2)
5. DATA GOVERNANCE FRAMEWORK:
   - Automated data classification and tagging
   - Column-level access controls with dynamic masking
   - Data lineage visualization and impact analysis
   - Compliance automation with policy enforcement

6. ADVANCED ANALYTICS CAPABILITIES:
   - Machine learning model integration for predictions
   - Statistical analysis with confidence intervals
   - Cohort analysis and funnel optimization
   - A/B testing framework with statistical significance

ENTERPRISE FEATURES TO IMPLEMENT:
*/

// ENTERPRISE FEATURE: Advanced export request with comprehensive options
export interface EnterpriseExportRequest {
  format: 'json' | 'csv' | 'excel' | 'parquet' | 'xml' | 'stream';
  query: {
    entities: string[];
    fields: string[];
    filters: Array<{
      field: string;
      operator: string;
      value: unknown;
      condition?: 'AND' | 'OR';
    }>;
    aggregations?: Array<{
      field: string;
      operation: 'sum' | 'count' | 'avg' | 'min' | 'max' | 'distinct';
      groupBy?: string[];
    }>;
    sorting: Array<{
      field: string;
      direction: 'asc' | 'desc';
    }>;
    pagination: {
      offset: number;
      limit: number;
    };
  };
  transformations: Array<{
    type: 'calculate' | 'enrich' | 'mask' | 'format';
    config: Record<string, unknown>;
  }>;
  options: {
    includeMetadata: boolean;
    compression: 'gzip' | 'brotli' | 'none';
    encryption: boolean;
    streaming: boolean;
    partitioning?: {
      field: string;
      size: number;
    };
  };
  governance: {
    purpose: string;
    retention: string;
    recipients: string[];
    classification: 'public' | 'internal' | 'confidential' | 'restricted';
  };
}

// ENTERPRISE FEATURE: Comprehensive export response with analytics
export interface EnterpriseExportResponse {
  success: boolean;
  exportId: string;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  metadata: {
    totalRecords: number;
    processedRecords: number;
    filteredRecords: number;
    exportSize: number;
    compressionRatio?: number;
    processingTime: number;
    queryOptimizations: string[];
  };
  data?: {
    records: unknown[];
    schema: Record<string, {
      type: string;
      nullable: boolean;
      description: string;
      classification?: string;
    }>;
    aggregations?: Record<string, unknown>;
  };
  download?: {
    urls: Array<{
      format: string;
      url: string;
      expiresAt: string;
      size: number;
    }>;
    resumable: boolean;
    chunks: number;
  };
  analytics: {
    insights: Array<{
      type: string;
      message: string;
      confidence: number;
    }>;
    recommendations: string[];
    dataQualityScore: number;
    completeness: number;
  };
  governance: {
    auditTrail: string;
    sensitiveDataDetected: boolean;
    complianceStatus: 'compliant' | 'review_required' | 'violation';
    retention: {
      policy: string;
      deleteAfter: string;
    };
  };
  error?: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import type { Prisma, LeadSource, LeadStatus } from "@prisma/client";
import { assertPermission, getOrgIdFromReq, PERMS } from "@/lib/rbac";
import { computeWindow, endOfDayUTC, parseLimit, readStringFilter } from "@/lib/reportingWindow";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).end("Method Not Allowed");
    }

    if (!(await assertPermission(req, res, PERMS.LEAD_EXPORT))) return;

    const orgId = await getOrgIdFromReq(req);
    if (!orgId) return res.status(400).json({ ok: false, error: "No org for current user" });

    const { from, to, label } = computeWindow(req.query);
    const statusStr = readStringFilter(req.query, "status");
    const sourceTypeStr = readStringFilter(req.query, "sourceType");
    const status: LeadStatus | undefined = statusStr ? (statusStr.toUpperCase() as LeadStatus) : undefined;
    const sourceType: LeadSource | undefined = sourceTypeStr ? (sourceTypeStr.toUpperCase() as LeadSource) : undefined;
    const limit = parseLimit(req.query, 10000, 100000);

    const where: Prisma.LeadWhereInput = {
      orgId,
      createdAt: { gte: from, lte: endOfDayUTC(to) },
      ...(status ? { status } : {}),
      ...(sourceType ? { sourceType } : {}),
    };

    const items = await db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        publicId: true,
        orgId: true,
        createdAt: true,
        convertedAt: true,
        status: true,
        company: true,
        contactName: true,
        email: true,
        phoneE164: true,
        serviceCode: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        zip: true,
        notes: true,
        sourceType: true,
        sourceDetail: true,
        systemGenerated: true,
        aiScore: true,
        enrichmentJson: true,
      },
    });

    // ENTERPRISE TODO: Add comprehensive export headers and metadata
    // Implementation should include:
    // 1. Data lineage and provenance information
    // 2. Export tracking with unique correlation IDs
    // 3. Data quality metrics and completeness scores
    // 4. Compliance metadata and sensitive data indicators
    
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    // ENTERPRISE TODO: Add security and governance headers
    // res.setHeader("X-Data-Classification", "internal");
    // res.setHeader("X-Export-ID", generateCorrelationId());
    // res.setHeader("X-Data-Lineage", JSON.stringify({ source: 'lead_database', version: '1.0' }));
    
    return res.status(200).json({
      ok: true,
      count: items.length,
      window: {
        label,
        fromISO: from.toISOString().slice(0, 10),
        toISO: to.toISOString().slice(0, 10),
      },
      filters: { status: status ?? null, sourceType: sourceType ?? null, limit },
      items,
      // ENTERPRISE TODO: Add comprehensive export metadata
      // metadata: {
      //   exportId: correlationId,
      //   dataQuality: calculateDataQualityScore(items),
      //   completeness: calculateCompleteness(items),
      //   sensitiveDataDetected: scanForSensitiveData(items),
      //   processingTime: Date.now() - startTime,
      //   queryOptimizations: getQueryOptimizations()
      // }
    });
  } catch (err: unknown) {
    console.error("/api/admin/export.json error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return res.status(500).json({ ok: false, error: message });
  }
}
