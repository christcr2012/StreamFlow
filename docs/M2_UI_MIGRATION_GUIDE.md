# M2: UI Component Migration Guide

**Status**: Phase 5 Complete (with build errors) → Phase 6 In Progress
**Last Updated**: 2025-01-15
**See Also**: `docs/M2_CURRENT_STATUS_AND_PLAN.md` for detailed current status

## Overview

This document outlines the migration strategy for consolidating UI components from both `tenant-app` and `provider-portal` into the shared `@cortiware/ui` package with support for multiple visual styles.

## Migration Status

### ✅ Phase 1-4 Complete
- Database schema with `themeSettings` field
- Shared `@cortiware/ui` package with 7 components (Button, Card, Input, Modal, Skeleton, EmptyState, Textarea)
- Theme customization API routes
- Theme settings UI pages
- Dynamic theme loading in root layouts
- 27 theme variants with CSS variables

### ✅ Phase 5: Component Migration Complete (with TypeScript errors)

**Approach**: Hybrid style system with `stylePreset` prop supporting both "business" (default) and "premium" visual styles.

**Key Decisions**:
1. Default `stylePreset` changed from `'premium'` to `'business'`
2. Business style uses CSS variables for theme integration (not hardcoded colors)
3. Input `onChange` signature changed to `(value: string) => void`
4. Button component does not accept `style` prop

**Current Blocker**: TypeScript errors preventing Vercel deployment (see M2_CURRENT_STATUS_AND_PLAN.md)

## Component Inventory

### @cortiware/ui (Shared Package) - Current Status
| Component | Status | Style Presets | Default | Notes |
|-----------|--------|---------------|---------|-------|
| Button | ✅ Complete | business, premium | business | No `style` prop support |
| Card | ✅ Complete | business, premium | business | Supports Header/Body subcomponents |
| Input | ✅ Complete | business, premium | business | onChange: `(value: string) => void` |
| Textarea | ✅ Complete | business, premium | business | NEW - Added in Phase 5 |
| Modal | ⚠️ Needs Fix | business, premium | business | Missing "use client" directive |
| Skeleton | ✅ Complete | N/A | N/A | Includes DetailSkeleton, TableSkeleton |
| EmptyState | ✅ Complete | N/A | N/A | NoResults, NoData, ErrorState presets |

### Style Presets Explained
- **business** (default): Clean, flat design with theme colors, no gradients/glow, subtle shadows
- **premium**: Glass morphism with gradients, glow effects, backdrop blur, vibrant aesthetic

### Tenant-App Migration Status
- ✅ All pages migrated to `@cortiware/ui`
- ✅ Local component files removed (Button, Card, Input, Modal, Skeleton)
- ⚠️ TypeScript errors blocking Vercel build
- ⏳ Remaining local components: toast, ThemeToggle, pagination (needs import fix)

### Provider-Portal Migration Status
- ✅ Already using `@cortiware/ui` (completed in earlier work)
- ✅ All local component files removed
- ⏳ Build status needs verification

## Migration Strategy

### Phase 5 Actions (COMPLETE)
1. ✅ Create migration guide (this document)
2. ✅ Identify components that match @cortiware/ui API
3. ✅ Migrate tenant-app to @cortiware/ui
4. ✅ Add stylePreset support (business/premium)
5. ✅ Change default stylePreset to 'business'
6. ✅ Fix business style to use CSS variables
7. ✅ Create Textarea component
8. ✅ Add DetailSkeleton and TableSkeleton exports
9. ⚠️ TypeScript errors discovered (blocking deployment)

### Current Issues (Phase 6 Blockers)
See `docs/M2_CURRENT_STATUS_AND_PLAN.md` for detailed error list and fixes needed:
- Modal component needs "use client" directive
- Pagination component has wrong button import
- Button `style` props need removal (~8 files)
- Input `onChange` handlers need signature update (~10+ files)
- Event handler type errors (~5 files)
- Implicit any errors (~3 files)

## API Changes & Breaking Changes

### Input Component onChange Signature
**BREAKING CHANGE**: Input onChange signature changed from event handler to value handler.

```typescript
// OLD (no longer supported)
<Input
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// NEW (required)
<Input
  value={name}
  onChange={(value) => setName(value)}
/>
```

**Impact**: All Input usages must be updated
**Rationale**: Simpler API, less boilerplate, more intuitive

### Button Component Style Prop
**BREAKING CHANGE**: Button component does not accept `style` prop.

```typescript
// OLD (no longer supported)
<Button style={{ minHeight: '48px' }}>
  Click Me
</Button>

// NEW (use className instead)
<Button className="min-h-[48px]">
  Click Me
</Button>
```

**Impact**: All Button `style` props must be removed
**Rationale**: Encourages use of Tailwind utilities, maintains design consistency

## Style Preset System

### Using Style Presets

All components support `stylePreset` prop with two options:

```typescript
// Business style (default) - Clean, flat, professional
<Button stylePreset="business" variant="solid">
  Save Changes
</Button>

// Premium style - Glass morphism, gradients, glow
<Button stylePreset="premium" variant="solid">
  Save Changes
</Button>
```

### Business Style (Default)
- **Visual**: Flat design, subtle shadows, no gradients
- **Colors**: Uses CSS variables from theme system
- **Use Case**: Professional business applications, clean corporate aesthetic
- **Theme Integration**: Fully respects theme color customization

### Premium Style
- **Visual**: Glass morphism, gradients, glow effects, backdrop blur
- **Colors**: Enhanced with gradients and glow overlays
- **Use Case**: Modern, vibrant applications, consumer-facing products
- **Theme Integration**: Applies theme colors with visual enhancements

### Default Changed
**Important**: Default `stylePreset` changed from `'premium'` to `'business'` in Phase 5.

**Rationale**: Business style is more professional and suitable for default use across both apps.

**Impact**: All components now default to clean, flat design unless explicitly set to `stylePreset="premium"`

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

### Phase 5 Status
- ✅ Migration guide created
- ✅ Tenant-app migrated to @cortiware/ui
- ✅ Style preset system implemented
- ✅ Business style uses CSS variables
- ✅ Textarea component created
- ✅ DetailSkeleton and TableSkeleton added
- ⚠️ TypeScript errors blocking deployment
- ⏳ All builds successful on Vercel (pending error fixes)

### Phase 6 Criteria (In Progress)
- ⏳ All TypeScript errors resolved
- ⏳ All builds successful on Vercel
- ⏳ Database migrations applied successfully
- ⏳ Theme customization working end-to-end
- ⏳ No visual regressions
- ⏳ Documentation updated

### M2 Complete When:
- ⏳ All Phase 6 criteria met
- ⏳ Additional theme color adjustments complete (~5-7 themes)
- ⏳ Final completion report created

## Theme System Improvements (Phase 5)

### Input Field Fixes (CRITICAL)
1. **Background Behavior**: Fixed input fields turning white on interaction in dark themes
   - Changed from hardcoded `bg-white` to `bg-[var(--surface-1)]`
   - Disabled state now uses same background color
   - Impact: Dark theme usability dramatically improved

2. **Text Color Theming**: Input text now uses theme accent color
   - Changed from `var(--text-primary)` to `var(--text-accent)`
   - Better visual integration with theme aesthetic

3. **Cursor Color**: Added themed cursor color
   - Added `caret-[var(--brand-primary)]` to both input styles
   - Cursor color now matches theme

### Theme Color Adjustments
**Completed** (2 of ~7 themes):
- ✅ Futuristic Green: Changed from neon `#00ff88` to muted `#10b981`
- ✅ Neon Aqua → Professional Teal: Changed from `#2cf2ff` to `#14b8a6`

**Remaining** (~5-7 themes need review):
- Crimson Tech, Cyber Purple, Graphite Orange, Electric Blue, Hot Pink, Lime Green
- Goal: Reduce brightness/saturation for better accessibility and reduced eye strain
- Requirement: All text-on-color combinations must meet WCAG AA (4.5:1 contrast)

## Related Documentation

- `docs/M2_CURRENT_STATUS_AND_PLAN.md` - **Current status and action plan**
- `packages/ui/STYLE_PRESETS.md` - Style preset documentation
- `packages/ui/README.md` - Component library README
- `docs/THEME_ARCHITECTURE.md` - Theme system architecture
- `docs/AI_AGENT_REFERENCE.md` - Agent guidelines and policies
- `docs/VERCEL_BUILD_GUIDE.md` - Vercel deployment guide

