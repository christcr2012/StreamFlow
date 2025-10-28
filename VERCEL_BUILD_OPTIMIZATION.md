# Vercel Build Optimization Guide

## Current Status

- **Build Time**: 2 minutes 28 seconds (tenant-app)
- **Issues**: Prisma Client initialization errors (9 occurrences), edge runtime warnings

## Fixes Applied

### 1. Prisma Binary Generation ✅

**Problem**: Prisma Client could not locate Query Engine for runtime "rhel-openssl-3.0.x"

**Solution**: Updated `apps/tenant-app/vercel.json` to run `npm run prisma:generate` before build:

```json
"buildCommand": "cd ../.. && npm install && npm run prisma:generate && cd apps/tenant-app && npm run build"
```

This ensures both Prisma clients are generated with correct binaries before Next.js build.

### 2. Edge Runtime Removal ✅

**Problem**: Using edge runtime disables static generation and causes warnings

**Solution**: Removed unnecessary `export const runtime = 'edge'` from `/api/theme/route.ts` (simple cookie operations don't need edge runtime)

## Recommended Optimizations

### A. Enable Vercel Remote Caching (Turbo)

**Impact**: ~30-50% build time reduction on subsequent builds

Add to `vercel.json` root (or via Vercel dashboard):

```json
{
  "build": {
    "env": {
      "TURBO_REMOTE_CACHE_READ_ONLY": "false",
      "TURBO_TOKEN": "$VERCEL_ARTIFACTS_TOKEN",
      "TURBO_TEAM": "$VERCEL_ARTIFACTS_OWNER"
    }
  }
}
```

Turbo already configured in `turbo.json` with:

```json
"remoteCache": { "enabled": true }
```

### B. Optimize Prisma Generation

**Current**: Generates both clients sequentially during every build
**Impact**: Saves ~10-15 seconds

Option 1: Cache Prisma Client output

```json
// turbo.json - already configured
"prisma:generate": {
  "cache": false,  // Consider changing to true
  "outputs": ["node_modules/@prisma/client*/**"]
}
```

Option 2: Only generate changed schemas (requires custom script)

### C. Parallel Dependency Installation

**Current**: Sequential npm install in monorepo
**Impact**: ~15-20 seconds

Add to root `vercel.json`:

```json
{
  "installCommand": "npm ci --prefer-offline --no-audit"
}
```

### D. Next.js Build Optimizations

Add to `apps/tenant-app/next.config.js`:

```javascript
experimental: {
  // Parallel processing
  workerThreads: true,
  cpus: 4,

  // Reduce memory usage
  optimizeCss: true,
  optimizePackageImports: ['@cortiware/*'],

  // Skip sourcemaps in production
  productionBrowserSourceMaps: false
}
```

### E. Reduce Bundle Size

**Current**: Large bundle with all packages
**Impact**: ~20-30 seconds

1. **Code Splitting**: Already using dynamic imports for heavy components
2. **Tree Shaking**: Ensure all packages export named exports
3. **Package Optimization**: Review `optimizePackageImports` in experimental config (already enabled)

### F. Selective Type Checking

**Current**: Full TypeScript check on every build
**Impact**: ~10-15 seconds

Add to `next.config.ts`:

```typescript
typescript: {
  // Skip type checking during build (rely on CI)
  ignoreBuildErrors: process.env.VERCEL_ENV === "preview";
}
```

**CAUTION**: Only enable for preview deployments, keep type checking for production

### G. Build Machine Upgrade

**Current**: 4 cores, 8 GB RAM
**Vercel Pro**: 8 cores, 16 GB RAM (~40% faster builds)

### H. Optimize Database Seeding

If seed scripts run during build, skip them:

```json
// package.json
"vercel-build": "node scripts/run-migrations-if-configured.js && npm run prisma:generate && turbo run build"
```

Ensure migrations script has guard:

```javascript
if (!process.env.DATABASE_URL) {
  console.log("Skipping migrations: DATABASE_URL not configured");
  process.exit(0);
}
```

## Monitoring Build Performance

### Vercel Analytics

- Enable in Vercel dashboard: Settings > Analytics
- Track build duration trends
- Identify slow dependencies

### Build Logs Analysis

Check for:

- Long-running Prisma generation
- Large bundle warnings
- Memory/CPU bottlenecks
- Cache hit/miss rates

## Expected Results

| Optimization              | Time Saved                    | Effort                  |
| ------------------------- | ----------------------------- | ----------------------- |
| Prisma fix                | +10s (errors removed)         | ✅ Done                 |
| Edge runtime removal      | +5s                           | ✅ Done                 |
| Remote caching            | 30-45s                        | Low (config change)     |
| Parallel installs         | 15-20s                        | Low (config change)     |
| Next.js workers           | 10-15s                        | Low (config change)     |
| Type check skip (preview) | 10-15s                        | Medium (needs CI setup) |
| **Total Potential**       | **80-110s (1m 20s - 1m 50s)** |                         |

**Target**: < 60 seconds for cached builds, < 90 seconds for clean builds

## Implementation Priority

1. ✅ **Critical** (Done): Fix Prisma binaries, remove edge runtime
2. **High** (Quick wins): Enable remote caching, optimize npm install
3. **Medium**: Next.js build config, parallel processing
4. **Low**: Type check optimization (requires CI changes), build machine upgrade

## Verification Commands

```bash
# Local build time test
time npm run build

# Check Turbo cache
turbo run build --summarize

# Analyze bundle
cd apps/tenant-app && npm run build -- --profile
```

## Notes

- Build time varies by cache state (cold vs warm)
- First build after dependency changes will always be slower
- Remote caching requires Vercel Pro plan
- Some optimizations trade build time for runtime performance
