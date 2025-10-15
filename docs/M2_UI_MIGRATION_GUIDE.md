# M2: UI Component Migration Guide

## Overview

This document outlines the migration strategy for consolidating UI components from both `tenant-app` and `provider-portal` into the shared `@cortiware/ui` package.

## Migration Status

### ✅ Phase 1-4 Complete
- Database schema with `themeSettings` field
- Shared `@cortiware/ui` package with 6 premium components
- Theme customization API routes
- Theme settings UI pages
- Dynamic theme loading in root layouts

### 🔄 Phase 5: Component Migration (Strategic Approach)

Due to the extensive number of components across both apps, we're taking a **strategic partial migration** approach:

1. **Demonstrate the pattern** with key component migrations
2. **Document the approach** for future incremental migration
3. **Maintain backward compatibility** during transition

## Component Inventory

### @cortiware/ui (Shared Package)
- ✅ Button (4 variants: solid, outline, ghost, gradient)
- ✅ Card (4 variants: default, glass, elevated, glow)
- ✅ Input (with icons, validation, error states)
- ✅ Modal (with ConfirmModal preset)
- ✅ Skeleton (SkeletonCard, SkeletonTable, SkeletonList)
- ✅ EmptyState (NoResults, NoData, ErrorState)

### Tenant-App Local Components
- `components/ui/button.tsx` - Different API than @cortiware/ui
- `components/ui/card.tsx` - Card + CardHeader components
- `components/ui/skeleton.tsx` - TableSkeleton, CardSkeleton
- `components/ui/toast.tsx` - Toast notification system
- `components/ui/Input.tsx` - Form input component
- `components/ui/ThemeToggle.tsx` - Theme switcher
- Many others...

### Provider-Portal Local Components
- `components/ui/Button.tsx` - Matches @cortiware/ui API
- `components/ui/Card.tsx` - Premium card component
- `components/ui/Input.tsx` - Matches @cortiware/ui API
- `components/ui/ThemeToggle.tsx` - Theme switcher
- `components/common/EmptyState.tsx` - Matches @cortiware/ui
- `components/common/Modal.tsx` - Matches @cortiware/ui
- `components/common/Skeleton.tsx` - Matches @cortiware/ui

## Migration Strategy

### Immediate Actions (Phase 5)
1. ✅ Create migration guide (this document)
2. ✅ Identify components that match @cortiware/ui API
3. ⏳ Migrate provider-portal components (easier - already match API)
4. ⏳ Document tenant-app migration path (requires API updates)

### Future Incremental Migration
- Migrate components one at a time as they're touched
- Update component APIs to match @cortiware/ui
- Remove local duplicates after migration
- Test thoroughly after each migration

## Provider-Portal Migration (Immediate)

The provider-portal components already match the @cortiware/ui API, making migration straightforward:

### Files to Update
1. Remove local component files:
   - `apps/provider-portal/src/components/ui/Button.tsx` → Use `@cortiware/ui`
   - `apps/provider-portal/src/components/ui/Input.tsx` → Use `@cortiware/ui`
   - `apps/provider-portal/src/components/ui/Card.tsx` → Use `@cortiware/ui`
   - `apps/provider-portal/src/components/common/EmptyState.tsx` → Use `@cortiware/ui`
   - `apps/provider-portal/src/components/common/Modal.tsx` → Use `@cortiware/ui`
   - `apps/provider-portal/src/components/common/Skeleton.tsx` → Use `@cortiware/ui`

2. Update imports across provider-portal:
   ```typescript
   // Before
   import { Button } from '@/components/ui/Button';
   import { Card } from '@/components/ui/Card';
   import { Input } from '@/components/ui/Input';
   import { EmptyState } from '@/components/common/EmptyState';
   import { Modal } from '@/components/common/Modal';
   import { Skeleton } from '@/components/common/Skeleton';
   
   // After
   import { Button, Card, Input, EmptyState, Modal, Skeleton } from '@cortiware/ui';
   ```

## Tenant-App Migration (Future)

The tenant-app components have different APIs and require more careful migration:

### API Differences

**Button Component:**
```typescript
// Tenant-app (current)
<Button variant="primary" size="md" loading={false}>
  Click Me
</Button>

// @cortiware/ui (target)
<Button variant="solid" size="md" loading={false}>
  Click Me
</Button>
```

**Card Component:**
```typescript
// Tenant-app (current)
<Card>
  <CardHeader title="Title" />
  <div className="p-6">Content</div>
</Card>

// @cortiware/ui (target)
<Card variant="default">
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>
```

### Migration Path
1. Create adapter components that wrap @cortiware/ui with tenant-app API
2. Gradually update pages to use new API
3. Remove adapters once all pages are updated
4. Remove local component files

## Testing Strategy

### After Each Migration
1. Run `npm run typecheck` - Ensure no type errors
2. Run `npm run build` - Ensure builds succeed
3. Test on Vercel deployment - Verify UI renders correctly
4. Manual testing - Check all affected pages

### Regression Testing
- Test all pages that use migrated components
- Verify theme customization still works
- Check responsive behavior on mobile
- Test dark/light mode switching

## Rollback Plan

If migration causes issues:
1. Revert the commit
2. Fix issues locally
3. Re-test before pushing
4. Document any edge cases discovered

## Success Criteria

### Phase 5 Complete When:
- ✅ Migration guide created
- ✅ Provider-portal uses @cortiware/ui exclusively
- ✅ Tenant-app migration path documented
- ✅ All typechecks passing
- ✅ All builds successful on Vercel
- ✅ No visual regressions

### M2 Complete When:
- ✅ All Phase 5 criteria met
- ✅ Phase 6 validation complete
- ✅ Theme customization working end-to-end
- ✅ Documentation complete

## Notes

- **Incremental approach** is safer than big-bang migration
- **Provider-portal first** because it's easier (API already matches)
- **Tenant-app later** because it requires API updates
- **Backward compatibility** maintained throughout
- **Team can continue** incremental migration after M2

## Related Files

- `packages/ui/` - Shared UI components
- `apps/provider-portal/src/components/` - Provider-portal components
- `apps/tenant-app/src/components/` - Tenant-app components
- `docs/COMPONENT_SPECS.md` - Component specifications

