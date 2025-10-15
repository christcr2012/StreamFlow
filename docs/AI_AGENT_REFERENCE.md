# AI Agent Reference - Cortiware Monorepo

**CRITICAL: READ THIS BEFORE MAKING ANY CHANGES**

## Truth Policy (Read First)
- The ONLY sources of truth are: 1) the codebase, and 2) the user.
- Documentation (including binders, plans, roadmaps) is REFERENCE ONLY.
- If a document claims something is done, DOUBLE-CHECK the codebase.
- Do not treat old documentation as a to-do list. Use `docs/ACTUAL_REMAINING_WORK.md` and the codebase.

## Monorepo Structure

```
Cortiware/
├── apps/
│   ├── provider-portal/          # Provider management portal
│   ├── tenant-app/                # Client-facing tenant app
│   ├── marketing-robinson/        # Robinson AI Systems marketing
│   └── marketing-cortiware/       # Cortiware product marketing
├── packages/
│   ├── auth-service/              # Shared authentication library
│   ├── config/                    # Shared TypeScript config
│   └── ui/                        # Shared UI components
└── package.json                   # Root workspace config
```

## Build System Rules

### 1. Package Installation
- **Root `node_modules/`**: Shared dependencies (hoisted by npm workspaces)
- **App `node_modules/`**: App-specific dependencies (rare)
- **Rule**: If a package is needed at BUILD TIME, it MUST be in `dependencies`, NOT `devDependencies`

### 2. Critical Dependencies for Next.js Apps
```json
{
  "dependencies": {
    "autoprefixer": "10.4.20",    // ← MUST be here for Vercel builds
    "postcss": "8.4.47",           // ← MUST be here for Vercel builds
    "tailwindcss": "3.4.17"        // ← MUST be here for Vercel builds
  }
}
```

**Why?** Vercel production builds don't install `devDependencies`. PostCSS runs during build, so these must be in `dependencies`.

### 3. CSS Import Hierarchy

**ALWAYS import `globals.css` in root layout, NEVER import `theme.css` directly**

```typescript
// ✅ CORRECT - apps/*/src/app/layout.tsx
import '../styles/globals.css';

// ❌ WRONG
import '../styles/theme.css';
```

**Why?** `globals.css` contains:
- `@tailwind base/components/utilities` (required for Tailwind to work)
- `@import './theme.css'` (includes theme variables)
- Body styles and fonts

### 4. Build Verification Checklist

**BEFORE PUSHING ANY COMMIT:**

```bash
# 1. Clean build test
npm run build -- --filter=provider-portal

# 2. Check for errors
# - TypeScript errors?
# - Build errors?
# - Missing modules?

# 3. If build succeeds locally, commit
git add -A
git commit -m "..."
git push origin main

# 4. Wait 60 seconds, then verify Vercel deployment
# Check GitHub commit status or Vercel dashboard
```

## Common Mistakes & Fixes

### Mistake 1: "Cannot find module 'autoprefixer'"
**Cause**: autoprefixer in `devDependencies`  
**Fix**: Move to `dependencies` in app's package.json

### Mistake 2: No UI/styling visible
**Cause**: Importing `theme.css` instead of `globals.css`  
**Fix**: Import `globals.css` in root layout

### Mistake 3: TypeScript config errors
**Cause**: Wrong extends path in tsconfig.json  
**Fix**: Use relative path `../../packages/config/tsconfig.base.json`

### Mistake 4: Build works locally but fails on Vercel
**Cause**: Different dependency resolution in Vercel environment  
**Fix**: Ensure all build-time deps are in `dependencies`, not `devDependencies`

## Provider Portal Specifics

### File Structure
```
apps/provider-portal/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (imports globals.css)
│   │   ├── provider/
│   │   │   └── layout.tsx          # Provider layout (uses ProviderShellClient)
│   │   └── ProviderShellClient.tsx # Sidebar + navigation
│   ├── styles/
│   │   ├── globals.css             # Tailwind + theme import
│   │   └── theme.css               # Theme variables
│   └── components/
├── package.json                    # App dependencies
├── postcss.config.js               # PostCSS config
└── tailwind.config.js              # Tailwind config
```

### Authentication Flow
1. User visits `/login`
2. Submits credentials → `/api/auth/login`
3. Sets cookie: `rs_provider` or `provider-session`
4. Redirects to `/provider`
5. `provider/layout.tsx` checks for cookie
6. If no cookie → redirect to `/login`
7. If cookie exists → render `ProviderShellClient` with sidebar

### Theme System
- Themes stored in: `src/lib/themes/theme-registry.ts`
- Theme cookie: `rs_admin_theme` (default: `futuristic-green`)
- Theme switcher: `/provider/settings` page
- API endpoint: `/api/theme` (GET/POST)

## Debugging Workflow

### When Build Fails

1. **Read the error message carefully**
   - Module not found? → Check dependencies
   - CSS error? → Check import paths
   - TypeScript error? → Check tsconfig.json

2. **Test locally first**
   ```bash
   npm run build -- --filter=provider-portal
   ```

3. **Check the specific file mentioned in error**
   - Don't guess
   - Don't assume
   - Read the actual file

4. **Make ONE change at a time**
   - Fix one issue
   - Test build
   - Commit if successful
   - Move to next issue

5. **Verify on Vercel**
   - Wait for deployment
   - Check GitHub commit status
   - Check Vercel logs if failed

## Pre-Flight Checklist

**Before making ANY code changes:**

- [ ] Do I understand the monorepo structure?
- [ ] Do I know which app I'm modifying?
- [ ] Have I checked the current file contents?
- [ ] Do I know where dependencies should be installed?
- [ ] Will this work in Vercel's build environment?
- [ ] Have I tested the build locally?

**After making changes:**

- [ ] Did the local build succeed?
- [ ] Did I commit with a clear message?
- [ ] Did I wait for Vercel deployment?
- [ ] Did I verify the deployment succeeded?
- [ ] If failed, did I read the actual error logs?

## Key Principles

1. **VERIFY BEFORE ASSUMING**: Always check file contents before editing
2. **TEST LOCALLY FIRST**: Never push without local build success
3. **ONE CHANGE AT A TIME**: Don't fix multiple issues in one commit
4. **READ ERROR MESSAGES**: They tell you exactly what's wrong
5. **CHECK VERCEL LOGS**: Don't assume deployment succeeded

## Emergency Recovery

If completely stuck:

1. **Stop making changes**
2. **Read the last 3 error messages**
3. **Check what changed in last 3 commits**
4. **Test each change individually**
5. **Ask user for clarification if needed**

---

**Remember: The monorepo is just multiple apps in one repo. Treat each app independently, but be aware of shared dependencies.**

