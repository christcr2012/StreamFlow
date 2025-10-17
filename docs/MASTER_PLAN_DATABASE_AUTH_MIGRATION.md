# Master Plan: Database Separation & Authentication Migration

**Created:** 2025-01-17  
**Status:** Planning  
**Owner:** Chris Robinson  
**Executor:** Augment Agent (Claude Sonnet 4.5)

---

## 🎯 Executive Summary

This plan addresses critical architectural issues preventing stable builds and proper authentication:

1. **Database Separation** - Split provider-portal and tenant-app into separate databases
2. **Provider Auth Migration** - Move from env-based to database-backed authentication
3. **Social Login Removal** - Remove inappropriate OAuth options from both apps
4. **Pricing Management Completion** - Finish Phase 3 of dynamic pricing system
5. **Email Change Capability** - Enable users to change their login email addresses

---

## 🚨 Critical Issues Being Resolved

### Issue #1: Shared Database Causing Build Failures
**Problem:** Both apps use the same Neon database with different Prisma schemas, causing:
- Schema conflicts during builds
- Coupling between tenant and provider concerns
- Cannot evolve schemas independently
- Vercel build failures due to schema mismatches

**Impact:** HIGH - Blocking deployments and feature development

### Issue #2: Environment-Based Provider Auth
**Problem:** Provider credentials stored in `.env.local`:
- Cannot change email/password through UI
- Not scalable for multiple provider accounts
- No audit trail of authentication events

**Impact:** MEDIUM - Functional but not user-friendly or scalable

### Issue #3: Broken Social Logins
**Problem:** GitHub/Gmail OAuth on login pages:
- Gmail says "system doesn't meet requirements"
- GitHub OAuth doesn't work
- Not appropriate for employee logins anyway
- Confusing for users

**Impact:** LOW - Not used, but clutters UI and causes confusion

---

## 📋 Execution Plan

### **PHASE 1: Database Separation** ⚠️ CRITICAL - DO FIRST

**Goal:** Create separate Neon databases for provider-portal and tenant-app

**Tasks:**

1. **Create New Neon Database**
   - [ ] Log into Neon console
   - [ ] Create new database: `cortiware-provider-portal`
   - [ ] Copy connection string
   - [ ] Update `apps/provider-portal/.env.local` with new `DATABASE_URL`
   - [ ] Keep original database for tenant-app

2. **Migrate Provider Schema**
   - [ ] Run `cd apps/provider-portal && npx prisma migrate deploy`
   - [ ] Verify all tables created correctly
   - [ ] Run seed script if needed

3. **Update CI/CD**
   - [ ] Update GitHub Actions to handle both databases
   - [ ] Update Vercel environment variables for provider-portal
   - [ ] Test builds on both apps independently

4. **Verification**
   - [ ] Provider portal builds successfully
   - [ ] Tenant app builds successfully
   - [ ] No schema conflicts
   - [ ] Both apps can deploy independently

**Rollback Strategy:** Keep original DATABASE_URL backed up; can revert .env changes

**Estimated Time:** 1-2 hours

---

### **PHASE 2: Provider Auth Migration to Database**

**Goal:** Move provider authentication from .env to database-backed system

**Tasks:**

1. **Create ProviderAccount Table**
   ```prisma
   model ProviderAccount {
     id           String   @id @default(cuid())
     email        String   @unique
     passwordHash String
     name         String?
     role         String   @default("SUPER_ADMIN")
     isActive     Boolean  @default(true)
     createdAt    DateTime @default(now())
     updatedAt    DateTime @updatedAt
     lastLogin    DateTime?
   }
   ```
   - [ ] Add to `apps/provider-portal/prisma/schema.prisma`
   - [ ] Run migration: `npx prisma migrate dev --name add_provider_accounts`

2. **Seed Initial Provider Account**
   - [ ] Create seed script to migrate chris@robinsonaisystems.com
   - [ ] Hash password properly with bcrypt
   - [ ] Run seed: `npx prisma db seed`

3. **Update Authentication Logic**
   - [ ] Update `packages/auth-service/src/authenticate.ts`
   - [ ] Check database first (Layer 1)
   - [ ] Fall back to breakglass env vars (Layer 2 - emergency only)
   - [ ] Remove primary env-based auth

4. **Build Account Management UI**
   - [ ] Create `/provider/settings/account` page
   - [ ] Email change form (with verification)
   - [ ] Password change form (requires current password)
   - [ ] Activity log of account changes

5. **Testing**
   - [ ] Test database login works
   - [ ] Test breakglass still works (simulate DB down)
   - [ ] Test email change flow
   - [ ] Test password change flow

**Rollback Strategy:** Keep breakglass credentials in .env; can always use emergency access

**Estimated Time:** 3-4 hours

---

### **PHASE 3: Remove Social Logins** (Can run parallel with Phase 2)

**Goal:** Remove GitHub/Gmail OAuth from both login pages

**Tasks:**

1. **Provider Portal Login**
   - [ ] Find login page: `apps/provider-portal/src/app/login/page.tsx`
   - [ ] Remove OAuth buttons/components
   - [ ] Remove OAuth callback routes
   - [ ] Clean up unused OAuth config

2. **Tenant App Login**
   - [ ] Find login page: `apps/tenant-app/src/app/login/page.tsx`
   - [ ] Remove OAuth buttons/components
   - [ ] Remove OAuth callback routes
   - [ ] Clean up unused OAuth config

3. **Documentation**
   - [ ] Document why social logins were removed
   - [ ] Note: May add back for customer portal in future (different use case)

**Rollback Strategy:** Git revert if needed

**Estimated Time:** 1 hour

---

### **PHASE 4: Complete Pricing Management Phase 3**

**Goal:** Finish dynamic pricing admin UI

**Tasks:**

1. **Plan Editor Pages**
   - [ ] Create `/provider/admin/pricing/new` page
   - [ ] Create `/provider/admin/pricing/[id]/edit` page
   - [ ] Form with: name, description, price, currency, CTA, features
   - [ ] Drag-and-drop feature reordering
   - [ ] Save as draft / Submit for review buttons

2. **History Viewer**
   - [ ] Create `/provider/admin/pricing/[id]/history` page
   - [ ] Timeline view of all changes
   - [ ] Show before/after diffs
   - [ ] Filter by action type

3. **Update Main Pricing Page**
   - [ ] Add "Submit for Review" button (Draft → Pending Review)
   - [ ] Add "Approve" button (Pending Review → Published)
   - [ ] Add "Reject" button (Pending Review → Draft)
   - [ ] Add "Edit" button (goes to edit page)

4. **Super Admin Role Check**
   - [ ] Implement actual role check (not just session check)
   - [ ] Create SUPER_ADMIN role in database
   - [ ] Assign to chris@robinsonaisystems.com

**Estimated Time:** 4-5 hours

---

### **PHASE 5: Email Change Capability**

**Goal:** Allow users to change their login email address

**Tasks:**

1. **API Endpoint**
   - [ ] Create `POST /api/user/change-email`
   - [ ] Validate new email not already taken
   - [ ] Send verification email to new address
   - [ ] Update email after verification
   - [ ] Update breakglass account if exists
   - [ ] Log change in activity log
   - [ ] Invalidate all sessions (force re-login)

2. **UI Component**
   - [ ] Add to `/provider/settings/account` page
   - [ ] Current email display
   - [ ] New email input
   - [ ] Verification code input
   - [ ] Confirmation flow

3. **Testing**
   - [ ] Test email change flow end-to-end
   - [ ] Test verification email delivery
   - [ ] Test session invalidation
   - [ ] Test breakglass account update

**Estimated Time:** 2-3 hours

---

## 🔄 Execution Order

```
PHASE 1: Database Separation (CRITICAL - DO FIRST)
  ↓
PHASE 2: Provider Auth Migration ←→ PHASE 3: Remove Social Logins (PARALLEL)
  ↓
PHASE 4: Complete Pricing Management
  ↓
PHASE 5: Email Change Capability
```

**Total Estimated Time:** 12-16 hours of focused work

---

## ✅ Success Criteria

- [ ] Provider portal and tenant app have separate databases
- [ ] Both apps build and deploy independently without conflicts
- [ ] Provider can log in with database-backed credentials
- [ ] Provider can change email and password through UI
- [ ] Breakglass emergency access still works
- [ ] Social login buttons removed from both apps
- [ ] Pricing management fully functional with workflow
- [ ] All changes logged and auditable

---

## 🚀 Next Steps

1. **User approval** of this plan
2. **Start Phase 1** immediately (database separation)
3. **Progress updates** after each phase
4. **Verification** at each checkpoint
5. **Deploy** incrementally to production

---

## 📝 Notes

- All changes will be committed atomically with descriptive messages
- Each phase will be tested before moving to next
- Rollback strategies documented for each phase
- User will be notified of any blockers or decisions needed

