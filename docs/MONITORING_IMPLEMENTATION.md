# Monitoring Implementation Guide

## Overview

Comprehensive monitoring setup for Cortiware using Sentry for error tracking, Vercel Analytics for performance, and custom health checks.

## Sentry Integration

### Installation

```bash
npm install @sentry/nextjs --save
```

### Configuration

**sentry.client.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['localhost', /^https:\/\/.*\.cortiware\.com/],
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      if (error instanceof Error && error.message.includes('ResizeObserver')) {
        return null; // Ignore ResizeObserver errors
      }
    }
    return event;
  },
});
```

**sentry.server.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || 'development',
  
  tracesSampleRate: 1.0,
  
  integrations: [
    new Sentry.Integrations.Prisma({ client: prisma }),
  ],
  
  beforeSend(event) {
    // Scrub sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.['authorization'];
    }
    return event;
  },
});
```

**sentry.edge.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV || 'development',
  tracesSampleRate: 1.0,
});
```

### Error Tracking

**Automatic Error Capture:**
```typescript
// Errors are automatically captured
throw new Error('Something went wrong');
```

**Manual Error Capture:**
```typescript
import * as Sentry from '@sentry/nextjs';

try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'leads',
      operation: 'create',
    },
    extra: {
      leadData: sanitizedData,
    },
  });
  throw error;
}
```

**Custom Context:**
```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,
  orgId: user.orgId,
});

Sentry.setTag('tenant', orgId);
Sentry.setContext('lead', {
  id: lead.id,
  status: lead.status,
});
```

### Performance Monitoring

**Transaction Tracking:**
```typescript
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  const transaction = Sentry.startTransaction({
    op: 'http.server',
    name: 'GET /api/provider/leads',
  });
  
  try {
    const span = transaction.startChild({
      op: 'db.query',
      description: 'Fetch leads',
    });
    
    const leads = await prisma.lead.findMany();
    span.finish();
    
    return NextResponse.json({ leads });
  } finally {
    transaction.finish();
  }
}
```

## Vercel Analytics

### Installation

```bash
npm install @vercel/analytics --save
```

### Configuration

**Root Layout:**
```typescript
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Custom Events

```typescript
import { track } from '@vercel/analytics';

// Track custom events
track('Lead Created', {
  orgId: user.orgId,
  sourceType: lead.sourceType,
});

track('Export Completed', {
  format: 'csv',
  count: leads.length,
});
```

## Health Checks

### API Health Endpoint

**apps/provider-portal/src/app/api/health/route.ts:**
```typescript
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';
import { kv } from '@vercel/kv';

const prisma = new PrismaClient();

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      sendgrid: await checkSendGrid(),
    },
  };
  
  const healthy = Object.values(checks.checks).every(c => c.status === 'ok');
  checks.status = healthy ? 'healthy' : 'degraded';
  
  return NextResponse.json(checks, {
    status: healthy ? 200 : 503,
  });
}

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', latency: 0 };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

async function checkRedis() {
  try {
    const start = Date.now();
    await kv.set('health_check', Date.now(), { ex: 10 });
    const latency = Date.now() - start;
    return { status: 'ok', latency };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

async function checkSendGrid() {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      return { status: 'warning', message: 'API key not configured' };
    }
    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}
```

### Uptime Monitoring

**UptimeRobot Configuration:**
```
Monitor Type: HTTP(s)
URL: https://portal.cortiware.com/api/health
Interval: 5 minutes
Alert Contacts: ops@cortiware.com
```

**Vercel Cron Job:**
```typescript
// apps/provider-portal/src/app/api/cron/health-check/route.ts
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const health = await fetch('https://portal.cortiware.com/api/health');
  const data = await health.json();
  
  if (data.status !== 'healthy') {
    // Send alert
    await sendAlert('Health check failed', data);
  }
  
  return NextResponse.json({ checked: true });
}
```

**vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/health-check",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## Logging

### Structured Logging

```typescript
// utils/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    }));
  },
  
  error: (message: string, error?: Error, meta?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...meta,
    }));
  },
  
  warn: (message: string, meta?: any) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    }));
  },
};
```

**Usage:**
```typescript
import { logger } from '@/utils/logger';

logger.info('Lead created', {
  leadId: lead.id,
  orgId: user.orgId,
});

logger.error('Failed to create lead', error, {
  orgId: user.orgId,
  data: sanitizedData,
});
```

## Alerting

### Sentry Alerts

**Configure in Sentry Dashboard:**
- Error rate threshold: > 10 errors/minute
- Performance degradation: P95 > 1000ms
- New issue detection: Immediate alert

### Custom Alerts

```typescript
// utils/alerts.ts
export async function sendAlert(title: string, details: any) {
  // Send to Slack
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: title,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${title}*\n\`\`\`${JSON.stringify(details, null, 2)}\`\`\``,
          },
        },
      ],
    }),
  });
  
  // Send to email
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  await sgMail.send({
    to: 'ops@cortiware.com',
    from: 'alerts@cortiware.com',
    subject: `Alert: ${title}`,
    text: JSON.stringify(details, null, 2),
  });
}
```

## Metrics Dashboard

### Key Metrics

**Application Metrics:**
- Request rate (requests/minute)
- Error rate (errors/minute)
- Response time (P50, P95, P99)
- Database query time
- Cache hit rate

**Business Metrics:**
- Leads created/hour
- Conversion rate
- Active users
- API usage by org

**Infrastructure Metrics:**
- CPU usage
- Memory usage
- Database connections
- Redis memory usage

### Custom Metrics

```typescript
// utils/metrics.ts
import { kv } from '@vercel/kv';

export async function incrementMetric(key: string, value = 1) {
  const timestamp = Math.floor(Date.now() / 60000); // 1-minute buckets
  const metricKey = `metrics:${key}:${timestamp}`;
  await kv.incrby(metricKey, value);
  await kv.expire(metricKey, 3600); // Keep for 1 hour
}

export async function getMetric(key: string, minutes = 60) {
  const now = Math.floor(Date.now() / 60000);
  const keys = Array.from({ length: minutes }, (_, i) => 
    `metrics:${key}:${now - i}`
  );
  
  const values = await Promise.all(
    keys.map(k => kv.get(k).then(v => Number(v) || 0))
  );
  
  return values.reduce((sum, v) => sum + v, 0);
}
```

**Usage:**
```typescript
// Track lead creation
await incrementMetric('leads_created');

// Get leads created in last hour
const count = await getMetric('leads_created', 60);
```

Monitoring Implementation: Complete ✅

