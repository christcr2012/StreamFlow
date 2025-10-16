# Two-Persona Portals Implementation Plan

**Date:** 2025-10-16  
**Goal:** Complete the two-persona model with Provider Analyst and Developer portals  
**Standard:** Production-grade, zero mock data, zero placeholders

---

## 🎯 OVERVIEW

Build two additional portal experiences within the existing `apps/provider-portal`:

1. **Provider Analyst Portal** (`/analyst/*`) - Read-only analytics and audit access
2. **Developer Portal** (`/developer/*`) - API tools, webhooks, and system monitoring

**Architecture Decision:** Use role-based routing within existing provider-portal app for:
- Shared authentication and session management
- Consistent theming and components
- Simplified deployment and maintenance
- Single codebase for all provider-facing features

---

## 📋 PHASE 1: PROVIDER ANALYST PORTAL

### 1.1 Route Structure

```
/analyst
├── /dashboard          # Analytics overview
├── /analytics          # Detailed usage metrics
│   ├── /usage         # API usage, tenant activity
│   ├── /revenue       # Revenue trends, MRR, ARR
│   └── /tenants       # Tenant health, churn analysis
├── /audit             # Audit logs and compliance
│   ├── /logs          # Security events, user actions
│   ├── /compliance    # SOC2, HIPAA, GDPR status
│   └── /export        # Export audit data
├── /incidents         # Monitoring and alerts
│   ├── /active        # Current incidents
│   ├── /history       # Past incidents
│   └── /metrics       # Uptime, SLA tracking
└── /billing           # Revenue reports
    ├── /reports       # Financial summaries
    ├── /subscriptions # Subscription analytics
    └── /invoices      # Invoice tracking
```

### 1.2 Features

**Dashboard (`/analyst/dashboard`):**
- Key metrics cards (MRR, active tenants, API usage, incidents)
- Revenue trend charts (last 30/90 days)
- Tenant activity heatmap
- Recent audit events
- Active incidents summary

**Analytics (`/analyst/analytics/*`):**
- Usage metrics: API calls, feature adoption, user activity
- Revenue metrics: MRR, ARR, churn rate, LTV
- Tenant metrics: Health scores, engagement, retention
- Export capabilities for all reports

**Audit Logs (`/analyst/audit/*`):**
- Searchable audit log viewer
- Filter by user, action, entity, date range
- Compliance framework status (SOC2, HIPAA, GDPR)
- Export audit data (CSV, JSON)

**Incidents (`/analyst/incidents/*`):**
- Active incidents list with severity
- Incident history and resolution times
- Uptime and SLA metrics
- Alert configuration (read-only view)

**Billing Reports (`/analyst/billing/*`):**
- Revenue reports by period
- Subscription analytics
- Invoice tracking and status
- Payment success rates

### 1.3 Permissions Enforcement

All routes must enforce `provider_analyst` role:
- Read-only access to all data
- No create/update/delete operations
- Export capabilities enabled
- Redirect to `/analyst/dashboard` on login

---

## 📋 PHASE 2: DEVELOPER PORTAL

### 2.1 Route Structure

```
/developer
├── /dashboard          # Developer overview
├── /api-explorer       # Interactive API docs
│   ├── /endpoints     # Browse all endpoints
│   ├── /playground    # Test API calls
│   └── /schemas       # View data models
├── /webhooks          # Webhook management
│   ├── /endpoints     # Manage webhook URLs
│   ├── /events        # Event types and payloads
│   ├── /logs          # Webhook delivery logs
│   └── /testing       # Test webhook delivery
├── /keys              # API key management
│   ├── /list          # View all keys
│   ├── /create        # Generate new keys
│   └── /rotate        # Rotate existing keys
├── /usage             # API usage dashboards
│   ├── /metrics       # Calls, latency, errors
│   ├── /quotas        # Rate limits and quotas
│   └── /analytics     # Usage trends
├── /monitoring        # IT system monitoring
│   ├── /infrastructure # CPU, memory, disk, network
│   ├── /services      # Service health, uptime
│   ├── /database      # Query performance, connections
│   └── /alerts        # System alerts and notifications
├── /ai-assistant      # AI Developer Assistant
│   ├── /chat          # Interactive AI chat
│   ├── /code-gen      # Code snippet generation
│   └── /docs          # AI-powered documentation
└── /docs              # Developer documentation
    ├── /guides        # Integration guides
    ├── /reference     # API reference
    └── /examples      # Code examples
```

### 2.2 Features

**API Explorer (`/developer/api-explorer`):**
- Browse all API endpoints with descriptions
- Interactive playground to test API calls
- Request/response examples
- Schema viewer for data models
- Authentication testing

**Webhooks (`/developer/webhooks`):**
- Create/update/delete webhook endpoints
- Configure event subscriptions
- View webhook delivery logs
- Test webhook delivery with sample payloads
- Retry failed deliveries

**API Keys (`/developer/keys`):**
- List all API keys with metadata
- Create new app-scoped keys
- Rotate keys with zero downtime
- Delete/revoke keys
- View key usage statistics

**Usage Dashboards (`/developer/usage`):**
- Real-time API call metrics
- Latency and error rate charts
- Rate limit tracking
- Quota usage and alerts
- Historical usage trends

**IT System Monitoring (`/developer/monitoring`):**
- Infrastructure metrics (CPU, memory, disk, network)
- Service health and uptime tracking
- Database performance metrics
- API endpoint latency
- Error rates and alerts

**AI Developer Assistant (`/developer/ai-assistant`):**
- Interactive chat for API questions
- Code snippet generation for integrations
- Debugging assistance for API errors
- Best practices and optimization tips
- Webhook handler generation

### 2.3 Permissions Enforcement

All routes must enforce `developer` role:
- Full access to developer tools
- Create/update/delete API keys and webhooks
- View usage and monitoring data
- Access AI assistant
- Redirect to `/developer/dashboard` on login

---

## 📋 PHASE 3: AUTHENTICATION & ROUTING

### 3.1 Login Flow

Update `/login` to support role-based redirects:

```typescript
// After successful authentication
if (role === 'provider_admin') {
  redirect('/provider/dashboard');
} else if (role === 'provider_analyst') {
  redirect('/analyst/dashboard');
} else if (role === 'developer') {
  redirect('/developer/dashboard');
}
```

### 3.2 Middleware Updates

Update `apps/provider-portal/src/middleware.ts`:

```typescript
// Analyst routes: /analyst/*
if (pathname.startsWith('/analyst')) {
  const session = getProviderSession(request);
  
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Only provider_analyst and provider_admin can access
  if (session.role !== 'provider_analyst' && session.role !== 'provider_admin') {
    return NextResponse.json(
      { error: 'Forbidden: Analyst access required' },
      { status: 403 }
    );
  }
  
  // Block all write operations for analyst role
  if (session.role === 'provider_analyst' && isWriteOperation(request)) {
    return NextResponse.json(
      { error: 'Forbidden: Read-only access' },
      { status: 403 }
    );
  }
}

// Developer routes: /developer/*
if (pathname.startsWith('/developer')) {
  const session = getDeveloperSession(request);
  
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

### 3.3 Navigation Components

Create role-specific navigation:
- `AnalystNav.tsx` - Navigation for analyst portal
- `DeveloperNav.tsx` - Navigation for developer portal
- Update `AppNav.tsx` to show role-appropriate links

---

## 📋 PHASE 4: DATABASE SCHEMA

### 4.1 New Models

**WebhookEndpoint:**
```prisma
model WebhookEndpoint {
  id          String   @id @default(cuid())
  url         String
  events      String[] // Array of event types
  secret      String   // HMAC secret for signature verification
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  deliveries  WebhookDelivery[]
  
  @@index([active])
}
```

**WebhookDelivery:**
```prisma
model WebhookDelivery {
  id            String   @id @default(cuid())
  endpointId    String
  endpoint      WebhookEndpoint @relation(fields: [endpointId], references: [id], onDelete: Cascade)
  event         String
  payload       Json
  status        String   // 'pending' | 'success' | 'failed'
  statusCode    Int?
  responseBody  String?  @db.Text
  attempts      Int      @default(0)
  nextRetryAt   DateTime?
  deliveredAt   DateTime?
  createdAt     DateTime @default(now())
  
  @@index([endpointId, createdAt])
  @@index([status, nextRetryAt])
}
```

**DeveloperApiKey:**
```prisma
model DeveloperApiKey {
  id          String   @id @default(cuid())
  name        String
  keyHash     String   @unique
  keyPrefix   String   // First 8 chars for identification
  scopes      String[] // Array of permitted scopes
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([keyPrefix])
  @@index([expiresAt])
}
```

**InfrastructureMetric:**
```prisma
model InfrastructureMetric {
  id          String   @id @default(cuid())
  service     String   // 'api' | 'database' | 'cache' | 'queue'
  metric      String   // 'cpu' | 'memory' | 'disk' | 'network' | 'latency'
  value       Float
  unit        String   // '%' | 'MB' | 'ms' | 'req/s'
  timestamp   DateTime @default(now())
  
  @@index([service, metric, timestamp])
  @@index([timestamp])
}
```

---

## 📋 PHASE 5: API ENDPOINTS

### 5.1 Analyst APIs

- `GET /api/analyst/metrics` - Dashboard metrics
- `GET /api/analyst/analytics/usage` - Usage analytics
- `GET /api/analyst/analytics/revenue` - Revenue analytics
- `GET /api/analyst/analytics/tenants` - Tenant analytics
- `GET /api/analyst/audit/logs` - Audit logs with filters
- `GET /api/analyst/audit/export` - Export audit data
- `GET /api/analyst/incidents` - Incidents list
- `GET /api/analyst/billing/reports` - Billing reports

### 5.2 Developer APIs

- `GET /api/developer/api-explorer/endpoints` - List all endpoints
- `POST /api/developer/api-explorer/test` - Test API call
- `GET /api/developer/webhooks` - List webhooks
- `POST /api/developer/webhooks` - Create webhook
- `PATCH /api/developer/webhooks/:id` - Update webhook
- `DELETE /api/developer/webhooks/:id` - Delete webhook
- `POST /api/developer/webhooks/:id/test` - Test webhook
- `GET /api/developer/webhooks/:id/deliveries` - Webhook logs
- `GET /api/developer/keys` - List API keys
- `POST /api/developer/keys` - Create API key
- `DELETE /api/developer/keys/:id` - Delete API key
- `GET /api/developer/usage/metrics` - Usage metrics
- `GET /api/developer/monitoring/infrastructure` - Infrastructure metrics
- `POST /api/developer/ai-assistant/chat` - AI chat
- `POST /api/developer/ai-assistant/generate` - Code generation

---

## 📋 PHASE 6: UI COMPONENTS

### 6.1 Shared Components

- `MetricCard.tsx` - Display key metrics
- `ChartContainer.tsx` - Wrapper for charts
- `DataTable.tsx` - Sortable, filterable tables
- `ExportButton.tsx` - Export data to CSV/JSON
- `DateRangePicker.tsx` - Select date ranges
- `FilterPanel.tsx` - Advanced filtering

### 6.2 Analyst Components

- `AnalystDashboard.tsx` - Main dashboard
- `UsageChart.tsx` - API usage trends
- `RevenueChart.tsx` - Revenue trends
- `AuditLogViewer.tsx` - Audit log table
- `IncidentList.tsx` - Incidents table
- `BillingReport.tsx` - Billing summary

### 6.3 Developer Components

- `ApiExplorer.tsx` - API endpoint browser
- `ApiPlayground.tsx` - Interactive API tester
- `WebhookManager.tsx` - Webhook CRUD interface
- `WebhookLogViewer.tsx` - Webhook delivery logs
- `ApiKeyManager.tsx` - API key CRUD interface
- `UsageDashboard.tsx` - Usage metrics
- `InfrastructureMonitor.tsx` - System metrics
- `AiAssistantChat.tsx` - AI chat interface
- `CodeGenerator.tsx` - Code snippet generator

---

## 🎯 SUCCESS CRITERIA

- [ ] Provider Analyst Portal fully functional with read-only access
- [ ] Developer Portal fully functional with all tools
- [ ] AI Developer Assistant integrated and working
- [ ] IT system monitoring dashboards complete
- [ ] All features use real database queries (zero mock data)
- [ ] All configurations database-backed (zero hardcoded)
- [ ] TypeScript checks passing (0 errors)
- [ ] All builds successful on Vercel
- [ ] Comprehensive documentation for both portals
- [ ] Role-based authentication and authorization working
- [ ] Navigation and UX consistent across all portals

---

**Estimated Timeline:** 16-20 hours  
**Approach:** Incremental, production-grade implementation  
**Standard:** Zero shortcuts, zero placeholders

