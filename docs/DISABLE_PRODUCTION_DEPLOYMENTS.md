# Disable Production Deployments on Vercel

**Date**: 2025-10-27  
**Purpose**: Prevent automatic production deployments until proper go-live procedures are followed

---

## Why Disable Production Deployments?

Per `docs/GO_LIVE_CLIENT_ONBOARDING_CHECKLIST.md`:
- Developer/test credentials are currently in Production
- Production should not be deployed until proper client onboarding process is in place
- Need to implement per-tenant credential storage
- Need to remove test credentials from Production environment

---

## Steps to Disable Production Deployments

### Option 1: Via Vercel Dashboard (Recommended - Immediate Effect)

#### For Each Project (tenant-app, provider-portal, marketing-cortiware, marketing-robinson):

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project
3. Go to **Settings** → **Git**
4. Under **Production Branch**, change from `main` to a non-existent branch like `production-ready`
   - This means pushes to `main` will only create **Preview** deployments
   - Production deployments will only trigger on pushes to `production-ready` branch
5. Click **Save**

**Effect**: All pushes to `main` will now create Preview deployments only. Production will not be updated.

---

### Option 2: Via Vercel CLI (For Automation)

```bash
# Set production branch to non-existent branch
vercel project ls  # List all projects
vercel project <project-name> --production-branch production-ready
```

For each app:
```bash
cd apps/tenant-app
vercel link
vercel project set production-branch production-ready

cd ../provider-portal
vercel link
vercel project set production-branch production-ready

cd ../marketing-cortiware
vercel link
vercel project set production-branch production-ready

cd ../marketing-robinson
vercel link
vercel project set production-branch production-ready
```

---

### Option 3: Git Branch Protection (Additional Safety)

Create a GitHub branch protection rule for `production-ready`:

1. Go to GitHub repository → Settings → Branches
2. Add branch protection rule for `production-ready`
3. Require pull request reviews before merging
4. Require status checks to pass
5. Require approval from code owners
6. Enable "Restrict pushes to matching branches"

This ensures no one can accidentally push to `production-ready` without proper approval.

---

## Current State After Configuration

### Development Workflow (Current - Safe):
```
git push origin main
  ↓
Vercel creates PREVIEW deployment
  ↓
Test in preview environment
  ↓
All good → Continue development
```

### Production Deployment Workflow (Future - When Ready):
```
Verify all items in GO_LIVE_CLIENT_ONBOARDING_CHECKLIST.md
  ↓
Remove developer credentials from Production
  ↓
Follow GO_LIVE_RUNBOOK.md procedures
  ↓
Create PR: main → production-ready
  ↓
Get approval from team
  ↓
Merge PR
  ↓
Vercel creates PRODUCTION deployment
  ↓
Run smoke tests
  ↓
Monitor for 24 hours
```

---

## Verification

After configuring, verify with:

```bash
# Check current production branch setting
vercel project ls

# Push to main and verify it creates Preview only
git commit --allow-empty -m "Test: verify preview deployment only"
git push origin main

# Check Vercel dashboard - should see Preview deployment, not Production
```

---

## When to Re-Enable Production Deployments

Only re-enable when ALL of these are complete:

- [ ] All items in `docs/GO_LIVE_CLIENT_ONBOARDING_CHECKLIST.md` are checked off
- [ ] Developer credentials removed from Production environment
- [ ] Per-tenant credential storage implemented in database
- [ ] Client onboarding documentation complete
- [ ] First pilot client ready for onboarding
- [ ] Team approval for go-live
- [ ] Production database provisioned per `docs/runbooks/GO_LIVE_RUNBOOK.md`
- [ ] Backup and monitoring systems in place

---

## Rollback (If Needed)

To re-enable production deployments on `main`:

### Via Dashboard:
1. Project Settings → Git → Production Branch
2. Change back to `main`
3. Save

### Via CLI:
```bash
vercel project <project-name> --production-branch main
```

---

## Emergency Production Hotfix Process

If a critical hotfix is needed in Production before normal go-live:

1. Create emergency branch: `git checkout -b emergency-hotfix-<issue>`
2. Make minimal fix
3. Test in Preview deployment thoroughly
4. Get emergency approval from team
5. Temporarily set production branch to emergency branch
6. Push to emergency branch → triggers Production deployment
7. After deployment, set production branch back to `production-ready`
8. Backport fix to `main` branch

---

## Summary

**Before Configuration**:
- Every push to `main` → Production deployment (DANGEROUS)

**After Configuration**:
- Every push to `main` → Preview deployment only (SAFE)
- Only pushes to `production-ready` → Production deployment (CONTROLLED)

This gives you full control over when Production gets updated, allowing safe development while maintaining a stable Production environment.

---

**Next Steps**:
1. Run the Vercel dashboard configuration for all 4 projects
2. Verify with a test commit
3. Update team on new deployment workflow
4. Continue development with confidence that Production won't be affected
