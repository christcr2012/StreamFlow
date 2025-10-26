# GitHub Issues: 2-Phase Implementation Plan

**Strategy**: Complete all 100+ open GitHub issues in 2 phases:
- **Phase 1**: Scaffold everything with stubs, placeholders, and minimal implementations
- **Phase 2**: Replace all placeholders with production-ready code

**Total Issues**: ~100 open issues
**Estimated Timeline**: 
- Phase 1: 8-12 weeks (rapid scaffolding)
- Phase 2: 16-24 weeks (production implementation)

---

## Phase 1: Scaffolding & Stubs (Foundation)

### Goals
- Create complete database schemas for all features
- Scaffold all API routes with stub responses
- Build UI component shells with placeholder data
- Implement feature flags for all modules
- Set up basic navigation and routing
- Establish patterns that Phase 2 will follow

### Approach
- Use TypeScript interfaces to define data structures
- Return mock data from API endpoints
- Use placeholder text/images in UI
- Stub external service integrations
- Focus on architecture over implementation
- Ensure everything compiles and runs

---

## Phase 1 Issue Breakdown

### 1.1 Infrastructure & MCP Servers (Issues #253, 255-256, 260-262)

**Issues**:
- #253: Custom Multi-Account Stripe MCP
- #255: Robinson AI MCP Servers Progress
- #256: Google Workspace MCP (100+ tools)
- #260: Resend MCP Server
- #261: Twilio MCP Server
- #262: Domain Registrar MCP

**Phase 1 Scaffolding**:
```typescript
// packages/mcp-stripe/src/index.ts
export class StripeMCPServer {
  async createCustomer(data: any) {
    // TODO: Implement Stripe customer creation
    return { id: 'cus_stub', ...data };
  }
  
  async createPaymentIntent(amount: number) {
    // TODO: Implement payment intent
    return { id: 'pi_stub', status: 'succeeded' };
  }
}

// packages/mcp-twilio/src/index.ts
export class TwilioMCPServer {
  async sendSMS(to: string, body: string) {
    // TODO: Implement Twilio SMS
    console.log(`[STUB] SMS to ${to}: ${body}`);
    return { sid: 'SM_stub', status: 'sent' };
  }
}

// packages/mcp-resend/src/index.ts
export class ResendMCPServer {
  async sendEmail(to: string, subject: string, html: string) {
    // TODO: Implement Resend email
    console.log(`[STUB] Email to ${to}: ${subject}`);
    return { id: 'email_stub' };
  }
}
```

**Deliverables**:
- ✅ MCP package structure created
- ✅ Stub methods for all operations
- ✅ TypeScript interfaces defined
- ✅ Basic tests with mock responses
- ⏸️ Real API integration (Phase 2)

---

### 1.2 Critical Infrastructure (Issues #257-259, #263)

**Issues**:
- #257: AI Cost Management - Tenant Portal
- #258: AI Cost Management - Provider Portal
- #259: Type 2 Communications (Client-to-Customer)
- #263: Domain Migration (Spaceship → Cloudflare)

**Phase 1 Scaffolding**:

#### AI Cost Management Schema
```sql
-- Add to prisma/schemas/tenant.prisma
model AIUsage {
  id              String   @id @default(uuid())
  tenantId        String
  userId          String?
  feature         String   // 'concierge', 'email_gen', 'scheduling_ai'
  model           String   // 'gpt-4', 'claude-3.5-sonnet'
  promptTokens    Int
  completionTokens Int
  totalTokens     Int
  estimatedCost   Decimal  @db.Decimal(10, 6)
  metadata        Json?
  createdAt       DateTime @default(now())
  
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  user            User?    @relation(fields: [userId], references: [id])
  
  @@index([tenantId, createdAt])
  @@index([userId, createdAt])
}

model AIBudget {
  id              String   @id @default(uuid())
  tenantId        String   @unique
  monthlyBudget   Decimal  @db.Decimal(10, 2)
  currentSpend    Decimal  @db.Decimal(10, 2) @default(0)
  alertThreshold  Int      @default(80) // percent
  hardLimit       Boolean  @default(false)
  resetDay        Int      @default(1) // day of month
  
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
}
```

#### AI Cost Tracking API (Stub)
```typescript
// apps/tenant-app/src/app/api/ai/usage/route.ts
export async function GET(req: Request) {
  // TODO: Query real usage from AIUsage table
  return NextResponse.json({
    currentMonth: {
      totalCost: 45.67,
      totalTokens: 1234567,
      byFeature: {
        concierge: 30.45,
        email_gen: 10.22,
        scheduling_ai: 5.00
      }
    },
    budget: {
      limit: 100.00,
      remaining: 54.33,
      percentUsed: 45.67
    },
    // STUB: placeholder data
  });
}

export async function POST(req: Request) {
  const { feature, model, tokens, cost } = await req.json();
  
  // TODO: Save to AIUsage table
  console.log('[STUB] AI usage tracked:', { feature, model, tokens, cost });
  
  return NextResponse.json({ success: true });
}
```

#### Type 2 Communications Schema
```sql
-- Add to prisma/schemas/tenant.prisma
model Communication {
  id              String   @id @default(uuid())
  tenantId        String
  contactId       String   // customer
  userId          String?  // staff member
  type            String   // 'sms', 'email', 'call'
  direction       String   // 'inbound', 'outbound'
  content         String   @db.Text
  metadata        Json?    // phone numbers, email addresses, etc.
  status          String   // 'sent', 'delivered', 'failed'
  externalId      String?  // Twilio SID, Resend ID, etc.
  createdAt       DateTime @default(now())
  
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  contact         Contact  @relation(fields: [contactId], references: [id])
  user            User?    @relation(fields: [userId], references: [id])
  
  @@index([tenantId, contactId, createdAt])
  @@index([userId, createdAt])
}

model CommunicationThread {
  id              String   @id @default(uuid())
  tenantId        String
  contactId       String
  subject         String?
  lastMessageAt   DateTime
  unreadCount     Int      @default(0)
  
  @@index([tenantId, lastMessageAt])
}
```

#### Communications API (Stub)
```typescript
// apps/tenant-app/src/app/api/communications/route.ts
export async function GET(req: Request) {
  // TODO: Query real communications
  return NextResponse.json({
    threads: [
      {
        id: '1',
        contact: { name: 'John Doe', phone: '555-1234' },
        lastMessage: 'Thanks for the service!',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0
      }
      // STUB: placeholder data
    ]
  });
}

export async function POST(req: Request) {
  const { contactId, type, content } = await req.json();
  
  // TODO: Send via Twilio/Resend and save to DB
  console.log('[STUB] Sending message:', { contactId, type, content });
  
  return NextResponse.json({ 
    id: 'comm_stub',
    status: 'sent' 
  });
}
```

**Deliverables**:
- ✅ Database schemas created
- ✅ API routes with stub responses
- ✅ Basic UI components (placeholders)
- ✅ Feature flags configured
- ⏸️ Real AI tracking logic (Phase 2)
- ⏸️ Real communication integrations (Phase 2)
- ⏸️ Domain migration execution (Phase 2)

---

### 1.3 Subscription & Module System (Issue #164)

**Issue**: #164 - Tiered Vertical Subscription System

**Phase 1 Scaffolding**:
```sql
-- Add to prisma/schemas/provider.prisma
model SubscriptionTier {
  id            String   @id @default(uuid())
  tierKey       String   @unique // 'starter', 'professional', 'enterprise'
  name          String
  description   String?
  basePrice     Decimal  @db.Decimal(10, 2)
  billingPeriod String   @default("monthly")
  displayOrder  Int
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())
}

model VerticalTierConfig {
  id                    String   @id @default(uuid())
  verticalKey           String   // 'hvac', 'plumbing', 'cleaning'
  subscriptionTierId    String
  featureModules        String[] // array of module keys
  limits                Json     // {max_users: 5, max_locations: 1, etc.}
  pricingOverride       Decimal? @db.Decimal(10, 2)
  createdAt             DateTime @default(now())
  
  tier                  SubscriptionTier @relation(fields: [subscriptionTierId], references: [id])
  
  @@unique([verticalKey, subscriptionTierId])
}

model TenantSubscription {
  id                    String   @id @default(uuid())
  tenantId              String   @unique
  verticalKey           String
  subscriptionTierId    String
  status                String   // 'trial', 'active', 'past_due', 'cancelled'
  trialEndsAt           DateTime?
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  stripeSubscriptionId  String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  tier                  SubscriptionTier @relation(fields: [subscriptionTierId], references: [id])
}
```

```typescript
// apps/tenant-app/src/lib/subscriptions/tiers.ts
export const SUBSCRIPTION_TIERS = {
  starter: {
    name: 'Starter',
    price: 99,
    limits: { max_users: 5, max_locations: 1, max_jobs_per_month: 100 }
  },
  professional: {
    name: 'Professional',
    price: 249,
    limits: { max_users: 20, max_locations: 3, max_jobs_per_month: null }
  },
  enterprise: {
    name: 'Enterprise',
    price: 499,
    limits: { max_users: null, max_locations: null, max_jobs_per_month: null }
  }
};

export async function checkTierLimit(tenantId: string, limitType: string) {
  // TODO: Query actual subscription and usage
  console.log('[STUB] Checking tier limit:', limitType);
  return true; // Always allow in Phase 1
}
```

**Deliverables**:
- ✅ Subscription schemas
- ✅ Tier configuration constants
- ✅ Stub limit checking
- ⏸️ Stripe integration (Phase 2)
- ⏸️ Real limit enforcement (Phase 2)

---

### 1.4 Core Features Scaffolding (Issues #161-177)

**Issues**:
- #161: Feature Toggle System
- #162: Subcontractor Management
- #163: Mobile Field Tech PWA
- #165: Scheduling & Dispatch
- #166: Estimates & Invoicing
- #167: Payment Processing
- #168: Reporting & Analytics
- #169: Time Tracking & Payroll
- #170: Migration Frameworks
- #171: Marketing Automation
- #172: Document Management
- #173: Recurring Services
- #174: Job Costing
- #175: GPS Tracking
- #176: Notification System
- #177: RBAC & Permissions

**Phase 1 Approach**:
For each feature:
1. Create database schema
2. Add API routes with stub implementations
3. Build minimal UI with placeholder data
4. Add feature flag configuration
5. Document Phase 2 requirements

**Example: Scheduling (#165)**:
```typescript
// Schema (stub)
model JobAssignment {
  id              String   @id @default(uuid())
  jobTicketId     String
  crewId          String?
  userId          String?
  scheduledStart  DateTime
  scheduledEnd    DateTime
  status          String
  // ... more fields
}

// API (stub)
// apps/tenant-app/src/app/api/schedule/route.ts
export async function GET() {
  return NextResponse.json({
    today: [
      { id: '1', customer: 'John Doe', time: '9:00 AM', crew: 'Crew A' }
      // STUB: placeholder schedule
    ]
  });
}

// UI (stub)
// apps/tenant-app/src/components/schedule/Calendar.tsx
export function ScheduleCalendar() {
  return (
    <div>
      <h2>Schedule</h2>
      <p>[PLACEHOLDER: Drag-and-drop calendar will go here]</p>
      {/* STUB: Basic calendar grid */}
    </div>
  );
}
```

**Deliverables (per feature)**:
- ✅ Database schemas
- ✅ API route structure
- ✅ Basic UI shells
- ✅ Navigation integrated
- ⏸️ Business logic (Phase 2)
- ⏸️ External integrations (Phase 2)

---

### 1.5 Vertical Packs Scaffolding (Issues #197-250)

**Vertical Issues**:
- #197, #225: HVAC
- #200: Cleaning (Mountain Vista)
- #201: Fencing (ProDBX competitor)
- #202: Plumbing
- #203: Electrical
- #204: Trucking & Logistics
- #205: Landscaping
- #213, #237: Roofing
- #214, #236: Pest Control
- #219: Painting
- #222: Flooring
- And 15+ more...

**Phase 1 Approach**:
```typescript
// packages/verticals/src/configs/hvac.ts
export const HVAC_CONFIG = {
  key: 'hvac',
  name: 'HVAC Services',
  modules: {
    starter: [
      'contacts_crm',
      'job_tickets',
      'basic_scheduling',
      'equipment_tracking_basic', // vertical-specific
      // ... more
    ],
    professional: [
      // ... all starter modules plus:
      'maintenance_contracts', // vertical-specific
      'equipment_history',
      // ... more
    ],
    enterprise: [
      // ... all professional modules plus:
      'warranty_management', // vertical-specific
      'manufacturer_integrations',
    ]
  },
  customFields: {
    jobTicket: [
      { key: 'systemType', label: 'System Type', type: 'select', options: ['Central AC', 'Heat Pump', 'Furnace'] },
      { key: 'refrigerantType', label: 'Refrigerant', type: 'text' }
    ]
  },
  // STUB: Basic config structure
};

// Similar configs for all 25+ verticals
```

```typescript
// apps/tenant-app/src/app/[vertical]/dashboard/page.tsx
export default function VerticalDashboard({ params }: { params: { vertical: string } }) {
  const config = getVerticalConfig(params.vertical);
  
  return (
    <div>
      <h1>{config.name} Dashboard</h1>
      <p>[PLACEHOLDER: Vertical-specific widgets will go here]</p>
      {/* STUB: Generic dashboard */}
    </div>
  );
}
```

**Deliverables**:
- ✅ Vertical config files for all 25+ verticals
- ✅ Basic routing structure
- ✅ Custom field definitions
- ✅ Module mappings per tier
- ⏸️ Vertical-specific UI (Phase 2)
- ⏸️ Vertical-specific workflows (Phase 2)

---

## Phase 1 Summary

### What Phase 1 Delivers
- **Complete Architecture**: All schemas, routes, components scaffolded
- **Navigable App**: Every feature accessible via UI (even if placeholder)
- **Testable Structure**: Can test navigation, API structure, data flow
- **Clear Phase 2 Path**: TODOs and stubs clearly marked for Phase 2

### What Phase 1 Does NOT Deliver
- Real business logic
- External API integrations
- Complex validation
- Production-ready UI/UX
- Performance optimization
- Error handling beyond basics

### Phase 1 Success Criteria
- [ ] All database schemas migrated
- [ ] All API routes created (even if stubs)
- [ ] All UI pages accessible
- [ ] All feature flags configured
- [ ] All vertical configs defined
- [ ] TypeScript compiles without errors
- [ ] App runs and is navigable
- [ ] CI/CD passes

---

## Phase 2: Production Implementation

### Goals
- Replace every stub with production code
- Implement real business logic
- Connect external integrations
- Build production-ready UI/UX
- Add comprehensive validation
- Implement error handling
- Optimize performance
- Write comprehensive tests

---

## Phase 2 Issue Breakdown

### 2.1 Infrastructure Production Code

**Issues**: #253, 255-256, 260-262

**Phase 2 Implementation**:
```typescript
// packages/mcp-stripe/src/index.ts (PRODUCTION)
import Stripe from 'stripe';

export class StripeMCPServer {
  private stripe: Stripe;
  
  constructor(accountId: string) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      stripeAccount: accountId // Multi-account support
    });
  }
  
  async createCustomer(data: CreateCustomerInput): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
        metadata: data.metadata
      });
      
      return customer;
    } catch (error) {
      throw new StripeError('Failed to create customer', error);
    }
  }
  
  async createPaymentIntent(amount: number, currency = 'usd'): Promise<Stripe.PaymentIntent> {
    // Real implementation with error handling
    // Idempotency keys
    // Webhook verification
    // ...
  }
}
```

**Deliverables**:
- ✅ Real Stripe multi-account integration
- ✅ Real Twilio SMS/voice integration
- ✅ Real Resend email integration
- ✅ Real Google Workspace integration
- ✅ Domain registrar integrations
- ✅ Error handling and retries
- ✅ Comprehensive tests

---

### 2.2 AI Cost Management Production Code

**Issues**: #257, #258

**Phase 2 Implementation**:
```typescript
// apps/tenant-app/src/lib/ai/usage-tracker.ts (PRODUCTION)
import { prisma } from '@/lib/prisma';

export class AIUsageTracker {
  async trackUsage(params: {
    tenantId: string;
    userId?: string;
    feature: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
  }) {
    const totalTokens = params.promptTokens + params.completionTokens;
    const estimatedCost = this.calculateCost(params.model, totalTokens);
    
    // Save to database
    await prisma.aIUsage.create({
      data: {
        ...params,
        totalTokens,
        estimatedCost
      }
    });
    
    // Check budget and alert if needed
    await this.checkBudgetAndAlert(params.tenantId, estimatedCost);
  }
  
  private calculateCost(model: string, tokens: number): number {
    const rates = {
      'gpt-4': { prompt: 0.03, completion: 0.06 },
      'claude-3.5-sonnet': { prompt: 0.003, completion: 0.015 },
      // ... more models
    };
    
    // Real cost calculation
    return (tokens / 1000) * rates[model].prompt;
  }
  
  private async checkBudgetAndAlert(tenantId: string, newCost: number) {
    const budget = await prisma.aIBudget.findUnique({
      where: { tenantId }
    });
    
    if (!budget) return;
    
    const newSpend = budget.currentSpend.toNumber() + newCost;
    const percentUsed = (newSpend / budget.monthlyBudget.toNumber()) * 100;
    
    if (percentUsed >= budget.alertThreshold) {
      await this.sendBudgetAlert(tenantId, percentUsed);
    }
    
    if (budget.hardLimit && percentUsed >= 100) {
      await this.disableAIFeatures(tenantId);
    }
  }
}
```

**Deliverables**:
- ✅ Real usage tracking with accurate costs
- ✅ Budget monitoring and alerts
- ✅ Usage analytics and dashboards
- ✅ Cost optimization recommendations
- ✅ Per-user and per-feature breakdowns
- ✅ Historical trending

---

### 2.3 Core Features Production Code

**All Issues #161-177, #238, #240**

**For Each Feature**:
1. Replace stub API logic with real database queries
2. Implement complete business logic
3. Add validation (Zod schemas)
4. Build production UI with real data
5. Add error handling and loading states
6. Write unit and integration tests
7. Add documentation

**Example: Scheduling (#165) Production**:
```typescript
// apps/tenant-app/src/app/api/schedule/optimize-route/route.ts (PRODUCTION)
import { geneticAlgorithmTSP } from '@/lib/routing/tsp';
import { getGoogleMapsDistances } from '@/lib/maps/google';

export async function POST(req: Request) {
  const { date, crewId } = await req.json();
  
  // Get all jobs for crew on date
  const jobs = await prisma.jobAssignment.findMany({
    where: {
      crewId,
      scheduledStart: {
        gte: startOfDay(date),
        lt: endOfDay(date)
      }
    },
    include: {
      jobTicket: {
        include: {
          property: true
        }
      }
    }
  });
  
  // Extract locations
  const locations = jobs.map(j => ({
    jobId: j.id,
    lat: j.jobTicket.property.latitude,
    lng: j.jobTicket.property.longitude
  }));
  
  // Calculate distance matrix
  const distances = await getGoogleMapsDistances(locations);
  
  // Run TSP optimization
  const optimizedRoute = await geneticAlgorithmTSP(locations, distances);
  
  // Update job assignments with new order
  await prisma.$transaction(
    optimizedRoute.map((jobId, index) =>
      prisma.jobAssignment.update({
        where: { id: jobId },
        data: { routeOrder: index }
      })
    )
  );
  
  return NextResponse.json({
    optimizedRoute,
    totalDistance: optimizedRoute.totalDistance,
    estimatedTime: optimizedRoute.estimatedTime
  });
}
```

**Deliverables (per feature)**:
- ✅ Production business logic
- ✅ Database operations
- ✅ Validation and error handling
- ✅ External integrations
- ✅ Production UI/UX
- ✅ Tests (unit + integration)

---

### 2.4 Vertical Packs Production Code

**All Issues #197-250**

**For Each Vertical**:
1. Build vertical-specific UI components
2. Implement vertical workflows
3. Add industry-specific validations
4. Create custom reports/dashboards
5. Integrate vertical-specific tools
6. Add example data/templates

**Example: HVAC (#197, #225) Production**:
```typescript
// apps/tenant-app/src/app/hvac/equipment/[id]/page.tsx (PRODUCTION)
import { EquipmentHistory } from '@/components/hvac/EquipmentHistory';
import { MaintenanceSchedule } from '@/components/hvac/MaintenanceSchedule';
import { WarrantyTracker } from '@/components/hvac/WarrantyTracker';

export default async function HVACEquipmentDetail({ params }) {
  const equipment = await prisma.equipment.findUnique({
    where: { id: params.id },
    include: {
      serviceHistory: true,
      warranties: true,
      maintenanceSchedule: true,
      property: {
        include: { contact: true }
      }
    }
  });
  
  return (
    <div>
      <EquipmentHeader equipment={equipment} />
      
      {/* HVAC-specific components */}
      <RefrigerantChargeLevels equipment={equipment} />
      <SystemEfficiencyChart equipment={equipment} />
      <EquipmentHistory history={equipment.serviceHistory} />
      <MaintenanceSchedule schedule={equipment.maintenanceSchedule} />
      <WarrantyTracker warranties={equipment.warranties} />
    </div>
  );
}
```

**Deliverables (per vertical)**:
- ✅ Industry-specific UI
- ✅ Custom workflows
- ✅ Specialized reports
- ✅ Vertical integrations
- ✅ Example templates
- ✅ Documentation

---

## Phase 2 Summary

### What Phase 2 Delivers
- **Production System**: Fully functional, production-ready
- **Real Integrations**: All external services connected
- **Complete Features**: All business logic implemented
- **Polished UI/UX**: Professional, responsive design
- **Tested**: Comprehensive test coverage
- **Documented**: User and developer documentation

### Phase 2 Success Criteria
- [ ] All stubs replaced with real code
- [ ] All external integrations working
- [ ] All features functional end-to-end
- [ ] All tests passing (>80% coverage)
- [ ] All documentation complete
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Ready for beta customers

---

## Issue Priority Matrix

### P0 - Critical (Must Have for Launch)
- #164: Subscription & Module System
- #166: Estimates & Invoicing
- #167: Payment Processing
- #257: AI Cost Management - Tenant
- #258: AI Cost Management - Provider

### P1 - High Priority (Launch Features)
- #163: Mobile Field Tech PWA
- #165: Scheduling & Dispatch
- #168: Reporting & Analytics
- #176: Notification System
- #200: Cleaning Vertical (Mountain Vista)

### P2 - Medium Priority (Post-Launch)
- #162: Subcontractor Management
- #169: Time Tracking & Payroll
- #173: Recurring Services
- #174: Job Costing
- All other vertical packs

### P3 - Low Priority (Future Enhancements)
- #170: Migration Frameworks
- #171: Marketing Automation
- Advanced MCP servers
- Nice-to-have features

---

## Success Metrics

### Phase 1 (Scaffolding)
- **Code Coverage**: Structural completeness (schemas, routes, components exist)
- **Compilation**: No TypeScript errors
- **Navigation**: All pages accessible
- **Timeline**: 8-12 weeks

### Phase 2 (Production)
- **Functionality**: All features work end-to-end
- **Test Coverage**: >80% unit/integration tests
- **Performance**: <2s page loads, <100ms API responses
- **Timeline**: 16-24 weeks

---

## Execution Strategy

### Phase 1 Execution
1. **Week 1-2**: Infrastructure & MCP scaffolding
2. **Week 3-4**: AI cost management & communications scaffolding
3. **Week 5-8**: Core features scaffolding (parallel work)
4. **Week 9-12**: Vertical packs scaffolding (parallel work)

### Phase 2 Execution
1. **Week 13-16**: Infrastructure production code
2. **Week 17-20**: AI cost management production code
3. **Week 21-28**: Core features production code (parallel work)
4. **Week 29-36**: Vertical packs production code (parallel work)

### Parallel Work Strategy
- Multiple features can be scaffolded simultaneously
- Use feature branches for each issue
- Merge to main frequently (daily if possible)
- Use feature flags to hide incomplete work

---

## Next Steps

1. ✅ Review and approve this 2-phase plan
2. 🔄 Begin Phase 1.1: Infrastructure scaffolding
3. 🔄 Set up feature flag system
4. 🔄 Create database schema migrations
5. 🔄 Scaffold first batch of API routes
