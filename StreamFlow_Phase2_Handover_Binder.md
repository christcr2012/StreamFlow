# StreamFlow — Phase 2 Handover Binder

**Repo:** https://github.com/christcr2012/StreamFlow  
**Additional Resources:** Operator Roadmaps, AI Engineer Specs, Deep Research, Billing & Invoicing Design PDFs.  
**Purpose:** This binder defines the *next phase of work* after the initial merged handover. It layers monetization, operator capabilities, advanced AI, governance, and scalability onto the Phase 1 foundation.

---

## 0) Context

- **Phase 1 Recap:** Foundations, Core CRM, AI Differentiators, Enterprise Polish. System now runs end-to-end, secure, tenant-isolated, with AI enrichment and assistant.  
- **Phase 2 Aim:** Extend StreamFlow into a *full SaaS business platform* with billing, advanced ops, compliance, predictive AI, and scaling beyond single-region.

---

## 1) Monetization & Billing Layer

### 1.1 Lead-Based Billing (from uploaded design PDF)
- Billing unit = **Lead** created/imported.  
- Quotas per tenant: free tier (100 leads/mo), paid tiers (1k, 10k, enterprise).  
- Overage charges for exceeded leads.  
- AI usage billed separately (tokens or per-suggestion pack).

### 1.2 Invoicing
- Generate invoices monthly per tenant.  
- Store invoices in `Invoice` table; send PDF via email/web portal.  
- Payment integration: **Stripe** recommended (no PCI scope).  
  - Store customerId + subscriptionId per tenant.  
  - Webhook handler `/api/webhooks/stripe` verifies signatures.

### 1.3 DB Schema (new tables)
- **Invoice**(id, tenantId, periodStart, periodEnd, amount, status, pdfUrl, createdAt).  
- **BillingEvent**(id, tenantId, type [lead.create, ai.usage], quantity, amount, createdAt).  

### Checklist
- [ ] Stripe integration keys in vault.  
- [ ] Billing events emitted on every chargeable action.  
- [ ] Invoices generated & tested in staging.  
- [ ] Admin portal shows tenant usage vs quota.

**Acceptance:** Tenants billed correctly on lead usage; invoices visible & payable; overages trigger billing.

---

## 2) Operator/Admin Enhancements

### 2.1 Operator Portal
- **Dashboards**: tenant usage, health, error rates.  
- **Audit Exports**: CSV/JSON exports with filters.  
- **Support Tools**: impersonate user (with audit trail).  
- **Feature Flags**: enable/disable features per tenant.

### 2.2 DB Extensions
- **OperatorActionLog**(id, operatorId, action, targetTenantId, meta, createdAt).  
- Retention: 1 year minimum.

### Checklist
- [ ] `/admin/operators` portal added.  
- [ ] Operator actions double-confirmed & logged.  
- [ ] Support impersonation guarded with audit & RBAC.

**Acceptance:** Operators can monitor tenant health, export data, toggle features, with every action audited.

---

## 3) Advanced AI Expansion

### 3.1 Operator Copilot
- AI assistant for operators: “What’s wrong with Tenant X?” → surfaces error logs, quota breaches.  
- Guardrails: no direct DB access; queries metrics store.

### 3.2 Predictive Metrics
- AI forecasts pipeline velocity, churn risk, lead conversion likelihood.  
- Metrics persisted in `AiForecast` table.

### 3.3 Anomaly Detection
- Detect unusual login activity, data spikes, suspicious API calls.  
- Trigger alerts → Operator Portal.

### Checklist
- [ ] AI Copilot integrated into Admin portal.  
- [ ] Forecast jobs run nightly; metrics visible in dashboards.  
- [ ] Anomalies generate alerts & operator tasks.

**Acceptance:** AI features provide measurable operator productivity gains without exposing raw tenant data.

---

## 4) Governance & Compliance

### 4.1 SOC 2 Evidence Collection
- Log evidence: CI/CD runs, code reviews, access reviews, backup tests.  
- Store in `ComplianceEvidence` table with links to artifacts.  

### 4.2 GDPR/CCPA Workflows
- Tenant data export (`/api/tenant/:id/export`).  
- Tenant erasure job (`/api/tenant/:id/delete`) with background purge + verification.

### 4.3 Audit Enhancements
- Immutable log pipeline → external storage (S3/WORM).  
- Retention: 7 years for financial, 1 year for activity.

### Checklist
- [ ] Evidence collected automatically per release.  
- [ ] Data export/erasure endpoints tested.  
- [ ] Audit logs replicated to compliant storage.

**Acceptance:** Compliance requirements demonstrably satisfied; external audit passes.

---

## 5) Scalability & Ops

### 5.1 Multi-Region
- Add region awareness in tenant config.  
- Read replicas in additional regions; eventual consistency for audit/logs.  

### 5.2 Sharding Strategy
- Plan: tenant-based sharding for >1M leads/tenant.  
- Shard keys = tenantId hash.  

### 5.3 Observability Expansion
- Full OpenTelemetry tracing.  
- SLO dashboards (latency, error rate, saturation).  
- Chaos testing in staging (kill workers, drop connections).

### Checklist
- [ ] Multi-region tested with synthetic tenants.  
- [ ] Shard migration playbook exists.  
- [ ] Chaos tests run without data loss.  

**Acceptance:** System continues to serve tenants across regions, scaling linearly, with resilience tested.

---

## 6) Risks & Edge Cases (Phase 2)

- **Billing Drift**: Events lost between app and invoice → double count or missing charges.  
  - Mitigation: idempotent billing events; reconciliation job.  
- **Operator Impersonation Abuse**: Could expose tenant data.  
  - Mitigation: audit + notifications to tenant admins.  
- **AI Forecast Bias**: Predictions skewed by small tenant datasets.  
  - Mitigation: confidence scores + hide low-confidence outputs.  
- **GDPR Erasure Risk**: Backups may retain deleted data.  
  - Mitigation: encrypt backups; rotate keys; accept practical compliance model.  
- **Multi-Region Latency**: Consistency lag on audit/logs.  
  - Mitigation: design as eventually consistent; document clearly.

---

## 7) Open Questions

1. Billing provider confirmed as Stripe? Any alternatives required?  
2. Operator role scope: internal only vs delegated to customer admins?  
3. AI scope: include outbound comms (drafting emails) or keep inbound analysis-only?  
4. Compliance target: SOC 2 first, GDPR second?  
5. Multi-region: active-active vs active-passive?

**Checklist**
- [ ] Each open question assigned an owner.  
- [ ] Answered in ADRs before Phase 2 execution.

---

## 8) Phase 2 Timeline & Definition of Done

### Milestones
1. **Billing & Invoicing** — tenants billed per lead, invoices visible, Stripe live.  
2. **Operator Portal** — dashboards, impersonation, feature flags, audit exports.  
3. **Advanced AI** — copilot, forecasts, anomaly alerts.  
4. **Compliance** — evidence collection, export/erasure, audit replication.  
5. **Scalability** — multi-region pilot, shard plan, chaos tests.

### Done means
- Tenants are monetized correctly.  
- Operators can manage/support tenants safely.  
- AI empowers operators & predicts pipeline trends.  
- Compliance audits pass with evidence.  
- System scales beyond single-region with resilience.

---

## 9) Runbook Additions

- **Billing**: `pnpm run billing:generate-invoices` — dry-run invoices.  
- **Exports**: `pnpm run tenant:export --tenant t_123` → tarball.  
- **Chaos**: `pnpm run chaos:simulate --kill worker-1`.  

---

### Sign-off

Phase 2 release = `v2.0.0`.  
Sign-off required: Product (billing), Security (compliance), Ops (scalability), AI Lead (forecasts), QA (end-to-end).

