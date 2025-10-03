# Windows & Doors — AI Tasks

- Measurement Estimator: inputs (photos, rough dims), outputs (cut sizes, waste %, labor estimate).
- Proposal Generator: good/better/best options with warranties.
- Warranty Tracker: schedules post-install checks and reminders.

APIs: `POST /tenant/ai/windows/measure`, `POST /tenant/ai/windows/proposal`.
Acceptance: measurement error <= 10% with provided dims; proposal in customer-friendly PDF within 5s.
