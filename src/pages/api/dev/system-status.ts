// src/pages/api/dev/system-status.ts

/**
 * 🛠️ DEVELOPER SYSTEM STATUS API
 * 
 * Real-time system health monitoring for developer dashboard.
 * Inspired by GitHub Status, Vercel Status, and AWS Health Dashboard.
 * 
 * MONITORED SYSTEMS:
 * - Database connectivity and performance
 * - API endpoints and response times
 * - AI services and model availability
 * - Federation connectivity and health
 * - Cache systems and memory usage
 * 
 * STATUS LEVELS:
 * - healthy: All systems operational
 * - warning: Minor issues, degraded performance
 * - error: Major issues, service disruption
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma as db } from '@/lib/prisma';

interface SystemStatus {
  database: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
  ai: 'healthy' | 'warning' | 'error';
  federation: 'healthy' | 'warning' | 'error';
  cache: 'healthy' | 'warning' | 'error';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check if user has developer access (OWNER role or specific dev email)
    const email = req.cookies.ws_user;
    if (!email) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { role: true, email: true }
    });

    const isDeveloper = user?.role === 'OWNER' || user?.email === 'gametcr3@gmail.com';
    
    if (!isDeveloper) {
      return res.status(403).json({ ok: false, error: 'Developer access required' });
    }

    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const systemStatus = await checkSystemStatus();

    return res.status(200).json({
      ok: true,
      status: systemStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('System status API error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
}

async function checkSystemStatus(): Promise<SystemStatus> {
  const [
    databaseStatus,
    apiStatus,
    aiStatus,
    federationStatus,
    cacheStatus
  ] = await Promise.all([
    checkDatabaseHealth(),
    checkApiHealth(),
    checkAiHealth(),
    checkFederationHealth(),
    checkCacheHealth()
  ]);

  return {
    database: databaseStatus,
    api: apiStatus,
    ai: aiStatus,
    federation: federationStatus,
    cache: cacheStatus
  };
}

async function checkDatabaseHealth(): Promise<'healthy' | 'warning' | 'error'> {
  try {
    const startTime = Date.now();
    
    // Test basic database connectivity
    await db.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - startTime;
    
    // Check for recent database errors
    const recentErrors = await db.auditLog.count({
      where: {
        action: { contains: 'error' },
        entityType: { contains: 'database' },
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
      }
    });

    // Determine status based on response time and errors
    if (recentErrors > 5) {
      return 'error';
    } else if (responseTime > 1000 || recentErrors > 0) {
      return 'warning';
    } else {
      return 'healthy';
    }
  } catch (error) {
    console.error('Database health check failed:', error);
    return 'error';
  }
}

async function checkApiHealth(): Promise<'healthy' | 'warning' | 'error'> {
  try {
    // Check recent API errors
    const recentApiErrors = await db.auditLog.count({
      where: {
        action: { contains: 'error' },
        entityType: { contains: 'api' },
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }
      }
    });

    // Check API response times by looking at recent activity
    const recentActivity = await db.auditLog.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 60 * 1000) } // Last minute
      }
    });

    // Determine API health
    if (recentApiErrors > 10) {
      return 'error';
    } else if (recentApiErrors > 2 || recentActivity > 1000) {
      return 'warning';
    } else {
      return 'healthy';
    }
  } catch (error) {
    console.error('API health check failed:', error);
    return 'error';
  }
}

async function checkAiHealth(): Promise<'healthy' | 'warning' | 'error'> {
  try {
    // Check recent AI usage and errors
    const [recentAiUsage, recentAiErrors] = await Promise.all([
      db.aiUsageEvent.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }
        }
      }),
      db.auditLog.count({
        where: {
          action: { contains: 'error' },
          entityType: { contains: 'ai' },
          createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }
        }
      })
    ]);

    // Check AI cost efficiency
    const recentCosts = await db.aiUsageEvent.aggregate({
      where: {
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
      },
      _sum: { costUsd: true }
    });

    const totalCost = Number(recentCosts._sum.costUsd) || 0;

    // Determine AI health
    if (recentAiErrors > 5 || totalCost > 10) { // More than $10/hour
      return 'error';
    } else if (recentAiErrors > 0 || totalCost > 5) { // More than $5/hour
      return 'warning';
    } else {
      return 'healthy';
    }
  } catch (error) {
    console.error('AI health check failed:', error);
    return 'warning'; // AI issues are less critical
  }
}

async function checkFederationHealth(): Promise<'healthy' | 'warning' | 'error'> {
  try {
    // In production, this would check actual federation connectivity
    // For now, simulate based on system health
    
    // Check for federation-related errors
    const federationErrors = await db.auditLog.count({
      where: {
        action: { contains: 'error' },
        entityType: { contains: 'federation' },
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } // Last 10 minutes
      }
    });

    // Check overall system load as proxy for federation health
    const systemLoad = await db.auditLog.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 60 * 1000) }
      }
    });

    if (federationErrors > 3) {
      return 'error';
    } else if (federationErrors > 0 || systemLoad > 500) {
      return 'warning';
    } else {
      return 'healthy';
    }
  } catch (error) {
    console.error('Federation health check failed:', error);
    return 'warning';
  }
}

async function checkCacheHealth(): Promise<'healthy' | 'warning' | 'error'> {
  try {
    // In production, this would check Redis/cache connectivity
    // For now, simulate based on system performance
    
    const startTime = Date.now();
    
    // Test a simple query that would benefit from caching
    await db.user.count();
    
    const queryTime = Date.now() - startTime;
    
    // Check memory usage proxy (recent activity)
    const memoryUsageProxy = await db.auditLog.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }
      }
    });

    // Determine cache health based on query performance and load
    if (queryTime > 2000 || memoryUsageProxy > 2000) {
      return 'error';
    } else if (queryTime > 500 || memoryUsageProxy > 1000) {
      return 'warning';
    } else {
      return 'healthy';
    }
  } catch (error) {
    console.error('Cache health check failed:', error);
    return 'warning';
  }
}
