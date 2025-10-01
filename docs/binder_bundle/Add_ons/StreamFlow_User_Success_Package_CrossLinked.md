
# StreamFlow User Success Package (Cross-Linked Edition)

This package consolidates tutorials, guides, help center structure, and documentation operations into a single file. It is designed for Customer Success, Documentation, Marketing, and Ops teams and can be published directly for end users.

Every tutorial, guide, and help article now includes 🔗 links back to the **Dev Binder specs** so your devs and docs stay aligned.

---

## USER_SUCCESS_OVERVIEW

**Audiences:**  
- End Users (tenant owners, managers, employees)  
- Providers (admins, finance, engineers)  
- Accountants (read-only finance role)  
- Subcontractors (limited portal access)  
- Field Employees (mobile work orders)  
- Customers (customer portal)  

**Docs Included:**  
- Tutorials (in-app, contextual, non-blocking)  
- User Guides (role-based, vertical-specific)  
- Provider Guide (setup, operations)  
- Help Center (articles, categories, tags)  
- DocOps Checklist (ongoing maintenance)  

---

## USER_TUTORIALS (Journeys)

**System Design:**  
- Tutorials appear contextually (role, page, feature enabled).  
- Always non-blocking, with “Skip” and “Remind me later”.  
- Concierge integration: can “explain step” with Eco-tier AI.  
- ULAP-aware: trial credits used first; previews shown for costly actions.  
- Logged as `journey_step_completed` for audit.

**Examples:**

### Tenant Owner — Cleaning Services
1. Open Opportunities → “New Estimate” (overlay: “Click here to start your first estimate”).  
2. Upload photos → AI Measurement Estimator (Eco).  
3. Generate “Good/Better/Best” proposal.  
4. Acceptance: estimate saved as draft; appears in Opportunities timeline.  
🔗 Dev Spec: `20_MODULES/Opportunities/Estimates.md`

### Employee Mobile — Work Order Completion
1. Open assigned job in Mobile Portal.  
2. Log arrival → take photos → mark parts used.  
3. Tap “Ask AI for completion summary” → report drafted.  
4. Collect customer signature → Submit.  
5. Acceptance: report stored; customer notified.  
🔗 Dev Spec: `20_MODULES/WorkOrders_JobTickets.md`

---

## USER_GUIDES

- **Owner Guide**: AI power controls, ULAP budgets, approvals, trial conversion.  
  🔗 Dev Spec: `20_MODULES/AI_Monetization/AI_PowerControls.md`, `20_MODULES/Billing/ULAP_SPEC.md`  

- **Manager Guide**: Crew assignments, estimate approvals, anomaly review.  
  🔗 Dev Spec: `20_MODULES/Dispatch/MultiLocation.md`, `20_MODULES/Opportunities/Estimates.md`  

- **Employee Mobile Guide**: Work orders, offline mode, AI assistant usage.  
  🔗 Dev Spec: `20_MODULES/WorkOrders_JobTickets.md`  

- **Accountant Guide**: Read-only budgets, exports, anomaly scan.  
  🔗 Dev Spec: `20_MODULES/Federation/Accountant_Scope.md`  

- **Subcontractor Guide**: Assigned jobs, submit completions.  
  🔗 Dev Spec: `20_MODULES/Subcontractors/Portal.md`  

- **Customer Portal Guide**: View invoices, book appointments, ask Concierge.  
  🔗 Dev Spec: `20_MODULES/CustomerPortal/Contracts_And_Concierge.md`  

**Vertical Quickstarts:**  
- Cleaning: recurring schedules, QA checklists, optimized routes.  
  🔗 Dev Spec: `20_MODULES/Verticals/Cleaning/AI_Tasks.md`  
- Fencing: BOM calculator, proposal packs.  
  🔗 Dev Spec: `20_MODULES/Verticals/Fencing/AI_Tasks.md`  
- Concrete: void calc, sealing follow-ups.  
  🔗 Dev Spec: `20_MODULES/Verticals/Concrete/AI_Tasks.md`  
- Windows/Doors: measurement estimator, warranty tracking.  
  🔗 Dev Spec: `20_MODULES/Verticals/WindowsDoors/AI_Tasks.md`  
- Rolloff: dispatch optimizer, utilization forecaster.  
  🔗 Dev Spec: `20_MODULES/Verticals/Rolloff/AI_Tasks.md`  
- Port-a-John: service route builder, event capacity planner.  
  🔗 Dev Spec: `20_MODULES/Verticals/PortaJohn/AI_Tasks.md`  
- Trucking: load planner, HOS-aware route optimizer.  
  🔗 Dev Spec: `20_MODULES/Verticals/Trucking/AI_Tasks.md`  

---

## PROVIDER_GUIDE

### Setup (Vercel + Neon)
- Deploy Provider Portal at `provider.<domain>`; tenant/portal at wildcards.  
- Configure `JWT_AUDIENCES=provider,tenant,portal`.  
- Run migrations for ULAP, trials, domains, audit logs.  
- Verify tenant creation → subdomain reachability.  
🔗 Dev Spec: `20_MODULES/Federation/SETUP_PROVIDER.md`

### Operations
- Trial controls (pause, extend, convert).  
  🔗 Dev Spec: `20_MODULES/Federation/Trial_Controls.md`  
- Notices (system-wide announcements).  
  🔗 Dev Spec: `Provider/Controls/Profitability_Dashboard.md`  
- Profitability Dashboard (AI summaries of costs/margins).  
  🔗 Dev Spec: `Provider/Controls/Profitability_Dashboard.md`  
- Adoption Discounts (10% drop per +10 adopters).  
  🔗 Dev Spec: `20_MODULES/Billing/ULAP_SPEC.md`  
- Infra Migration (migrate button with health check + rollback).  
  🔗 Dev Spec: `20_MODULES/Federation/Migrations.md`  

### Support Playbook
- Triage flow, impersonation with audit, safe exports, AI-generated comms.  
🔗 Dev Spec: `Provider/Controls/Support_Playbook.md`  

---

## HELP_CENTER_STRUCTURE

**Categories:**  
- Getting Started  
- Role Guides  
- Vertical Quickstarts  
- AI Agents & Power Controls  
- Billing & Trials  
- Work Orders & Job Tickets  
- Customer Portal  
- Provider Portal  

**Articles (sample):**  
- “Create your first estimate”  
  🔗 Dev Spec: `20_MODULES/Opportunities/Estimates.md`  
- “Enable AI Inbox”  
  🔗 Dev Spec: `20_MODULES/AI_Monetization/Agents_and_WorkUnits.md`  
- “Optimize your first route”  
  🔗 Dev Spec: `20_MODULES/Dispatch/Route_Optimizer.md`  
- “Manage AI Power Controls”  
  🔗 Dev Spec: `20_MODULES/AI_Monetization/AI_PowerControls.md`  
- “Convert a Trial to Paid”  
  🔗 Dev Spec: `20_MODULES/Federation/Trial_Controls.md`  
- “Close a job ticket offline”  
  🔗 Dev Spec: `20_MODULES/WorkOrders_JobTickets.md`  
- “Collect customer payment reminders”  
  🔗 Dev Spec: `20_MODULES/Collections/Agent.md`  

**Search Tags:** vertical names, role names, common service industry keywords.  

---

## HELP_CENTER_ARTICLES (Draft Content)

- **How to create your first estimate**  
  🔗 Dev Spec: `20_MODULES/Opportunities/Estimates.md`  

- **How to enable AI Inbox**  
  🔗 Dev Spec: `20_MODULES/AI_Monetization/Agents_and_WorkUnits.md`  

- **How to optimize routes**  
  🔗 Dev Spec: `20_MODULES/Dispatch/Route_Optimizer.md`  

- **How to manage AI power**  
  🔗 Dev Spec: `20_MODULES/AI_Monetization/AI_PowerControls.md`  

- **How to convert a trial**  
  🔗 Dev Spec: `20_MODULES/Federation/Trial_Controls.md`  

- **How to close a job offline**  
  🔗 Dev Spec: `20_MODULES/WorkOrders_JobTickets.md`  

- **How to collect payments**  
  🔗 Dev Spec: `20_MODULES/Collections/Agent.md`  

---

## FUTURE_ENHANCEMENTS

- Video tutorials embedded in Help Center.  
- Interactive “sandbox mode” with fake tenant data.  
- AI-driven help assistant integrated in-app (Q&A on guides).  
- Multi-language doc packs (EN, ES, FR).  
- Metrics dashboards: track which guides/tutorials reduce support tickets.  

---

## DOCOPS_CHECKLIST

- **Versioning**: all docs tied to product release tags; changelog links updated.  
- **Review Cadence**: CS + Product review each quarter.  
- **Update Workflow**: Merged PRs trigger doc update issues.  
- **Tooling**: broken link checker, linting for docs, screenshot refresh.  
- **Ownership**:  
  - Tutorials → Product/UX  
  - Guides → Customer Success  
  - Help Center → Documentation Team  
  - Provider Guide → Ops/Engineering  
- **Feedback Loop**: “Was this helpful?” → creates ticket in backlog.  
- **Distribution**: PDFs, in-app embedding, help center website.  
- **Archival Policy**: outdated docs moved to `/archive` with version tags.  
🔗 Dev Spec: `Differentiation/StreamFlow_Differentiation_Principles.md`  

---

# ✅ Acceptance Criteria

- Tutorials never block workflows.  
- Role/vertical-specific guides exist for every core industry.  
- Help Center structure has ≥ 50 articles drafted with tags.  
- DocOps pipeline runs lint + link checks.  
- Provider setup/ops guides complete with onboarding and support playbook.  
- Users always have a guided path (tutorial, guide, or article) for every feature exposed in the UI.  
- All tutorials, guides, and help articles link back to dev binder specs.  
