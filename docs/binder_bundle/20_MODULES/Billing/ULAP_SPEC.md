# ULAP Spec (Usage • Limits • Adoption Pricing)

## Meters
- ai_tokens_light / medium / heavy
- email_count, sms_count
- maps_calls, geofence_events
- storage_gb_month, egress_gb
- job_reports_generated, anomaly_scans, route_optimizations

## Credits & Budgets
- Credits ledger debits before billing. When insufficient → `402 PAYMENT_REQUIRED` with `required_meters`, `est_price`, `prepay_url`.
- Optional grace window per tenant (0–60 minutes); usage in grace is audited.

## Adoption Discounts
- Eligible services (unlimited-license) drop 10% per +10 adopters (cap 70%).
- Nightly recompute job emits notices and adjusts pricing for all.

## APIs
- `GET /tenant/billing/usage` → per meter breakdown.
- `POST /tenant/billing/prepay` → idempotent; returns updated balances.
- `POST /provider/ulap/recompute` → provider‑only; audits changes.

## Acceptance
- Any costed route returns 402 when credits/budget insufficient; never executes without payment or grace.
- All runs are logged with tenant_id, meter deltas, price_cents.
