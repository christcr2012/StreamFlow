# System Architecture Diagram

## Cortiware System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile Browser]
    end
    
    subgraph "Vercel Deployment"
        subgraph "Apps"
            ProviderPortal[Provider Portal<br/>:3000]
            TenantApp[Tenant App<br/>:3003]
            MarketingCW[Marketing Cortiware<br/>:3001]
            MarketingRB[Marketing Robinson<br/>:3002]
        end
        
        subgraph "Shared Packages"
            AuthService[@cortiware/auth-service]
            DB[@cortiware/db]
            Themes[@cortiware/themes]
            UIComponents[@cortiware/ui-components]
            KV[@cortiware/kv]
            Routing[@cortiware/routing]
            Verticals[@cortiware/verticals]
            Wallet[@cortiware/wallet]
            Agreements[@cortiware/agreements]
        end
    end
    
    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL<br/>Database)]
        Redis[(Redis<br/>Cache)]
        VercelKV[(Vercel KV<br/>Storage)]
    end
    
    subgraph "External Services"
        Stripe[Stripe<br/>Payments]
        SendGrid[SendGrid<br/>Email]
        OIDC[OIDC<br/>Provider]
    end
    
    Browser --> ProviderPortal
    Browser --> TenantApp
    Browser --> MarketingCW
    Browser --> MarketingRB
    Mobile --> ProviderPortal
    Mobile --> TenantApp
    
    ProviderPortal --> AuthService
    ProviderPortal --> DB
    ProviderPortal --> Themes
    ProviderPortal --> UIComponents
    ProviderPortal --> KV
    
    TenantApp --> AuthService
    TenantApp --> DB
    TenantApp --> Themes
    TenantApp --> UIComponents
    TenantApp --> KV
    TenantApp --> Routing
    TenantApp --> Verticals
    TenantApp --> Wallet
    TenantApp --> Agreements
    
    DB --> PostgreSQL
    KV --> Redis
    KV --> VercelKV
    
    ProviderPortal --> Stripe
    ProviderPortal --> SendGrid
    ProviderPortal --> OIDC
    
    TenantApp --> Stripe
    TenantApp --> SendGrid
    
    style ProviderPortal fill:#0070f3,color:#fff
    style TenantApp fill:#0070f3,color:#fff
    style MarketingCW fill:#10b981,color:#fff
    style MarketingRB fill:#10b981,color:#fff
    style PostgreSQL fill:#336791,color:#fff
    style Redis fill:#dc382d,color:#fff
    style Stripe fill:#635bff,color:#fff
```

## Component Descriptions

### Apps

1. **Provider Portal** (Port 3000)
   - Provider management interface
   - Federation management
   - Monetization (plans, prices, coupons)
   - Developer portal (API keys, webhooks)
   - Observability dashboards
   - RBAC with 30+ permissions

2. **Tenant App** (Port 3003)
   - Client-facing application
   - CRM (Leads, Opportunities, Organizations)
   - Dashboard and analytics
   - User management

3. **Marketing Cortiware** (Port 3001)
   - Public marketing site for Cortiware
   - Features, pricing, contact

4. **Marketing Robinson** (Port 3002)
   - Public marketing site for Robinson AI Systems
   - Solutions, case studies, contact

### Shared Packages

- **@cortiware/auth-service**: Authentication utilities (JWT, TOTP, bcrypt)
- **@cortiware/db**: Database utilities and Prisma helpers
- **@cortiware/themes**: Shared themes and CSS
- **@cortiware/ui-components**: Reusable React components
- **@cortiware/kv**: Key-value store (Redis/Vercel KV)
- **@cortiware/routing**: Routing utilities
- **@cortiware/verticals**: Vertical-specific code
- **@cortiware/wallet**: Wallet functionality
- **@cortiware/agreements**: Agreements engine

### Data Layer

- **PostgreSQL**: Primary database (dual schema architecture)
- **Redis**: Caching and rate limiting
- **Vercel KV**: Serverless key-value storage

### External Services

- **Stripe**: Payment processing and subscriptions
- **SendGrid**: Email delivery
- **OIDC**: OpenID Connect authentication

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 3.4
- **Database**: PostgreSQL 14+ with Prisma 6.16
- **Caching**: Redis 6+ / Vercel KV
- **Deployment**: Vercel
- **Monorepo**: Turborepo 2.5
- **Node.js**: 22.x

