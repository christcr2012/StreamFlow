# Optimization Rollback Procedures

**Purpose**: Quick rollback instructions for each optimization in case of issues  
**Last Updated**: 2025-10-17

---

## 🚨 **Quick Rollback Commands**

### **If Everything Breaks**
```bash
# Revert to last known good commit
git log --oneline -10  # Find the commit before optimizations
git revert <commit-hash>
git push
```

### **If Specific Optimization Breaks**
See individual sections below for targeted rollbacks.

---

## 📋 **Optimization Inventory**

### **✅ APPLIED (Phase 1)**
1. Database Separation
2. Tenant-App Build Script Simplification
3. Turbo.json Enhancements
4. Root Package.json Convenience Scripts
5. Auth-Service Clean Script

### **🔄 PLANNED (This Session)**
6. Marketing Sites Next.js Optimizations
7. Turbopack for Development (Experimental)
8. Performance Monitoring Dashboard
9. CI/CD Workflow Updates

---

## 1️⃣ **Database Separation** (APPLIED ✅)

### **What Changed**:
- Provider-portal uses separate Neon database: `provider-portal`
- Tenant-app continues using: `neondb`
- Updated Vercel environment variables

### **Rollback Procedure**:

**⚠️ WARNING**: This will merge both databases back together. Only do this if absolutely necessary.

```bash
# 1. Update Vercel environment variable for provider-portal
cd apps/provider-portal
echo "OLD_DATABASE_URL" | vercel env add DATABASE_URL production

# 2. Update local .env files
# Edit apps/provider-portal/.env and .env.local
# Change DATABASE_URL back to original neondb connection

# 3. Redeploy
git commit -m "rollback: revert database separation"
git push
```

**Verification**:
- Check Vercel deployment logs for successful migration
- Verify both apps can access database

**Risk**: LOW (databases are separate; no data loss)

---

## 2️⃣ **Tenant-App Build Script** (APPLIED ✅)

### **What Changed**:
```json
// Before
"build": "cd ../.. && node node_modules/prisma/build/index.js generate --schema=prisma/schema.prisma && cd apps/tenant-app && node ../../node_modules/next/dist/bin/next build"

// After
"build": "node ../../node_modules/prisma/build/index.js generate --schema=../../prisma/schema.prisma && node ../../node_modules/next/dist/bin/next build"
```

### **Rollback Procedure**:

```bash
# Edit apps/tenant-app/package.json
# Revert build script to old version (see above)

git add apps/tenant-app/package.json
git commit -m "rollback: revert tenant-app build script simplification"
git push
```

**Verification**:
- Check Vercel deployment logs
- Verify build completes successfully

**Risk**: VERY LOW (simple script change)

---

## 3️⃣ **Turbo.json Enhancements** (APPLIED ✅)

### **What Changed**:
- Added `inputs` and `outputs` to all tasks
- Added `prisma:generate` task configuration
- Added `clean` task configuration

### **Rollback Procedure**:

```bash
# Revert turbo.json to previous version
git show HEAD~1:turbo.json > turbo.json

git add turbo.json
git commit -m "rollback: revert turbo.json enhancements"
git push
```

**Verification**:
- Run `npm run build` locally
- Check Turborepo cache behavior

**Risk**: LOW (only affects caching, not functionality)

---

## 4️⃣ **Root Package.json Scripts** (APPLIED ✅)

### **What Changed**:
Added convenience scripts:
- `clean`, `seed:provider`, `prisma:generate`, `prisma:studio:*`, `prisma:migrate:*`

### **Rollback Procedure**:

```bash
# Remove added scripts from package.json
# Edit package.json and remove the new scripts

git add package.json
git commit -m "rollback: remove convenience scripts"
git push
```

**Verification**:
- Scripts are optional; no verification needed

**Risk**: NONE (scripts are additive, don't affect builds)

---

## 5️⃣ **Auth-Service Clean Script** (APPLIED ✅)

### **What Changed**:
Added `"clean": "rm -rf dist"` to `packages/auth-service/package.json`

### **Rollback Procedure**:

```bash
# Remove clean script from packages/auth-service/package.json

git add packages/auth-service/package.json
git commit -m "rollback: remove auth-service clean script"
git push
```

**Verification**:
- None needed (optional script)

**Risk**: NONE

---

## 6️⃣ **Marketing Sites Next.js Optimizations** (PLANNED 🔄)

### **What Will Change**:
- Add bundle analyzer
- Add compiler optimizations (removeConsole)
- Add experimental optimizations (optimizePackageImports)
- Add ESLint build configuration

### **Rollback Procedure**:

```bash
# Revert next.config.js for both marketing sites
git show HEAD~1:apps/marketing-robinson/next.config.js > apps/marketing-robinson/next.config.js
git show HEAD~1:apps/marketing-cortiware/next.config.js > apps/marketing-cortiware/next.config.js

git add apps/marketing-*/next.config.js
git commit -m "rollback: revert marketing sites next.config optimizations"
git push
```

**Verification**:
- Check Vercel deployment logs
- Verify sites load correctly
- Check bundle sizes (should return to previous size)

**Risk**: LOW (config changes only)

**Monitoring**:
- Bundle size comparison (before/after)
- Build time comparison
- Runtime performance (Lighthouse scores)

---

## 7️⃣ **Turbopack for Development** (PLANNED 🔄 - EXPERIMENTAL)

### **What Will Change**:
```json
// package.json dev scripts
"dev": "next dev --turbo"
```

### **Rollback Procedure**:

```bash
# Remove --turbo flag from dev scripts
# Edit package.json for each app

git add apps/*/package.json
git commit -m "rollback: disable turbopack"
git push
```

**Verification**:
- Run `npm run dev` locally
- Verify dev server starts
- Test HMR (Hot Module Replacement)

**Risk**: MEDIUM (experimental feature, may have bugs)

**Monitoring**:
- Dev server startup time
- HMR speed
- Console errors during development
- Memory usage

**⚠️ IMPORTANT**: This is EXPERIMENTAL. Test thoroughly before committing.

---

## 8️⃣ **Performance Monitoring Dashboard** (PLANNED 🔄)

### **What Will Change**:
- New scripts to measure build times, bundle sizes, dev server performance
- Baseline metrics captured before optimizations
- Automated comparison after optimizations

### **Rollback Procedure**:

```bash
# Remove performance monitoring scripts
# Edit package.json and remove new scripts
# Delete any created monitoring files

git add package.json scripts/performance/*
git commit -m "rollback: remove performance monitoring"
git push
```

**Verification**:
- None needed (monitoring is passive)

**Risk**: NONE (read-only monitoring)

---

## 9️⃣ **CI/CD Workflow Updates** (PLANNED 🔄)

### **What Will Change**:
- Update `.github/workflows/ci.yml` to test optimizations
- Add bundle size tracking
- Add performance regression detection
- Update Node version if needed

### **Rollback Procedure**:

```bash
# Revert workflow files
git show HEAD~1:.github/workflows/ci.yml > .github/workflows/ci.yml

git add .github/workflows/
git commit -m "rollback: revert CI/CD workflow updates"
git push
```

**Verification**:
- Check GitHub Actions runs
- Verify all jobs pass

**Risk**: LOW (workflow changes don't affect production)

---

## 🔍 **How to Detect Issues**

### **Build Failures**:
- Check Vercel deployment logs
- Check GitHub Actions workflow runs
- Look for error messages in build output

### **Runtime Issues**:
- Check browser console for errors
- Monitor Vercel Analytics for increased error rates
- Check application logs

### **Performance Regressions**:
- Compare bundle sizes (before/after)
- Compare build times (before/after)
- Check Lighthouse scores
- Monitor Core Web Vitals

### **Development Issues**:
- Dev server won't start
- HMR not working
- Slow dev server
- Memory issues

---

## 📊 **Rollback Decision Matrix**

| Issue Severity | Action | Timeline |
|---------------|--------|----------|
| **Critical** (Site down, data loss) | Immediate rollback | < 5 minutes |
| **High** (Major feature broken) | Rollback within 1 hour | < 1 hour |
| **Medium** (Minor feature broken) | Fix forward or rollback | < 4 hours |
| **Low** (Performance regression) | Fix forward | < 1 day |

---

## 🎯 **Testing Checklist Before Rollback**

Before rolling back, verify the issue is actually caused by the optimization:

1. ✅ Check Vercel deployment logs for errors
2. ✅ Check GitHub Actions for failures
3. ✅ Test locally with optimization disabled
4. ✅ Check if issue exists in previous deployment
5. ✅ Review recent commits for other changes

**If issue persists after rollback**: The optimization wasn't the cause. Investigate further.

---

## 📝 **Rollback Reporting Template**

When rolling back, document:

```markdown
## Rollback Report

**Date**: YYYY-MM-DD HH:MM UTC
**Optimization Rolled Back**: [Name]
**Reason**: [Brief description]
**Issue Detected**: [How was the issue found?]
**Rollback Commit**: [Git commit hash]
**Verification**: [How was rollback verified?]
**Root Cause**: [What caused the issue?]
**Prevention**: [How to prevent in future?]
```

---

## 🚀 **Safe Deployment Strategy**

To minimize rollback risk:

1. **Test locally first** - Always test optimizations locally
2. **Deploy to preview** - Use Vercel preview deployments
3. **Monitor closely** - Watch logs and metrics for 30 minutes
4. **Gradual rollout** - Apply to one app at a time
5. **Have rollback ready** - Know the rollback procedure before deploying

---

**Last Updated**: 2025-10-17  
**Next Review**: After each optimization is applied

