// src/pages/api/admin/audit-events.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS } from "@/lib/rbac";
import { requireAuth } from "@/lib/auth-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Require Owner-level permissions for audit access
  const user = await requireAuth(req, res);
  if (!user) return;

  if (!(await assertPermission(req, res, PERMS.AUDIT_READ))) return;

  try {
    const {
      page = "1",
      limit = "50",
      action,
      userId,
      target,
      severity,
      category,
      dateFrom,
      dateTo,
      success,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;

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
      whereClause.success = success === 'true';
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

    // Get audit events with pagination
    const [events, totalCount] = await Promise.all([
      db.auditEvent.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limitNum,
        select: {
          id: true,
          userId: true,
          sessionId: true,
          action: true,
          target: true,
          targetId: true,
          details: true,
          ipAddress: true,
          userAgent: true,
          severity: true,
          category: true,
          success: true,
          errorMessage: true,
          createdAt: true,
        },
      }),
      db.auditEvent.count({ where: whereClause }),
    ]);

    // Get user details for events
    const userIds = [...new Set(events.map(e => e.userId).filter(Boolean))] as string[];
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    });

    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    // Enrich events with user information
    const enrichedEvents = events.map(event => ({
      ...event,
      user: event.userId ? userMap[event.userId] : null,
    }));

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      events: enrichedEvents,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
      filters: {
        action,
        userId,
        target,
        severity,
        category,
        dateFrom,
        dateTo,
        success,
      },
    });

  } catch (error) {
    console.error("Audit events error:", error);
    res.status(500).json({ error: "Failed to fetch audit events" });
  }
}