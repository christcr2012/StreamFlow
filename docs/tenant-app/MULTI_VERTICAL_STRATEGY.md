# Multi-Vertical Support Strategy

## Approach (Configuration-Driven)
Use @cortiware/verticals registry. Each vertical provides:
- Field schemas (Zod) to extend Customer/Job/Invoice forms
- Workflow config: job statuses, transitions, default SLAs
- Templates: agreement templates, invoice defaults
- Labels/Copy: per-vertical terminology

```ts
export type VerticalConfig = {
  key: string;
  jobFields: ZodSchema;
  jobStatuses: Array<{ key: string; next: string[] }>;
  agreementTemplateIds: string[];
};
```

## UI Integration
- Org selects vertical in onboarding/Settings → stored on org
- Forms extend base + vertical.jobFields dynamically
- Status pickers derive from vertical.jobStatuses
- Agreement creation suggests vertical templates

## Vertical Switching UX
- Admin-only; prompt implications and field archival
- For MVP: one-time selection recommended; switching discouraged

