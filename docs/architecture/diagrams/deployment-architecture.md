# Deployment Architecture Diagram

## Vercel Deployment Architecture

```mermaid
graph TB
    subgraph "GitHub"
        Repo[Git Repository<br/>main branch]
    end
    
    subgraph "Vercel Platform"
        subgraph "Build Process"
            Trigger[Git Push Trigger]
            Install[npm install]
            PrismaGen[Prisma Generate]
            PrismaMigrate[Prisma Migrate Deploy]
            NextBuild[Next.js Build]
        end
        
        subgraph "Deployed Apps"
            PP[Provider Portal<br/>dpl_ByiywwsaKTvGL8mYuir9LFRbpCaF]
            TA[Tenant App<br/>dpl_2gs6jqK81knFrRb1NgaWxNJaBoD2]
            MCW[Marketing Cortiware]
            MRB[Marketing Robinson<br/>dpl_4Equyw1Ub139XD3SQimjpRCHhYzd]
        end
        
        subgraph "Serverless Functions"
            PPAPI[Provider Portal APIs]
            TAAPI[Tenant App APIs]
            Cron[Cron Jobs]
        end
    end
    
    subgraph "External Services"
        PostgreSQL[(PostgreSQL<br/>Database)]
        Redis[(Redis<br/>Cache)]
        VercelKV[(Vercel KV<br/>Storage)]
        Stripe[Stripe API]
        SendGrid[SendGrid API]
    end
    
    subgraph "CDN"
        Edge[Vercel Edge Network]
        Static[Static Assets]
    end
    
    Repo -->|Push to main| Trigger
    Trigger --> Install
    Install --> PrismaGen
    PrismaGen --> PrismaMigrate
    PrismaMigrate --> NextBuild
    NextBuild --> PP
    NextBuild --> TA
    NextBuild --> MCW
    NextBuild --> MRB
    
    PP --> PPAPI
    TA --> TAAPI
    PP --> Cron
    
    PPAPI --> PostgreSQL
    TAAPI --> PostgreSQL
    PPAPI --> Redis
    TAAPI --> Redis
    PPAPI --> VercelKV
    TAAPI --> VercelKV
    PPAPI --> Stripe
    PPAPI --> SendGrid
    TAAPI --> SendGrid
    
    PP --> Edge
    TA --> Edge
    MCW --> Edge
    MRB --> Edge
    Edge --> Static
    
    style PP fill:#0070f3,color:#fff
    style TA fill:#0070f3,color:#fff
    style MCW fill:#10b981,color:#fff
    style MRB fill:#10b981,color:#fff
    style PostgreSQL fill:#336791,color:#fff
    style Redis fill:#dc382d,color:#fff
```

## Build Pipeline

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as GitHub
    participant Vercel as Vercel
    participant Build as Build System
    participant Deploy as Deployment
    participant Prod as Production
    
    Dev->>Git: git push origin main
    Git->>Vercel: Webhook trigger
    Vercel->>Build: Start build
    
    Note over Build: Build Process
    
    Build->>Build: npm install
    Build->>Build: prisma generate
    Build->>Build: prisma migrate deploy
    Build->>Build: next build
    Build->>Build: Run tests (optional)
    
    alt Build Success
        Build->>Deploy: Deploy to production
        Deploy->>Prod: Update deployment
        Prod-->>Vercel: Deployment URL
        Vercel-->>Git: Update commit status
        Git-->>Dev: Notification
    else Build Failure
        Build-->>Vercel: Build failed
        Vercel-->>Git: Update commit status
        Git-->>Dev: Failure notification
    end
```

## Environment Configuration

```mermaid
graph TB
    subgraph "Vercel Project Settings"
        EnvVars[Environment Variables]
        BuildSettings[Build Settings]
        Domains[Custom Domains]
    end
    
    subgraph "Environment Variables"
        Production[Production Env]
        Preview[Preview Env]
        Development[Development Env]
    end
    
    subgraph "Required Variables"
        DB[DATABASE_URL]
        Auth[NEXTAUTH_SECRET]
        Stripe[STRIPE_SECRET_KEY]
        SendGrid[SENDGRID_API_KEY]
        Redis[REDIS_URL]
        KV[KV_REST_API_URL]
    end
    
    EnvVars --> Production
    EnvVars --> Preview
    EnvVars --> Development
    
    Production --> DB
    Production --> Auth
    Production --> Stripe
    Production --> SendGrid
    Production --> Redis
    Production --> KV
    
    style Production fill:#10b981,color:#fff
    style Preview fill:#f59e0b,color:#fff
    style Development fill:#3b82f6,color:#fff
```

## Deployment URLs

### Production Deployments

```mermaid
graph LR
    subgraph "Production URLs"
        PP[provider-portal<br/>cortiware-provider-portal-*.vercel.app]
        TA[tenant-app<br/>cortiware-tenant-*.vercel.app]
        MCW[marketing-cortiware<br/>cortiware-marketing-cortiware-*.vercel.app]
        MRB[marketing-robinson<br/>cortiware-marketing-robinson-*.vercel.app]
    end
    
    subgraph "Custom Domains (Future)"
        PPDomain[provider.cortiware.com]
        TADomain[app.cortiware.com]
        MCWDomain[cortiware.com]
        MRBDomain[robinson.ai]
    end
    
    PP -.->|Future| PPDomain
    TA -.->|Future| TADomain
    MCW -.->|Future| MCWDomain
    MRB -.->|Future| MRBDomain
    
    style PP fill:#0070f3,color:#fff
    style TA fill:#0070f3,color:#fff
    style MCW fill:#10b981,color:#fff
    style MRB fill:#10b981,color:#fff
```

## Monorepo Build Strategy

```mermaid
graph TB
    Push[Git Push] --> TurboIgnore[turbo-ignore]
    
    TurboIgnore --> CheckPP{Provider Portal<br/>Changed?}
    TurboIgnore --> CheckTA{Tenant App<br/>Changed?}
    TurboIgnore --> CheckMCW{Marketing CW<br/>Changed?}
    TurboIgnore --> CheckMRB{Marketing RB<br/>Changed?}
    
    CheckPP -->|Yes| BuildPP[Build Provider Portal]
    CheckPP -->|No| SkipPP[Skip Build]
    
    CheckTA -->|Yes| BuildTA[Build Tenant App]
    CheckTA -->|No| SkipTA[Skip Build]
    
    CheckMCW -->|Yes| BuildMCW[Build Marketing CW]
    CheckMCW -->|No| SkipMCW[Skip Build]
    
    CheckMRB -->|Yes| BuildMRB[Build Marketing RB]
    CheckMRB -->|No| SkipMRB[Skip Build]
    
    BuildPP --> DeployPP[Deploy PP]
    BuildTA --> DeployTA[Deploy TA]
    BuildMCW --> DeployMCW[Deploy MCW]
    BuildMRB --> DeployMRB[Deploy MRB]
    
    style BuildPP fill:#0070f3,color:#fff
    style BuildTA fill:#0070f3,color:#fff
    style BuildMCW fill:#10b981,color:#fff
    style BuildMRB fill:#10b981,color:#fff
```

## Serverless Functions

```mermaid
graph TB
    subgraph "Provider Portal Functions"
        FedAPI[/api/federation/*]
        MonAPI[/api/monetization/*]
        DevAPI[/api/developer/*]
        ObsAPI[/api/observability/*]
        CronAPI[/api/cron/collect-metrics]
    end
    
    subgraph "Tenant App Functions"
        LeadsAPI[/api/leads/*]
        OppsAPI[/api/opportunities/*]
        OrgsAPI[/api/organizations/*]
        AuthAPI[/api/auth/*]
    end
    
    subgraph "Vercel Edge Network"
        EdgeFunc[Edge Functions]
        Middleware[Middleware]
    end
    
    FedAPI --> EdgeFunc
    MonAPI --> EdgeFunc
    LeadsAPI --> EdgeFunc
    OppsAPI --> EdgeFunc
    
    EdgeFunc --> Middleware
    Middleware -->|Rate Limit| RateLimit[Rate Limiting]
    Middleware -->|Auth| AuthCheck[Authentication]
    Middleware -->|Audit| AuditLog[Audit Logging]
    
    style EdgeFunc fill:#000,color:#fff
```

## Cron Jobs

```mermaid
graph LR
    Vercel[Vercel Cron] -->|Every 15 min| Metrics[Collect Metrics]
    
    Metrics --> FedMetrics[Federation Metrics]
    Metrics --> MonMetrics[Monetization Metrics]
    Metrics --> APIMetrics[API Usage Metrics]
    
    FedMetrics --> DB[(Database)]
    MonMetrics --> DB
    APIMetrics --> DB
    
    style Vercel fill:#000,color:#fff
    style DB fill:#336791,color:#fff
```

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (`npm run test`)
- [ ] TypeCheck passing (`npm run typecheck`)
- [ ] Lint passing (`npm run lint`)
- [ ] No uncommitted changes
- [ ] Environment variables set in Vercel
- [ ] DATABASE_URL configured for production

### Post-Deployment
- [ ] Check deployment status in Vercel dashboard
- [ ] Review build logs for errors or warnings
- [ ] Verify deployment URLs load correctly
- [ ] Check Vercel function logs for runtime errors
- [ ] Confirm Prisma migrations ran successfully
- [ ] Test critical user flows
- [ ] Monitor error rates in Vercel Analytics

## Rollback Strategy

```mermaid
graph TB
    Issue[Production Issue Detected] --> Identify[Identify Problem Deployment]
    Identify --> Rollback[Rollback to Previous Deployment]
    
    Rollback --> VercelUI[Vercel Dashboard]
    VercelUI --> SelectPrev[Select Previous Deployment]
    SelectPrev --> Promote[Promote to Production]
    
    Promote --> Verify[Verify Rollback]
    Verify --> Monitor[Monitor for Issues]
    
    Monitor -->|Issues Resolved| Success[Rollback Successful]
    Monitor -->|Issues Persist| Investigate[Investigate Further]
    
    style Issue fill:#ef4444,color:#fff
    style Success fill:#10b981,color:#fff
```

## Monitoring & Observability

```mermaid
graph TB
    subgraph "Vercel Analytics"
        WebVitals[Web Vitals]
        RealUserMetrics[Real User Monitoring]
        ErrorTracking[Error Tracking]
    end
    
    subgraph "Custom Dashboards"
        FedDash[Federation Dashboard]
        MonDash[Monetization Dashboard]
        APIDash[API Usage Dashboard]
    end
    
    subgraph "Alerts"
        ErrorAlerts[Error Rate Alerts]
        PerformanceAlerts[Performance Alerts]
        UptimeAlerts[Uptime Alerts]
    end
    
    WebVitals --> RealUserMetrics
    RealUserMetrics --> ErrorTracking
    
    FedDash --> APIDash
    MonDash --> APIDash
    
    ErrorTracking --> ErrorAlerts
    WebVitals --> PerformanceAlerts
    RealUserMetrics --> UptimeAlerts
    
    style ErrorAlerts fill:#ef4444,color:#fff
    style PerformanceAlerts fill:#f59e0b,color:#fff
    style UptimeAlerts fill:#10b981,color:#fff
```

