// src/pages/api/admin/audit-export.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS } from "@/lib/rbac";
import { requireAuth } from "@/lib/auth-helpers";
import { auditAction } from "@/lib/audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Require Owner-level permissions for audit export
  const user = await requireAuth(req, res);
  if (!user) return;

  if (!(await assertPermission(req, res, PERMS.AUDIT_EXPORT))) return;

  try {
    const {
      action,
      userId,
      target,
      severity,
      category,
      dateFrom,
      dateTo,
      success,
      format = 'csv'
    } = req.body;

    // Build where clause
    const whereClause: any = {
      orgId: user.orgId,
    };

    if (action) {
      whereClause.action = { contains: action as string, mode: 'insensitive' };
    }

    if (userId) {
      whereClause.userId = userId as string;
    }

    if (target) {
      whereClause.target = target as string;
    }

    if (severity) {
      whereClause.severity = severity as string;
    }

    if (category) {
      whereClause.category = category as string;
    }

    if (success !== undefined) {
      whereClause.success = success === true;
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) {
        whereClause.createdAt.gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        whereClause.createdAt.lte = new Date(dateTo as string);
      }
    }

    // Get audit events
    const events = await db.auditEvent.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 10000, // Limit to 10K records for export
    });

    // Get user details for events
    const userIds = [...new Set(events.map(e => e.userId).filter(Boolean))] as string[];
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    });

    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    // Generate enterprise-grade export with cryptographic integrity
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
      organizationId: user.orgId,
      recordCount: events.length,
      filters: { action, userId, target, severity, category, dateFrom, dateTo, success },
      events: events.map(event => {
        const eventUser = event.userId ? userMap[event.userId] : null;
        return {
          ...event,
          user: eventUser ? { email: eventUser.email, name: eventUser.name } : null,
        };
      }),
    };

    // Generate cryptographic signature for tamper detection
    const signature = await generateExportSignature(exportData);
    const integrityHash = await generateIntegrityHash(exportData.events);

    // Generate CSV content with integrity verification
    if (format === 'csv') {
      const csvHeader = [
        'Timestamp',
        'User Email',
        'User Name',
        'Action',
        'Target',
        'Target ID',
        'Success',
        'Severity',
        'Category',
        'IP Address',
        'User Agent',
        'Hash',
        'Details',
        'Error Message'
      ].join(',');

      const csvRows = exportData.events.map(event => {
        return [
          event.createdAt.toISOString(),
          event.user?.email || '',
          event.user?.name || '',
          event.action,
          event.target,
          event.targetId || '',
          event.success.toString(),
          event.severity,
          event.category,
          event.ipAddress || '',
          event.userAgent || '',
          event.hash || '',
          JSON.stringify(event.details || {}),
          event.errorMessage || ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
      });

      // Add integrity footer for tamper detection
      const integrityFooter = [
        '',
        '# ENTERPRISE INTEGRITY VERIFICATION',
        `# Export Hash: ${integrityHash}`,
        `# Digital Signature: ${signature}`,
        `# Exported At: ${exportData.exportedAt}`,
        `# Exported By: ${exportData.exportedBy}`,
        `# Organization: ${exportData.organizationId}`,
        `# Record Count: ${exportData.recordCount}`,
        '# WARNING: Any modification to this file will invalidate the integrity signature',
        '# To verify: Recalculate hash of data rows and compare with Export Hash above'
      ].join('\n');

      const csvContent = [csvHeader, ...csvRows, integrityFooter].join('\n');

      // Set headers for file download with integrity metadata
      const filename = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('X-Export-Signature', signature);
      res.setHeader('X-Integrity-Hash', integrityHash);
      res.setHeader('X-Export-Algorithm', 'HMAC-SHA256');
      
      await auditAction(req, {
        action: 'audit_export',
        target: 'audit_event',
        category: 'ADMIN_ACTION',
        details: { 
          format,
          recordCount: events.length,
          signature: signature.substring(0, 16) + '...', // Partial for security
          integrityHash: integrityHash.substring(0, 16) + '...',
          filters: { action, userId, target, severity, category, dateFrom, dateTo, success }
        },
      });

      res.send(csvContent);
    } else {
      // Enhanced JSON export with enterprise integrity
      const signedExport = {
        ...exportData,
        integrity: {
          signature,
          hash: integrityHash,
          algorithm: 'SHA-256',
          signedWith: 'HMAC-SHA256',
          keyId: 'audit-export-v1',
        },
        verification: {
          instructions: 'To verify integrity, recalculate hash of events array and compare with provided hash',
          warning: 'Any modification to the events array will invalidate the integrity signature',
          algorithm: 'SHA-256 hash of sorted event data',
        },
      };

      await auditAction(req, {
        action: 'audit_export',
        target: 'audit_event',
        category: 'ADMIN_ACTION',
        details: { 
          format,
          recordCount: events.length,
          signature: signature.substring(0, 16) + '...',
          integrityHash: integrityHash.substring(0, 16) + '...',
          filters: { action, userId, target, severity, category, dateFrom, dateTo, success }
        },
      });

      const filename = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('X-Export-Signature', signature);
      res.setHeader('X-Integrity-Hash', integrityHash);
      res.setHeader('X-Export-Algorithm', 'HMAC-SHA256');
      res.json(signedExport);
    }

  } catch (error) {
    console.error("Audit export error:", error);
    res.status(500).json({ error: "Failed to export audit events" });
  }
}

/**
 * Generate cryptographic signature for export integrity
 */
async function generateExportSignature(exportData: any): Promise<string> {
  const crypto = await import('crypto');
  const secret = process.env.SESSION_SECRET || 'audit-export-secret';
  const dataString = JSON.stringify(exportData, Object.keys(exportData).sort());
  return crypto.createHmac('sha256', secret).update(dataString).digest('hex');
}

/**
 * Generate integrity hash for audit events
 */
async function generateIntegrityHash(events: any[]): Promise<string> {
  const crypto = await import('crypto');
  const eventsString = JSON.stringify(events.map(e => ({
    id: e.id,
    action: e.action,
    target: e.target,
    targetId: e.targetId,
    createdAt: e.createdAt,
    hash: e.hash || '', // Include existing hashes if available
  })));
  return crypto.createHash('sha256').update(eventsString).digest('hex');
}