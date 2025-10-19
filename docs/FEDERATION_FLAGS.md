# Federation Flags

Canonical variables
- FED_ENABLED: enable/disable federation features
- FED_OIDC_ENABLED: enable OIDC flows when true
- FED_RATE_LIMIT_ENABLED: enable federation RL
- FED_IDEMPOTENCY_ENABLED: enable idempotency checks

Notes
- Legacy PROVIDER_FEDERATION_* variables have been removed. Use only the canonical FED_* variables listed above.
- UI should gate owner-only toggles in the Provider portal; server must still enforce.

Guardrails
- Add tests to ensure routes respect disabled state (403/404 as specified)
- CI: ensure env defaults are explicit in test env to avoid flakiness

