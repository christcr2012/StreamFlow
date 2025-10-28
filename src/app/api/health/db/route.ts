/**
 * Database health check endpoint
 * Tests connection to Neon PostgreSQL
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const start = Date.now();
    
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;
    
    const duration = Date.now() - start;

    return NextResponse.json({
      ok: true,
      database: 'connected',
      latency_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[health/db] Database check failed:', error);
    
    return NextResponse.json(
      {
        ok: false,
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

