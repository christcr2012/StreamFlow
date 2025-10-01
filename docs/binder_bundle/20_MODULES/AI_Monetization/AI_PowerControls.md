# AI Power Controls

- Global default power level (Eco/Standard/Max).
- Feature/Agent/Channel overrides with caps and schedules.
- One‑off Boost per run with accurate cost preview.
- Role ceilings (employee ≤ Standard; owner can run Max).
- Effective power = Boost > Override > Global, bounded by ceilings/caps.

## APIs
- `GET/POST /tenant/ai/power/profile`
- `POST /tenant/ai/power/override`
- `POST /tenant/ai/run { options.power, preview }` → returns `effective_power`, `est_credits`.
