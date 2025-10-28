# Cortiware Documentation Index
**Last Updated:** 2025-10-12
**Total Documents:** 120+ files
**Status:** ✅ Current

---

> Reference and Archival Policy
>
> - Codebase is the source of truth; documents are supportive.
> - Execute/* (Binder System) is reference-only; do not execute binders.
> - Outdated docs are moved to docs/archive and marked as Historical.
> - Use docs/AI_AGENT_REFERENCE.md for the operative rules and build policy.


## Quick Navigation

- [🚀 Getting Started](#getting-started)
- [🏗️ Architecture](#architecture)
- [📋 Implementation Reports](#implementation-reports)
- [📅 Planning & Roadmap](#planning--roadmap)
- [🚢 Deployment & CI/CD](#deployment--cicd)
- [🔐 Security & Federation](#security--federation)
- [📚 API Documentation](#api-documentation)
- [📖 Guides & References](#guides--references)
- [🧪 Testing](#testing)
- [📦 Execute Directory (Binder System)](#execute-directory-binder-system)

---

## 🚀 Getting Started

**New to Cortiware? Start here:**

| Document | Description | Status |
|----------|-------------|--------|
| [QUICK_START.md](QUICK_START.md) | Environment setup, local development, testing, deployment | ✅ Current |
| [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md) | Complete system architecture and design patterns | ✅ Current |
| [AI_AGENT_REFERENCE.md](AI_AGENT_REFERENCE.md) | Build system rules, common mistakes, debugging workflow | ✅ Current |
| [VERCEL_BUILD_GUIDE.md](VERCEL_BUILD_GUIDE.md) | Vercel-specific build configuration and troubleshooting | ✅ Current |

---

## 🏗️ Architecture

### Core Architecture Documents

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md) | Monorepo topology, runtime surfaces, auth model, data layer | 2025-10-10 | ✅ Current |
| [ARCH_MONOREPO.md](ARCH_MONOREPO.md) | Turborepo configuration and workspace setup | 2025-10-09 | ✅ Current |
| [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md) | Key architectural decisions and rationale | 2025-10-09 | ✅ Current |

### Specialized Architecture

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [architecture/DUAL_PRISMA_SCHEMA.md](architecture/DUAL_PRISMA_SCHEMA.md) | Dual Prisma schema architecture (tenant-app vs provider-portal) | 2025-10-10 | ✅ Current |
| [MONOREPO_STRUCTURE.md](MONOREPO_STRUCTURE.md) | Detailed monorepo structure and package organization | 2025-10-09 | ✅ Current |
| [DOMAIN_MODELS.md](DOMAIN_MODELS.md) | Domain models and entity relationships | 2025-10-09 | 📋 Reference |

---

## 📋 Implementation Reports

### Provider Portal (100% Complete)

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [HANDOFF_PROVIDER_PORTAL_2025-10-10.md](HANDOFF_PROVIDER_PORTAL_2025-10-10.md) | Complete handoff for Provider Portal Strategic Enhancement Plan | 2025-10-12 | ✅ Current |
| [PROVIDER_PORTAL_COMPLETE_IMPLEMENTATION_2025-10-10.md](PROVIDER_PORTAL_COMPLETE_IMPLEMENTATION_2025-10-10.md) | Final implementation report for all phases | 2025-10-12 | ✅ Current |
| [PROVIDER_PORTAL_IMPLEMENTATION_PLAN.md](PROVIDER_PORTAL_IMPLEMENTATION_PLAN.md) | Original enhancement plan | 2025-10-10 | 📋 Reference |
| [PROVIDER_PORTAL_PHASE_1_COMPLETE.md](PROVIDER_PORTAL_PHASE_1_COMPLETE.md) | Phase 1 completion report | 2025-10-10 | 📋 Reference |
| [PROVIDER_PORTAL_PHASE_2_COMPLETE.md](PROVIDER_PORTAL_PHASE_2_COMPLETE.md) | Phase 2 completion report | 2025-10-10 | 📋 Reference |
| [PROVIDER_PORTAL_PHASE_3_COMPLETE.md](PROVIDER_PORTAL_PHASE_3_COMPLETE.md) | Phase 3 completion report | 2025-10-10 | 📋 Reference |

### CRM Implementation (100% Complete)

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [CRM_IMPLEMENTATION_STATUS.md](CRM_IMPLEMENTATION_STATUS.md) | Complete CRM feature implementation status | 2025-10-09 | ✅ Current |
| [IMPORT_WIZARD_IMPLEMENTATION.md](IMPORT_WIZARD_IMPLEMENTATION.md) | Import wizard feature documentation | 2025-10-09 | ✅ Current |
| [IMPORT_WIZARD_USER_GUIDE.md](IMPORT_WIZARD_USER_GUIDE.md) | User guide for import wizard | 2025-10-09 | ✅ Current |

### Federation & Security

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [FEDERATION_V3_IMPLEMENTATION_REPORT.md](FEDERATION_V3_IMPLEMENTATION_REPORT.md) | Federation implementation details | 2025-10-09 | ✅ Current |
| [federation/api-contracts.md](federation/api-contracts.md) | API contract specifications | 2025-10-09 | ✅ Current |

### System Audits

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [DOCUMENTATION_AUDIT_REPORT_2025-10-12.md](DOCUMENTATION_AUDIT_REPORT_2025-10-12.md) | Comprehensive documentation audit and system state | 2025-10-12 | ✅ Current |
| [COMPREHENSIVE_SYSTEM_AUDIT_2025-10-10.md](COMPREHENSIVE_SYSTEM_AUDIT_2025-10-10.md) | Historical audit - all issues resolved | 2025-10-12 | 📋 Historical |
| [AUDIT_REPORT.md](AUDIT_REPORT.md) | General audit report | 2025-10-09 | 📋 Reference |

---

## 📅 Planning & Roadmap

### Master Planning Documents

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [planning/ROADMAP.md](planning/ROADMAP.md) | Master roadmap for remaining phases | 2025-10-09 | ✅ Current |
| [planning/HANDOFF.md](planning/HANDOFF.md) | General handoff procedures | 2025-10-09 | ✅ Current |
| [planning/ALL_PHASES_COMPLETE.md](planning/ALL_PHASES_COMPLETE.md) | Phase completion tracking | 2025-10-10 | ✅ Current |
| [planning/IMPLEMENTATION_CHECKLISTS.md](planning/IMPLEMENTATION_CHECKLISTS.md) | Per-phase executable checklists | 2025-10-09 | ✅ Current |

### Phase-Specific Planning

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [PHASE_1_PLAN.md](PHASE_1_PLAN.md) | Phase 1 planning document | 2025-10-09 | 📋 Reference |
| [PHASE_2_PLAN.md](PHASE_2_PLAN.md) | Phase 2 planning document | 2025-10-09 | 📋 Reference |
| [planning/phase-*.md](planning/) | Individual phase plans (1-7) | 2025-10-09 | 📋 Reference |

---

## 🚢 Deployment & CI/CD

### Deployment Guides

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [VERCEL_BUILD_GUIDE.md](VERCEL_BUILD_GUIDE.md) | Vercel-specific build configuration and troubleshooting | 2025-10-12 | ✅ Current |
| [deployment/ENVIRONMENT_VARIABLES.md](deployment/ENVIRONMENT_VARIABLES.md) | Complete list of required environment variables | 2025-10-09 | ✅ Current |
| [deployment/VERCEL_DEPLOYMENT.md](deployment/VERCEL_DEPLOYMENT.md) | Vercel deployment procedures | 2025-10-09 | ✅ Current |
| [deployment/DEPLOYMENT_CHECKLIST.md](deployment/DEPLOYMENT_CHECKLIST.md) | Pre-deployment checklist | 2025-10-09 | ✅ Current |

### CI/CD Documentation

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [CI_CD_GUIDELINES.md](CI_CD_GUIDELINES.md) | CI/CD best practices | 2025-10-09 | ✅ Current |
| [CI_CD_STRATEGY.md](CI_CD_STRATEGY.md) | Overall CI/CD strategy | 2025-10-09 | ✅ Current |
| [CI_CD_FIX_SUMMARY.md](CI_CD_FIX_SUMMARY.md) | Historical CI/CD fixes | 2025-10-09 | 📋 Reference |
| [GITHUB_ACTIONS_GUIDE.md](GITHUB_ACTIONS_GUIDE.md) | GitHub Actions workflow documentation | 2025-10-09 | ✅ Current |

### Migration & Runbooks

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [MIGRATION_RUNBOOK.md](MIGRATION_RUNBOOK.md) | Data migration procedures | 2025-10-09 | ✅ Current |
| [runbooks/EMERGENCY_PROCEDURES.md](runbooks/EMERGENCY_PROCEDURES.md) | Emergency response procedures | 2025-10-09 | ✅ Current |

---

## 🔐 Security & Federation

### Security Documentation

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [security/EMERGENCY_ACCESS_RUNBOOK.md](security/EMERGENCY_ACCESS_RUNBOOK.md) | Emergency access procedures | 2025-10-09 | ✅ Current |
| [security/SECRET_ROTATION_COMPLETE.md](security/SECRET_ROTATION_COMPLETE.md) | Secret rotation documentation | 2025-10-09 | ✅ Current |
| [security/RBAC_PERMISSIONS.md](security/RBAC_PERMISSIONS.md) | RBAC permissions reference | 2025-10-10 | ✅ Current |
| [security/AUTHENTICATION.md](security/AUTHENTICATION.md) | Authentication architecture | 2025-10-09 | ✅ Current |
| [security/AUTHORIZATION.md](security/AUTHORIZATION.md) | Authorization patterns | 2025-10-09 | ✅ Current |

### Federation Documentation

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [federation/api-contracts.md](federation/api-contracts.md) | API contract specifications | 2025-10-09 | ✅ Current |
| [federation/FEDERATION_GUIDE.md](federation/FEDERATION_GUIDE.md) | Federation implementation guide | 2025-10-09 | ✅ Current |
| [federation/OIDC_SETUP.md](federation/OIDC_SETUP.md) | OIDC configuration guide | 2025-10-09 | ✅ Current |

---

## 📚 API Documentation

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [api/README.md](api/README.md) | API overview and conventions | 2025-10-09 | ✅ Current |
| [RESPONSE_STANDARDS.md](RESPONSE_STANDARDS.md) | API response standards | 2025-10-09 | ✅ Current |
| [RESPONSE_STANDARDS_IMPLEMENTATION.md](RESPONSE_STANDARDS_IMPLEMENTATION.md) | Response standards implementation guide | 2025-10-09 | ✅ Current |
| [RESPONSE_STANDARDS_MIGRATION.md](RESPONSE_STANDARDS_MIGRATION.md) | Migration guide for response standards | 2025-10-09 | ✅ Current |

---

## 📖 Guides & References

### Developer Guides

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [AI_AGENT_REFERENCE.md](AI_AGENT_REFERENCE.md) | Build system rules, common mistakes, debugging workflow | 2025-10-10 | ✅ Current |
| [QUICK_START.md](QUICK_START.md) | Environment setup and local development | 2025-10-12 | ✅ Current |
| [USER_GUIDE.md](USER_GUIDE.md) | End-user documentation | 2025-10-09 | 📋 Reference |
| [STYLE_GUIDE.md](STYLE_GUIDE.md) | Code style guide | 2025-10-09 | ✅ Current |
| [THEME_GUIDE.md](THEME_GUIDE.md) | Theme customization guide | 2025-10-09 | ✅ Current |

### Implementation Guides

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [implementation/BEST_PRACTICES.md](implementation/BEST_PRACTICES.md) | Development best practices | 2025-10-09 | ✅ Current |
| [implementation/CODE_REVIEW_CHECKLIST.md](implementation/CODE_REVIEW_CHECKLIST.md) | Code review checklist | 2025-10-09 | ✅ Current |
| [HOLISTIC_APPROACH.md](HOLISTIC_APPROACH.md) | Holistic development approach | 2025-10-09 | ✅ Current |
| [AUTONOMOUS_IMPLEMENTATION.md](AUTONOMOUS_IMPLEMENTATION.md) | Autonomous implementation guidelines | 2025-10-09 | ✅ Current |

### Provider Portal Guides

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [provider-portal/DEVELOPER_PORTAL_GUIDE.md](provider-portal/DEVELOPER_PORTAL_GUIDE.md) | Developer portal user guide | 2025-10-10 | ✅ Current |
| [provider-portal/FEDERATION_GUIDE.md](provider-portal/FEDERATION_GUIDE.md) | Federation management guide | 2025-10-10 | ✅ Current |
| [provider-portal/MONETIZATION_GUIDE.md](provider-portal/MONETIZATION_GUIDE.md) | Monetization features guide | 2025-10-10 | ✅ Current |
| [provider-portal/OBSERVABILITY_GUIDE.md](provider-portal/OBSERVABILITY_GUIDE.md) | Observability dashboards guide | 2025-10-10 | ✅ Current |
| [provider-portal/RBAC_GUIDE.md](provider-portal/RBAC_GUIDE.md) | RBAC implementation guide | 2025-10-10 | ✅ Current |

---

## 🧪 Testing

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [Execute/TEST_STRATEGY.md](Execute/TEST_STRATEGY.md) | Testing strategy and coverage | 2025-10-09 | ✅ Current |
| [TYPECHECK_GUIDE.md](TYPECHECK_GUIDE.md) | TypeScript type checking guide | 2025-10-09 | ✅ Current |

---

## 📦 Execute Directory (Binder System)

### Core Execute Documents

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [Execute/README.md](Execute/README.md) | Augment Bundle v3.5 documentation | 2025-10-09 | ✅ Current |
| [Execute/MASTER_GUIDE.md](Execute/MASTER_GUIDE.md) | Unified bundle guide | 2025-10-09 | ✅ Current |
| [Execute/PROMPTS.md](Execute/PROMPTS.md) | Prompt engineering guidelines | 2025-10-09 | ✅ Current |
| [Execute/TEST_STRATEGY.md](Execute/TEST_STRATEGY.md) | Testing strategy | 2025-10-09 | ✅ Current |

### Binder Files (Phase 1 - Port-a-John Vertical)

| Document | Description | Last Updated | Status |
|----------|-------------|--------------|--------|
| [Execute/binder1-routing-engine.md](Execute/binder1-routing-engine.md) | Routing engine implementation | 2025-10-09 | 📋 Reference |
| [Execute/binder2-agreements.md](Execute/binder2-agreements.md) | Agreements engine implementation | 2025-10-09 | 📋 Reference |
| [Execute/binder3-seeds.md](Execute/binder3-seeds.md) | Database seeding | 2025-10-09 | 📋 Reference |
| [Execute/binder4-importers.md](Execute/binder4-importers.md) | Data importers | 2025-10-09 | 📋 Reference |

---

## 📊 Status Legend

| Symbol | Meaning | Description |
|--------|---------|-------------|
| ✅ Current | Up-to-date | Document reflects current system state |
| 📋 Reference | Reference Material | Historical or reference documentation |
| 📋 Historical | Historical | Document describes past state, issues resolved |
| ⚠️ Needs Update | Outdated | Document needs updating |

---

## 🔍 Finding Documentation

### By Topic

- **Getting Started**: See [Getting Started](#getting-started) section
- **Architecture**: See [Architecture](#architecture) section
- **Deployment**: See [Deployment & CI/CD](#deployment--cicd) section
- **Security**: See [Security & Federation](#security--federation) section
- **API**: See [API Documentation](#api-documentation) section
- **Testing**: See [Testing](#testing) section

### By Status

- **Current Documentation**: Look for ✅ Current status
- **Reference Material**: Look for 📋 Reference status
- **Historical Documentation**: Look for 📋 Historical status

### By Date

- **Most Recent**: See [DOCUMENTATION_AUDIT_REPORT_2025-10-12.md](DOCUMENTATION_AUDIT_REPORT_2025-10-12.md)
- **Provider Portal**: See [HANDOFF_PROVIDER_PORTAL_2025-10-10.md](HANDOFF_PROVIDER_PORTAL_2025-10-10.md)
- **CRM**: See [CRM_IMPLEMENTATION_STATUS.md](CRM_IMPLEMENTATION_STATUS.md)

---

## 📝 Documentation Maintenance

### Adding New Documentation

1. Create document in appropriate subdirectory
2. Add entry to this INDEX.md
3. Include status indicator (✅ Current, 📋 Reference, etc.)
4. Update last-updated date
5. Commit with descriptive message

### Updating Existing Documentation

1. Update document content
2. Update last-updated date in document
3. Update last-updated date in INDEX.md
4. Verify status indicator is correct
5. Commit with descriptive message

### Archiving Old Documentation

1. Move document to `docs/archive/` directory
2. Update INDEX.md to mark as 📋 Historical
3. Add note about why it was archived
4. Keep entry in INDEX.md for reference

---

**END OF DOCUMENTATION INDEX**

For questions or suggestions about documentation, please contact the development team.

