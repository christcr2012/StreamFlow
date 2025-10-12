# Technical Specifications

## File Structure (Next.js App Router)
- app/(app-shell)/layout.tsx, nav, guards
- app/dashboard/page.tsx (RSC)
- app/customers/[id]/page.tsx, etc.
- app/api/* route handlers
- components/* (UI + hooks)
- lib/* (auth-context, fetch utils, zod schemas)
- actions/* (server actions)

## Data Fetching
- Reads in RSC via Prisma/@cortiware/db or tenant APIs
- Mutations via Server Actions; fallback to POST route handlers
- Revalidate tags on mutation; client SWR for high-interactivity lists

## Validation
- Zod schemas shared client/server
- react-hook-form + zodResolver; server parse() before DB writes

## Testing Strategy
- Unit: Vitest + Testing Library
- Integration: route handlers + server actions (supertest/fetch mocks)
- E2E: Playwright for critical flows
- Accessibility: Axe in CI; snapshots for structure

## Performance
- Dynamic imports for charts/maps/modals
- Next/Image; client-side compression for photos
- Stream large lists via RSC + pagination
- Memoize derived state; minimal client caches

## Examples
```ts
// Server Action example
export async function createJob(data: unknown) {
  const input = CreateJobSchema.parse(data);
  const job = await db.job.create({ data: input });
  revalidateTag(`jobs:${job.orgId}`);
  return job.id;
}
```

```ts
// Zod example
export const CreateJobSchema = z.object({
  title: z.string().min(1),
  customerId: z.string().cuid(),
  scheduledAt: z.string().datetime(),
  assignees: z.array(z.string().cuid()).default([]),
});
```

