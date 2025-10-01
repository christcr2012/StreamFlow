// src/pages/api/health.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getHealthStatus } from '@/lib/monitoring';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { queue } from '@/lib/queue';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'MethodNotAllowed', message: 'GET only' });
    return;
  }

  try {
    // Check database
    let dbHealthy = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbHealthy = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Check cache
    const cacheStats = cache.getStats();
    const cacheHealthy = true; // In-memory cache is always available

    // Check queue
    const queueStats = queue.getStats();
    const queueHealthy = true; // In-memory queue is always available

    // Determine overall status
    const allHealthy = dbHealthy && cacheHealthy && queueHealthy;
    const status = allHealthy ? 'healthy' : 'degraded';

    const health = {
      status,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealthy,
        cache: cacheHealthy,
        queue: queueHealthy,
      },
      stats: {
        cache: cacheStats,
        queue: queueStats,
      },
    };

    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
    });
  }
}

export default handler;

