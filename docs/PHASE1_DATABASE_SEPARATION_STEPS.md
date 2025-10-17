# Phase 1: Database Separation - Vercel Configuration

**Status:** In Progress  
**Date:** 2025-01-17

## ✅ Completed Steps

1. **Created new Neon database:** `provider-portal`
2. **Updated local environment files:**
   - `apps/provider-portal/.env` - Created with new DATABASE_URL
   - `apps/provider-portal/.env.local` - Updated with new DATABASE_URL

## 🔄 Next Steps - Vercel Dashboard Configuration

### Step 1: Update Provider Portal Environment Variable

1. Go to: https://vercel.com/chris-projects-de6cd1bf/cortiware-provider-portal/settings/environment-variables
2. Find the `DATABASE_URL` variable
3. Click "Edit" or "Add" if it doesn't exist
4. Set the value to:
   ```
   postgresql://neondb_owner:npg_GwJisR3Hvlf7@ep-billowing-truth-afi1gfga-pooler.c-2.us-west-2.aws.neon.tech/provider-portal?sslmode=require&channel_binding=require
   ```
5. Select environments: **Production, Preview, Development**
6. Click "Save"

### Step 2: Trigger Redeploy

After updating the environment variable:
1. Go to: https://vercel.com/chris-projects-de6cd1bf/cortiware-provider-portal
2. Click "Deployments" tab
3. Find the latest deployment
4. Click the three dots menu → "Redeploy"
5. Check "Use existing Build Cache" (optional)
6. Click "Redeploy"

### Step 3: Monitor Deployment

Watch the deployment logs for:
- ✅ Prisma migrations running successfully
- ✅ Database connection established
- ✅ Build completes without errors
- ✅ No schema conflicts

## 📊 Expected Results

After successful deployment:
- Provider portal uses separate database: `provider-portal`
- Tenant app continues using original database
- No schema conflicts between apps
- Both apps can deploy independently

## 🔙 Rollback Plan

If deployment fails:
1. Revert DATABASE_URL in Vercel to original value
2. Redeploy
3. Investigate error logs
4. Fix issues and retry

## 📝 Database Connection Strings

**Provider Portal (NEW):**
```
postgresql://neondb_owner:npg_GwJisR3Hvlf7@ep-billowing-truth-afi1gfga-pooler.c-2.us-west-2.aws.neon.tech/provider-portal?sslmode=require&channel_binding=require
```

**Tenant App (EXISTING):**
- Keep current DATABASE_URL unchanged
- Will be documented separately if needed

