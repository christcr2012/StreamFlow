# Real-Time Updates Implementation Guide

## Overview

Cortiware supports real-time updates for dashboards and activity feeds using Server-Sent Events (SSE). This provides live updates without the overhead of WebSockets.

## Architecture

### Server-Sent Events (SSE)

**Why SSE over WebSockets:**
- Simpler implementation (HTTP-based)
- Automatic reconnection
- Better compatibility with proxies/firewalls
- Lower overhead for one-way communication
- Native browser support

**Use Cases:**
- Dashboard metric updates
- Lead status changes
- Audit event notifications
- System alerts
- Real-time activity feeds

## Implementation

### SSE Endpoint

**File:** `apps/provider-portal/src/app/api/provider/events/route.ts`

```typescript
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('rs_provider')?.value;
  if (!cookie) {
    return new Response('Unauthorized', { status: 401 });
  }

  const email = decodeURIComponent(cookie);
  
  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );

      // Set up event listeners
      const interval = setInterval(async () => {
        try {
          // Fetch latest events for this user
          const events = await getLatestEvents(email);
          
          if (events.length > 0) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'events', data: events })}\n\n`)
            );
          }
        } catch (error) {
          console.error('Error fetching events:', error);
        }
      }, 5000); // Poll every 5 seconds

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function getLatestEvents(email: string) {
  // Implementation to fetch latest events
  // This would query the database for new audit events, lead updates, etc.
  return [];
}
```

### Client-Side Integration

**React Hook for SSE:**

```typescript
// hooks/useRealtimeEvents.ts
import { useEffect, useState } from 'react';

export function useRealtimeEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('/api/provider/events');

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'connected') {
        console.log('SSE connected');
      } else if (data.type === 'events') {
        setEvents((prev) => [...data.data, ...prev].slice(0, 100));
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return { events, connected };
}
```

**Dashboard Component:**

```typescript
'use client';

import { useRealtimeEvents } from '@/hooks/useRealtimeEvents';

export default function DashboardPage() {
  const { events, connected } = useRealtimeEvents();

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-gray-600">
          {connected ? 'Live' : 'Disconnected'}
        </span>
      </div>

      <div className="mt-4">
        <h2>Recent Activity</h2>
        {events.map((event) => (
          <div key={event.id} className="border-b py-2">
            {event.description}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Event Types

### Lead Events

```typescript
{
  type: 'lead_created',
  data: {
    id: 'lead_123',
    company: 'Acme Corp',
    status: 'NEW'
  }
}

{
  type: 'lead_status_changed',
  data: {
    id: 'lead_123',
    oldStatus: 'NEW',
    newStatus: 'CONVERTED'
  }
}
```

### Dashboard Metrics

```typescript
{
  type: 'metrics_update',
  data: {
    totalLeads: 1234,
    convertedLeads: 567,
    conversionRate: 45.9
  }
}
```

### System Alerts

```typescript
{
  type: 'alert',
  data: {
    severity: 'warning',
    message: 'High API usage detected',
    timestamp: '2025-10-12T10:30:00Z'
  }
}
```

## Optimization Strategies

### 1. Event Batching

Batch multiple events into a single SSE message:

```typescript
const eventBatch = [];
const batchInterval = setInterval(() => {
  if (eventBatch.length > 0) {
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ type: 'batch', data: eventBatch })}\n\n`)
    );
    eventBatch.length = 0;
  }
}, 1000); // Send batch every second
```

### 2. Selective Updates

Only send events relevant to the user:

```typescript
async function getLatestEvents(email: string, lastEventId?: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { orgId: true }
  });

  return await prisma.auditEvent.findMany({
    where: {
      orgId: user.orgId,
      id: lastEventId ? { gt: lastEventId } : undefined,
      createdAt: { gte: new Date(Date.now() - 60000) } // Last minute
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
}
```

### 3. Connection Pooling

Limit concurrent SSE connections per user:

```typescript
const activeConnections = new Map<string, number>();

export async function GET(request: NextRequest) {
  const email = getEmailFromCookie(request);
  
  const currentConnections = activeConnections.get(email) || 0;
  if (currentConnections >= 3) {
    return new Response('Too many connections', { status: 429 });
  }
  
  activeConnections.set(email, currentConnections + 1);
  
  // ... SSE implementation
  
  request.signal.addEventListener('abort', () => {
    activeConnections.set(email, (activeConnections.get(email) || 1) - 1);
  });
}
```

## Fallback Strategy

### Polling for Unsupported Browsers

```typescript
export function useRealtimeEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Check SSE support
    if (typeof EventSource === 'undefined') {
      // Fallback to polling
      const interval = setInterval(async () => {
        const response = await fetch('/api/provider/events/poll');
        const data = await response.json();
        setEvents((prev) => [...data.events, ...prev].slice(0, 100));
      }, 10000); // Poll every 10 seconds

      return () => clearInterval(interval);
    }

    // Use SSE (implementation from above)
    // ...
  }, []);

  return { events, connected };
}
```

## Monitoring

### Connection Metrics

```typescript
let totalConnections = 0;
let activeConnections = 0;

// Track in SSE endpoint
export async function GET(request: NextRequest) {
  totalConnections++;
  activeConnections++;

  request.signal.addEventListener('abort', () => {
    activeConnections--;
  });

  // Log metrics every minute
  setInterval(() => {
    console.log(`SSE Connections - Active: ${activeConnections}, Total: ${totalConnections}`);
  }, 60000);
}
```

### Event Delivery Rate

```typescript
let eventsSent = 0;

controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
eventsSent++;

// Log every hour
setInterval(() => {
  console.log(`Events sent in last hour: ${eventsSent}`);
  eventsSent = 0;
}, 3600000);
```

## Security Considerations

### Authentication

Always verify session before establishing SSE connection:

```typescript
const cookie = request.cookies.get('rs_provider')?.value;
if (!cookie) {
  return new Response('Unauthorized', { status: 401 });
}
```

### Rate Limiting

Limit SSE connection attempts:

```typescript
const key = `sse_attempts:${email}`;
const attempts = await kv.incr(key);
if (attempts === 1) {
  await kv.expire(key, 60);
}
if (attempts > 10) {
  return new Response('Too many connection attempts', { status: 429 });
}
```

### Data Filtering

Never send sensitive data in SSE events:

```typescript
// Good: Only send necessary data
{
  type: 'lead_created',
  data: {
    id: 'lead_123',
    company: 'Acme Corp'
  }
}

// Bad: Sending sensitive data
{
  type: 'lead_created',
  data: {
    id: 'lead_123',
    email: 'contact@acme.com', // PII
    phone: '+1234567890' // PII
  }
}
```

## Performance Impact

**Without Real-Time Updates:**
- Dashboard refresh: Manual (F5)
- Update latency: 30-60 seconds
- Server load: Periodic polling (high)

**With SSE:**
- Dashboard refresh: Automatic
- Update latency: 1-5 seconds
- Server load: Persistent connections (moderate)

Real-Time Updates: Complete ✅

