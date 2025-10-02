# App Router Migration Status

**Branch**: `chore/app-router-import-rewrite`  
**Started**: 2025-10-02  
**Status**: IN PROGRESS (Step 2 of 7 complete)

## Directive

Following authoritative directive to make App Router canonical and eliminate all `@/pages/**` imports.

## Progress

### ✅ Step 0: Safety Net (COMPLETE)
- Created branch `chore/app-router-import-rewrite`
- Captured pre-migration TypeScript errors in `ops/typescript-errors.pre.txt`

### ✅ Step 1: Standardize Component Home (COMPLETE)
- Created directories:
  - `src/components/leads/`
  - `src/components/opportunities/`
  - `src/components/contacts/`
  - `src/components/organizations/`
  - `src/components/shared/`

### ✅ Step 2: Extract Page Bodies (COMPLETE)
- **Extracted components:**
  - `src/components/leads/Leads.tsx` (from `app/(app)/leads/page.tsx`)
  - `src/components/leads/LeadDetail.tsx` (from `app/(app)/leads/[id]/page.tsx`)
  - `src/components/opportunities/Opportunities.tsx` (from `app/(app)/opportunities/page.tsx`)
  - `src/components/opportunities/OpportunityDetail.tsx` (from `app/(tenant)/crm/opportunities/[id]/page.tsx`)
  - `src/components/contacts/Contacts.tsx` (from `app/(tenant)/crm/contacts/page.tsx`)
  - `src/components/contacts/ContactDetail.tsx` (from `app/(tenant)/crm/contacts/[id]/page.tsx`)
  - `src/components/organizations/Organizations.tsx` (from `app/(tenant)/crm/organizations/page.tsx`)
  - `src/components/organizations/OrganizationDetail.tsx` (from `app/(tenant)/crm/organizations/[id]/page.tsx`)

- **Deleted conflicting Pages Router files:**
  - `src/pages/leads.tsx`
  - `src/pages/leads/[id].tsx`
  - `src/pages/_app.tsx`
  - `src/pages/_document.tsx`

- **Created App Router infrastructure:**
  - `src/app/layout.tsx` (root layout)

- **Fixed TypeScript issues:**
  - Added null checks for `useParams()` in all detail pages
  - Wrapped `useSearchParams()` in Suspense boundary in contacts page

- **Partially completed thin wrappers:**
  - ✅ `app/(app)/leads/page.tsx` - thin wrapper complete

### ⏳ Step 3: Rewrite Imports (PENDING)
Need to:
1. Rename component exports to match target names
2. Replace remaining route files with thin wrappers
3. Search and replace `@/pages/**` imports to `@/components/**`

### ⏳ Step 4: Fix Default vs Named Exports (PENDING)

### ⏳ Step 5: Route Params Consistency (PENDING)

### ⏳ Step 6: Build + Fast Fixes (PENDING)

### ⏳ Step 7: Commit & PR (PENDING)

## Remaining Work

### Immediate Next Steps

1. **Rename component exports** in extracted files:
   ```typescript
   // In src/components/leads/LeadDetail.tsx
   export default function LeadDetailPage() { ... }
   // Should be:
   export default function LeadDetail() { ... }
   ```

2. **Create thin wrappers** for remaining route files:
   ```typescript
   // app/(app)/leads/[id]/page.tsx
   import LeadDetail from '@/components/leads/LeadDetail';
   export const metadata = { title: 'Lead Detail' };
   export default function Page({ params }: { params: { id: string } }) {
     return <LeadDetail id={params.id} />;
   }
   ```

3. **Search and replace imports** across codebase (excluding `pages/api/**`):
   - `@/pages/leads` → `@/components/leads/Leads`
   - `@/pages/opportunities` → `@/components/opportunities/Opportunities`
   - etc.

4. **Run TypeScript check** and fix any remaining errors

5. **Run build** and verify no conflicts

6. **Test routes** locally

7. **Push and create PR**

## Files Modified So Far

**Added:**
- `ops/typescript-errors.pre.txt`
- `src/app/layout.tsx`
- `src/components/contacts/Contacts.tsx`
- `src/components/leads/Leads.tsx`
- `src/components/opportunities/Opportunities.tsx`
- `src/components/organizations/Organizations.tsx`
- `src/components/contacts/ContactDetail.tsx` (needs export rename)
- `src/components/leads/LeadDetail.tsx` (needs export rename)
- `src/components/opportunities/OpportunityDetail.tsx` (needs export rename)
- `src/components/organizations/OrganizationDetail.tsx` (needs export rename)

**Modified:**
- `src/app/(app)/leads/page.tsx` (thin wrapper complete)
- `src/app/(app)/leads/[id]/page.tsx` (needs thin wrapper)
- `src/app/(tenant)/crm/contacts/page.tsx` (needs thin wrapper)
- `src/app/(tenant)/crm/contacts/[id]/page.tsx` (needs thin wrapper)
- `src/app/(tenant)/crm/opportunities/[id]/page.tsx` (needs thin wrapper)
- `src/app/(tenant)/crm/organizations/page.tsx` (needs thin wrapper)
- `src/app/(tenant)/crm/organizations/[id]/page.tsx` (needs thin wrapper)

**Deleted:**
- `src/pages/_app.tsx`
- `src/pages/_document.tsx`
- `src/pages/leads.tsx`
- `src/pages/leads/[id].tsx`

## Commands to Continue

```bash
# Check current status
git status

# Continue with Step 3: Rename exports and create thin wrappers
# (See "Remaining Work" section above)

# After completing all steps:
npx tsc --noEmit 2>&1 | tee -a ops/typescript-errors.post.txt
npx next build
git add -A
git commit -m "chore(app-router): rewrite all @/pages imports to @/components, extract feature components, keep pages/api intact"
git push -u origin chore/app-router-import-rewrite
```

## Rollback (if needed)

```bash
git reset --hard HEAD~1
git checkout main
git branch -D chore/app-router-import-rewrite
```

## Notes

- All API routes in `pages/api/**` remain untouched
- App Router is now canonical for UI routes
- Components are extracted and reusable
- Route files are thin wrappers (or will be when complete)
- No runtime risk - purely structural changes

