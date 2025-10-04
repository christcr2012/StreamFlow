---
description: Repository Information Overview
alwaysApply: true
---

# StreamFlow Information

## Summary
StreamFlow is a multi-tenant Next.js application designed for service business management with comprehensive features including user management, workflow automation, and enterprise-grade database architecture. The application uses a PostgreSQL database with Prisma ORM and implements PWA capabilities.

## Structure
- **src/app**: Next.js App Router components and pages
- **src/components**: Reusable React components
- **src/config**: System configuration and feature flags
- **src/lib**: Core utilities and services
- **src/middleware**: Request middleware for authentication, auditing, etc.
- **src/pages**: Next.js Pages Router components (API routes)
- **src/server**: Server-side logic and services
- **src/webhooks**: Webhook handlers for external integrations
- **src/workers**: Background processing workers
- **prisma**: Database schema and migrations
- **scripts**: Build and utility scripts
- **public**: Static assets for the web application
- **tests**: Test files for the application

## Language & Runtime
**Language**: TypeScript
**Version**: Node.js 22.x
**Framework**: Next.js 15.1.0
**Build System**: npm
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- Next.js 15.1.0 (React framework)
- Prisma 6.16.2 (ORM for PostgreSQL)
- React 18.3.1 (UI library)
- Zod 3.23.8 (Schema validation)
- Tailwind CSS 3.4.10 (Styling)
- next-pwa 5.6.0 (Progressive Web App support)
- OpenTelemetry (Observability)
- Stripe (Payment processing)
- OpenAI (AI integration)
- Twilio (Communication)
- SendGrid (Email)

**Development Dependencies**:
- TypeScript 5.9.2
- ESLint 9.36.0
- Cross-env 10.1.0
- TSX 4.20.5

## Build & Installation
```bash
# Install dependencies
npm install

# Development
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type checking
npm run typecheck
```

## Database
**Type**: PostgreSQL
**ORM**: Prisma 6.16.2
**Schema**: Multi-tenant with orgId-based isolation
**Migration**: `prisma migrate deploy`
**Seeding**: `npm run seed`

## PWA Configuration
**Framework**: next-pwa 5.6.0
**Cache Strategy**: Hybrid (StaleWhileRevalidate/CacheFirst)
**Offline Support**: Enabled
**Installation**: Automatic registration

## Testing
**Framework**: Jest (implied from test files)
**Test Location**: /tests directory
**Naming Convention**: test-*.test.ts
**Run Command**: Not explicitly defined in package.json

## Middleware
**Authentication**: Token-based authentication with audience verification
**Authorization**: Role-based access control with fine-grained permissions
**Cost Guard**: Credit-based system for metering API usage
**Rate Limiting**: Protection against excessive API requests
**Idempotency**: Ensures duplicate requests are handled safely

## Binder System
**Purpose**: Code generation system for implementing features
**Location**: External binder files in OneDrive (C:/Users/chris/OneDrive/Desktop/binderfiles)
**Processing**: Custom orchestration scripts in /scripts directory
**Pattern Detection**: Identifies API specifications and generates code
**Implementation**: Sequential processing of binder files to generate code
**Orchestration**: `npm run binders:run` executes the binder-orchestrator-new.js script