# TypeScript Errors - Action Required

## Status

🔴 **CI/CD workflows are currently failing** due to TypeScript compilation errors in `tenant-app`.

### ✅ Fixed (Already Committed)
- **packages/queue**: Changed `errors` field to `errorSummary` (matches Prisma schema)
- **tenant-app/api/import/csv**: Changed `errors` to `errorSummary` in API response

### ❌ Remaining Errors: 28 TypeScript errors in tenant-app

---

## Critical Errors Requiring Immediate Attention

### 1. Database Connection Module (1 error)
**File**: `apps/tenant-app/src/app/api/health/db/route.ts:12`
```
Cannot find module '@cortiware/db/connection'
```
**Fix**: Update import to use correct module resolution or change to 'node16'/'nodenext' moduleResolution

### 2. Prisma Schema Mismatches (11 errors)

#### ImportEntityType (1 error)
**File**: `apps/tenant-app/src/app/api/import/csv/route.ts:85`
```
Type 'string' is not assignable to type 'ImportEntityType'
```
**Fix**: Cast the string to ImportEntityType enum or validate against enum values

#### Org.metadata Does Not Exist (5 errors)
**Files**: `apps/tenant-app/src/app/api/settings/ai/route.ts` (lines 23, 26, 62, 65, 71)
```
Property 'metadata' does not exist in type 'Org'
```
**Fix Options**:
- Add `metadata Json?` field to Org model in `prisma/schema.prisma`
- OR remove references to metadata and use existing fields
- OR store metadata in `settingsJson` field

#### String ID Type Issues (2 errors)
**Files**:
- `apps/tenant-app/src/app/api/cleaning/inspections/create-scheduled/route.ts:60`
- `apps/tenant-app/src/app/api/cleaning/schedules/expand/route.ts:61`
```
Property 'id' does not exist on type 'string'
```
**Fix**: The variable is already a string (ID), remove `.id` accessor

#### Period Type (2 errors)
**File**: `apps/tenant-app/src/lib/cost-alerts.ts` (lines 112, 132)
```
Argument of type 'string' is not assignable to parameter of type '"MONTHLY" | "DAILY" | "WEEKLY"'
```
**Fix**: Cast to union type or validate string before passing

#### Variable Usage (1 error)
**File**: `apps/tenant-app/src/lib/cost-alerts.ts` (lines 129, 135)
```
Variable 'currentUsage' is used before being assigned
```
**Fix**: Initialize variable or add conditional check

---

## Medium Priority Errors

### 3. Prisma Middleware Deprecated (6 errors)

**Files**:
- `apps/tenant-app/src/lib/prisma.ts` (lines 97, 115)
- `packages/db/src/middleware/slow-query-logger.ts:91`

```
Property '$use' does not exist on type 'PrismaClient'
Namespace 'Prisma' has no exported member 'Middleware'
```

**Context**: Prisma middleware (`$use`) was deprecated in Prisma 5.x

**Fix Options**:
1. **Migrate to Prisma Client Extensions** (recommended):
   ```typescript
   const prisma = new PrismaClient().$extends({
     query: {
       $allModels: {
         async $allOperations({ operation, model, args, query }) {
           const start = Date.now()
           const result = await query(args)
           const duration = Date.now() - start
           console.log(`${model}.${operation} took ${duration}ms`)
           return result
         }
       }
     }
   })
   ```

2. **Remove middleware** (if not critical)

### 4. Image Compression Library Issues (6 errors)

**Files**:
- `apps/tenant-app/src/components/FileUploadWithCompression.tsx` (lines 52, 53, 157)
- `apps/tenant-app/src/components/job-photo-gallery.tsx:33`
- `apps/tenant-app/src/lib/image-compression.ts` (lines 43, 75, 136)

```
Object literal may only specify known properties, and 'preset' does not exist in type 'UseImageCompressionOptions'
Type 'boolean' is not assignable to type 'number' (useWebWorker)
```

**Fix**: Update to match current `browser-image-compression` API:
- Remove `preset` property (doesn't exist in current version)
- Change `useWebWorker: boolean` (not `number`)

### 5. Realtime Type Mismatch (1 error)

**File**: `packages/realtime/src/index.ts:208`
```
Type 'Record<string, string[]>' is not assignable to type 'string | { [key: string]: capabilityOp[] | ["*"]; }'
```
**Fix**: Cast to correct Ably capability format

### 6. Missing Type Annotations (1 error)

**File**: `apps/tenant-app/src/lib/wallet.ts:242`
```
Parameter 'activity' implicitly has an 'any' type
```
**Fix**: Add type annotation for the activity parameter

---

## Recommended Action Plan

### Phase 1: Quick Fixes (30 minutes)
1. Fix string ID accessor issues (remove `.id`)
2. Initialize `currentUsage` variable
3. Add type annotations for `activity` parameter
4. Cast period strings to union types

### Phase 2: Schema Updates (1 hour)
5. Decide on Org.metadata approach:
   - **Option A**: Add `metadata Json?` to Prisma schema + migrate
   - **Option B**: Refactor code to use `settingsJson`
6. Fix ImportEntityType casting
7. Fix database connection import

### Phase 3: Library Updates (1-2 hours)
8. Update image compression code to match current API
9. Migrate Prisma middleware to Client Extensions
10. Fix Realtime capability types

---

## Commands to Run After Fixes

```bash
# Typecheck locally
npm run typecheck

# Run CI/CD checks locally
npm run lint
npm run test

# Commit and push
git add .
git commit -m "fix: resolve TypeScript compilation errors"
git push origin main
```

---

## Workflow Status Monitoring

Check workflow status:
```powershell
$env:GH_TOKEN = "your-token"
gh run list --limit 5
gh run view <run-id> --log-failed
```

Or visit: https://github.com/christcr2012/Cortiware/actions

---

**Current Status**: Workflows in progress. Will fail once TypeScript typecheck runs on tenant-app.

**Next Step**: Fix Phase 1 issues first (quick wins), then tackle schema and library updates.
