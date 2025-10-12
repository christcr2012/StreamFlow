# Monitoring and Observability Guide

**Last Updated**: 2025-10-12  
**Owner**: DevOps/SRE Team  
**Review Frequency**: Quarterly

## Overview

This document outlines monitoring, observability, and alerting strategies for the Cortiware platform to ensure system health, performance, and reliability.

## Current Monitoring Stack

### Vercel Analytics (Built-in)

**Metrics Available**:
- Request count and error rates
- Response times (p50, p75, p95, p99)
- Edge network performance
- Function execution duration
- Build and deployment status

**Access**: Vercel Dashboard → Analytics tab for each project

### GitHub Actions (CI/CD)

**Metrics Available**:
- Build success/failure rates
- Test pass rates
- Deployment frequency
- Build duration

**Access**: GitHub repository → Actions tab

## Recommended Monitoring Enhancements

### 1. Error Tracking (Sentry)

**Purpose**: Real-time error tracking and debugging

**Setup**:
```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV || 'development',
  tracesSampleRate: 0.1, // 10% of transactions
  beforeSend(event) {
    // Filter out sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.Authorization;
    }
    return event;
  },
});
```

**Metrics to Track**:
- Error rate by route
- Error rate by user
- Stack traces and context
- Release tracking
- Performance issues

**Alerts**:
- New error types
- Error rate spike (>10 errors/minute)
- Critical errors (database connection failures)

### 2. Application Performance Monitoring (APM)

**Options**:
- **Vercel Speed Insights**: Built-in, free tier available
- **New Relic**: Full-featured APM
- **Datadog**: Comprehensive monitoring and logging

**Metrics to Track**:
- API endpoint latency (p50, p95, p99)
- Database query performance
- External API call duration
- Memory usage
- CPU usage

**Example (Vercel Speed Insights)**:
```javascript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 3. Uptime Monitoring

**Options**:
- **Vercel Monitoring**: Built-in uptime checks
- **Pingdom**: Comprehensive uptime monitoring
- **UptimeRobot**: Free tier available
- **Better Uptime**: Modern uptime monitoring

**Endpoints to Monitor**:
```
# Tenant App
https://tenant-app.vercel.app/api/health
https://tenant-app.vercel.app/

# Provider Portal
https://provider-portal.vercel.app/api/health
https://provider-portal.vercel.app/

# Marketing Sites
https://marketing-cortiware.vercel.app/
https://marketing-robinson.vercel.app/
```

**Check Frequency**: Every 1-5 minutes  
**Alert Threshold**: 2 consecutive failures

### 4. Database Monitoring

**Metrics to Track**:
- Connection pool usage
- Query latency (p50, p95, p99)
- Slow queries (>1s)
- Lock contention
- Replication lag (if applicable)
- Storage usage

**Tools**:
- Database provider dashboard (Vercel Postgres, Supabase, etc.)
- pg_stat_statements (PostgreSQL extension)
- Custom queries via monitoring tool

**Example Slow Query Alert**:
```sql
-- Find slow queries
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000 -- 1 second
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 5. Log Aggregation

**Options**:
- **Vercel Logs**: Built-in, limited retention
- **Logtail (Better Stack)**: Structured logging
- **Datadog Logs**: Comprehensive log management
- **Papertrail**: Simple log aggregation

**Log Levels**:
- **ERROR**: Application errors, exceptions
- **WARN**: Warnings, degraded performance
- **INFO**: Important events (user login, API calls)
- **DEBUG**: Detailed debugging information (dev only)

**Structured Logging Example**:
```typescript
// lib/logger.ts
export function log(level: string, message: string, context?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
    environment: process.env.VERCEL_ENV,
  };
  
  console.log(JSON.stringify(logEntry));
}

// Usage
log('INFO', 'User logged in', { userId: '123', email: 'user@example.com' });
log('ERROR', 'Database connection failed', { error: err.message });
```

## Key Metrics and SLIs (Service Level Indicators)

### Availability

**Definition**: Percentage of time the service is available and responding to requests

**Target SLI**: 99.9% uptime (43 minutes downtime/month)

**Measurement**:
```
Availability = (Total time - Downtime) / Total time × 100
```

**Monitoring**:
- Uptime checks every 1 minute
- Alert if 2 consecutive failures

### Latency

**Definition**: Time to respond to requests

**Target SLIs**:
- p50 (median): <200ms
- p95: <500ms
- p99: <1000ms

**Measurement**:
- Vercel Analytics (automatic)
- APM tool (Sentry, New Relic)

**Alerts**:
- p95 latency >1s for 5 minutes
- p99 latency >2s for 5 minutes

### Error Rate

**Definition**: Percentage of requests that result in errors (5xx)

**Target SLI**: <0.1% error rate

**Measurement**:
```
Error Rate = (5xx responses / Total responses) × 100
```

**Alerts**:
- Error rate >1% for 5 minutes
- Error rate >5% for 1 minute (critical)

### Throughput

**Definition**: Number of requests per second

**Target SLI**: Support 100 req/s per app

**Measurement**:
- Vercel Analytics
- APM tool

**Alerts**:
- Throughput drops >50% (potential outage)

## Alerting Strategy

### Alert Channels

1. **Critical (P0)**: PagerDuty → On-call engineer
2. **High (P1)**: Slack #alerts + Email
3. **Medium (P2)**: Slack #ops
4. **Low (P3)**: Email digest (daily)

### Alert Definitions

#### P0 - Critical

**Triggers**:
- Service completely down (uptime check fails)
- Error rate >5%
- Database connection failures
- Security breach detected

**Response Time**: 15 minutes  
**Escalation**: Immediate

#### P1 - High

**Triggers**:
- Error rate >1%
- p95 latency >2s
- Backup failure
- Deployment failure

**Response Time**: 1 hour  
**Escalation**: After 2 hours

#### P2 - Medium

**Triggers**:
- p95 latency >1s
- Slow queries detected
- High memory usage (>80%)
- Rate limit threshold reached

**Response Time**: 4 hours  
**Escalation**: After 8 hours

#### P3 - Low

**Triggers**:
- Deprecation warnings
- Non-critical configuration issues
- Informational alerts

**Response Time**: Next business day  
**Escalation**: None

### Alert Fatigue Prevention

1. **Use appropriate thresholds** - Avoid alerts for normal variance
2. **Aggregate similar alerts** - Group related alerts
3. **Implement alert suppression** - During maintenance windows
4. **Regular alert review** - Tune thresholds quarterly
5. **Actionable alerts only** - Every alert should have a clear action

## Dashboards

### Executive Dashboard

**Metrics**:
- Overall system health (green/yellow/red)
- Uptime percentage (last 30 days)
- Active users (last 24 hours)
- Error rate trend
- Deployment frequency

**Audience**: Leadership, Product  
**Update Frequency**: Real-time

### Engineering Dashboard

**Metrics**:
- Request rate by endpoint
- Error rate by endpoint
- Latency percentiles (p50, p95, p99)
- Database query performance
- Function execution duration
- Memory and CPU usage

**Audience**: Engineering team  
**Update Frequency**: Real-time

### Business Dashboard

**Metrics**:
- Active organizations
- New signups (daily/weekly/monthly)
- Feature usage (CRM, leads, opportunities)
- API usage by tenant
- Revenue metrics (if applicable)

**Audience**: Product, Sales, Leadership  
**Update Frequency**: Daily

## Health Check Endpoints

### Implementation

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      kv: 'unknown',
    },
  };

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = 'healthy';
  } catch (error) {
    checks.checks.database = 'unhealthy';
    checks.status = 'degraded';
  }

  try {
    // KV check (if applicable)
    const kv = getKVClient();
    await kv.set('health-check', '1', { ex: 10 });
    checks.checks.kv = 'healthy';
  } catch (error) {
    checks.checks.kv = 'unhealthy';
    checks.status = 'degraded';
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
```

### Response Format

```json
{
  "status": "healthy",
  "timestamp": "2025-10-12T10:30:00Z",
  "checks": {
    "database": "healthy",
    "kv": "healthy"
  }
}
```

## Incident Response

### Incident Severity Levels

| Severity | Description | Example | Response Time |
|----------|-------------|---------|---------------|
| P0 | Complete outage | All apps down | 15 minutes |
| P1 | Major degradation | High error rate | 1 hour |
| P2 | Minor degradation | Slow performance | 4 hours |
| P3 | Cosmetic issue | UI bug | Next business day |

### Incident Response Process

1. **Detection** (0-5 minutes)
   - Alert triggered
   - On-call engineer notified

2. **Acknowledgment** (5-10 minutes)
   - Engineer acknowledges alert
   - Initial assessment

3. **Investigation** (10-30 minutes)
   - Review logs and metrics
   - Identify root cause
   - Determine impact

4. **Mitigation** (30-60 minutes)
   - Apply fix or workaround
   - Verify resolution
   - Monitor for recurrence

5. **Communication** (ongoing)
   - Update status page
   - Notify stakeholders
   - Post-incident report

6. **Post-Mortem** (within 48 hours)
   - Document incident timeline
   - Identify root cause
   - Action items to prevent recurrence

## Custom Metrics

### Business Metrics

```typescript
// Track custom events
import { track } from '@/lib/analytics';

// User signup
track('user_signup', {
  userId: user.id,
  plan: 'free',
  source: 'organic',
});

// Lead created
track('lead_created', {
  orgId: org.id,
  leadSource: 'website',
});

// Opportunity won
track('opportunity_won', {
  orgId: org.id,
  value: 50000,
});
```

### Performance Metrics

```typescript
// Track API performance
export async function trackAPICall(endpoint: string, duration: number, status: number) {
  // Send to monitoring service
  await fetch('https://monitoring.example.com/api/metrics', {
    method: 'POST',
    body: JSON.stringify({
      metric: 'api_call',
      endpoint,
      duration,
      status,
      timestamp: Date.now(),
    }),
  });
}
```

## Best Practices

1. **Monitor what matters** - Focus on user-impacting metrics
2. **Set realistic SLIs** - Based on actual usage patterns
3. **Alert on symptoms, not causes** - Alert on user impact, not internal metrics
4. **Implement gradual rollouts** - Use feature flags for risky changes
5. **Regular review** - Review metrics and alerts quarterly
6. **Document everything** - Runbooks for common incidents
7. **Test monitoring** - Verify alerts work as expected

## Related Documentation

- [BACKUP_AND_DISASTER_RECOVERY.md](./BACKUP_AND_DISASTER_RECOVERY.md): Backup and DR procedures
- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md): System architecture
- [VERCEL_BUILD_GUIDE.md](./VERCEL_BUILD_GUIDE.md): Build and deployment

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-12 | 1.0 | Initial monitoring guide | AI Agent |

## Next Review Date

**2026-01-12** (Quarterly review)

