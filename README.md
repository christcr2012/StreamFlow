# Cortiware

**Cortiware** is an AI-powered multi-tenant platform for service businesses, featuring industry-specific AI agents, automation tools, and vertical-specific feature packs. Built by Robinson AI Systems.

## 🚀 Quick Start

```powershell
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Generate Prisma clients
npm run db:generate

# Start development servers
npm run dev
```

Visit:

- **Tenant App**: http://localhost:3000
- **Provider Portal**: http://localhost:3001
- **Marketing (Cortiware)**: http://localhost:3002
- **Marketing (Robinson)**: http://localhost:3003

## 📚 Documentation

- **[Phase Automation Workflow](docs/PHASE_AUTOMATION_WORKFLOW.md)** - **READ THIS FIRST** for development workflow
- **[Quick Start Guide](docs/QUICK_START.md)** - Get up and running quickly
- **[Architecture Overview](docs/ARCH_MONOREPO.md)** - Understand the monorepo structure
- **[Build & Deploy Guide](docs/BUILD_AND_DEPLOY_GUIDE.md)** - Build and deployment instructions
- **[AI Agent Reference](docs/AI_AGENT_REFERENCE.md)** - Essential context for AI agents working on this codebase
- **[Documentation Index](docs/INDEX.md)** - Complete documentation index

## 🏗️ Project Structure

```
Cortiware/
├── apps/
│   ├── tenant-app/          # Client-facing tenant portal
│   ├── provider-portal/      # Provider administration portal
│   ├── marketing-cortiware/  # Marketing site for Cortiware product
│   └── marketing-robinson/   # Marketing site for Robinson AI Systems
├── packages/
│   ├── auth-service/         # Shared authentication system
│   ├── db/                   # Shared database utilities & error handlers
│   ├── kv/                   # Key-value store (Vercel KV wrapper)
│   ├── ui/                   # Shared UI components
│   ├── themes/               # Theme system with 15+ premium themes
│   ├── verticals/            # Industry-specific vertical packs
│   ├── agreements/           # Agreement & contract management
│   ├── wallet/               # Settlement & wallet system
│   └── routing/              # Route optimization for roll-off/dumpster
├── prisma/
│   └── schema.prisma         # Tenant-app database schema
├── apps/provider-portal/prisma/
│   └── schema.prisma         # Provider-portal database schema (separate DB)
├── docs/                     # Comprehensive documentation
└── scripts/                  # Build, deployment, and automation scripts
```

## 🔑 Key Features

### Multi-Tenant Architecture

- **Separate databases**: Tenant-app and provider-portal use isolated databases
- **Dual Prisma clients**: `@prisma/client-tenant` and `@prisma/client-provider`
- **White-label branding**: Per-tenant customization via theme system

### Vertical-Specific Features

- **Cleaning**: Contracts, inspections, billing, scheduling
- **Roll-Off/Dumpster**: Route optimization, landfill management, driver dispatch
- **Port-a-John**: Service scheduling, route optimization
- **HVAC, Fencing, Concrete Leveling**: Preview/Early Access

### AI-Powered Features

- **AI Concierge**: Natural language assistance for tenants
- **Lead Scoring**: Auto-enrichment and prioritization
- **RFP Analysis**: Automated proposal analysis
- **Cost Management**: Budget alerts and usage tracking

### Provider Tools

- **Federation Management**: Multi-provider integrations with OIDC
- **Revenue Intelligence**: Forecasting and analytics
- **Compliance Dashboard**: Security metrics and audit trails
- **API Usage & Rate Limiting**: Tenant API usage monitoring
- **Monetization**: Plans, pricing, coupons, offers management

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router) + React Server Components
- **Language**: TypeScript (strict mode)
- **Database**: Neon Postgres (pooled connections via Prisma)
- **Monorepo**: Turborepo with npm workspaces
- **Styling**: Tailwind CSS + CSS Custom Properties (theme system)
- **Authentication**: Custom SSO with TOTP/2FA, nonce replay protection (Redis/KV)
- **Deployment**: Vercel (per-app projects)
- **CI/CD**: GitHub Actions + CircleCI
- **Testing**: Playwright (E2E), Jest/Vitest (unit), Pact (contract)

## 📦 Package Scripts

```powershell
# Development
npm run dev                  # Start all apps in dev mode
npm run dev --workspace=tenant-app  # Start specific app

# Build
npm run build                # Build all apps
npm run vercel-build         # Build for Vercel deployment

# Type Checking & Linting
npm run typecheck            # Check TypeScript across all packages
npm run lint                 # Lint all packages
npm run lint:fix             # Auto-fix lint issues

# Database
npm run db:generate          # Generate Prisma clients
npm run db:migrate           # Run Prisma migrations
npm run db:push              # Push schema changes to dev DB
npm run db:seed              # Seed database with test data
npm run db:studio            # Open Prisma Studio

# Testing
npm run test                 # Run unit tests
npm run test:e2e             # Run Playwright E2E tests

# Placeholders & Code Quality
npm run ci:placeholders      # Check for actionable placeholders (gate at 0)
```

## 🔐 Environment Variables

See [.env.example](.env.example) for required environment variables. Key variables:

- **DATABASE_URL**: Neon Postgres connection (tenant schema)
- **PROVIDER_DATABASE_URL**: Provider portal database (separate)
- **KV\_\*** or **VERCEL*KV*\***: Vercel KV (Redis) for nonce store & caching
- **NEXT_PUBLIC_PROVIDER_URL**: Provider portal URL for SSO redirects
- **ENCRYPTION_MASTER_KEY**: AES-256 encryption key for sensitive data
- **OPENAI_API_KEY**: OpenAI API for AI features
- **NEON_API_KEY** / **NEON_PROJECT_ID**: Neon API for cost tracking

## 🚢 Deployment

### Vercel (Production)

Each app has its own Vercel project:

1. **tenant-app** → app.cortiware.com
2. **provider-portal** → provider.robinsonaisystems.com
3. **marketing-cortiware** → www.cortiware.com
4. **marketing-robinson** → www.robinsonaisystems.com

See [docs/README_DEPLOYMENT.md](docs/README_DEPLOYMENT.md) for detailed deployment instructions.

### Local Build Testing

```powershell
# Test local builds (no DATABASE_URL required)
npm run vercel-build

# Verify placeholder gate
npm run ci:placeholders
```

**Important**: Local builds use build-time guards to handle missing `DATABASE_URL`. Vercel builds populate real data using environment variables from project settings. See [BUILD_TIME_DATA_FETCH_GUARDS.md](BUILD_TIME_DATA_FETCH_GUARDS.md) for details.

## 🧪 Testing

```powershell
# Unit tests
npm run test

# E2E tests (requires deployed apps)
npm run test:e2e

# Type checking
npm run typecheck
```

## 📖 Contributing

1. **Check Documentation First**: See [docs/](docs/) for architecture, guides, and references
2. **Follow Patterns**: Use existing patterns for auth, data fetching, error handling
3. **Build-Time Guards**: Always guard async server components that fetch data (see BUILD_TIME_DATA_FETCH_GUARDS.md)
4. **Placeholder Policy**: Use `PLACEHOLDER_block_[service]` format; keep actionable count at 0
5. **Type Safety**: Maintain strict TypeScript compliance (`npm run typecheck`)

## 🐛 Troubleshooting

### Build Errors

- **Prisma errors during build**: This is expected locally without `DATABASE_URL`. Build-time guards ensure pages render with empty data.
- **TypeScript errors**: Run `npm run typecheck` to see all errors
- **Missing dependencies**: Run `npm install` from root

### Database Issues

- **Prisma client not found**: Run `npm run db:generate`
- **Migration conflicts**: See [docs/BUILD_AND_DEPLOY_GUIDE.md](docs/BUILD_AND_DEPLOY_GUIDE.md)

### Environment Variables

- **Missing env vars**: Copy `.env.example` to `.env.local` and configure
- **KV connection errors**: Ensure Vercel KV is set up or use fallback in-memory store

## 📝 License

Proprietary - Robinson AI Systems

## 🔗 Links

- **Cortiware**: https://www.cortiware.com
- **Robinson AI Systems**: https://www.robinsonaisystems.com
- **Documentation**: [docs/INDEX.md](docs/INDEX.md)
- **API Reference**: [docs/API_REFERENCE.md](docs/API_REFERENCE.md)

---

**Built with ❤️ by Robinson AI Systems**
