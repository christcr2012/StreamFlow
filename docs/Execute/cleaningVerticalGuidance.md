# Cortiware — Cleaning Services Vertical Pack (v1.1)
> End-to-end instruction set for **Augment Code (Sonnet 4.5)** to implement a production-ready **Cleaning Services vertical** inside the existing **Cortiware monorepo**. Designed to rival/surpass Jobber, Housecall Pro, ServiceMonster, Swept, ZenMaid, etc. Includes: drag-and-drop assignment/scheduling, AI bids/estimates, contracts & recurrence, janitorial checklists/inspections, offline driver PWA, QR/geofence, imports/exports, no-paper billing, and analytics.

**Monorepo assumptions (current Cortiware)**
- API service: `services/api` (Express/Node or Next API) with `src/server.ts` composing routers.  
- Admin app: `apps/admin` (React/Next) using `packages/ui`.  
- Optional worker: `services/worker` for cron/queues.  
- Shared: `packages/pricing`, `packages/types`, `packages/ui`.  
- **Neon Postgres** (RLS pattern), **S3/R2** for attachments, **Stripe** for invoices, provider **wallet/credits guard** returning **402** for costed actions.  
- Field users previously called “technicians” → use **Drivers/Cleaners** consistently.  

---

## 0) What we’re shipping in this pack
1. **Leads & Estimates** – lead capture, site-walk checklists, **AI estimator** (eco tier + wallet guard), multi-option proposals, e-sign, versioning & audit.  
2. **Contracts & Recurrence** – RRULE engine, SLAs, price escalators, location-specific pricing/taxes.  
3. **Scheduling & Dispatch** – **drag-and-drop** board + calendar + map; skill/availability rules; auto-sequence; optional route publish to fleet system (Samsara-ready).  
4. **Work Orders & QA** – SOP templates per vertical/space, randomized inspections with scoring & defect heatmaps.  
5. **Driver PWA (offline)** – preload day, QR scan, GPS/geofence, photos/signatures, reliable outbox sync.  
6. **Billing & AR** – pre-billing review, invoice generation, Stripe send/pay, credits/adjustments, location pricing & taxes.  
7. **Imports/Exports** – CSV/Excel mappers for customers/sites/assets/pricing/tax/contracts/schedules.  
8. **Analytics** – job profitability, schedule adherence, QA scores, rework %, lead→win funnel, contract margin by location.  

---

## 1) Repo structure additions
*(file map abbreviated for space – keep from v1.1 full spec)*  
```
/apps/admin/src/pages/cleaning/...  
/packages/ui/cleaning/...  
/services/api/src/routes/cleaning/...  
/services/worker/src/jobs/cleaning/...  
/DB/migrations/2025_10_16_cleaning.sql  
/docs/CLEANING_*.md  
```
Wire router in `services/api/src/server.ts`:  
```ts
import { cleaningRouter } from './routes/cleaning/index.js';
app.use('/v1/cleaning', cleaningRouter());
```  

---

## 2) Environment & config
Add to .env (Vercel/local):  
```
DATABASE_URL=...
S3_... 
STRIPE_... 
FEDERATION_JWT_PUBLIC_KEY=...
```
Cron/Worker: expand-schedules (15 min) / invoicing (nightly) / inspections (daily).  

---

## 3) Database migration (Neon Postgres)
*(exact SQL from v1.1 spec — keep enum definitions, tables for leads, estimates, contracts, schedules, work_orders, assignments, job_events, checklists, inspections, billables with indexes and RLS note)*  

---

## 4) API surface (OpenAPI summary)
Mount `/v1/cleaning`; all mutations require `Idempotency-Key`; costed = wallet check → 402.  
Endpoints: leads, estimates (+AI), contracts, schedules, work-orders (+assign & events), QA (inspections + score), billing (billables/invoices), imports/exports.  

---

## 5) Admin UI (React/Next)
- **Dashboard** (KPIs – funnel, QA, revenue)  
- **Leads & Bids** (Kanban + AI Assist)  
- **Estimate Builder** (templates + live pricing)  
- **Contracts** (RRULE, SLA, escalators)  
- **Schedule** (Board lanes = drivers, Calendar, Map)  
- **Work Orders** (detail view, checklists/photos)  
- **QA & Inspections** (randomized, scoring, heatmap)  
- **Billing** (pre-billing → invoice → Stripe)  
- **Templates/Imports** (checklist designer, CSV mapper).  

UI components (`/packages/ui/cleaning`): DragBoard, RRuleEditor, ChecklistDesigner, InspectionScoring, EstimateOptionCard, MapCluster, PriceCatalogTable, ImportMapper.  

---

## 6) Driver PWA (offline-first)
Installable PWA; app-shell cached; IndexedDB tables: driver, routes, jobs, sites, assets, templates, outbox, attachments.  
Outbox pattern: queue events (scan/start/arrive/complete/photo/signature) → sync batch → idempotent apply by `client_event_id`.  
Geofence check; photos/signatures to S3 presigned URLs; works offline with manual “Sync now”.  

---

## 7) AI Estimator (eco tier)
`POST /v1/cleaning/estimates/:id/ai` → wallet guarded.  
Inputs: spaceType, metrics, debris level, frequency, notes/photos, rates.  
Outputs: `scope_json`, `threeOptions` (Good/Better/Best).  
Prompt in `/docs/CLEANING_AI_Estimator.md` (strict JSON schema).  
Track token use & acceptance ROI.  

---

## 8) Contract → Schedule → Work Order engine
RRULE stored on contract; worker/cron expands ahead → creates WOs; skip holidays; SLA metrics recorded.  

---

## 9) Billing & AR
Billables from WOs/contracts; generate invoices → Stripe; webhook updates AR aging.  

---

## 10) Imports/Exports
Imports: customers, sites, assets, pricing, tax_profiles, contracts, schedules (CSV headers in docs).  
Exports: `vw_cleaning_schedule`, `vw_cleaning_kpis`, `vw_cleaning_contract_value`.  

---

## 11) Security & RBAC
Roles: HQ Admin, Location Manager, Dispatcher, Driver, Billing Clerk, QA Inspector.  
RLS by org_id; audit all status changes; photo access scoped to location.  

---

## 12) Analytics KPIs
Ops (schedule adherence %, travel %, utilization, rework %), QA (scores/defects trend), Sales (lead→win, margin by option), Finance (revenue, AR, ROI).  

---

## 13) Cost controls & performance
AI opt-in, token cap, preview cost → 402 on low wallet. Photo compression + pooled Neon connections; index use as in §3.  

---

## 14) Acceptance tests (must pass)
- Drag-drop 300+ WOs/day < 200 ms reads.  
- Offline 20 WOs → sync = no loss.  
- AI estimator JSON valid + wallet log.  
- RRULE expansion 8 weeks correct.  
- Invoice flow end-to-end.  
- Inspection generator target %.  
- CSV imports dry-run OK.  

---

## 15) Build order (for Augment Sonnet 4.5)
1. Apply SQL migration (§3) + generate models.  
2. Implement routers (§4).  
3. Admin UI (§5).  
4. Driver PWA (§6).  
5. AI estimator (§7).  
6. Schedule worker (§8).  
7. Billing (§9).  
8. Imports/Exports (§10).  
9. Analytics (§12).  
10. Tests & fixtures (§14).  

---

## 16) Seed templates (`/docs/CLEANING_Checklists.md`)
Residential, Post-Construction, Commercial/Government checklists as detailed in v1.1 spec.  

---

## 17) AI prompt (`/docs/CLEANING_AI_Estimator.md`)
System: “Senior cleaning estimator. Output strict JSON: areas[], riskFactors[], threeOptions[]. Calibrate for {space_type}, {frequency}.”  
User: site notes, metrics, debris level, photos, requirements.  

---

## 18) Import headers (`/docs/CLEANING_Import_Headers.md`)
```
customers: name,billing_email,billing_phone,terms,location_name
sites: customer_name,site_name,address,city,state,zip,lat,lon,location_name
assets: kind,size,serial,qr_code,status,location_name
pricing: location_name,item_code,description,unit_price_cents,unit
tax_profiles: location_name,name,rate_pct
contracts: customer,site,space_type,start_date,recurrence,base_price_cents,tax_profile
schedules: contract,rule,next_run
```  

---

## 19) Competitive parity checklist
Jobber/HCP (drag-drop dispatch) – ✅  
ServiceMonster (quote→invoice flow) – ✅  
Swept (janitorial checklists & QA) – ✅  
ZenMaid (recurring rules + availability) – ✅  
Offline PWA + wallet/AI ROI analytics – **advantage**  

---

## 20) Quick start (for you)
1. Save this file as `Cortiware_Cleaning_Vertical_Pack_v1.1.md` in repo root.  
2. Tell Augment: “Implement Cortiware Cleaning Vertical per file v1.1; follow build order §15.”  
3. After deploy, run acceptance scenarios (`/docs/CLEANING_Acceptance_Scenarios.md`).  
