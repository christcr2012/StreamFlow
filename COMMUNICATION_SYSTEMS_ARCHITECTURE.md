# Cortiware Communication Systems Architecture

## Overview
Cortiware has MULTIPLE DISTINCT communication systems that must remain architecturally separated.

---

## Communication System 1: Provider ↔ Tenant (B2B)

**Purpose**: Robinson AI Systems (Provider) communicates with their tenant organizations

**Examples**:
- System notifications (billing, maintenance, upgrades)
- Support tickets
- Feature announcements
- Account management

**Technology**:
- Provider portal sends → Tenant receives
- Email via Resend (from provider@robinsonai.com)
- In-app notifications in tenant dashboard
- Provider dashboard shows sent communications

**Data Model**:
```sql
-- Provider database (apps/provider-portal/prisma/schema.prisma)
model ProviderCommunication {
  id              String   @id @default(uuid())
  tenantId        String
  subject         String
  message         String   @db.Text
  type            String   // 'billing', 'support', 'announcement'
  status          String   // 'sent', 'delivered', 'read'
  createdAt       DateTime @default(now())
}
```

**Security**: Provider has full access, tenants are recipients

---

## Communication System 2: Tenant Internal (Staff)

**Purpose**: Internal communication within a tenant organization's staff

**Examples**:
- Job assignments
- Internal notes
- Staff messaging
- Team coordination

**Technology**:
- Internal messaging system
- No external SMS/email (stays in-app)
- Real-time via WebSockets

**Data Model**:
```sql
-- Tenant database (prisma/schema.prisma)
model StaffMessage {
  id              String   @id @default(uuid())
  orgId           String
  fromUserId      String
  toUserId        String
  jobTicketId     String?
  message         String   @db.Text
  readAt          DateTime?
  createdAt       DateTime @default(now())
  
  org             Org      @relation(fields: [orgId], references: [id])
  fromUser        User     @relation("SentMessages", fields: [fromUserId], references: [id])
  toUser          User     @relation("ReceivedMessages", fields: [toUserId], references: [id])
}
```

**Security**: Only visible to staff within same Org

---

## Communication System 3: Tenant ↔ Customer (Type 2 Communications) ⚠️ PRIMARY FOCUS

**Purpose**: Field service businesses communicate with their end customers

**Examples**:
- Appointment confirmations
- Job updates
- Invoice delivery
- Customer inquiries
- Two-way SMS conversations
- Email notifications

**Technology**:
- SMS via Twilio (tenant's Twilio account)
- Email via Resend (from tenant's domain)
- Phone calls via Twilio
- In-app customer portal (optional)

**Data Model**:
```sql
-- Tenant database (prisma/schema.prisma)
model Communication {
  id              String   @id @default(uuid())
  orgId           String
  contactId       String   // The customer
  userId          String?  // Staff member who initiated
  type            String   // 'sms', 'email', 'call'
  direction       String   // 'inbound', 'outbound'
  content         String   @db.Text
  metadata        Json?    // phone numbers, email addresses, etc.
  status          String   // 'sent', 'delivered', 'failed', 'read'
  externalId      String?  // Twilio SID, Resend ID
  createdAt       DateTime @default(now())
  
  org             Org      @relation(fields: [orgId], references: [id])
  contact         Contact  @relation(fields: [contactId], references: [id])
  user            User?    @relation(fields: [userId], references: [id])
  
  @@index([orgId, contactId, createdAt])
}

model CommunicationThread {
  id              String   @id @default(uuid())
  orgId           String
  contactId       String
  lastMessageAt   DateTime
  unreadCount     Int      @default(0)
  
  org             Org      @relation(fields: [orgId], references: [id])
  contact         Contact  @relation(fields: [contactId], references: [id])
  
  @@index([orgId, lastMessageAt])
}
```

**Security**: 
- Each tenant uses their own Twilio/Resend credentials
- Data isolated per Org
- Customer only sees their own thread

**Integration**:
```typescript
// apps/tenant-app/src/lib/communications/send.ts
import { TwilioService } from '@cortiware/twilio-service';
import { ResendService } from '@cortiware/resend-service';

export async function sendCustomerSMS(orgId: string, contactId: string, message: string) {
  // Get tenant's Twilio credentials from secure config
  const config = await getTenantTwilioConfig(orgId);
  
  const twilio = new TwilioService(
    config.accountSid,
    config.authToken,
    config.fromNumber
  );
  
  const result = await twilio.sendSMS({
    to: contact.phone,
    body: message
  });
  
  // Save to Communications table
  await prisma.communication.create({
    data: {
      orgId,
      contactId,
      type: 'sms',
      direction: 'outbound',
      content: message,
      status: result.status,
      externalId: result.sid
    }
  });
}
```

---

## Communication System 4: Customer ↔ Cortiware (Support)

**Purpose**: End customers get help with the Cortiware platform itself (rare)

**Examples**:
- "How do I pay my invoice?"
- "I can't access the customer portal"
- Platform bugs

**Technology**:
- Support email (support@cortiware.com)
- Help center
- Handled by Provider, not shown in tenant app

**Data Model**: Lives in Provider database

---

## Communication System 5: Provider Internal

**Purpose**: Robinson AI Systems internal team communication

**Examples**:
- Developer notes
- Internal incidents
- Sales/support coordination

**Technology**: 
- External tools (Slack, etc.)
- NOT part of Cortiware codebase

---

## Architecture Principles

### 1. Database Separation
- **Provider communications**: `apps/provider-portal/prisma/schema.prisma`
- **Tenant communications**: `prisma/schema.prisma` (tenant database)
- **NO shared communications table**

### 2. Service Integration Isolation
```typescript
// Each tenant has their own credentials
// Provider CANNOT see tenant's Twilio/Resend data
// Tenant CANNOT see provider's communication platform

// Tenant config (encrypted in their database)
{
  twilioAccountSid: "AC...",
  twilioAuthToken: "***",
  twilioFromNumber: "+15551234567",
  resendApiKey: "re_***",
  resendFromEmail: "notifications@acmehvac.com"
}

// Provider config (separate)
{
  twilioAccountSid: "AC...",  // Different account
  resendApiKey: "re_***",     // Different account
  resendFromEmail: "noreply@robinsonai.com"
}
```

### 3. UI Separation
- **Provider Portal**: `/provider/communications` shows Provider → Tenant messages
- **Tenant App**: `/communications` shows Tenant ↔ Customer messages (Type 2)
- **Tenant App**: `/staff/messages` for internal staff chat (future)

### 4. API Route Separation
```
apps/provider-portal/src/app/api/
  communications/              # Provider → Tenant
  
apps/tenant-app/src/app/api/
  communications/              # Tenant ↔ Customer (Type 2)
  staff/messages/              # Internal staff (future)
```

---

## Phase 1 Implementation Priority

**FOCUS**: Communication System 3 (Tenant ↔ Customer)
- Most complex (external integrations)
- Highest business value
- Core to field service operations

**Defer**: 
- System 1 (Provider → Tenant): Simple notifications
- System 2 (Staff internal): Nice-to-have
- System 4 (Customer support): Rare edge case
- System 5 (Provider internal): External tools

---

## Service Package Usage

### @cortiware/twilio-service
**Used by**: 
- ✅ Tenant app (Type 2 Communications - customer SMS)
- ❌ Provider portal (providers don't send SMS to tenants)

### @cortiware/resend-service
**Used by**:
- ✅ Tenant app (Type 2 Communications - customer emails)
- ✅ Provider portal (system notifications to tenants)
- ✅ Both use different API keys and from addresses

### @cortiware/stripe-service
**Used by**:
- ✅ Tenant app (if tenant wants to charge customers via their own Stripe)
- ✅ Provider portal (Robinson AI bills tenants via provider's Stripe)
- ✅ Multi-account architecture supports both

---

## Key Takeaway

**Cortiware is a MULTI-TENANT platform where each tenant runs their own business.**

Communication flows:
1. **Provider (Robinson AI) ↔ Tenants**: Platform operations
2. **Tenant ↔ Customers**: Business operations (PRIMARY)
3. **Within Tenant**: Staff coordination
4. **Customer ↔ Platform**: Support (rare)

**Each system is architecturally isolated** with separate:
- Database tables
- API routes
- UI sections
- Service credentials
- Access controls
