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
    const userIds = [...new Set(events.map(e => e.userId).filter(Boolean))];
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    });

    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    // Generate CSV content
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
        'Details',
        'Error Message'
      ].join(',');

      const csvRows = events.map(event => {
        const user = event.userId ? userMap[event.userId] : null;
        return [
          event.createdAt.toISOString(),
          user?.email || '',
          user?.name || '',
          event.action,
          event.target,
          event.targetId || '',
          event.success.toString(),
          event.severity,
          event.category,
          event.ipAddress || '',
          event.userAgent || '',
          JSON.stringify(event.details || {}),
          event.errorMessage || ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
      });

      const csvContent = [csvHeader, ...csvRows].join('\n');

      // Set headers for file download
      const filename = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      await auditAction(req, {
        action: 'audit_export',
        target: 'audit_event',
        category: 'ADMIN_ACTION',
        details: { 
          format,
          recordCount: events.length,
          filters: { action, userId, target, severity, category, dateFrom, dateTo, success }
        },
      });

      res.send(csvContent);
    } else {
      // JSON export
      const enrichedEvents = events.map(event => ({
        ...event,
        user: event.userId ? userMap[event.userId] : null,
      }));

      await auditAction(req, {
        action: 'audit_export',
        target: 'audit_event',
        category: 'ADMIN_ACTION',
        details: { 
          format,
          recordCount: events.length,
          filters: { action, userId, target, severity, category, dateFrom, dateTo, success }
        },
      });

      const filename = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json({
        exportedAt: new Date().toISOString(),
        recordCount: events.length,
        filters: { action, userId, target, severity, category, dateFrom, dateTo, success },
        events: enrichedEvents,
      });
    }

  } catch (error) {
    console.error("Audit export error:", error);
    res.status(500).json({ error: "Failed to export audit events" });
  }
}