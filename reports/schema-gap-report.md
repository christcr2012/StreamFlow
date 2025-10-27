# Schema Gap Report

Generated: 2025-10-27T18:29:27.640Z

## Schemas

- C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma
- C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma

## Models

### Activity (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - actorType: String
  - actorId: String?
  - entityType: String
  - entityId: String
  - action: String
  - meta: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/metrics.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/analytics.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/audit.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/compliance.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/incidents.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/stats.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/skeleton.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/lib/wallet.ts
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/analytics/snapshot/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/clients/FederatedClientsSection.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/compliance/ComplianceClient.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/metrics/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/dashboard/dashboard-client.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/jobs/[id]/job-detail-client.tsx
- Test candidates:

### AddonPurchase (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - sku: String
  - amount: Decimal
  - status: String
  - purchasedAt: DateTime
  - refundedAt: DateTime?
  - meta: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/addons.service.ts
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/AUDIT_PROGRESS_REPORT_2025-10-10.md
  - C:/Users/chris/Git Local/Cortiware/docs/COMPREHENSIVE_AUDIT_COMPLETE_2025-10-10.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROVIDER_PORTAL_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/TYPECHECK_ERROR_INVENTORY_2025-10-10.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/addons/page.tsx
- Test candidates:

### Agreement (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - customerId: String
  - templateId: String
  - status: String
  - content: String
  - variables: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/config/leadScoringConfig.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/ai/AIDisclosureBanner.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/ai/AIFeatureBadge.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/config/isr-revalidation.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/lib/validations/agreement.ts
  - C:/Users/chris/Git Local/Cortiware/docs/ACTUAL_REMAINING_WORK.md
  - C:/Users/chris/Git Local/Cortiware/docs/architecture/diagrams/system-architecture.md
  - C:/Users/chris/Git Local/Cortiware/docs/CURRENT_STATE_VERIFICATION_2025-10-16.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/app/terms/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-robinson/src/app/terms/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/agreements/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/agreements/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/agreements/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/customers/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/sse/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/dashboard/dashboard-client.tsx
- Test candidates:
  - C:/Users/chris/Git Local/Cortiware/tests/unit/agreements_eval.test.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/run.ts

### AgreementTemplate (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String?
  - name: String
  - verticalKey: String?
  - content: String
  - mergeFields: Json
  - isActive: Boolean
  - createdAt: DateTime
  - updatedAt: DateTime
  - Agreement: Agreement[]
- Relations:
  - AgreementTemplate.Agreement → Agreement
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/lib/validations/agreement.ts
  - C:/Users/chris/Git Local/Cortiware/docs/tenant-app/SYSTEM_ARCHITECTURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/TODO_AGREEMENT_MODELS.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/agreements/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/agreements/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/agreements/[id]/route.ts
- Test candidates:

### AiModelTest (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - testName: String
  - feature: String
  - modelA: String
  - modelB: String
  - status: String
  - trafficSplit: Int
  - startedAt: DateTime
  - endedAt: DateTime?
  - createdAt: DateTime
  - updatedAt: DateTime
  - Org: Org
  - AiModelTestResult: AiModelTestResult[]
- Relations:
  - AiModelTest.Org → Org
  - AiModelTest.AiModelTestResult → AiModelTestResult
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/AI_PHASE_5_COMPLETION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### AiModelTestResult (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - testId: String
  - model: String
  - feature: String
  - tokensIn: Int
  - tokensOut: Int
  - costUsd: Decimal
  - latencyMs: Int
  - userRating: Int?
  - success: Boolean
  - createdAt: DateTime
  - AiModelTest: AiModelTest
- Relations:
  - AiModelTestResult.AiModelTest → AiModelTest
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/AI_PHASE_5_COMPLETION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### AiMonthlySummary (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - monthKey: String
  - tokensIn: Int
  - tokensOut: Int
  - costUsd: Decimal
  - creditsUsed: Int
  - callCount: Int
  - createdAt: DateTime
  - updatedAt: DateTime
  - Org: Org
- Relations:
  - AiMonthlySummary.Org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/infrastructure/ai-usage-monitor.ts
  - C:/Users/chris/Git Local/Cortiware/docs/AI_PRODUCTION_READINESS_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/COMPREHENSIVE_CODEBASE_REVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/INFRASTRUCTURE_MONITORING.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/IMPLEMENTATION_CHECKLIST.md
- Frontend candidates:
- Test candidates:

### AiUsageEvent (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - userId: String?
  - feature: String
  - model: String
  - tokensIn: Int
  - tokensOut: Int
  - costUsd: Decimal
  - creditsUsed: Int
  - requestId: String?
  - createdAt: DateTime
  - Org: Org
- Relations:
  - AiUsageEvent.Org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/infrastructure/ai-usage-monitor.ts
  - C:/Users/chris/Git Local/Cortiware/AUTONOMOUS_SESSION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/AI_PRODUCTION_READINESS_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/AUTONOMOUS_PHASE_1_FINAL_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/COMPREHENSIVE_CODEBASE_REVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/DOCUMENTATION_AUDIT_REPORT_2025-10-12.md
  - C:/Users/chris/Git Local/Cortiware/docs/INFRASTRUCTURE_MONITORING.md
- Frontend candidates:
- Test candidates:

### AIUsageLog (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - userId: String?
  - feature: String
  - model: String
  - tokensIn: Int
  - tokensOut: Int
  - costCents: Int
  - costUsd: Decimal
  - creditsUsed: Int
  - requestId: String?
  - createdAt: DateTime
  - Org: Org
- Relations:
  - AIUsageLog.Org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### SMSLog (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - userId: String?
  - toNumber: String
  - fromNumber: String?
  - message: String
  - status: String
  - costCents: Int
  - provider: String
  - sid: String?
  - createdAt: DateTime
  - Org: Org
- Relations:
  - SMSLog.Org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### CostAlert (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - alertType: String
  - threshold: Int
  - period: String
  - email: String
  - webhookUrl: String?
  - enabled: Boolean
  - lastTriggered: DateTime?
  - createdAt: DateTime
  - updatedAt: DateTime
  - Org: Org
- Relations:
  - CostAlert.Org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/lib/cost-alerts.ts
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/cost-alerts/route.ts
- Test candidates:

### AnalyticsSnapshot (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - snapshotDate: DateTime
  - mrrCents: Int
  - arrCents: Int
  - activeClients: Int
  - newClients: Int
  - churnedClients: Int
  - totalRevenue: Int
  - metricsJson: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/IMPLEMENTATION_CHECKLIST.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/PHASE3_COMPLETE.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_COMPLETE_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PHASE1_PHASE3_COMPLETE.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### AuditEvent (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - actorType: String
  - actorId: String?
  - action: String
  - entityType: String
  - entityId: String?
  - metadata: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/api/audit-middleware.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/audit/audit-event.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/audit/with-audit-log.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/audit-log.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/auditService.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/consolidated-audit.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/federation-audit.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/types/common.types.ts
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/audit/export/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/audit/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/compliance/ComplianceClient.tsx
- Test candidates:

### AuditLog (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - entityId: String?
  - createdAt: DateTime
  - actorUserId: String?
  - entity: String
  - field: String?
  - newValue: Json?
  - oldValue: Json?
  - reason: String?
  - Org: Org
- Relations:
  - AuditLog.Org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/api/middleware.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/audit/with-audit-log.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/audit-log.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/federation-audit.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/audit.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/lib/audit-log.ts
  - C:/Users/chris/Git Local/Cortiware/docs/architecture/diagrams/deployment-architecture.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/federation/providers/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/federation/providers/[id]/test/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/billing/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/revenue/export/route.ts
- Test candidates:

### BillingLedger (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - type: LedgerType
  - amount: Decimal
  - meta: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/AUTONOMOUS_EXECUTION_PROGRESS_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROJECT_COMPLETION_SUMMARY_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/HANDOFF_GPT5.md
  - C:/Users/chris/Git Local/Cortiware/Reference/Provider/PROVIDER_OPERATIONS_BLUEPRINT.md
- Frontend candidates:
- Test candidates:

### BreakglassActivationLog (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - userId: String
  - orgId: String
  - reason: String
  - method: String
  - riskScore: Int
  - riskFactors: String
  - delayMinutes: Int
  - verificationSteps: String
  - ipAddress: String
  - userAgent: String
  - success: Boolean
  - errorMessage: String?
  - notifiedAdmins: String
  - timestamp: DateTime
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/AUTH_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/IMPLEMENTATION_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/WHATS_WORKING_NOW.md
- Frontend candidates:
- Test candidates:

### CleaningChecklistTemplate (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - name: String
  - spaceType: String
  - itemsJson: Json
  - isDefault: Boolean
  - createdAt: DateTime
  - updatedAt: DateTime
  - Org: Org
- Relations:
  - CleaningChecklistTemplate.Org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/AUTONOMOUS_EXECUTION_PROGRESS_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/CLEANING_VERTICAL_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/CLEANING_VERTICAL_README.md
  - C:/Users/chris/Git Local/Cortiware/docs/FINAL_IMPLEMENTATION_SUMMARY_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/MASTER_IMPLEMENTATION_PLAN_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROJECT_COMPLETION_SUMMARY_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
- Frontend candidates:
- Test candidates:

### CleaningContract (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - estimateId: String
  - customerId: String?
  - siteAddress: String
  - spaceType: String
  - squareFeet: Int
  - recurrenceRule: String?
  - frequency: String
  - startDate: DateTime
  - endDate: DateTime?
  - basePrice: Decimal
  - taxRate: Decimal?
  - escalatorPct: Decimal?
  - slaResponseHours: Int?
  - slaCompletionHours: Int?
  - status: String
  - createdAt: DateTime
  - updatedAt: DateTime
  - CleaningEstimate: CleaningEstimate
  - Org: Org
  - CleaningWorkOrder: CleaningWorkOrder[]
- Relations:
  - CleaningContract.CleaningEstimate → CleaningEstimate
  - CleaningContract.Org → Org
  - CleaningContract.CleaningWorkOrder → CleaningWorkOrder
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/AUTONOMOUS_EXECUTION_PROGRESS_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/CLEANING_VERTICAL_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/CLEANING_VERTICAL_README.md
  - C:/Users/chris/Git Local/Cortiware/docs/FINAL_IMPLEMENTATION_SUMMARY_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/MASTER_IMPLEMENTATION_PLAN_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROJECT_COMPLETION_SUMMARY_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/(tenant)/cleaning/contracts/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/cleaning/contracts/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/cleaning/estimates/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/cleaning/inspections/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/cleaning/work-orders/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/schedule/jobs/assign/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/schedule/jobs/reschedule/route.ts
- Test candidates:

### CleaningEstimate (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - leadId: String?
  - version: Int
  - spaceType: String
  - squareFeet: Int
  - frequency: String
  - optionsJson: Json
  - status: String
  - acceptedOption: String?
  - signedAt: DateTime?
  - signedBy: String?
  - signatureUrl: String?
  - createdAt: DateTime
  - updatedAt: DateTime
  - CleaningContract: CleaningContract?
  - CleaningLead: CleaningLead?
  - Org: Org
- Relations:
  - CleaningEstimate.CleaningContract → CleaningContract
  - CleaningEstimate.CleaningLead → CleaningLead
  - CleaningEstimate.Org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/AUTONOMOUS_EXECUTION_PROGRESS_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/CLEANING_VERTICAL_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/CLEANING_VERTICAL_README.md
  - C:/Users/chris/Git Local/Cortiware/docs/FINAL_IMPLEMENTATION_SUMMARY_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/MASTER_IMPLEMENTATION_PLAN_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROJECT_COMPLETION_SUMMARY_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/(tenant)/cleaning/estimates/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/cleaning/contracts/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/cleaning/estimates/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/cleaning/inspections/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/cleaning/leads/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/cleaning/work-orders/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/estimates/route.ts
- Test candidates:

### CleaningInspection (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - workOrderId: String
  - inspectorId: String?
  - inspectedAt: DateTime?
  - checklistJson: Json
  - score: Decimal?
  - defectsCount: Int
  - status: String
  - createdAt: DateTime
  - updatedAt: DateTime
  - Org: Org
  - CleaningWorkOrder: CleaningWorkOrder[]
- Relations:
  - CleaningInspection.Org → Org
  - CleaningInspection.CleaningWorkOrder → CleaningWorkOrder
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/AUTONOMOUS_EXECUTION_PROGRESS_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/CLEANING_VERTICAL_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/CLEANING_VERTICAL_README.md
  - C:/Users/chris/Git Local/Cortiware/docs/FINAL_IMPLEMENTATION_SUMMARY_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/MASTER_IMPLEMENTATION_PLAN_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROJECT_COMPLETION_SUMMARY_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/(tenant)/cleaning/qa/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/cleaning/inspections/route.ts
- Test candidates:

### CleaningLead (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - company: String?
  - contactName: String
  - email: String?
  - phone: String?
  - address: String
  - city: String
  - state: String
  - zip: String
  - lat: Decimal?
  - lon: Decimal?
  - spaceType: String
  - squareFeet: Int?
  - frequency: String?
  - status: String
  - aiEstimateJson: Json?
  - aiTokensUsed: Int?
  - createdAt: DateTime
  - updatedAt: DateTime
  - CleaningEstimate: CleaningEstimate[]
  - Org: Org
- Relations:
  - CleaningLead.CleaningEstimate → CleaningEstimate
  - CleaningLead.Org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/AUTONOMOUS_EXECUTION_PROGRESS_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/CLEANING_VERTICAL_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/CLEANING_VERTICAL_README.md
  - C:/Users/chris/Git Local/Cortiware/docs/FINAL_IMPLEMENTATION_SUMMARY_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/MASTER_IMPLEMENTATION_PLAN_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROJECT_COMPLETION_SUMMARY_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/(tenant)/cleaning/leads/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/cleaning/estimates/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/cleaning/inspections/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/cleaning/leads/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/cleaning/work-orders/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/estimates/route.ts
- Test candidates:

### CleaningWorkOrder (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - contractId: String?
  - publicId: String
  - siteAddress: String
  - spaceType: String
  - squareFeet: Int
  - scheduledDate: DateTime
  - scheduledStart: DateTime
  - scheduledEnd: DateTime
  - assignedTo: String?
  - assignedAt: DateTime?
  - actualStart: DateTime?
  - actualEnd: DateTime?
  - status: String
  - checklistJson: Json?
  - inspectionId: String?
  - photosJson: Json?
  - signatureUrl: String?
  - signedBy: String?
  - signedAt: DateTime?
  - createdAt: DateTime
  - updatedAt: DateTime
  - CleaningContract: CleaningContract?
  - CleaningInspection: CleaningInspection?
  - Org: Org
  - CleaningWorkOrderEvent: CleaningWorkOrderEvent[]
- Relations:
  - CleaningWorkOrder.CleaningContract → CleaningContract
  - CleaningWorkOrder.CleaningInspection → CleaningInspection
  - CleaningWorkOrder.Org → Org
  - CleaningWorkOrder.CleaningWorkOrderEvent → CleaningWorkOrderEvent
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/AUTONOMOUS_SESSION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/AUTONOMOUS_EXECUTION_PROGRESS_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/CLEANING_VERTICAL_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/CLEANING_VERTICAL_README.md
  - C:/Users/chris/Git Local/Cortiware/docs/FINAL_IMPLEMENTATION_SUMMARY_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/MASTER_IMPLEMENTATION_PLAN_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROJECT_COMPLETION_SUMMARY_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/(tenant)/cleaning/schedules/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/cleaning/contracts/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/cleaning/inspections/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/cleaning/work-orders/route.ts
- Test candidates:

### CleaningWorkOrderEvent (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - workOrderId: String
  - eventType: String
  - userId: String?
  - timestamp: DateTime
  - metadata: Json?
  - CleaningWorkOrder: CleaningWorkOrder
- Relations:
  - CleaningWorkOrderEvent.CleaningWorkOrder → CleaningWorkOrder
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/AUTONOMOUS_EXECUTION_PROGRESS_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/CLEANING_VERTICAL_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/CLEANING_VERTICAL_README.md
  - C:/Users/chris/Git Local/Cortiware/docs/FINAL_IMPLEMENTATION_SUMMARY_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/MASTER_IMPLEMENTATION_PLAN_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROJECT_COMPLETION_SUMMARY_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/cleaning/work-orders/route.ts
- Test candidates:

### Coupon (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - code: String
  - name: String?
  - percentOff: Int?
  - amountOffCents: Int?
  - duration: String?
  - durationMonths: Int?
  - startsAt: DateTime?
  - endsAt: DateTime?
  - maxRedemptions: Int?
  - active: Boolean
  - createdAt: DateTime
  - updatedAt: DateTime
  - OnboardingInvite: OnboardingInvite[]
- Relations:
  - Coupon.OnboardingInvite → OnboardingInvite
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/APP_ROUTER_IMPLEMENTATION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/AUTONOMOUS_COMPLETION_FINAL.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/archive/COMPLETION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/archive/FINAL_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/DOCUMENTATION_AUDIT_REPORT_2025-10-12.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRICING_MANAGEMENT_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/PROVIDER_PORTAL_END_TO_END_DELIVERY_RUNBOOK_v2.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/monetization/MonetizationClient.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/observability/monetization-metrics/page.tsx
- Test candidates:

### Customer (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - publicId: String
  - company: String?
  - primaryName: String?
  - primaryEmail: String?
  - primaryPhone: String?
  - notes: String?
  - createdAt: DateTime
  - updatedAt: DateTime
  - billingSettings: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/lib/pricing.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/seed-compliance.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/config/leadScoringConfig.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/stripeHelpers.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/infrastructure/recommendation-engine.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/owner/billing.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/owner/subscription.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/dunning.service.ts
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/app/about/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/app/industries/cleaning/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/app/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/app/privacy/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/incidents/IncidentsClient.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/revenue-intelligence/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/revenue-intelligence/RevenueClient.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/agreements/page.tsx
- Test candidates:
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/page-objects/DashboardPage.ts
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/page-objects/JobsPage.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/importers_schema.test.ts

### CustomerContact (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - customerId: String
  - name: String
  - email: String?
  - phone: String?
  - role: String?
  - isPrimary: Boolean
  - createdAt: DateTime
  - updatedAt: DateTime
  - Customer: Customer
- Relations:
  - CustomerContact.Customer → Customer
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/lib/validations/customer.ts
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/customers/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/customers/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/customers/[id]/customer-detail-client.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/customers/[id]/page.tsx
- Test candidates:

### EmailTemplate (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - templateType: String
  - subject: String
  - htmlBody: String
  - textBody: String
  - active: Boolean
  - createdAt: DateTime
  - updatedAt: DateTime
  - Org: Org
- Relations:
  - EmailTemplate.Org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/lib/email-notifications.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/lib/email-service.ts
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_COMPLETE_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_PROGRESS_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/webhooks/stripe/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/settings/email-templates/email-templates-client.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/settings/email-templates/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/settings/email-templates/[type]/email-template-editor.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/settings/email-templates/[type]/page.tsx
- Test candidates:

### FederationKey (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - tenantId: String
  - keyId: String
  - secretHash: String
  - scope: String
  - createdAt: DateTime
  - disabledAt: DateTime?
  - lastUsedAt: DateTime?
  - rotatedAt: DateTime?
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/BUILD_PLAN_PROVIDER_PORTAL.md
  - C:/Users/chris/Git Local/Cortiware/COMPLETE_FEATURE_VERIFICATION.md
  - C:/Users/chris/Git Local/Cortiware/docs/architecture/diagrams/data-flow.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/DOCUMENTATION_AUDIT_REPORT_2025-10-12.md
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_Implementation_Guide_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_PR_Plan_and_Templates_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/HANDOFF_PROVIDER_PORTAL_2025-10-10.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/federation/FederationKeys.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/federation/page.tsx
- Test candidates:

### GlobalMonetizationConfig (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - defaultPlanId: String?
  - defaultPriceId: String?
  - defaultTrialDays: Int?
  - publicOnboarding: Boolean
  - createdAt: DateTime
  - updatedAt: DateTime
  - PricePlan: PricePlan?
  - PlanPrice: PlanPrice?
- Relations:
  - GlobalMonetizationConfig.PricePlan → PricePlan
  - GlobalMonetizationConfig.PlanPrice → PlanPrice
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PRECHECK.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/GPT5_NEXT_PHASE_HANDOFF.md
  - C:/Users/chris/Git Local/Cortiware/Reference/MONETIZATION_BLUEPRINT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/SONNET_PROGRESS_TRACKER.md
- Frontend candidates:
- Test candidates:

### ImportError (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - importJobId: String
  - rowNumber: Int
  - fieldName: String?
  - errorType: String
  - errorMessage: String
  - rawData: Json?
  - createdAt: DateTime
  - ImportJob: ImportJob
- Relations:
  - ImportError.ImportJob → ImportJob
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/AI_PRODUCTION_READINESS_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/IMPORT_WIZARD_AI_IMPLEMENTATION.md
  - C:/Users/chris/Git Local/Cortiware/docs/IMPORT_WIZARD_DEPLOYMENT.md
  - C:/Users/chris/Git Local/Cortiware/docs/IMPORT_WIZARD_IMPLEMENTATION.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
- Frontend candidates:
- Test candidates:

### ImportJob (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - userId: String
  - entityType: ImportEntityType
  - status: ImportStatus
  - fileName: String
  - fileSize: Int
  - fileUrl: String?
  - totalRecords: Int
  - processedRecords: Int
  - successCount: Int
  - errorCount: Int
  - skipCount: Int
  - mappingId: String?
  - sampleData: Json?
  - fieldMappings: Json?
  - transformRules: Json?
  - validationRules: Json?
  - progressPercent: Int
  - startedAt: DateTime?
  - completedAt: DateTime?
  - errorSummary: String?
  - createdAt: DateTime
  - updatedAt: DateTime
  - ImportError: ImportError[]
  - ImportMapping: ImportMapping?
  - Org: Org
  - User: User
- Relations:
  - ImportJob.ImportError → ImportError
  - ImportJob.ImportMapping → ImportMapping
  - ImportJob.Org → Org
  - ImportJob.User → User
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/AI_PRODUCTION_READINESS_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/DOCUMENTATION_AUDIT_REPORT_2025-10-12.md
  - C:/Users/chris/Git Local/Cortiware/docs/IMPORT_WIZARD_AI_IMPLEMENTATION.md
  - C:/Users/chris/Git Local/Cortiware/docs/IMPORT_WIZARD_DEPLOYMENT.md
  - C:/Users/chris/Git Local/Cortiware/docs/IMPORT_WIZARD_IMPLEMENTATION.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/src/app/(owner)/import-wizard/components/ProgressTracker.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/(owner)/import-wizard/ImportWizard.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/api/owner/import/route.ts
- Test candidates:

### ImportMapping (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - name: String
  - entityType: ImportEntityType
  - sourceFormat: String
  - fieldMappings: Json
  - transformRules: Json
  - validationRules: Json
  - isTemplate: Boolean
  - useCount: Int
  - lastUsedAt: DateTime?
  - createdAt: DateTime
  - updatedAt: DateTime
  - ImportJob: ImportJob[]
  - Org: Org
- Relations:
  - ImportMapping.ImportJob → ImportJob
  - ImportMapping.Org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/AI_FEATURES_IMPLEMENTATION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/AI_PRODUCTION_READINESS_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/docs/AI_PRODUCTION_READINESS_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/IMPORT_WIZARD_AI_IMPLEMENTATION.md
  - C:/Users/chris/Git Local/Cortiware/docs/IMPORT_WIZARD_DEPLOYMENT.md
  - C:/Users/chris/Git Local/Cortiware/docs/IMPORT_WIZARD_IMPLEMENTATION.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/src/app/api/owner/import/route.ts
- Test candidates:

### Incident (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - severity: IncidentSeverity
  - status: IncidentStatus
  - title: String
  - description: String
  - assigneeUserId: String?
  - slaResponseDeadline: DateTime?
  - slaResolveDeadline: DateTime?
  - acknowledgedAt: DateTime?
  - resolvedAt: DateTime?
  - closedAt: DateTime?
  - createdAt: DateTime
  - updatedAt: DateTime
  - Org: Org
- Relations:
  - Incident.Org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/rbac/roles.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/mocks/provider/incidents.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/incidents.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/tenant-health.service.ts
  - C:/Users/chris/Git Local/Cortiware/BUILD_PLAN_PROVIDER_PORTAL.md
  - C:/Users/chris/Git Local/Cortiware/COMPLETE_FEATURE_VERIFICATION.md
  - C:/Users/chris/Git Local/Cortiware/docs/ACTUAL_REMAINING_WORK.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-robinson/src/app/security/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/incidents/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/v1/federation/escalation/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/dev-aids/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/incidents/IncidentsClient.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/incidents/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/ProviderShellClient.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/(owner)/owner/incidents/page.tsx
- Test candidates:

### InfrastructureLimit (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - service: InfrastructureService
  - metric: MetricType
  - currentPlan: String
  - limitValue: Float
  - warningPercent: Float
  - criticalPercent: Float
  - createdAt: DateTime
  - updatedAt: DateTime
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/migrations/MIGRATION_INSTRUCTIONS.md
  - C:/Users/chris/Git Local/Cortiware/docs/AUTONOMOUS_IMPLEMENTATION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/INFRASTRUCTURE_MONITORING.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/(provider)/infrastructure/InfrastructureDashboard.tsx
- Test candidates:

### InfrastructureMetric (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - service: InfrastructureService
  - metric: MetricType
  - value: Float
  - timestamp: DateTime
  - metadata: Json?
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/migrations/MIGRATION_INSTRUCTIONS.md
  - C:/Users/chris/Git Local/Cortiware/docs/AUTONOMOUS_IMPLEMENTATION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/INFRASTRUCTURE_MONITORING.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/TWO_PERSONA_PORTALS_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/(provider)/infrastructure/InfrastructureDashboard.tsx
- Test candidates:

### Invoice (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - customerId: String?
  - amount: Decimal
  - status: String
  - issuedAt: DateTime
  - items: Json
  - createdAt: DateTime
  - currency: String
  - discountAmount: Decimal
  - dueDate: DateTime?
  - jobId: String?
  - notes: String?
  - number: String?
  - paidAt: DateTime?
  - paymentLinkExpiresAt: DateTime?
  - paymentLinkToken: String?
  - paymentLinkViews: Int
  - subtotal: Decimal
  - taxAmount: Decimal
  - terms: String?
  - updatedAt: DateTime
  - Customer: Customer?
  - Org: Org
  - InvoiceLine: InvoiceLine[]
  - InvoiceReminder: InvoiceReminder[]
  - Payment: Payment[]
- Relations:
  - Invoice.Customer → Customer
  - Invoice.Org → Org
  - Invoice.InvoiceLine → InvoiceLine
  - Invoice.InvoiceReminder → InvoiceReminder
  - Invoice.Payment → Payment
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/components/DashboardBillableCard.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/mocks/provider/billing.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/accountant/stats.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/owner/billing.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/billing.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/invoices.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/stats.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/breadcrumbs.tsx
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/billing/retry/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/clients/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/invoices/[id]/html/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/invoices/[id]/pdf/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/invoices/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/v1/federation/analytics/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/v1/federation/billing/invoice/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/developer/webhooks/page.tsx
- Test candidates:
  - C:/Users/chris/Git Local/Cortiware/tests/FEDERATION_TESTS.md
  - C:/Users/chris/Git Local/Cortiware/tests/unit/importers_schema.test.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/wallet.test.ts

### InvoiceLine (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - invoiceId: String
  - description: String
  - lineType: InvoiceLineType
  - quantity: Int
  - unitPriceCents: Int
  - amountCents: Int
  - sourceType: String?
  - sourceId: String?
  - createdAt: DateTime
  - Invoice: Invoice
- Relations:
  - InvoiceLine.Invoice → Invoice
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/billing.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/invoices.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/lib/validations/invoice.ts
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/archive/FINAL_COMPLETION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/tenant-app/SYSTEM_ARCHITECTURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/invoices/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/invoices/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/invoices/[id]/page.tsx
- Test candidates:

### InvoiceReminder (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - invoiceId: String
  - reminderType: String
  - status: String
  - sentAt: DateTime?
  - error: String?
  - createdAt: DateTime
  - Invoice: Invoice
- Relations:
  - InvoiceReminder.Invoice → Invoice
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/INVOICE_REMINDERS_CRON.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/invoices/[id]/page.tsx
- Test candidates:

### Job (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - customerId: String?
  - rfpId: String?
  - status: String
  - schedule: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/migrations/MIGRATION_INSTRUCTIONS.md
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/breadcrumbs.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/empty-state.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/job-photo-gallery.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/keyboard-shortcuts.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/mobile-nav.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/optimized-image.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/schedule/draggable-job.tsx
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/analytics/snapshot/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/cron/collect-metrics/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/customers/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/customers/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/import/csv/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/job-costing/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/jobs/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/jobs/[id]/photos/route.ts
- Test candidates:
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/page-objects/DashboardPage.ts
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/page-objects/JobsPage.ts
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/README.md
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/tenant-app/03-jobs-management.spec.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/importers_schema.test.ts

### JobPhoto (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - publicId: String
  - jobId: String
  - url: String
  - caption: String?
  - metadata: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/job-photo-gallery.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/lib/validations/job.ts
  - C:/Users/chris/Git Local/Cortiware/docs/PHASE_2_COMPLETION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/tenant-app/SYSTEM_ARCHITECTURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/jobs/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/jobs/[id]/photos/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/jobs/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/jobs/[id]/job-detail-client.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/jobs/[id]/page.tsx
- Test candidates:

### JobTimeline (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - publicId: String
  - jobId: String
  - eventType: String
  - description: String
  - metadata: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/PHASE_2_COMPLETION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/jobs/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/jobs/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/jobs/[id]/status/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/leads/[id]/convert/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/jobs/[id]/job-detail-client.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/jobs/[id]/page.tsx
- Test candidates:

### Lead (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - publicId: String
  - sourceType: LeadSource
  - identityHash: String
  - company: String?
  - contactName: String?
  - email: String?
  - phoneE164: String?
  - website: String?
  - serviceCode: String?
  - zip: String?
  - enrichmentJson: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/seed-leads.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/seed.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/components/AiInsights.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/components/AppNav.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/components/AppShell.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/components/QuickActions.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/config/leadScoringConfig.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/ai/usage-pattern-analyzer.ts
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/app/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/analytics/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/federation/clients/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/federation/clients/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/leads/dispute/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/leads/quality-score/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/leads/reclassify/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/leads/seed/route.ts
- Test candidates:
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/testing/e2e-plan.md
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/page-objects/DashboardPage.ts
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/page-objects/LeadsPage.ts
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/README.md
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/tenant-app/02-leads-management.spec.ts
  - C:/Users/chris/Git Local/Cortiware/tests/integration/api-leads.test.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/run.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/validation.leads.test.ts

### LeadInvoice (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String?
  - number: String
  - periodFrom: DateTime
  - periodTo: DateTime
  - status: String
  - subtotalCents: Int
  - taxCents: Int
  - totalCents: Int
  - currency: String
  - stripeInvoiceId: String?
  - createdAt: DateTime
  - updatedAt: DateTime
  - leadCount: Int
  - Org: Org?
  - LeadInvoiceLine: LeadInvoiceLine[]
- Relations:
  - LeadInvoice.Org → Org
  - LeadInvoice.LeadInvoiceLine → LeadInvoiceLine
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/billing.service.ts
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/archive/FINAL_COMPLETION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/Provider/PROVIDER_OPERATIONS_BLUEPRINT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### LeadInvoiceLine (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - invoiceId: String
  - leadId: String?
  - description: String
  - quantity: Int
  - unitPriceCents: Int
  - amountCents: Int
  - source: String?
  - createdAt: DateTime
  - LeadInvoice: LeadInvoice
  - Lead: Lead?
- Relations:
  - LeadInvoiceLine.LeadInvoice → LeadInvoice
  - LeadInvoiceLine.Lead → Lead
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/billing.service.ts
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/archive/FINAL_COMPLETION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/Provider/PROVIDER_OPERATIONS_BLUEPRINT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### Notification (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String?
  - audience: String
  - type: String
  - title: String
  - body: String
  - severity: String
  - readAt: DateTime?
  - createdAt: DateTime
  - Org: Org?
- Relations:
  - Notification.Org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/notifications.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/lib/email-notifications.ts
  - C:/Users/chris/Git Local/Cortiware/AUDIT_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/COMPLETE_FEATURE_VERIFICATION.md
  - C:/Users/chris/Git Local/Cortiware/docs/ACTUAL_REMAINING_WORK.md
  - C:/Users/chris/Git Local/Cortiware/docs/architecture/diagrams/deployment-architecture.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/FEDERATION_V3_IMPLEMENTATION_REPORT.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/notifications/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/settings/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/settings/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/ProviderShellClient.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/notifications/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/notifications/notifications-client.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/notifications/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/settings/integrations/integrations-client.tsx
- Test candidates:

### OIDCConfig (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - enabled: Boolean
  - issuerUrl: String
  - clientId: String
  - clientSecret: String
  - scopes: String
  - createdAt: DateTime
  - updatedAt: DateTime
  - lastTestedAt: DateTime?
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/oidc.ts
  - C:/Users/chris/Git Local/Cortiware/BUILD_PLAN_PROVIDER_PORTAL.md
  - C:/Users/chris/Git Local/Cortiware/COMPLETE_FEATURE_VERIFICATION.md
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_Implementation_Guide_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_PR_Plan_and_Templates_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/FEDERATION_V3_IMPLEMENTATION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/PROVIDER_PORTAL_END_TO_END_DELIVERY_RUNBOOK_v2.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/PROVIDER_PORTAL_STRATEGIC_ENHANCEMENT_PLAN_v2.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/federation/oidc/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/federation/OIDCConfig.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/federation/page.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/api/auth/oidc/callback/route.ts
- Test candidates:

### Offer (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - name: String
  - percentOff: Int?
  - amountOffCents: Int?
  - duration: String?
  - durationMonths: Int?
  - appliesToPlanId: String?
  - startsAt: DateTime?
  - endsAt: DateTime?
  - active: Boolean
  - createdAt: DateTime
  - updatedAt: DateTime
  - PricePlan: PricePlan?
  - OnboardingInvite: OnboardingInvite[]
- Relations:
  - Offer.PricePlan → PricePlan
  - Offer.OnboardingInvite → OnboardingInvite
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/aiResponseTemplates.ts
  - C:/Users/chris/Git Local/Cortiware/APP_ROUTER_IMPLEMENTATION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/AUTONOMOUS_COMPLETION_FINAL.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/archive/COMPLETION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/archive/FINAL_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROVIDER_PORTAL_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROVIDER_PORTAL_AUDIT_SUMMARY.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/monetization/MonetizationClient.tsx
- Test candidates:

### OnboardingInvite (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - token: String
  - email: String?
  - planId: String?
  - priceId: String?
  - offerId: String?
  - couponId: String?
  - trialDays: Int?
  - expiresAt: DateTime
  - usedAt: DateTime?
  - note: String?
  - createdAt: DateTime
  - Coupon: Coupon?
  - Offer: Offer?
  - PricePlan: PricePlan?
  - PlanPrice: PlanPrice?
- Relations:
  - OnboardingInvite.Coupon → Coupon
  - OnboardingInvite.Offer → Offer
  - OnboardingInvite.PricePlan → PricePlan
  - OnboardingInvite.PlanPrice → PlanPrice
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/DOCUMENTATION_AUDIT_REPORT_2025-10-12.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PRECHECK.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/PRODUCTION_READINESS.md
  - C:/Users/chris/Git Local/Cortiware/Reference/GPT5_NEXT_PHASE_HANDOFF.md
- Frontend candidates:
- Test candidates:

### Opportunity (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - customerId: String
  - valueType: ValueType
  - estValue: Decimal?
  - stage: String
  - ownerId: String?
  - sourceLeadId: String?
  - classification: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/aiResponseTemplates.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/api/v2.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/validation/opportunities.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/opportunities.service.ts
  - C:/Users/chris/Git Local/Cortiware/AUDIT_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/AUTONOMOUS_COMPLETION_FINAL.md
  - C:/Users/chris/Git Local/Cortiware/COPILOT_OPERATING_PROCEDURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/AI_PRODUCTION_READINESS_SUMMARY.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/src/app/(app)/leads/[id]/convert-modal.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/(app)/leads/[id]/page.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/(app)/opportunities/new/page.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/(app)/opportunities/page.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/(app)/opportunities/[id]/edit-form.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/(app)/opportunities/[id]/page.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/api/v2/opportunities/route.ts
  - C:/Users/chris/Git Local/Cortiware/src/app/api/v2/opportunities/[id]/route.ts
- Test candidates:
  - C:/Users/chris/Git Local/Cortiware/tests/unit/validation.opportunities.test.ts

### Org (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - name: String
  - featureFlags: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/seed-leads.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/seed.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/aiMeter.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/api/v2.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/auth/automated-breakglass.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/auth-helpers.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/auth-owner.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/federation/idempotency.ts
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-robinson/src/app/layout.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-robinson/src/app/services/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/ai/alerts/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/analytics/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/actions/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/audit/export/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/leads/advanced-filter/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/leads/export/route.ts
- Test candidates:
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/testing/e2e-plan.md
  - C:/Users/chris/Git Local/Cortiware/tests/FEDERATION_TESTS.md
  - C:/Users/chris/Git Local/Cortiware/tests/integration/api-leads.test.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/federation.ratelimit.test.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/run.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/validation.organizations.test.ts

### Payment (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - invoiceId: String?
  - amount: Decimal
  - method: String
  - receivedAt: DateTime
  - reference: String?
  - failureReason: String?
  - lastRetryAt: DateTime?
  - retryCount: Int
  - status: String
  - stripeChargeId: String?
  - stripePaymentIntentId: String?
  - currency: String
  - Invoice: Invoice?
  - Org: Org
- Relations:
  - Payment.Invoice → Invoice
  - Payment.Org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/seed-compliance.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/accountant/stats.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/billing.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/dunning.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/stripe.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/tenant-health.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/empty-state.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/payment-modal.tsx
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/app/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/actions/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/developer/webhooks/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/billing/BillingUpdateForm.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/invoices/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/invoices/[id]/payment-intent/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/invoices/[id]/payments/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/invoices/[id]/route.ts
- Test candidates:
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/page-objects/WalletPage.ts
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/README.md
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/tenant-app/04-wallet.spec.ts
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/tenant-app/05-ui-components.spec.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/ui_components.test.ts

### PlanPrice (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - planId: String
  - currency: String
  - unitAmountCents: Int
  - cadence: BillingCadence
  - trialDays: Int?
  - active: Boolean
  - stripePriceId: String?
  - createdAt: DateTime
  - updatedAt: DateTime
  - GlobalMonetizationConfig: GlobalMonetizationConfig[]
  - OnboardingInvite: OnboardingInvite[]
  - PricePlan: PricePlan
  - TenantPriceOverride: TenantPriceOverride[]
- Relations:
  - PlanPrice.GlobalMonetizationConfig → GlobalMonetizationConfig
  - PlanPrice.OnboardingInvite → OnboardingInvite
  - PlanPrice.PricePlan → PricePlan
  - PlanPrice.TenantPriceOverride → TenantPriceOverride
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/APP_ROUTER_IMPLEMENTATION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/archive/COMPLETION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/IMPLEMENTATION_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PRECHECK.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
- Frontend candidates:
- Test candidates:

### PricePlan (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - key: String
  - name: String
  - description: String?
  - active: Boolean
  - createdAt: DateTime
  - updatedAt: DateTime
  - GlobalMonetizationConfig: GlobalMonetizationConfig[]
  - Offer: Offer[]
  - OnboardingInvite: OnboardingInvite[]
  - PlanPrice: PlanPrice[]
  - TenantPriceOverride: TenantPriceOverride[]
- Relations:
  - PricePlan.GlobalMonetizationConfig → GlobalMonetizationConfig
  - PricePlan.Offer → Offer
  - PricePlan.OnboardingInvite → OnboardingInvite
  - PricePlan.PlanPrice → PlanPrice
  - PricePlan.TenantPriceOverride → TenantPriceOverride
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/architecture/diagrams/data-flow.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/DOCUMENTATION_AUDIT_REPORT_2025-10-12.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PRECHECK.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/GPT5_NEXT_PHASE_HANDOFF.md
- Frontend candidates:
- Test candidates:

### PricingPlan (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - orgId: String
  - model: PricingModel
  - currency: String
  - unitAmount: Int
  - tiersJson: Json?
  - includedUnits: Int
  - Org: Org
- Relations:
  - PricingPlan.Org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/lib/pricing.ts
  - C:/Users/chris/Git Local/Cortiware/docs/PRICING_MANAGEMENT_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/prisma/seed-marketing-pricing.ts
  - C:/Users/chris/Git Local/Cortiware/Reference/PROVIDER_CONTROL_CENTER_BLUEPRINT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
  - C:/Users/chris/Git Local/Cortiware/src/\_disabled/pages/api/integrations/sam/fetch.ts
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/admin/pricing/plans/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/admin/pricing/plans/[id]/approve/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/admin/pricing/plans/[id]/publish/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/admin/pricing/plans/[id]/reject/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/admin/pricing/plans/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/admin/pricing/plans/[id]/submit-review/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/admin/pricing/plans/[id]/unpublish/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/public/pricing/route.ts
- Test candidates:

### ProviderConfig (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - samApiKey: String?
  - stripeSecretKey: String?
  - otherConfig: Json?
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/LEGACY_MIGRATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/MASTER_IMPLEMENTATION_PLAN_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_COMPLETE_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_PROGRESS_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROVIDER_PORTAL_INVESTIGATION_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROVIDER_PORTAL_ISSUES_AND_FIXES_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/feature-flags/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/settings/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/theme/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/settings/features/features-client.tsx
- Test candidates:

### ProviderIntegration (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - name: String
  - type: String
  - config: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/BUILD_PLAN_PROVIDER_PORTAL.md
  - C:/Users/chris/Git Local/Cortiware/COMPLETE_FEATURE_VERIFICATION.md
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_Implementation_Guide_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_PR_Plan_and_Templates_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/FEDERATION_V3_IMPLEMENTATION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/PROVIDER_PORTAL_END_TO_END_DELIVERY_RUNBOOK_v2.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/PROVIDER_PORTAL_STRATEGIC_ENHANCEMENT_PLAN_v2.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROVIDER_PORTAL_IMPLEMENTATION_PLAN.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/federation/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/federation/ProviderIntegrations.tsx
- Test candidates:

### RbacPermission (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - code: String
  - description: String?
  - createdAt: DateTime
  - RbacRolePermission: RbacRolePermission[]
- Relations:
  - RbacPermission.RbacRolePermission → RbacRolePermission
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PRECHECK.md
  - C:/Users/chris/Git Local/Cortiware/PHASE_2_FINAL_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/permissions/route.ts
- Test candidates:

### RbacRole (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String?
  - name: String
  - slug: String
  - isSystem: Boolean
  - createdAt: DateTime
  - Org: Org?
  - RbacRolePermission: RbacRolePermission[]
  - RbacUserRole: RbacUserRole[]
- Relations:
  - RbacRole.Org → Org
  - RbacRole.RbacRolePermission → RbacRolePermission
  - RbacRole.RbacUserRole → RbacUserRole
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/PROVIDER_PORTAL_END_TO_END_DELIVERY_RUNBOOK_v2.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PRECHECK.md
  - C:/Users/chris/Git Local/Cortiware/PHASE_2_FINAL_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/permissions/route.ts
- Test candidates:

### RbacRolePermission (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - roleId: String
  - permissionId: String
  - RbacPermission: RbacPermission
  - RbacRole: RbacRole
- Relations:
  - RbacRolePermission.RbacPermission → RbacPermission
  - RbacRolePermission.RbacRole → RbacRole
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PRECHECK.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/permissions/route.ts
- Test candidates:

### RbacUserRole (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - userId: String
  - orgId: String?
  - roleId: String
  - Org: Org?
  - RbacRole: RbacRole
  - User: User
- Relations:
  - RbacUserRole.Org → Org
  - RbacUserRole.RbacRole → RbacRole
  - RbacUserRole.User → User
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/PROVIDER_PORTAL_END_TO_END_DELIVERY_RUNBOOK_v2.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PRECHECK.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
  - C:/Users/chris/Git Local/Cortiware/src/\_disabled/pages/api/tenant/register.ts
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/permissions/route.ts
- Test candidates:

### RecoveryRequest (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - userId: String
  - orgId: String
  - type: String
  - status: String
  - verificationToken: String
  - verificationCode: String?
  - codeExpiresAt: DateTime?
  - codeAttempts: Int
  - riskScore: Int
  - delayUntil: DateTime
  - ipAddress: String
  - userAgent: String
  - createdAt: DateTime
  - expiresAt: DateTime
  - completedAt: DateTime?
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/auth/automated-breakglass.ts
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/AUTH_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/IMPLEMENTATION_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/WHATS_WORKING_NOW.md
- Frontend candidates:
- Test candidates:

### RecurringInvoice (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - customerId: String
  - frequency: String
  - intervalCount: Int
  - startDate: DateTime
  - endDate: DateTime?
  - nextInvoiceDate: DateTime
  - active: Boolean
  - items: Json
  - terms: String?
  - notes: String?
  - currency: String
  - createdAt: DateTime
  - updatedAt: DateTime
  - Customer: Customer
  - Org: Org
- Relations:
  - RecurringInvoice.Customer → Customer
  - RecurringInvoice.Org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/invoices/recurring/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/invoices/recurring/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/invoices/recurring/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/invoices/recurring/recurring-invoices-client.tsx
- Test candidates:

### Referral (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - employeeId: String?
  - referredName: String
  - referredEmail: String?
  - referredPhone: String?
  - status: String
  - convertedAt: DateTime?
  - createdAt: DateTime
  - updatedAt: DateTime
  - Org: Org
- Relations:
  - Referral.Org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/config/leadScoringConfig.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/billing.ts
  - C:/Users/chris/Git Local/Cortiware/docs/ACTUAL_REMAINING_WORK.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/ISSUES_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/IMPLEMENTATION_CHECKLIST.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/leads/LeadsManagementClient.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/(tenant)/leads/page.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/(app)/leads/new/page.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/(app)/leads/page.tsx
- Test candidates:

### RefreshToken (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - sessionId: String
  - userId: String
  - email: String
  - role: String
  - expiresAt: DateTime
  - revoked: Boolean
  - revokedAt: DateTime?
  - createdAt: DateTime
  - updatedAt: DateTime
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/email/gmail.ts
  - C:/Users/chris/Git Local/Cortiware/docs/ACTUAL_REMAINING_WORK.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/ISSUES_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/PHASE_2_IMPLEMENTATION.md
  - C:/Users/chris/Git Local/Cortiware/docs/security/SECURITY_IMPROVEMENTS_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/email/connect/callback/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/email/status/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/auth/logout/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/auth/refresh/route.ts
- Test candidates:

### Rfp (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - publicId: String
  - sourceSite: String
  - title: String
  - dueDate: DateTime?
  - docs: Json
  - aiBidFit: Int?
  - aiPriceHint: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/IMPLEMENTATION_CHECKLIST.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/(tenant)/rfps/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/(tenant)/rfps/[id]/page.tsx
- Test candidates:

### Subscription (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - plan: String
  - status: String
  - startedAt: DateTime
  - canceledAt: DateTime?
  - renewsAt: DateTime?
  - priceCents: Int
  - meta: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/owner/subscription.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/revenue.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/stripe.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/subscriptions.service.ts
  - C:/Users/chris/Git Local/Cortiware/APP_ROUTER_IMPLEMENTATION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/AUDIT_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/AUTONOMOUS_COMPLETION_FINAL.md
  - C:/Users/chris/Git Local/Cortiware/COPILOT_OPERATING_PROCEDURE.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/analytics/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/actions/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/developer/webhooks/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/clients/ClientDetailsModal.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/clients/ClientListTable.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/revenue-intelligence/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/revenue-intelligence/RevenueClient.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/subscriptions/page.tsx
- Test candidates:

### TenantPriceOverride (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - planId: String?
  - priceId: String?
  - type: OverrideType
  - percentOff: Int?
  - amountOffCents: Int?
  - priceCents: Int?
  - startsAt: DateTime?
  - endsAt: DateTime?
  - reason: String?
  - createdAt: DateTime
  - updatedAt: DateTime
  - Org: Org
  - PricePlan: PricePlan?
  - PlanPrice: PlanPrice?
- Relations:
  - TenantPriceOverride.Org → Org
  - TenantPriceOverride.PricePlan → PricePlan
  - TenantPriceOverride.PlanPrice → PlanPrice
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PRECHECK.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/GPT5_NEXT_PHASE_HANDOFF.md
  - C:/Users/chris/Git Local/Cortiware/Reference/MONETIZATION_BLUEPRINT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/SONNET_PROGRESS_TRACKER.md
- Frontend candidates:
- Test candidates:

### UpgradeRecommendation (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - service: InfrastructureService
  - currentPlan: String
  - recommendedPlan: String
  - priority: RecommendationPriority
  - status: RecommendationStatus
  - reason: String
  - currentUsage: Float?
  - usagePercent: Float?
  - currentCost: Float?
  - upgradeCost: Float?
  - revenueImpact: Float?
  - roi: Float?
  - estimatedCostUsd: Float?
  - estimatedSavings: Float?
  - roiMonths: Int?
  - createdAt: DateTime
  - updatedAt: DateTime
  - acknowledgedAt: DateTime?
  - implementedAt: DateTime?
  - benefits: String?
  - daysToLimit: Int?
  - limitValue: Float?
  - profitImpact: Float?
  - projectedCost: Float?
  - risks: String?
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/migrations/MIGRATION_INSTRUCTIONS.md
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/infrastructure/recommendation-engine.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/infrastructure/types.ts
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/AUTONOMOUS_IMPLEMENTATION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/IMPORT_WIZARD_DEPLOYMENT.md
  - C:/Users/chris/Git Local/Cortiware/docs/INFRASTRUCTURE_MONITORING.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/(provider)/infrastructure/InfrastructureDashboard.tsx
- Test candidates:

### UsageMeter (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - meter: String
  - quantity: Int
  - windowStart: DateTime
  - windowEnd: DateTime
  - createdAt: DateTime
  - Org: Org
- Relations:
  - UsageMeter.Org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/usage.service.ts
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/AUDIT_PROGRESS_REPORT_2025-10-10.md
  - C:/Users/chris/Git Local/Cortiware/docs/COMPREHENSIVE_AUDIT_COMPLETE_2025-10-10.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROVIDER_PORTAL_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/TYPECHECK_ERROR_INVENTORY_2025-10-10.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/usage/page.tsx
- Test candidates:

### User (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - email: String
  - name: String?
  - role: Role
  - status: String
  - createdAt: DateTime
  - updatedAt: DateTime
  - mustChangePassword: Boolean
  - passwordHash: String?
  - backupCodesHash: String?
  - failedLoginAttempts: Int
  - isActive: Boolean
  - isLocked: Boolean
  - lastFailedLogin: DateTime?
  - lastPasswordChange: DateTime?
  - lastSuccessfulLogin: DateTime?
  - lockedUntil: DateTime?
  - totpEnabled: Boolean
  - totpSecret: String?
  - ImportJob: ImportJob[]
  - RbacUserRole: RbacUserRole[]
  - Org: Org
  - UserBreakglassAccount: UserBreakglassAccount?
  - UserDeviceFingerprint: UserDeviceFingerprint[]
  - UserLoginHistory: UserLoginHistory[]
  - UserRecoveryCode: UserRecoveryCode[]
  - UserSecurityQuestion: UserSecurityQuestion[]
  - Communication: Communication[]
  - TimeEntry: TimeEntry[]
- Relations:
  - User.ImportJob → ImportJob
  - User.RbacUserRole → RbacUserRole
  - User.Org → Org
  - User.UserBreakglassAccount → UserBreakglassAccount
  - User.UserDeviceFingerprint → UserDeviceFingerprint
  - User.UserLoginHistory → UserLoginHistory
  - User.UserRecoveryCode → UserRecoveryCode
  - User.UserSecurityQuestion → UserSecurityQuestion
  - User.Communication → Communication
  - User.TimeEntry → TimeEntry
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/.github/ISSUE_TEMPLATE/feature.md
  - C:/Users/chris/Git Local/Cortiware/.github/ISSUE_TEMPLATE/slice.md
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/seed.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/accountant-auth.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/ai/usage-pattern-analyzer.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/audit-log.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/auth/automated-breakglass.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/auth/unified-login.ts
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/app/robots.txt/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-robinson/src/app/robots.txt/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-robinson/src/app/terms/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/analytics/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/clients/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/incidents/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/incidents/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/actions/[id]/route.ts
- Test candidates:
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/page-objects/DashboardPage.ts
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/README.md
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/tenant-app/05-ui-components.spec.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/onboarding.accept-public.api.test.ts

### UserBreakglassAccount (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - userId: String
  - orgId: String
  - encryptedEmail: String
  - encryptedPasswordHash: String
  - encryptionIV: String
  - createdAt: DateTime
  - lastActivatedAt: DateTime?
  - activationCount: Int
  - isEnabled: Boolean
  - canAutoActivate: Boolean
  - minDelayMinutes: Int
  - User: User
- Relations:
  - UserBreakglassAccount.User → User
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/AUTH_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/IMPLEMENTATION_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/WHATS_WORKING_NOW.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### UserDeviceFingerprint (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - userId: String
  - fingerprint: String
  - ipAddress: String
  - userAgent: String
  - isTrusted: Boolean
  - trustScore: Int
  - firstSeenAt: DateTime
  - lastSeenAt: DateTime
  - loginCount: Int
  - User: User
- Relations:
  - UserDeviceFingerprint.User → User
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/AUTH_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/IMPLEMENTATION_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/WHATS_WORKING_NOW.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### UserLoginHistory (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - userId: String
  - success: Boolean
  - method: String
  - ipAddress: String
  - userAgent: String
  - deviceFingerprint: String?
  - riskScore: Int
  - riskFactors: String?
  - country: String?
  - city: String?
  - timestamp: DateTime
  - User: User
- Relations:
  - UserLoginHistory.User → User
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/audit-log.ts
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/runbooks/SSO_OUTAGE_RECOVERY.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/AUTH_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/GPT5_HANDOFF.md
- Frontend candidates:
- Test candidates:

### UserRecoveryCode (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - userId: String
  - codeHash: String
  - usedAt: DateTime?
  - usedFrom: String?
  - createdAt: DateTime
  - expiresAt: DateTime
  - User: User
- Relations:
  - UserRecoveryCode.User → User
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/AUTH_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/DEV_ACCOUNT_ACCESS_GUIDE.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/IMPLEMENTATION_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/WHATS_WORKING_NOW.md
- Frontend candidates:
- Test candidates:

### UserSecurityQuestion (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - userId: String
  - question: String
  - answerHash: String
  - createdAt: DateTime
  - User: User
- Relations:
  - UserSecurityQuestion.User → User
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/AUTH_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/IMPLEMENTATION_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/WHATS_WORKING_NOW.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### FeatureFlag (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - key: String
  - name: String
  - description: String?
  - enabled: Boolean
  - global: Boolean
  - rules: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/COPILOT_OPERATING_PROCEDURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/AUTONOMOUS_EXECUTION_PROGRESS_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/M5_UI_INTEGRATION_EXAMPLES.md
  - C:/Users/chris/Git Local/Cortiware/docs/planning/ALL_PHASES_COMPLETE.md
  - C:/Users/chris/Git Local/Cortiware/docs/planning/PHASE5_COMPLETE.md
  - C:/Users/chris/Git Local/Cortiware/docs/planning/UI_COMPONENTS_INTEGRATION_GUIDE.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROJECT_COMPLETION_SUMMARY_2025-10-16.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/settings/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/settings/features/features-client.tsx
- Test candidates:
  - C:/Users/chris/Git Local/Cortiware/tests/unit/ui_components.test.ts

### FeatureModule (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - moduleKey: String
  - name: String
  - description: String?
  - category: String
  - defaultEnabled: Boolean
  - requiresTier: String?
  - verticals: String[]
  - createdAt: DateTime
  - updatedAt: DateTime
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/COPILOT_OPERATING_PROCEDURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### AIBudget (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - monthlyBudget: Decimal
  - currentSpend: Decimal
  - alertThreshold: Int
  - hardLimit: Boolean
  - resetDay: Int
  - createdAt: DateTime
  - updatedAt: DateTime
  - Org: Org
- Relations:
  - AIBudget.Org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/AUDIT_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/AUTONOMOUS_SESSION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/COPILOT_OPERATING_PROCEDURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/PLACEHOLDER_INTELLIGENCE.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/GITHUB_ISSUES_2PHASE_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/IMPLEMENTATION_CHECKLIST.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/ai/budget/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/ai/usage/route.ts
- Test candidates:

### AIAlert (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - alertType: String
  - message: String
  - metadata: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/AUDIT_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/COPILOT_OPERATING_PROCEDURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/PLACEHOLDER_INTELLIGENCE.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/IMPLEMENTATION_CHECKLIST.md
  - C:/Users/chris/Git Local/Cortiware/PHASE_2_COMPLETION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/PHASE_2_SESSION_PROGRESS.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/ai/alerts/route.ts
- Test candidates:

### Communication (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - threadId: String?
  - orgId: String
  - contactId: String
  - userId: String?
  - type: String
  - direction: String
  - subject: String?
  - content: String
  - metadata: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/mobile-nav.tsx
  - C:/Users/chris/Git Local/Cortiware/AUDIT_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/AUTONOMOUS_SESSION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/COMMUNICATION_SYSTEMS_ARCHITECTURE.md
  - C:/Users/chris/Git Local/Cortiware/COPILOT_OPERATING_PROCEDURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/ACTUAL_REMAINING_WORK.md
  - C:/Users/chris/Git Local/Cortiware/docs/GO_LIVE_CLIENT_ONBOARDING_CHECKLIST.md
  - C:/Users/chris/Git Local/Cortiware/docs/ISSUES_SUMMARY.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/app/privacy/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-robinson/src/app/privacy/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/communications/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/communications/threads/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/communications/page.tsx
- Test candidates:

### CommunicationThread (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - contactId: String
  - subject: String?
  - lastMessageAt: DateTime
  - lastMessagePreview: String?
  - unreadCount: Int
  - status: String
  - participants: Json
  - metadata: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/AUDIT_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/COMMUNICATION_SYSTEMS_ARCHITECTURE.md
  - C:/Users/chris/Git Local/Cortiware/COPILOT_OPERATING_PROCEDURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/GITHUB_ISSUES_2PHASE_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/PHASE_2_COMPLETION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/PHASE_2_FINAL_STATUS.md
- Frontend candidates:
- Test candidates:

### SubscriptionTier (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - tierKey: String
  - name: String
  - description: String?
  - basePrice: Decimal
  - annualDiscount: Int
  - billingPeriod: String
  - displayOrder: Int
  - active: Boolean
  - features: String[]
  - createdAt: DateTime
  - updatedAt: DateTime
  - VerticalTierConfig: VerticalTierConfig[]
  - TenantSubscription: TenantSubscription[]
- Relations:
  - SubscriptionTier.VerticalTierConfig → VerticalTierConfig
  - SubscriptionTier.TenantSubscription → TenantSubscription
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/COPILOT_OPERATING_PROCEDURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/GITHUB_ISSUES_2PHASE_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### VerticalTierConfig (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - verticalKey: String
  - subscriptionTierId: String
  - featureModules: String[]
  - limits: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/GITHUB_ISSUES_2PHASE_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### TenantSubscription (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - verticalKey: String
  - subscriptionTierId: String
  - status: String
  - trialEndsAt: DateTime?
  - currentPeriodStart: DateTime
  - currentPeriodEnd: DateTime
  - stripeSubscriptionId: String?
  - stripeCustomerId: String?
  - metadata: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/owner/subscription.service.ts
  - C:/Users/chris/Git Local/Cortiware/COPILOT_OPERATING_PROCEDURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/GITHUB_ISSUES_2PHASE_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/OWNER_PORTAL_BLUEPRINT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/OWNER_PROVIDER_PHASED_CROSSWALK.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/src/app/api/owner/subscription/status/route.ts
- Test candidates:

### TenantUsage (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - usageMonth: DateTime
  - activeUsers: Int
  - activeLocations: Int
  - jobsCreated: Int
  - storageUsedGb: Decimal
  - metadata: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/COPILOT_OPERATING_PROCEDURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/IMPLEMENTATION_CHECKLIST.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### TimeEntry (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - userId: String
  - jobId: String?
  - clockIn: DateTime
  - clockOut: DateTime?
  - breakMinutes: Int
  - totalHours: Decimal?
  - hourlyRate: Decimal
  - totalPay: Decimal?
  - status: String
  - notes: String?
  - gpsClockIn: Json?
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/AUDIT_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/COPILOT_OPERATING_PROCEDURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/IMPLEMENTATION_CHECKLIST.md
  - C:/Users/chris/Git Local/Cortiware/packages/queue/src/jobs/index.ts
  - C:/Users/chris/Git Local/Cortiware/PHASE_2_FINAL_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/PHASE_2_STUB_AUDIT.md
- Frontend candidates:
- Test candidates:

### Subcontractor (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - companyName: String
  - contactName: String?
  - email: String?
  - phone: String?
  - specialties: String[]
  - status: String
  - rating: Decimal?
  - completedJobs: Int
  - hourlyRate: Decimal?
  - insurance: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/AUDIT_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/AUTONOMOUS_SESSION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/COPILOT_OPERATING_PROCEDURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/ACTUAL_REMAINING_WORK.md
  - C:/Users/chris/Git Local/Cortiware/docs/ISSUES_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/GITHUB_ISSUES_2PHASE_PLAN.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/subcontractors/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/subcontractors/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/subcontractors/subcontractors-client.tsx
- Test candidates:

### RecurringService (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - customerId: String
  - serviceName: String
  - description: String?
  - frequency: String
  - price: Decimal
  - status: String
  - nextServiceDate: DateTime?
  - lastServiceDate: DateTime?
  - startDate: DateTime
  - contractEndDate: DateTime?
  - autoRenew: Boolean
  - totalServices: Int
  - completedServices: Int
  - notes: String?
  - metadata: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/AUDIT_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/COPILOT_OPERATING_PROCEDURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PHASE_2_FINAL_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/PHASE_2_STUB_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/recurring-services/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/recurring-services/recurring-services-client.tsx
- Test candidates:

### JobCost (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - jobId: String
  - laborCost: Decimal
  - materialsCost: Decimal
  - equipmentCost: Decimal
  - overheadCost: Decimal
  - totalCost: Decimal
  - estimatedCost: Decimal
  - variance: Decimal
  - revenue: Decimal
  - profit: Decimal
  - profitMargin: Decimal
  - status: String
  - notes: String?
  - createdAt: DateTime
  - updatedAt: DateTime
  - completedAt: DateTime?
  - org: Org
  - job: Job
- Relations:
  - JobCost.org → Org
  - JobCost.job → Job
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/AUDIT_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/COPILOT_OPERATING_PROCEDURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/IMPLEMENTATION_CHECKLIST.md
  - C:/Users/chris/Git Local/Cortiware/PHASE_2_FINAL_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/PHASE_2_STUB_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/job-costing/job-costing-client.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/job-costing/page.tsx
- Test candidates:

### VerticalPack (C:\Users\chris\Git Local\Cortiware\prisma\schema.prisma)

- Fields:
  - id: String
  - key: String
  - name: String
  - description: String?
  - icon: String?
  - category: String
  - features: Json
  - customFields: Json
  - isActive: Boolean
  - displayOrder: Int
  - createdAt: DateTime
  - updatedAt: DateTime
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/COPILOT_OPERATING_PROCEDURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/2/packages/verticals/src/index.ts
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/2/packages/verticals/src/packs/concrete-lifting-and-leveling.ts
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/packages/verticals/src/index.ts
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/packages/verticals/src/packs/port-a-john.ts
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/IMPLEMENTATION_CHECKLIST.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/vertical-packs/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/settings/vertical-pack/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/settings/vertical-pack/vertical-pack-client.tsx
- Test candidates:

### Org (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - name: String
  - featureFlags: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/seed-leads.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/seed.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/aiMeter.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/api/v2.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/auth/automated-breakglass.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/auth-helpers.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/auth-owner.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/federation/idempotency.ts
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-robinson/src/app/layout.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-robinson/src/app/services/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/ai/alerts/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/analytics/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/actions/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/audit/export/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/leads/advanced-filter/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/leads/export/route.ts
- Test candidates:
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/testing/e2e-plan.md
  - C:/Users/chris/Git Local/Cortiware/tests/FEDERATION_TESTS.md
  - C:/Users/chris/Git Local/Cortiware/tests/integration/api-leads.test.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/federation.ratelimit.test.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/run.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/validation.organizations.test.ts

### User (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - email: String
  - name: String?
  - role: Role
  - passwordHash: String?
  - mustChangePassword: Boolean
  - status: String
  - createdAt: DateTime
  - updatedAt: DateTime
  - isActive: Boolean
  - isLocked: Boolean
  - lockedUntil: DateTime?
  - failedLoginAttempts: Int
  - lastFailedLogin: DateTime?
  - lastSuccessfulLogin: DateTime?
  - lastPasswordChange: DateTime?
  - totpSecret: String?
  - totpEnabled: Boolean
  - backupCodesHash: String?
  - org: Org
  - rbacUserRoles: RbacUserRole[]
  - recoveryCodes: UserRecoveryCode[]
  - breakglassAccount: UserBreakglassAccount?
  - securityQuestions: UserSecurityQuestion[]
  - loginHistory: UserLoginHistory[]
  - deviceFingerprints: UserDeviceFingerprint[]
- Relations:
  - User.org → Org
  - User.rbacUserRoles → RbacUserRole
  - User.recoveryCodes → UserRecoveryCode
  - User.breakglassAccount → UserBreakglassAccount
  - User.securityQuestions → UserSecurityQuestion
  - User.loginHistory → UserLoginHistory
  - User.deviceFingerprints → UserDeviceFingerprint
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/.github/ISSUE_TEMPLATE/feature.md
  - C:/Users/chris/Git Local/Cortiware/.github/ISSUE_TEMPLATE/slice.md
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/seed.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/accountant-auth.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/ai/usage-pattern-analyzer.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/audit-log.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/auth/automated-breakglass.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/auth/unified-login.ts
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/app/robots.txt/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-robinson/src/app/robots.txt/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-robinson/src/app/terms/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/analytics/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/clients/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/incidents/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/incidents/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/actions/[id]/route.ts
- Test candidates:
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/page-objects/DashboardPage.ts
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/README.md
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/tenant-app/05-ui-components.spec.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/onboarding.accept-public.api.test.ts

### UserRecoveryCode (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - userId: String
  - codeHash: String
  - usedAt: DateTime?
  - usedFrom: String?
  - createdAt: DateTime
  - expiresAt: DateTime
  - user: User
- Relations:
  - UserRecoveryCode.user → User
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/AUTH_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/DEV_ACCOUNT_ACCESS_GUIDE.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/IMPLEMENTATION_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/WHATS_WORKING_NOW.md
- Frontend candidates:
- Test candidates:

### UserSecurityQuestion (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - userId: String
  - question: String
  - answerHash: String
  - createdAt: DateTime
  - user: User
- Relations:
  - UserSecurityQuestion.user → User
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/AUTH_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/IMPLEMENTATION_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/WHATS_WORKING_NOW.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### UserBreakglassAccount (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - userId: String
  - orgId: String
  - encryptedEmail: String
  - encryptedPasswordHash: String
  - encryptionIV: String
  - createdAt: DateTime
  - lastActivatedAt: DateTime?
  - activationCount: Int
  - isEnabled: Boolean
  - canAutoActivate: Boolean
  - minDelayMinutes: Int
  - user: User
- Relations:
  - UserBreakglassAccount.user → User
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/AUTH_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/IMPLEMENTATION_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/WHATS_WORKING_NOW.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### UserDeviceFingerprint (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - userId: String
  - fingerprint: String
  - ipAddress: String
  - userAgent: String
  - isTrusted: Boolean
  - trustScore: Int
  - firstSeenAt: DateTime
  - lastSeenAt: DateTime
  - loginCount: Int
  - user: User
- Relations:
  - UserDeviceFingerprint.user → User
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/AUTH_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/IMPLEMENTATION_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/WHATS_WORKING_NOW.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### UserLoginHistory (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - userId: String
  - success: Boolean
  - method: String
  - ipAddress: String
  - userAgent: String
  - deviceFingerprint: String?
  - riskScore: Int
  - riskFactors: String?
  - country: String?
  - city: String?
  - timestamp: DateTime
  - user: User
- Relations:
  - UserLoginHistory.user → User
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/audit-log.ts
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/runbooks/SSO_OUTAGE_RECOVERY.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/AUTH_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/GPT5_HANDOFF.md
- Frontend candidates:
- Test candidates:

### BreakglassActivationLog (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - userId: String
  - orgId: String
  - reason: String
  - method: String
  - riskScore: Int
  - riskFactors: String
  - delayMinutes: Int
  - verificationSteps: String
  - ipAddress: String
  - userAgent: String
  - success: Boolean
  - errorMessage: String?
  - notifiedAdmins: String
  - timestamp: DateTime
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/AUTH_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/IMPLEMENTATION_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/WHATS_WORKING_NOW.md
- Frontend candidates:
- Test candidates:

### RecoveryRequest (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - userId: String
  - orgId: String
  - type: String
  - status: String
  - verificationToken: String
  - verificationCode: String?
  - codeExpiresAt: DateTime?
  - codeAttempts: Int
  - riskScore: Int
  - delayUntil: DateTime
  - ipAddress: String
  - userAgent: String
  - createdAt: DateTime
  - expiresAt: DateTime
  - completedAt: DateTime?
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/auth/automated-breakglass.ts
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/AUTH_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/IMPLEMENTATION_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/WHATS_WORKING_NOW.md
- Frontend candidates:
- Test candidates:

### Lead (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - publicId: String
  - sourceType: LeadSource
  - identityHash: String
  - company: String?
  - contactName: String?
  - email: String?
  - phoneE164: String?
  - website: String?
  - serviceCode: String?
  - zip: String?
  - enrichmentJson: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/seed-leads.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/seed.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/components/AiInsights.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/components/AppNav.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/components/AppShell.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/components/QuickActions.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/config/leadScoringConfig.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/ai/usage-pattern-analyzer.ts
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/app/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/analytics/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/federation/clients/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/federation/clients/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/leads/dispute/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/leads/quality-score/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/leads/reclassify/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/leads/seed/route.ts
- Test candidates:
  - C:/Users/chris/Git Local/Cortiware/Reference/repo-docs/docs/testing/e2e-plan.md
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/page-objects/DashboardPage.ts
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/page-objects/LeadsPage.ts
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/README.md
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/tenant-app/02-leads-management.spec.ts
  - C:/Users/chris/Git Local/Cortiware/tests/integration/api-leads.test.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/run.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/validation.leads.test.ts

### Customer (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - publicId: String
  - company: String?
  - primaryName: String?
  - primaryEmail: String?
  - primaryPhone: String?
  - notes: String?
  - createdAt: DateTime
  - updatedAt: DateTime
  - org: Org
  - invoices: Invoice[]
  - jobs: Job[]
  - opportunities: Opportunity[]
- Relations:
  - Customer.org → Org
  - Customer.invoices → Invoice
  - Customer.jobs → Job
  - Customer.opportunities → Opportunity
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/lib/pricing.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/seed-compliance.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/config/leadScoringConfig.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/stripeHelpers.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/infrastructure/recommendation-engine.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/owner/billing.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/owner/subscription.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/dunning.service.ts
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/app/about/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/app/industries/cleaning/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/app/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/app/privacy/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/incidents/IncidentsClient.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/revenue-intelligence/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/revenue-intelligence/RevenueClient.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/agreements/page.tsx
- Test candidates:
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/page-objects/DashboardPage.ts
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/page-objects/JobsPage.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/importers_schema.test.ts

### Opportunity (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - customerId: String
  - valueType: ValueType
  - estValue: Decimal?
  - stage: String
  - ownerId: String?
  - sourceLeadId: String?
  - classification: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/aiResponseTemplates.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/api/v2.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/validation/opportunities.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/opportunities.service.ts
  - C:/Users/chris/Git Local/Cortiware/AUDIT_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/AUTONOMOUS_COMPLETION_FINAL.md
  - C:/Users/chris/Git Local/Cortiware/COPILOT_OPERATING_PROCEDURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/AI_PRODUCTION_READINESS_SUMMARY.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/src/app/(app)/leads/[id]/convert-modal.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/(app)/leads/[id]/page.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/(app)/opportunities/new/page.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/(app)/opportunities/page.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/(app)/opportunities/[id]/edit-form.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/(app)/opportunities/[id]/page.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/api/v2/opportunities/route.ts
  - C:/Users/chris/Git Local/Cortiware/src/app/api/v2/opportunities/[id]/route.ts
- Test candidates:
  - C:/Users/chris/Git Local/Cortiware/tests/unit/validation.opportunities.test.ts

### Invoice (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - customerId: String?
  - amount: Decimal
  - status: String
  - issuedAt: DateTime
  - items: Json
  - lineItems: InvoiceLine[]
  - customer: Customer?
  - org: Org
  - payments: Payment[]
- Relations:
  - Invoice.lineItems → InvoiceLine
  - Invoice.customer → Customer
  - Invoice.org → Org
  - Invoice.payments → Payment
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/components/DashboardBillableCard.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/mocks/provider/billing.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/accountant/stats.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/owner/billing.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/billing.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/invoices.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/stats.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/breadcrumbs.tsx
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/billing/retry/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/clients/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/invoices/[id]/html/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/invoices/[id]/pdf/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/invoices/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/v1/federation/analytics/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/v1/federation/billing/invoice/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/developer/webhooks/page.tsx
- Test candidates:
  - C:/Users/chris/Git Local/Cortiware/tests/FEDERATION_TESTS.md
  - C:/Users/chris/Git Local/Cortiware/tests/unit/importers_schema.test.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/wallet.test.ts

### Payment (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - invoiceId: String?
  - amount: Decimal
  - method: String
  - receivedAt: DateTime
  - reference: String?
  - status: String
  - stripePaymentIntentId: String?
  - stripeChargeId: String?
  - failureReason: String?
  - retryCount: Int
  - lastRetryAt: DateTime?
  - invoice: Invoice?
  - org: Org
- Relations:
  - Payment.invoice → Invoice
  - Payment.org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/seed-compliance.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/accountant/stats.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/billing.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/dunning.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/stripe.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/tenant-health.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/empty-state.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/payment-modal.tsx
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/app/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/actions/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/developer/webhooks/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/billing/BillingUpdateForm.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/invoices/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/invoices/[id]/payment-intent/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/invoices/[id]/payments/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/invoices/[id]/route.ts
- Test candidates:
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/page-objects/WalletPage.ts
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/README.md
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/tenant-app/04-wallet.spec.ts
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/tenant-app/05-ui-components.spec.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/ui_components.test.ts

### Rfp (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - publicId: String
  - sourceSite: String
  - title: String
  - dueDate: DateTime?
  - docs: Json
  - aiBidFit: Int?
  - aiPriceHint: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/IMPLEMENTATION_CHECKLIST.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/(tenant)/rfps/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/(tenant)/rfps/[id]/page.tsx
- Test candidates:

### Job (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - customerId: String?
  - rfpId: String?
  - status: String
  - schedule: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/migrations/MIGRATION_INSTRUCTIONS.md
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/breadcrumbs.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/empty-state.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/job-photo-gallery.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/keyboard-shortcuts.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/mobile-nav.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/optimized-image.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/schedule/draggable-job.tsx
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/analytics/snapshot/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/cron/collect-metrics/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/customers/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/customers/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/import/csv/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/job-costing/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/jobs/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/jobs/[id]/photos/route.ts
- Test candidates:
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/page-objects/DashboardPage.ts
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/page-objects/JobsPage.ts
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/README.md
  - C:/Users/chris/Git Local/Cortiware/tests/e2e-playwright/tenant-app/03-jobs-management.spec.ts
  - C:/Users/chris/Git Local/Cortiware/tests/unit/importers_schema.test.ts

### Referral (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - employeeId: String?
  - referredName: String
  - referredEmail: String?
  - referredPhone: String?
  - status: String
  - convertedAt: DateTime?
  - createdAt: DateTime
  - updatedAt: DateTime
  - org: Org
- Relations:
  - Referral.org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/config/leadScoringConfig.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/billing.ts
  - C:/Users/chris/Git Local/Cortiware/docs/ACTUAL_REMAINING_WORK.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/ISSUES_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/IMPLEMENTATION_CHECKLIST.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/leads/LeadsManagementClient.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/(tenant)/leads/page.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/(app)/leads/new/page.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/(app)/leads/page.tsx
- Test candidates:

### BillingLedger (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - type: LedgerType
  - amount: Decimal
  - meta: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/AUTONOMOUS_EXECUTION_PROGRESS_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROJECT_COMPLETION_SUMMARY_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/HANDOFF_GPT5.md
  - C:/Users/chris/Git Local/Cortiware/Reference/Provider/PROVIDER_OPERATIONS_BLUEPRINT.md
- Frontend candidates:
- Test candidates:

### LeadInvoice (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String?
  - org: Org?
  - number: String
  - periodFrom: DateTime
  - periodTo: DateTime
  - status: String
  - subtotalCents: Int
  - taxCents: Int
  - totalCents: Int
  - currency: String
  - stripeInvoiceId: String?
  - createdAt: DateTime
  - updatedAt: DateTime
  - leadCount: Int
  - lines: LeadInvoiceLine[]
- Relations:
  - LeadInvoice.org → Org
  - LeadInvoice.lines → LeadInvoiceLine
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/billing.service.ts
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/archive/FINAL_COMPLETION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/Provider/PROVIDER_OPERATIONS_BLUEPRINT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### LeadInvoiceLine (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - invoiceId: String
  - invoice: LeadInvoice
  - leadId: String?
  - lead: Lead?
  - description: String
  - quantity: Int
  - unitPriceCents: Int
  - amountCents: Int
  - source: String?
  - createdAt: DateTime
- Relations:
  - LeadInvoiceLine.invoice → LeadInvoice
  - LeadInvoiceLine.lead → Lead
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/billing.service.ts
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/archive/FINAL_COMPLETION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/Provider/PROVIDER_OPERATIONS_BLUEPRINT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### AuditLog (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - actorUserId: String?
  - entity: String
  - entityId: String?
  - field: String?
  - oldValue: Json?
  - newValue: Json?
  - reason: String?
  - createdAt: DateTime
  - org: Org
- Relations:
  - AuditLog.org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/api/middleware.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/audit/with-audit-log.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/audit-log.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/federation-audit.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/audit.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/lib/audit-log.ts
  - C:/Users/chris/Git Local/Cortiware/docs/architecture/diagrams/deployment-architecture.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/federation/providers/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/federation/providers/[id]/test/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/billing/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/revenue/export/route.ts
- Test candidates:

### RbacPermission (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - code: String
  - description: String?
  - createdAt: DateTime
  - rolePerms: RbacRolePermission[]
- Relations:
  - RbacPermission.rolePerms → RbacRolePermission
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PRECHECK.md
  - C:/Users/chris/Git Local/Cortiware/PHASE_2_FINAL_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/permissions/route.ts
- Test candidates:

### RbacRole (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String?
  - org: Org?
  - name: String
  - slug: String
  - isSystem: Boolean
  - createdAt: DateTime
  - rolePerms: RbacRolePermission[]
  - userRoles: RbacUserRole[]
- Relations:
  - RbacRole.org → Org
  - RbacRole.rolePerms → RbacRolePermission
  - RbacRole.userRoles → RbacUserRole
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/PROVIDER_PORTAL_END_TO_END_DELIVERY_RUNBOOK_v2.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PRECHECK.md
  - C:/Users/chris/Git Local/Cortiware/PHASE_2_FINAL_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/permissions/route.ts
- Test candidates:

### RbacRolePermission (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - roleId: String
  - permissionId: String
  - role: RbacRole
  - permission: RbacPermission
- Relations:
  - RbacRolePermission.role → RbacRole
  - RbacRolePermission.permission → RbacPermission
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PRECHECK.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/permissions/route.ts
- Test candidates:

### RbacUserRole (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - userId: String
  - orgId: String?
  - roleId: String
  - user: User
  - org: Org?
  - role: RbacRole
- Relations:
  - RbacUserRole.user → User
  - RbacUserRole.org → Org
  - RbacUserRole.role → RbacRole
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/PROVIDER_PORTAL_END_TO_END_DELIVERY_RUNBOOK_v2.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PRECHECK.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
  - C:/Users/chris/Git Local/Cortiware/src/\_disabled/pages/api/tenant/register.ts
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/permissions/route.ts
- Test candidates:

### ProviderConfig (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - samApiKey: String?
  - stripeSecretKey: String?
  - otherConfig: Json?
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/LEGACY_MIGRATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/MASTER_IMPLEMENTATION_PLAN_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_COMPLETE_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_PROGRESS_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROVIDER_PORTAL_INVESTIGATION_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROVIDER_PORTAL_ISSUES_AND_FIXES_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/feature-flags/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/settings/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/theme/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/settings/features/features-client.tsx
- Test candidates:

### PricingPlan (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - orgId: String
  - org: Org
  - model: PricingModel
  - currency: String
  - unitAmount: Int
  - tiersJson: Json?
  - includedUnits: Int
- Relations:
  - PricingPlan.org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-cortiware/src/lib/pricing.ts
  - C:/Users/chris/Git Local/Cortiware/docs/PRICING_MANAGEMENT_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/prisma/seed-marketing-pricing.ts
  - C:/Users/chris/Git Local/Cortiware/Reference/PROVIDER_CONTROL_CENTER_BLUEPRINT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
  - C:/Users/chris/Git Local/Cortiware/src/\_disabled/pages/api/integrations/sam/fetch.ts
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/admin/pricing/plans/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/admin/pricing/plans/[id]/approve/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/admin/pricing/plans/[id]/publish/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/admin/pricing/plans/[id]/reject/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/admin/pricing/plans/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/admin/pricing/plans/[id]/submit-review/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/admin/pricing/plans/[id]/unpublish/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/public/pricing/route.ts
- Test candidates:

### AiUsageEvent (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - userId: String?
  - feature: String
  - model: String
  - tokensIn: Int
  - tokensOut: Int
  - costUsd: Decimal
  - creditsUsed: Int
  - requestId: String?
  - createdAt: DateTime
  - org: Org
- Relations:
  - AiUsageEvent.org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/infrastructure/ai-usage-monitor.ts
  - C:/Users/chris/Git Local/Cortiware/AUTONOMOUS_SESSION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/AI_PRODUCTION_READINESS_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/AUTONOMOUS_PHASE_1_FINAL_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/COMPREHENSIVE_CODEBASE_REVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/DOCUMENTATION_AUDIT_REPORT_2025-10-12.md
  - C:/Users/chris/Git Local/Cortiware/docs/INFRASTRUCTURE_MONITORING.md
- Frontend candidates:
- Test candidates:

### AiMonthlySummary (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - monthKey: String
  - tokensIn: Int
  - tokensOut: Int
  - costUsd: Decimal
  - creditsUsed: Int
  - callCount: Int
  - createdAt: DateTime
  - updatedAt: DateTime
  - org: Org
- Relations:
  - AiMonthlySummary.org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/infrastructure/ai-usage-monitor.ts
  - C:/Users/chris/Git Local/Cortiware/docs/AI_PRODUCTION_READINESS_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/COMPREHENSIVE_CODEBASE_REVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/INFRASTRUCTURE_MONITORING.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/IMPLEMENTATION_CHECKLIST.md
- Frontend candidates:
- Test candidates:

### InfrastructureMetric (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - service: InfrastructureService
  - metric: MetricType
  - value: Float
  - timestamp: DateTime
  - metadata: Json?
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/migrations/MIGRATION_INSTRUCTIONS.md
  - C:/Users/chris/Git Local/Cortiware/docs/AUTONOMOUS_IMPLEMENTATION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/INFRASTRUCTURE_MONITORING.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/TWO_PERSONA_PORTALS_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/(provider)/infrastructure/InfrastructureDashboard.tsx
- Test candidates:

### InfrastructureLimit (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - service: InfrastructureService
  - metric: MetricType
  - currentPlan: String
  - limitValue: Float
  - warningPercent: Float
  - criticalPercent: Float
  - updatedAt: DateTime
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/migrations/MIGRATION_INSTRUCTIONS.md
  - C:/Users/chris/Git Local/Cortiware/docs/AUTONOMOUS_IMPLEMENTATION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/INFRASTRUCTURE_MONITORING.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/(provider)/infrastructure/InfrastructureDashboard.tsx
- Test candidates:

### UpgradeRecommendation (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - service: InfrastructureService
  - currentPlan: String
  - recommendedPlan: String
  - priority: RecommendationPriority
  - status: RecommendationStatus
  - currentUsage: Float
  - limitValue: Float
  - usagePercent: Float
  - daysToLimit: Int?
  - currentCost: Decimal?
  - projectedCost: Decimal?
  - upgradeCost: Decimal?
  - revenueImpact: Decimal?
  - profitImpact: Decimal?
  - roi: Float?
  - reason: String
  - benefits: Json?
  - risks: Json?
  - createdAt: DateTime
  - updatedAt: DateTime
  - reviewedAt: DateTime?
  - reviewedBy: String?
  - implementedAt: DateTime?
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/prisma/migrations/MIGRATION_INSTRUCTIONS.md
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/infrastructure/recommendation-engine.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/infrastructure/types.ts
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/AUTONOMOUS_IMPLEMENTATION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/IMPORT_WIZARD_DEPLOYMENT.md
  - C:/Users/chris/Git Local/Cortiware/docs/INFRASTRUCTURE_MONITORING.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/(provider)/infrastructure/InfrastructureDashboard.tsx
- Test candidates:

### Activity (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - actorType: String
  - actorId: String?
  - entityType: String
  - entityId: String
  - action: String
  - meta: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/metrics.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/analytics.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/audit.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/compliance.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/incidents.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/stats.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/components/skeleton.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/lib/wallet.ts
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/analytics/snapshot/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/clients/FederatedClientsSection.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/compliance/ComplianceClient.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/metrics/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/dashboard/dashboard-client.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/jobs/[id]/job-detail-client.tsx
- Test candidates:

### Subscription (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - plan: String
  - status: String
  - startedAt: DateTime
  - canceledAt: DateTime?
  - renewsAt: DateTime?
  - priceCents: Int
  - meta: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/owner/subscription.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/revenue.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/stripe.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/subscriptions.service.ts
  - C:/Users/chris/Git Local/Cortiware/APP_ROUTER_IMPLEMENTATION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/AUDIT_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/AUTONOMOUS_COMPLETION_FINAL.md
  - C:/Users/chris/Git Local/Cortiware/COPILOT_OPERATING_PROCEDURE.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/analytics/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/actions/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/developer/webhooks/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/clients/ClientDetailsModal.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/clients/ClientListTable.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/revenue-intelligence/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/revenue-intelligence/RevenueClient.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/subscriptions/page.tsx
- Test candidates:

### UsageMeter (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - meter: String
  - quantity: Int
  - windowStart: DateTime
  - windowEnd: DateTime
  - createdAt: DateTime
  - org: Org
- Relations:
  - UsageMeter.org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/usage.service.ts
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/AUDIT_PROGRESS_REPORT_2025-10-10.md
  - C:/Users/chris/Git Local/Cortiware/docs/COMPREHENSIVE_AUDIT_COMPLETE_2025-10-10.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROVIDER_PORTAL_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/TYPECHECK_ERROR_INVENTORY_2025-10-10.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/usage/page.tsx
- Test candidates:

### AddonPurchase (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - sku: String
  - amount: Decimal
  - status: String
  - purchasedAt: DateTime
  - refundedAt: DateTime?
  - meta: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/addons.service.ts
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/AUDIT_PROGRESS_REPORT_2025-10-10.md
  - C:/Users/chris/Git Local/Cortiware/docs/COMPREHENSIVE_AUDIT_COMPLETE_2025-10-10.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROVIDER_PORTAL_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/TYPECHECK_ERROR_INVENTORY_2025-10-10.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/addons/page.tsx
- Test candidates:

### FederationKey (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - keyId: String
  - secretHash: String
  - orgId: String
  - createdAt: DateTime
  - disabledAt: DateTime?
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/BUILD_PLAN_PROVIDER_PORTAL.md
  - C:/Users/chris/Git Local/Cortiware/COMPLETE_FEATURE_VERIFICATION.md
  - C:/Users/chris/Git Local/Cortiware/docs/architecture/diagrams/data-flow.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/DOCUMENTATION_AUDIT_REPORT_2025-10-12.md
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_Implementation_Guide_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_PR_Plan_and_Templates_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/HANDOFF_PROVIDER_PORTAL_2025-10-10.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/federation/FederationKeys.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/federation/page.tsx
- Test candidates:

### OIDCConfig (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - enabled: Boolean
  - issuerUrl: String
  - clientId: String
  - clientSecret: String
  - scopes: String
  - createdAt: DateTime
  - updatedAt: DateTime
  - lastTestedAt: DateTime?
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/oidc.ts
  - C:/Users/chris/Git Local/Cortiware/BUILD_PLAN_PROVIDER_PORTAL.md
  - C:/Users/chris/Git Local/Cortiware/COMPLETE_FEATURE_VERIFICATION.md
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_Implementation_Guide_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_PR_Plan_and_Templates_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/FEDERATION_V3_IMPLEMENTATION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/PROVIDER_PORTAL_END_TO_END_DELIVERY_RUNBOOK_v2.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/PROVIDER_PORTAL_STRATEGIC_ENHANCEMENT_PLAN_v2.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/federation/oidc/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/federation/OIDCConfig.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/federation/page.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/api/auth/oidc/callback/route.ts
- Test candidates:

### ProviderIntegration (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - name: String
  - type: String
  - config: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/BUILD_PLAN_PROVIDER_PORTAL.md
  - C:/Users/chris/Git Local/Cortiware/COMPLETE_FEATURE_VERIFICATION.md
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_Implementation_Guide_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_PR_Plan_and_Templates_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/FEDERATION_V3_IMPLEMENTATION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/PROVIDER_PORTAL_END_TO_END_DELIVERY_RUNBOOK_v2.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/PROVIDER_PORTAL_STRATEGIC_ENHANCEMENT_PLAN_v2.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROVIDER_PORTAL_IMPLEMENTATION_PLAN.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/federation/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/federation/ProviderIntegrations.tsx
- Test candidates:

### AuditEvent (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - actorType: String
  - actorId: String?
  - orgId: String?
  - action: String
  - entityType: String
  - entityId: String?
  - result: String
  - metadata: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/api/audit-middleware.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/audit/audit-event.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/audit/with-audit-log.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/audit-log.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/auditService.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/consolidated-audit.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/federation-audit.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/types/common.types.ts
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/audit/export/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/audit/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/compliance/ComplianceClient.tsx
- Test candidates:

### AnalyticsSnapshot (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - snapshotDate: DateTime
  - mrrCents: Int
  - arrCents: Int
  - activeClients: Int
  - newClients: Int
  - churnedClients: Int
  - totalRevenue: Int
  - metricsJson: Json
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/IMPLEMENTATION_CHECKLIST.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/PHASE3_COMPLETE.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_COMPLETE_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PHASE1_PHASE3_COMPLETE.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### Incident (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - severity: IncidentSeverity
  - status: IncidentStatus
  - title: String
  - description: String
  - assigneeUserId: String?
  - slaResponseDeadline: DateTime?
  - slaResolveDeadline: DateTime?
  - acknowledgedAt: DateTime?
  - resolvedAt: DateTime?
  - closedAt: DateTime?
  - createdAt: DateTime
  - updatedAt: DateTime
  - org: Org
- Relations:
  - Incident.org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/rbac/roles.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/mocks/provider/incidents.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/incidents.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/tenant-health.service.ts
  - C:/Users/chris/Git Local/Cortiware/BUILD_PLAN_PROVIDER_PORTAL.md
  - C:/Users/chris/Git Local/Cortiware/COMPLETE_FEATURE_VERIFICATION.md
  - C:/Users/chris/Git Local/Cortiware/docs/ACTUAL_REMAINING_WORK.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/marketing-robinson/src/app/security/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/incidents/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/v1/federation/escalation/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/dev-aids/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/incidents/IncidentsClient.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/incidents/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/ProviderShellClient.tsx
  - C:/Users/chris/Git Local/Cortiware/src/app/(owner)/owner/incidents/page.tsx
- Test candidates:

### InvoiceLine (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - invoiceId: String
  - description: String
  - lineType: InvoiceLineType
  - quantity: Int
  - unitPriceCents: Int
  - amountCents: Int
  - sourceType: String?
  - sourceId: String?
  - createdAt: DateTime
  - invoice: Invoice
- Relations:
  - InvoiceLine.invoice → Invoice
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/billing.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/invoices.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/lib/validations/invoice.ts
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/archive/FINAL_COMPLETION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/tenant-app/SYSTEM_ARCHITECTURE.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/invoices/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/invoices/[id]/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/invoices/[id]/page.tsx
- Test candidates:

### Notification (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String?
  - audience: String
  - type: String
  - title: String
  - body: String
  - severity: String
  - readAt: DateTime?
  - createdAt: DateTime
  - org: Org?
- Relations:
  - Notification.org → Org
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/notifications.service.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/lib/email-notifications.ts
  - C:/Users/chris/Git Local/Cortiware/AUDIT_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/COMPLETE_FEATURE_VERIFICATION.md
  - C:/Users/chris/Git Local/Cortiware/docs/ACTUAL_REMAINING_WORK.md
  - C:/Users/chris/Git Local/Cortiware/docs/architecture/diagrams/deployment-architecture.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/FEDERATION_V3_IMPLEMENTATION_REPORT.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/notifications/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/settings/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/settings/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/ProviderShellClient.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/api/notifications/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/notifications/notifications-client.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/notifications/page.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/app/settings/integrations/integrations-client.tsx
- Test candidates:

### PricePlan (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - key: String
  - name: String
  - description: String?
  - active: Boolean
  - createdAt: DateTime
  - updatedAt: DateTime
  - prices: PlanPrice[]
  - offers: Offer[]
  - overrides: TenantPriceOverride[]
  - asDefaultFor: GlobalMonetizationConfig[]
  - invites: OnboardingInvite[]
- Relations:
  - PricePlan.prices → PlanPrice
  - PricePlan.offers → Offer
  - PricePlan.overrides → TenantPriceOverride
  - PricePlan.asDefaultFor → GlobalMonetizationConfig
  - PricePlan.invites → OnboardingInvite
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/architecture/diagrams/data-flow.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/DOCUMENTATION_AUDIT_REPORT_2025-10-12.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PRECHECK.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/GPT5_NEXT_PHASE_HANDOFF.md
- Frontend candidates:
- Test candidates:

### PlanPrice (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - planId: String
  - currency: String
  - unitAmountCents: Int
  - cadence: BillingCadence
  - trialDays: Int?
  - active: Boolean
  - stripePriceId: String?
  - createdAt: DateTime
  - overrides: TenantPriceOverride[]
  - asDefaultFor: GlobalMonetizationConfig[]
  - invites: OnboardingInvite[]
  - updatedAt: DateTime
  - plan: PricePlan
- Relations:
  - PlanPrice.overrides → TenantPriceOverride
  - PlanPrice.asDefaultFor → GlobalMonetizationConfig
  - PlanPrice.invites → OnboardingInvite
  - PlanPrice.plan → PricePlan
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/APP_ROUTER_IMPLEMENTATION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/archive/COMPLETION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/IMPLEMENTATION_STATUS.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PRECHECK.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
- Frontend candidates:
- Test candidates:

### Offer (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - name: String
  - percentOff: Int?
  - amountOffCents: Int?
  - duration: String?
  - durationMonths: Int?
  - appliesToPlanId: String?
  - startsAt: DateTime?
  - endsAt: DateTime?
  - active: Boolean
  - createdAt: DateTime
  - updatedAt: DateTime
  - appliesToPlan: PricePlan?
  - invites: OnboardingInvite[]
- Relations:
  - Offer.appliesToPlan → PricePlan
  - Offer.invites → OnboardingInvite
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/aiResponseTemplates.ts
  - C:/Users/chris/Git Local/Cortiware/APP_ROUTER_IMPLEMENTATION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/AUTONOMOUS_COMPLETION_FINAL.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/archive/COMPLETION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/archive/FINAL_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROVIDER_PORTAL_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROVIDER_PORTAL_AUDIT_SUMMARY.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/monetization/MonetizationClient.tsx
- Test candidates:

### Coupon (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - code: String
  - name: String?
  - percentOff: Int?
  - amountOffCents: Int?
  - duration: String?
  - durationMonths: Int?
  - startsAt: DateTime?
  - endsAt: DateTime?
  - maxRedemptions: Int?
  - active: Boolean
  - createdAt: DateTime
  - updatedAt: DateTime
  - invites: OnboardingInvite[]
- Relations:
  - Coupon.invites → OnboardingInvite
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/APP_ROUTER_IMPLEMENTATION_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/AUTONOMOUS_COMPLETION_FINAL.md
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/archive/COMPLETION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/archive/FINAL_SUMMARY.md
  - C:/Users/chris/Git Local/Cortiware/docs/DOCUMENTATION_AUDIT_REPORT_2025-10-12.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRICING_MANAGEMENT_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/PROVIDER_PORTAL_END_TO_END_DELIVERY_RUNBOOK_v2.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/monetization/MonetizationClient.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/observability/monetization-metrics/page.tsx
- Test candidates:

### TenantPriceOverride (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - planId: String?
  - priceId: String?
  - type: OverrideType
  - percentOff: Int?
  - amountOffCents: Int?
  - priceCents: Int?
  - startsAt: DateTime?
  - endsAt: DateTime?
  - reason: String?
  - createdAt: DateTime
  - updatedAt: DateTime
  - org: Org
  - plan: PricePlan?
  - price: PlanPrice?
- Relations:
  - TenantPriceOverride.org → Org
  - TenantPriceOverride.plan → PricePlan
  - TenantPriceOverride.price → PlanPrice
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PRECHECK.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/GPT5_NEXT_PHASE_HANDOFF.md
  - C:/Users/chris/Git Local/Cortiware/Reference/MONETIZATION_BLUEPRINT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/SONNET_PROGRESS_TRACKER.md
- Frontend candidates:
- Test candidates:

### GlobalMonetizationConfig (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - defaultPlanId: String?
  - defaultPriceId: String?
  - defaultTrialDays: Int?
  - publicOnboarding: Boolean
  - createdAt: DateTime
  - updatedAt: DateTime
  - defaultPlan: PricePlan?
  - defaultPrice: PlanPrice?
- Relations:
  - GlobalMonetizationConfig.defaultPlan → PricePlan
  - GlobalMonetizationConfig.defaultPrice → PlanPrice
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PRECHECK.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/GPT5_NEXT_PHASE_HANDOFF.md
  - C:/Users/chris/Git Local/Cortiware/Reference/MONETIZATION_BLUEPRINT.md
  - C:/Users/chris/Git Local/Cortiware/Reference/SONNET_PROGRESS_TRACKER.md
- Frontend candidates:
- Test candidates:

### OnboardingInvite (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - token: String
  - email: String?
  - planId: String?
  - priceId: String?
  - offerId: String?
  - couponId: String?
  - trialDays: Int?
  - expiresAt: DateTime
  - usedAt: DateTime?
  - note: String?
  - createdAt: DateTime
  - plan: PricePlan?
  - price: PlanPrice?
  - offer: Offer?
  - coupon: Coupon?
- Relations:
  - OnboardingInvite.plan → PricePlan
  - OnboardingInvite.price → PlanPrice
  - OnboardingInvite.offer → Offer
  - OnboardingInvite.coupon → Coupon
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/ARCHITECTURE_OVERVIEW.md
  - C:/Users/chris/Git Local/Cortiware/docs/DOCUMENTATION_AUDIT_REPORT_2025-10-12.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/ops/reports/ROLLUP_PRECHECK.md
  - C:/Users/chris/Git Local/Cortiware/PRISMA_SCHEMA_AUDIT.md
  - C:/Users/chris/Git Local/Cortiware/PRODUCTION_READINESS.md
  - C:/Users/chris/Git Local/Cortiware/Reference/GPT5_NEXT_PHASE_HANDOFF.md
- Frontend candidates:
- Test candidates:

### FederatedClient (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - name: String
  - contactEmail: String
  - planType: String
  - apiKeyId: String
  - webhookEndpoint: String?
  - lastSeen: DateTime?
  - monthlyRevenue: Int
  - convertedLeads: Int
  - createdAt: DateTime
  - updatedAt: DateTime
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_Implementation_Guide_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_PR_Plan_and_Templates_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/FEDERATION_V3_IMPLEMENTATION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/PHASE_1_AUTONOMOUS_PROGRESS.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/COMPREHENSIVE_IMPLEMENTATION_TRACKER.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/FEDERATION_V3_IMPLEMENTATION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/analytics/FederationAnalyticsSection.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/clients/FederatedClientsSection.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/clients/page.tsx
- Test candidates:

### WebhookRegistration (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - url: String
  - secretHash: String
  - enabled: Boolean
  - createdAt: DateTime
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_Implementation_Guide_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_PR_Plan_and_Templates_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/FEDERATION_V3_IMPLEMENTATION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/COMPREHENSIVE_IMPLEMENTATION_TRACKER.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/FEDERATION_V3_IMPLEMENTATION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### EscalationTicket (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - escalationId: String
  - tenantId: String
  - orgId: String
  - type: String
  - severity: String
  - description: String
  - createdAt: DateTime
  - state: String
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_Implementation_Guide_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_PR_Plan_and_Templates_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/FEDERATION_V3_IMPLEMENTATION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/COMPREHENSIVE_IMPLEMENTATION_TRACKER.md
  - C:/Users/chris/Git Local/Cortiware/docs/provider-portal/\_incoming/v2/FEDERATION_V3_IMPLEMENTATION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/analytics/FederationAnalyticsSection.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/incidents/FederationEscalationsSection.tsx
- Test candidates:

### FederationInvoice (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - clientOrgId: String
  - leadId: String
  - conversionType: String
  - amountCents: Int
  - metadataJson: Json
  - createdAt: DateTime
  - status: String
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### IdempotencyKey (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - key: String
  - method: String
  - path: String
  - bodyHash: String
  - response: Json
  - orgId: String
  - createdAt: DateTime
  - ttl: Int
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/lib/idempotency-store.ts
  - C:/Users/chris/Git Local/Cortiware/apps/tenant-app/src/lib/idempotency-store.ts
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_Implementation_Guide_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/AugmentCode_PR_Plan_and_Templates_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/Execute/Provider v3/ProviderFederation_Design_Rationale_v3_plus.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### DeveloperAPIKey (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - name: String
  - keyId: String
  - secretHash: String
  - userId: String
  - orgId: String?
  - scopes: String[]
  - createdAt: DateTime
  - lastUsedAt: DateTime?
  - expiresAt: DateTime?
  - revokedAt: DateTime?
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/HANDOFF_PROVIDER_PORTAL_2025-10-10.md
  - C:/Users/chris/Git Local/Cortiware/docs/PROVIDER_PORTAL_COMPLETE_IMPLEMENTATION_2025-10-10.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### SecretsRotationPolicy (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - name: String
  - keyType: String
  - rotationIntervalDays: Int
  - gracePeriodDays: Int
  - autoRotate: Boolean
  - notifyBeforeDays: Int
  - enabled: Boolean
  - lastRotation: DateTime?
  - nextRotation: DateTime?
  - createdAt: DateTime
  - updatedAt: DateTime
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### SecretsRotationHistory (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - policyId: String?
  - keyType: String
  - oldKeyId: String
  - newKeyId: String
  - rotatedAt: DateTime
  - rotatedBy: String
  - reason: String
  - metadata: Json?
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### CustomFieldDefinition (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - orgId: String
  - entityType: String
  - fieldName: String
  - displayName: String
  - fieldType: String
  - options: Json?
  - required: Boolean
  - defaultValue: String?
  - validation: Json?
  - order: Int
  - enabled: Boolean
  - createdAt: DateTime
  - updatedAt: DateTime
  - values: CustomFieldValue[]
- Relations:
  - CustomFieldDefinition.values → CustomFieldValue
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/CACHING_STRATEGY.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### CustomFieldValue (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - fieldId: String
  - field: CustomFieldDefinition
  - entityType: String
  - entityId: String
  - value: String
  - createdAt: DateTime
  - updatedAt: DateTime
- Relations:
  - CustomFieldValue.field → CustomFieldDefinition
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
  - C:/Users/chris/Git Local/Cortiware/scripts/ci/placeholder-analyzer.ts
- Frontend candidates:
- Test candidates:

### ComplianceFramework (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - framework: String
  - status: String
  - lastAuditDate: DateTime?
  - nextAuditDate: DateTime?
  - certificationUrl: String?
  - notes: String?
  - createdAt: DateTime
  - updatedAt: DateTime
  - audits: ComplianceAudit[]
  - findings: ComplianceFinding[]
- Relations:
  - ComplianceFramework.audits → ComplianceAudit
  - ComplianceFramework.findings → ComplianceFinding
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_COMPLETE_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_PROGRESS_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### ComplianceAudit (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - frameworkId: String
  - framework: ComplianceFramework
  - auditDate: DateTime
  - auditor: String
  - result: String
  - reportUrl: String?
  - notes: String?
  - createdAt: DateTime
  - updatedAt: DateTime
  - findings: ComplianceFinding[]
- Relations:
  - ComplianceAudit.framework → ComplianceFramework
  - ComplianceAudit.findings → ComplianceFinding
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_COMPLETE_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_PROGRESS_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### ComplianceFinding (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - frameworkId: String
  - framework: ComplianceFramework
  - auditId: String?
  - audit: ComplianceAudit?
  - severity: String
  - title: String
  - description: String
  - remediation: String?
  - status: String
  - dueDate: DateTime?
  - resolvedDate: DateTime?
  - assignedTo: String?
  - createdAt: DateTime
  - updatedAt: DateTime
- Relations:
  - ComplianceFinding.framework → ComplianceFramework
  - ComplianceFinding.audit → ComplianceAudit
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_COMPLETE_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_PROGRESS_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### DataRetentionPolicy (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - dataType: String
  - retentionDays: Int
  - autoDelete: Boolean
  - lastReviewDate: DateTime?
  - nextReviewDate: DateTime?
  - notes: String?
  - createdAt: DateTime
  - updatedAt: DateTime
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/compliance.service.ts
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_COMPLETE_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_PROGRESS_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/compliance/ComplianceClient.tsx
- Test candidates:

### EncryptionConfig (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - component: String
  - encrypted: Boolean
  - algorithm: String
  - keyRotationDate: DateTime?
  - nextRotationDate: DateTime?
  - notes: String?
  - createdAt: DateTime
  - updatedAt: DateTime
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_COMPLETE_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_PROGRESS_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### VulnerabilityScan (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - scanDate: DateTime
  - scanner: String
  - totalVulns: Int
  - criticalVulns: Int
  - highVulns: Int
  - mediumVulns: Int
  - lowVulns: Int
  - resolvedVulns: Int
  - reportUrl: String?
  - notes: String?
  - createdAt: DateTime
  - updatedAt: DateTime
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/compliance.service.ts
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_COMPLETE_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/PRODUCTION_GRADE_PROGRESS_2025-10-16.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/api/provider/compliance/route.ts
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/compliance/ComplianceClient.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/compliance/page.tsx
- Test candidates:

### WebhookEndpoint (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - name: String
  - url: String
  - events: String[]
  - secret: String
  - active: Boolean
  - description: String?
  - createdAt: DateTime
  - updatedAt: DateTime
  - deliveries: WebhookDelivery[]
- Relations:
  - WebhookEndpoint.deliveries → WebhookDelivery
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/TWO_PERSONA_PORTALS_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### WebhookDelivery (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - endpointId: String
  - endpoint: WebhookEndpoint
  - event: String
  - payload: Json
  - status: String
  - statusCode: Int?
  - responseBody: String?
  - errorMessage: String?
  - attempts: Int
  - maxAttempts: Int
  - nextRetryAt: DateTime?
  - deliveredAt: DateTime?
  - createdAt: DateTime
- Relations:
  - WebhookDelivery.endpoint → WebhookEndpoint
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/FEDERATION_V3_IMPLEMENTATION_REPORT.md
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/TWO_PERSONA_PORTALS_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### DeveloperApiKey (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - name: String
  - description: String?
  - keyHash: String
  - keyPrefix: String
  - scopes: String[]
  - expiresAt: DateTime?
  - lastUsedAt: DateTime?
  - usageCount: Int
  - createdAt: DateTime
  - updatedAt: DateTime
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/TWO_PERSONA_PORTALS_IMPLEMENTATION_PLAN.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### ApiUsageMetric (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - endpoint: String
  - method: String
  - statusCode: Int
  - latency: Int
  - apiKeyId: String?
  - userAgent: String?
  - ipAddress: String?
  - timestamp: DateTime
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/services/provider/api-usage.service.ts
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/api-usage/ApiUsageClient.tsx
  - C:/Users/chris/Git Local/Cortiware/apps/provider-portal/src/app/provider/api-usage/page.tsx
- Test candidates:

### AiAssistantConversation (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - sessionId: String
  - role: String
  - content: String
  - metadata: Json?
  - createdAt: DateTime
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### MarketingPricingPlan (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - name: String
  - slug: String
  - price: Int?
  - currency: String
  - description: String
  - cta: String
  - highlighted: Boolean
  - active: Boolean
  - sortOrder: Int
  - status: MarketingPricingStatus
  - publishedAt: DateTime?
  - features: MarketingPricingFeature[]
  - history: MarketingPricingHistory[]
  - createdAt: DateTime
  - updatedAt: DateTime
  - createdBy: String?
  - updatedBy: String?
- Relations:
  - MarketingPricingPlan.features → MarketingPricingFeature
  - MarketingPricingPlan.history → MarketingPricingHistory
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### MarketingPricingFeature (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - planId: String
  - plan: MarketingPricingPlan
  - text: String
  - sortOrder: Int
  - createdAt: DateTime
  - updatedAt: DateTime
- Relations:
  - MarketingPricingFeature.plan → MarketingPricingPlan
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:

### MarketingPricingHistory (C:\Users\chris\Git Local\Cortiware\apps\provider-portal\prisma\schema.prisma)

- Fields:
  - id: String
  - planId: String
  - plan: MarketingPricingPlan
  - action: String
  - changes: Json
  - changedBy: String
  - changedByEmail: String?
  - reason: String?
  - createdAt: DateTime
- Relations:
  - MarketingPricingHistory.plan → MarketingPricingPlan
- Backend candidates:
  - C:/Users/chris/Git Local/Cortiware/docs/trace-matrix.md
  - C:/Users/chris/Git Local/Cortiware/docs/work-plan.md
  - C:/Users/chris/Git Local/Cortiware/reports/schema-gap-report.md
- Frontend candidates:
- Test candidates:
