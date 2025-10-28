# Changelog

All notable changes to the Cortiware platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Root README.md with comprehensive project overview
- CONTRIBUTING.md with development workflow and coding standards
- CHANGELOG.md for tracking releases

### Changed

- Build-time data fetch guards for local/Vercel parity (2025-01-27)

## [0.9.0] - 2025-01-27 - Build Parity & Production Readiness

### Added

- **Build-Time Data Fetch Guards**: 14 pages now handle missing DATABASE_URL gracefully
  - 7 newly guarded pages: compliance, metrics, infrastructure, billing, pricing (3 pages)
  - 7 verified existing guards: branding, provisioning, tenant-health, leads, subscriptions, api-usage, revenue
- **Documentation**:
  - `BUILD_TIME_DATA_FETCH_GUARDS.md`: Comprehensive pattern guide
  - `SESSION_2025-10-27_BUILD_PARITY_FIX.md`: Complete session summary
  - Updated `BUILD_AND_DEPLOY_GUIDE.md` with guard references

### Fixed

- **Critical**: Local builds now succeed without DATABASE_URL
- **Critical**: Eliminated "works locally but breaks on Vercel" issues
- TypeScript errors in compliance page (proper type imports)
- Prisma initialization errors replaced with clear console logs

### Validated

- ✅ Build success: Tasks 12/12 successful
- ✅ TypeScript: Tasks 15/15 successful
- ✅ Placeholder gate: 0 actionable (117 legitimately blocked)
- ✅ Tenant-app builds successfully

## [0.8.0] - 2025-01 - Operating Procedures & Placeholder System

### Added

- **Intelligent Placeholder Detection System**:
  - Automated scanning for actionable vs. blocked placeholders
  - CI/CD integration with GitHub issue creation
  - `PLACEHOLDER_block_[service]` format for external service dependencies
  - Gate at 0 actionable placeholders
- **Operating Procedures**: Phases 0-3 implementation complete
  - Phase 0: Schema audit and slice planning
  - Phase 0.5: Foundations
  - Phases 1-3: Feature implementation

### Changed

- Placeholder format standardized across codebase
- CI/CD pipeline includes placeholder checks

## [0.7.0] - 2024-12 - Federation & Provider Portal

### Added

- **Federation Management v3+**:
  - OIDC dual-mode authentication
  - HMAC signature verification
  - Rate limiting with Redis backend
  - Idempotency support
  - Audit logging system
  - Webhook registration and delivery
- **Provider Portal Features**:
  - Revenue intelligence & forecasting
  - API usage & rate limit management
  - Compliance & security dashboard
  - Tenant provisioning workflows
  - White-label management
  - Support & incident management
- **Monetization System**:
  - Marketing pricing plans with draft→review→publish workflow
  - Dynamic pricing with ISR
  - Coupons and offers
  - Tenant overrides
  - Global configuration
  - Onboarding invites

### Changed

- Separated provider-portal to use dedicated database
- Enhanced RBAC enforcement across all provider routes

## [0.6.0] - 2024-11 - AI Features & Vertical Packs

### Added

- **AI-Powered Features**:
  - AI Concierge for natural language assistance
  - Lead scoring with auto-enrichment
  - RFP analysis with automated insights
  - AI cost management and budget alerts
  - Usage tracking and analytics
- **Vertical Packs**:
  - Cleaning vertical: contracts, inspections, billing, scheduling
  - Roll-off/Dumpster: route optimization, landfill management
  - Port-a-John: service scheduling
  - HVAC, Fencing, Concrete Leveling (preview)
- **Import Wizard**:
  - AI-powered data import with validation
  - Multi-format support (CSV, Excel, JSON)
  - Batch processing
  - Error reporting and recovery

### Changed

- Enhanced database schema with AI-related models
- Performance optimizations for AI API calls (batching, caching)

## [0.5.0] - 2024-10 - Monorepo Migration

### Added

- **Turborepo Monorepo Structure**:
  - 4 apps: tenant-app, provider-portal, marketing-cortiware, marketing-robinson
  - 12+ shared packages
  - Unified build pipeline
- **Dual Prisma Clients**:
  - `@prisma/client-tenant` for tenant-app
  - `@prisma/client-provider` for provider-portal
- **Shared Packages**:
  - `@cortiware/auth-service`: Unified authentication
  - `@cortiware/themes`: 15+ premium themes
  - `@cortiware/ui`: Shared component library
  - `@cortiware/verticals`: Industry-specific features
  - `@cortiware/routing`: Route optimization
  - `@cortiware/agreements`: Contract management
  - `@cortiware/wallet`: Settlement system

### Changed

- Migrated from single Next.js app to monorepo
- Vercel deployment: separate projects per app
- Build and deployment workflows optimized

## [0.4.0] - 2024-09 - Theme System & Mobile UX

### Added

- **Premium Theme System**:
  - 15+ premium themes (dark/light variants)
  - CSS custom properties for runtime theming
  - Theme switcher in all portal settings
  - System preference detection
- **Mobile Optimizations**:
  - Responsive tables with card layouts
  - Touch gestures (swipe-to-delete, pull-to-refresh)
  - Optimized forms for mobile input
  - Bottom sheet modals
  - Progressive enhancement

### Changed

- All UI components now theme-aware
- Enhanced mobile experience across all pages

## [0.3.0] - 2024-08 - Authentication & Security

### Added

- **Unified Authentication System**:
  - SSO with TOTP/2FA support
  - Nonce replay protection (Redis/KV)
  - Automated breakglass recovery
  - JWT-based auth tickets
- **Security Features**:
  - Encryption for sensitive data (AES-256)
  - HMAC authentication for federation
  - Rate limiting middleware
  - Audit logging with PII redaction
  - Secret rotation automation

### Changed

- Consolidated auth logic into `@cortiware/auth-service`
- Enhanced session management with Redis

## [0.2.0] - 2024-07 - Core CRM & Tenant Features

### Added

- **CRM System**:
  - Leads management with AI scoring
  - Opportunities tracking
  - Organizations/customers
  - Contact management
  - Lead-to-opportunity conversion
- **Tenant Portal**:
  - Dashboard with KPIs
  - Jobs management
  - Invoicing with PDF generation
  - Recurring invoices
  - Payment processing (Stripe integration)
  - Job photo upload (Vercel Blob)
  - Real-time updates (SSE)

### Changed

- Enhanced database schema with CRM models
- Improved API error handling

## [0.1.0] - 2024-06 - Initial Release

### Added

- **Foundation**:
  - Next.js 15 with App Router
  - Neon Postgres database
  - Prisma ORM
  - Basic tenant management
  - Provider portal skeleton
  - Marketing sites (Cortiware, Robinson AI Systems)
- **Infrastructure**:
  - CI/CD with GitHub Actions and CircleCI
  - Vercel deployment configuration
  - Environment variable management
  - Basic monitoring and logging

---

## Version History Summary

- **0.9.0**: Build parity & production readiness ← Current
- **0.8.0**: Operating procedures & placeholder system
- **0.7.0**: Federation & provider portal
- **0.6.0**: AI features & vertical packs
- **0.5.0**: Monorepo migration
- **0.4.0**: Theme system & mobile UX
- **0.3.0**: Authentication & security
- **0.2.0**: Core CRM & tenant features
- **0.1.0**: Initial release

## Semantic Versioning

We use [SemVer](https://semver.org/) for versioning:

- **MAJOR** (0.x.0): Breaking changes
- **MINOR** (x.1.0): New features (backward-compatible)
- **PATCH** (x.x.1): Bug fixes (backward-compatible)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and guidelines.

## Links

- **Repository**: Internal
- **Documentation**: [docs/INDEX.md](docs/INDEX.md)
- **Issue Tracker**: GitHub Issues
- **Website**: https://www.cortiware.com

---

**Maintained by Robinson AI Systems**
