# Mountain Vista - Lead Management & Billing System

## Overview

Mountain Vista is a comprehensive lead management and billing platform built for service businesses, particularly focusing on janitorial and cleaning companies. The system handles lead generation, scoring, conversion tracking, and automated billing for converted leads. It features integration with external data sources (SAM.gov for RFP imports), Stripe for payment processing, and includes role-based access control (RBAC) for multi-user organizations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 15 with Pages Router (TypeScript)
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: SWR for data fetching and client-side state
- **Authentication**: Cookie-based session management (`mv_user` cookie)
- **UI Components**: Custom components with a dark theme design system

### Backend Architecture
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: bcryptjs for password hashing, cookie-based sessions
- **Authorization**: Custom RBAC system with roles and permissions
- **Lead Scoring**: Configurable AI scoring system based on geography, service types, and source
- **Billing**: Conversion-based billing system with automated invoice generation

### Database Design
- **Core Entities**: Organizations, Users, Leads, Customers, Opportunities
- **RBAC System**: Roles, Permissions, and User-Role assignments
- **Billing System**: Invoices, Payments, Ledger entries for financial tracking
- **Audit Logging**: Complete audit trail for all system actions
- **Lead Management**: Comprehensive lead tracking with deduplication and scoring

### Key Features
1. **Lead Management**: Import, score, track, and convert leads
2. **RFP Integration**: Automated import from SAM.gov for government contracts
3. **Billing System**: Automated billing for converted leads with Stripe integration
4. **Multi-tenant**: Organization-based data isolation
5. **Role-based Access**: Granular permissions system
6. **Provider Federation**: Framework for cross-instance provider portal integration

### Data Flow Patterns
- **Lead Ingestion**: External sources → Deduplication → Scoring → Storage
- **Conversion Tracking**: Lead status changes → Billing eligibility → Invoice generation
- **User Management**: RBAC permissions → API endpoint authorization → UI feature gating

### Security Model
- **Authentication**: Email/password with secure password hashing
- **Session Management**: HttpOnly cookies with configurable security flags
- **Authorization**: Permission-based access control at API level
- **Data Isolation**: Organization-scoped queries prevent cross-tenant data access
- **Federation Security**: HMAC-signed requests for provider portal integration

## External Dependencies

### Database & ORM
- **PostgreSQL**: Primary data store (configured via DATABASE_URL)
- **Prisma**: Database toolkit and ORM for schema management and queries
- **Connection Pooling**: Supports pgbouncer for production scaling

### Payment Processing
- **Stripe**: Payment processing and invoice management
  - Secret key for server-side operations
  - Publishable key for client-side operations
  - Webhook endpoint for payment status updates

### External APIs
- **SAM.gov**: Government contracting data for RFP imports
- **SendGrid**: Email delivery service for notifications
- **Twilio**: SMS/voice communication services

### Development & Build Tools
- **TypeScript**: Type safety and developer experience
- **ESLint**: Code quality and consistency
- **Tailwind CSS**: Utility-first styling framework
- **tsx**: TypeScript execution for scripts and development

### Runtime Environment
- **Node.js 22.x**: Runtime environment
- **Vercel**: Deployment platform with cron job support for automated billing
- **Environment Variables**: Secure configuration for API keys and database connections