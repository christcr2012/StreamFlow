# WorkStream - Business Operating System for Service Companies

## Overview
WorkStream is a multi-industry enterprise operating system for service businesses, offering configurable lead generation, AI-powered triage, professional estimation/bidding, contract management, robust inventory control, and automated billing. Built with a verticalization framework that adapts to ANY service industry - from cleaning and HVAC to fencing and electrical work. It integrates with SAM.gov for RFP imports and Stripe for payments, featuring robust role-based access control. The platform aims to be a leading enterprise business operating system, providing high ROI for StreamCore providers who manage and scale deployments. The business vision is to achieve $10M ARR within 24 months, transforming from a proven MVP to a board-ready, enterprise-grade solution through systematic hardening, compliance, and market expansion.

## User Preferences

Preferred communication style: Simple, everyday language.

**Environment Variable Management:**
- Use Replit secrets for convenience while working in Replit
- Manually maintain .env file for cross-platform compatibility (GitHub/Vercel/Neon workflow)
- CRITICAL: Never clear, delete, or modify the .env file - user manages this manually
- Dual approach provides both Replit convenience and external development portability

## Multi-Industry Platform Architecture

### Industry Verticalization Framework
- **IndustryPack System**: Configurable templates, workflows, and catalogs per industry
- **Capability Registry**: Dynamic feature enabling based on industry needs
- **JSON Schema Configuration**: Industry-specific forms, checklists, and workflows
- **NAICS/SIC Integration**: Proper industry classification and compliance

### Professional Service Tools
- **Estimation Engine**: Configurable catalogs, rate cards, formula DSL, takeoff import
- **Contract Management**: Industry-specific templates, e-signatures, automated work orders
- **Advanced Inventory**: Multi-location tracking (warehouse/vehicle/site), BOM, consumption
- **Mobile Field Operations**: QR scanning, offline functionality, real-time updates
- **Dynamic Workflows**: Configurable work orders, checklists, inspections per industry

## System Architecture

### Frontend
- **Framework**: Next.js 15 (Pages Router, TypeScript)
- **Styling**: Tailwind CSS with custom CSS variables (dark theme)
- **State Management**: SWR
- **Authentication**: Cookie-based session management (`ws_user` cookie)

### Backend
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: bcryptjs, cookie-based sessions
- **Authorization**: Custom RBAC system
- **Lead Scoring**: Configurable AI-driven system
- **Billing**: Conversion-based, automated invoice generation

### Database Design
- **Core Entities**: Organizations, Users, Leads, Customers, Opportunities
- **RBAC System**: Roles, Permissions, User-Role assignments
- **Billing System**: Invoices, Payments, Ledger entries
- **Audit Logging**: Comprehensive audit trail
- **Lead Management**: Tracking, deduplication, scoring

### Key Features
- **Lead Generation**: Free sources, SAM.gov API integration
- **Billing System**: Automated, Stripe integration
- **AI-Powered Lead Scoring**: Prioritization based on various factors
- **Multi-tenant**: Organization-based data isolation
- **Role-based Access**: Granular permissions
- **StreamCore Federation**: Cross-instance provider portal integration
- **Business Model**: Conversion-based billing ($100/converted lead), AI costs capped at $50/month, supports Relationship-valued and Job-valued leads
- **Employee Referral System**: Direct payments, anti-fraud protection

### Security Model
- **Authentication**: Email/password, secure hashing
- **Session Management**: HttpOnly cookies
- **Authorization**: Permission-based, API-level
- **Data Isolation**: Organization-scoped queries
- **Federation Security**: HMAC-signed requests

### Enterprise Roadmap
- **Compliance**: SOC 2 Type II certification, GDPR, data retention policies, DLP, key management, vendor risk management, incident response framework.
- **Performance**: SLOs for 99.9% uptime and <200ms API response, error budget management, capacity planning for 16x growth.
- **Testing**: Load, stress, spike, endurance testing; automated unit, integration, and E2E tests.
- **Technology Milestones**: Foundation, Hardening, Compliance, Scale, Enterprise phases including SSO, MFA, advanced monitoring, multi-region deployment, AI/ML optimization, and predictive analytics.

## External Dependencies

### Database & ORM
- **PostgreSQL**: Primary data store
- **Prisma**: ORM

### Payment Processing
- **Stripe**: Payment processing, invoice management

### External APIs
- **SAM.gov**: Government contracting data
- **SendGrid**: Email delivery
- **Twilio**: SMS/voice communication

### Development & Build Tools
- **TypeScript**: Language
- **ESLint**: Code quality
- **Tailwind CSS**: Styling
- **tsx**: TypeScript execution

### Runtime Environment
- **Node.js 22.x**: Runtime
- **Vercel**: Deployment platform