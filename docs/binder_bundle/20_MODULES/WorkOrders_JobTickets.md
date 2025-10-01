# Work Orders & Job Tickets

## Entities
- `job_ticket(id, tenant_id, customer_id, location, crew_id, service_type, scheduled_at, status, estimate_id, invoice_id)`
- `job_log(job_ticket_id, actor_id, role, action, notes, photo_url, parts_used, created_at)`
- `job_completion(job_ticket_id, completed_at, signature_url, ai_report_url)`
- `job_anomaly(job_ticket_id, type, severity, ai_notes, created_at)`

## API
- `POST /tenant/jobs` create; `POST /tenant/jobs/{id}/assign`; `POST /tenant/jobs/{id}/log`; `POST /tenant/jobs/{id}/complete`
- AI: `POST /tenant/ai/jobs/{id}/summary`; `.../completion-report`; `.../anomaly-scan`

## Acceptance
- Offline capable logs; sync later.
- AI brief ≤ 300 words; completion reports include photos + signature.
- Every AI call logged in `ai_task`; 402 gating enforced.
