# Data Flow Diagram

## Dual Prisma Schema Architecture

```mermaid
graph TB
    subgraph "Tenant App"
        TenantRoutes[API Routes<br/>/api/leads, /api/opportunities]
        TenantPrisma[Prisma Client<br/>@prisma/client-tenant]
    end
    
    subgraph "Provider Portal"
        ProviderRoutes[API Routes<br/>/api/federation, /api/monetization]
        ProviderPrisma[Prisma Client<br/>@prisma/client-provider]
    end
    
    subgraph "Root Schema"
        RootSchema[prisma/schema.prisma]
        TenantDB[(Tenant Database<br/>CRM, Users, Orgs)]
    end
    
    subgraph "Provider Schema"
        ProviderSchema[apps/provider-portal/<br/>prisma/schema.prisma]
        ProviderDB[(Provider Database<br/>Federation, Monetization)]
    end
    
    TenantRoutes --> TenantPrisma
    TenantPrisma --> RootSchema
    RootSchema --> TenantDB
    
    ProviderRoutes --> ProviderPrisma
    ProviderPrisma --> ProviderSchema
    ProviderSchema --> ProviderDB
    
    style TenantDB fill:#0070f3,color:#fff
    style ProviderDB fill:#7c3aed,color:#fff
```

## CRM Data Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as React Component
    participant API as API Route
    participant Service as Service Layer
    participant Prisma as Prisma Client
    participant DB as PostgreSQL
    
    Note over User,DB: Create Lead Flow
    
    User->>UI: Fill lead form
    UI->>UI: Validate input
    UI->>API: POST /api/leads
    API->>API: Authenticate user
    API->>API: Check permissions
    API->>Service: createLead(data)
    Service->>Service: Validate business rules
    Service->>Prisma: prisma.lead.create()
    Prisma->>DB: INSERT INTO leads
    DB-->>Prisma: Lead record
    Prisma-->>Service: Lead object
    Service->>Service: Audit log
    Service-->>API: Success response
    API-->>UI: 201 Created + lead data
    UI-->>User: Show success message
    
    Note over User,DB: Update Lead Flow
    
    User->>UI: Edit lead
    UI->>API: PUT /api/leads/[id]
    API->>API: Authenticate user
    API->>API: Check permissions
    API->>Service: updateLead(id, data)
    Service->>Prisma: prisma.lead.update()
    Prisma->>DB: UPDATE leads
    DB-->>Prisma: Updated record
    Prisma-->>Service: Lead object
    Service->>Service: Audit log
    Service-->>API: Success response
    API-->>UI: 200 OK + lead data
    UI-->>User: Show updated lead
    
    Note over User,DB: Convert Lead to Opportunity
    
    User->>UI: Click "Convert to Opportunity"
    UI->>API: POST /api/leads/[id]/convert
    API->>API: Authenticate user
    API->>Service: convertLeadToOpportunity(leadId)
    Service->>Prisma: prisma.$transaction()
    
    Note over Prisma,DB: Transaction Start
    
    Prisma->>DB: BEGIN TRANSACTION
    Prisma->>DB: INSERT INTO opportunities
    Prisma->>DB: UPDATE leads SET converted=true
    Prisma->>DB: COMMIT TRANSACTION
    
    Note over Prisma,DB: Transaction End
    
    DB-->>Prisma: Opportunity + Lead
    Prisma-->>Service: Transaction result
    Service->>Service: Audit log
    Service-->>API: Success response
    API-->>UI: 200 OK + opportunity data
    UI-->>User: Redirect to opportunity
```

## Federation Data Flow

```mermaid
graph TB
    subgraph "Provider Portal"
        FedUI[Federation UI]
        FedAPI[Federation API]
        FedService[Federation Service]
    end
    
    subgraph "Database"
        FedKeys[(Federation Keys)]
        Tenants[(Tenants)]
        OIDC[(OIDC Config)]
    end
    
    subgraph "External"
        OIDCProvider[OIDC Provider]
        TenantApp[Tenant Application]
    end
    
    FedUI -->|Create Key| FedAPI
    FedAPI --> FedService
    FedService -->|Store| FedKeys
    FedService -->|Link| Tenants
    FedService -->|Configure| OIDC
    
    TenantApp -->|Authenticate| OIDCProvider
    OIDCProvider -->|Validate| FedKeys
    FedKeys -->|Return Token| TenantApp
    
    style FedKeys fill:#7c3aed,color:#fff
    style Tenants fill:#0070f3,color:#fff
```

## Monetization Data Flow

```mermaid
sequenceDiagram
    participant Admin as Provider Admin
    participant UI as Monetization UI
    participant API as Monetization API
    participant Service as Monetization Service
    participant Prisma as Prisma Client
    participant DB as Database
    participant Stripe as Stripe API
    
    Note over Admin,Stripe: Create Price Plan
    
    Admin->>UI: Create price plan
    UI->>API: POST /api/monetization/plans
    API->>Service: createPlan(data)
    Service->>Stripe: stripe.products.create()
    Stripe-->>Service: Product ID
    Service->>Stripe: stripe.prices.create()
    Stripe-->>Service: Price ID
    Service->>Prisma: prisma.pricePlan.create()
    Prisma->>DB: INSERT INTO price_plans
    DB-->>Prisma: Plan record
    Prisma-->>Service: Plan object
    Service-->>API: Success response
    API-->>UI: 201 Created + plan data
    UI-->>Admin: Show new plan
    
    Note over Admin,Stripe: Create Subscription
    
    Admin->>UI: Subscribe tenant to plan
    UI->>API: POST /api/monetization/subscriptions
    API->>Service: createSubscription(tenantId, planId)
    Service->>Prisma: prisma.pricePlan.findUnique()
    Prisma->>DB: SELECT FROM price_plans
    DB-->>Prisma: Plan with Stripe IDs
    Prisma-->>Service: Plan object
    Service->>Stripe: stripe.subscriptions.create()
    Stripe-->>Service: Subscription ID
    Service->>Prisma: prisma.subscription.create()
    Prisma->>DB: INSERT INTO subscriptions
    DB-->>Prisma: Subscription record
    Prisma-->>Service: Subscription object
    Service-->>API: Success response
    API-->>UI: 201 Created + subscription data
    UI-->>Admin: Show active subscription
```

## Caching Strategy

```mermaid
graph TB
    Request[API Request] --> CheckCache{Cache<br/>Hit?}
    
    CheckCache -->|Yes| ReturnCached[Return Cached Data]
    CheckCache -->|No| QueryDB[Query Database]
    
    QueryDB --> StoreCache[Store in Cache]
    StoreCache --> ReturnFresh[Return Fresh Data]
    
    Mutation[Data Mutation] --> InvalidateCache[Invalidate Cache]
    InvalidateCache --> UpdateDB[Update Database]
    UpdateDB --> UpdateCache[Update Cache]
    
    subgraph "Cache Layers"
        Redis[(Redis Cache)]
        VercelKV[(Vercel KV)]
        Memory[(In-Memory Cache)]
    end
    
    ReturnCached --> Redis
    StoreCache --> Redis
    StoreCache --> VercelKV
    StoreCache --> Memory
    
    style Redis fill:#dc382d,color:#fff
    style VercelKV fill:#000,color:#fff
```

## Rate Limiting Data Flow

```mermaid
sequenceDiagram
    participant Client
    participant Middleware as Rate Limit Middleware
    participant KV as Key-Value Store
    participant API as API Route
    
    Client->>Middleware: API Request
    Middleware->>KV: Get rate limit counter
    KV-->>Middleware: Current count
    
    alt Under Limit
        Middleware->>KV: Increment counter
        Middleware->>API: Forward request
        API-->>Middleware: Response
        Middleware-->>Client: 200 OK + response
    else Over Limit
        Middleware-->>Client: 429 Too Many Requests<br/>Retry-After: 60
    end
    
    Note over KV: Counter expires after window
```

## Audit Logging Data Flow

```mermaid
graph TB
    Request[API Request] --> Middleware[Audit Middleware]
    Middleware --> CaptureData[Capture Request Data]
    CaptureData --> ProcessRequest[Process Request]
    ProcessRequest --> CaptureResponse[Capture Response]
    CaptureResponse --> CreateLog[Create Audit Log]
    
    CreateLog --> DB[(Audit Logs Table)]
    
    subgraph "Audit Log Data"
        UserId[User ID]
        Action[Action Type]
        Resource[Resource]
        Timestamp[Timestamp]
        IPAddress[IP Address]
        UserAgent[User Agent]
        RequestBody[Request Body]
        ResponseStatus[Response Status]
    end
    
    CreateLog --> UserId
    CreateLog --> Action
    CreateLog --> Resource
    CreateLog --> Timestamp
    CreateLog --> IPAddress
    CreateLog --> UserAgent
    CreateLog --> RequestBody
    CreateLog --> ResponseStatus
    
    style DB fill:#336791,color:#fff
```

## Data Relationships

### Tenant App Schema

```mermaid
erDiagram
    User ||--o{ Lead : creates
    User ||--o{ Opportunity : manages
    User ||--o{ Organization : belongs_to
    Lead ||--o| Opportunity : converts_to
    Opportunity ||--|| Organization : belongs_to
    Organization ||--o{ User : has
    
    User {
        string id PK
        string email
        string name
        string role
        datetime createdAt
    }
    
    Lead {
        string id PK
        string name
        string email
        string status
        boolean converted
        datetime createdAt
    }
    
    Opportunity {
        string id PK
        string name
        decimal value
        string stage
        string organizationId FK
        datetime createdAt
    }
    
    Organization {
        string id PK
        string name
        string industry
        datetime createdAt
    }
```

### Provider Portal Schema

```mermaid
erDiagram
    Provider ||--o{ FederationKey : manages
    Provider ||--o{ PricePlan : creates
    Tenant ||--o{ Subscription : has
    PricePlan ||--o{ Subscription : used_in
    Developer ||--o{ APIKey : owns
    
    Provider {
        string id PK
        string email
        string name
        string role
        datetime createdAt
    }
    
    FederationKey {
        string id PK
        string providerId FK
        string keyHash
        datetime expiresAt
        datetime createdAt
    }
    
    PricePlan {
        string id PK
        string name
        decimal price
        string stripeProductId
        string stripePriceId
        datetime createdAt
    }
    
    Subscription {
        string id PK
        string tenantId FK
        string planId FK
        string status
        datetime createdAt
    }
    
    APIKey {
        string id PK
        string developerId FK
        string keyHash
        datetime expiresAt
        datetime createdAt
    }
```

