# Vertical Packs Status & Test Data Plan

**Date**: 2025-10-16  
**Purpose**: Identify complete vertical packs and create test tenants for Provider/Tenant system testing

---

## 🎯 Vertical Packs Status

### ✅ COMPLETE Vertical Packs (Ready for Testing)

**1. Port-a-John** (`port-a-john`)
- ✅ **Forms**: 5 forms (lead, estimate, service job, delivery job, removal job)
- ✅ **Price Book**: 4 SKUs with pricing
- ✅ **Estimator**: Full estimation logic
- ✅ **Status**: **PRODUCTION READY**
- **Use Case**: Portable toilet rental and servicing

**2. Cleaning** (`cleaning`)
- ✅ **Forms**: Service type, square feet
- ✅ **Price Book**: Residential and commercial pricing
- ✅ **Estimator**: Basic estimation logic
- ✅ **Status**: **PRODUCTION READY**
- **Use Case**: Residential and commercial cleaning services

**3. Fencing** (`fencing`)
- ✅ **Forms**: Fence type, linear feet, height
- ✅ **Price Book**: Wood and vinyl pricing
- ✅ **Estimator**: Basic estimation logic
- ✅ **Status**: **PRODUCTION READY**
- **Use Case**: Fence installation

**4. Appliance Rental** (`appliance-rental`)
- ✅ **Forms**: Appliance type, rental days
- ✅ **Price Book**: Refrigerator, washer pricing
- ✅ **Estimator**: Basic estimation logic
- ✅ **Status**: **PRODUCTION READY**
- **Use Case**: Appliance rental services

**5. Roll-Off** (`roll-off`)
- ✅ **Forms**: Dumpster size, rental days
- ✅ **Price Book**: 20-yard and 30-yard pricing
- ✅ **Estimator**: Basic estimation logic
- ✅ **Status**: **PRODUCTION READY**
- **Use Case**: Dumpster rental

**6. Concrete Lifting & Leveling** (`concrete-lifting-and-leveling`)
- ⚠️ **Forms**: Placeholder (tries to load from external files)
- ⚠️ **Price Book**: Placeholder
- ⚠️ **Estimator**: Placeholder
- ⚠️ **Status**: **SKELETON** (needs external files)
- **Use Case**: Concrete repair services

---

### ⚠️ SKELETON Vertical Packs (Not Ready)

All of these return skeleton/placeholder data:

7. **HVAC** (`hvac`) - Skeleton only
8. **Plumbing** (`plumbing`) - Skeleton only
9. **Electrical** (`electrical`) - Skeleton only
10. **Roofing** (`roofing`) - Skeleton only
11. **Landscaping** (`landscaping`) - Skeleton only
12. **Painting** (`painting`) - Skeleton only
13. **Pressure Washing** (`pressure-washing`) - Skeleton only
14. **Pest Control** (`pest-control`) - Skeleton only
15. **Snow Removal** (`snow-removal`) - Skeleton only
16. **Auto Detail** (`auto-detail`) - Skeleton only
17. **Generic Service** (`generic-service`) - Skeleton only
18. **Generic Rental** (`generic-rental`) - Skeleton only
19. **Generic Project** (`generic-project`) - Skeleton only

---

## 📊 Summary

**Total Vertical Packs**: 19  
**Complete & Ready**: 5 (Port-a-John, Cleaning, Fencing, Appliance Rental, Roll-Off)  
**Skeleton Only**: 13  
**Partial**: 1 (Concrete Lifting & Leveling)

**Completion Rate**: ~26% (5/19)

---

## 🧪 Test Data Plan

### Recommended Test Tenants

Based on complete vertical packs, create these test tenants:

**1. Test Tenant: "Clean Sweep Services"**
- **Vertical**: Cleaning
- **Trade**: Cleaning Services
- **Service Areas**: ["Denver, CO", "Aurora, CO", "Lakewood, CO"]
- **Plan**: Starter
- **Status**: Active
- **Test Scenarios**:
  - Residential cleaning leads
  - Commercial cleaning leads
  - Square footage-based pricing
  - Service frequency (weekly, bi-weekly, monthly)

**2. Test Tenant: "Mile High Fence Co"**
- **Vertical**: Fencing
- **Trade**: Fencing Installation
- **Service Areas**: ["Colorado Springs, CO", "Fort Collins, CO"]
- **Plan**: Professional
- **Status**: Active
- **Test Scenarios**:
  - Wood fence installation
  - Vinyl fence installation
  - Linear feet calculations
  - Height variations (4ft, 6ft, 8ft)

**3. Test Tenant: "Rocky Mountain Portables"**
- **Vertical**: Port-a-John
- **Trade**: Portable Toilet Rental
- **Service Areas**: ["Boulder, CO", "Longmont, CO", "Greeley, CO"]
- **Plan**: Professional
- **Status**: Active
- **Test Scenarios**:
  - Unit rental (daily pricing)
  - Service visits
  - Delivery and pickup
  - Duration-based pricing

**4. Test Tenant: "Front Range Dumpsters"**
- **Vertical**: Roll-Off
- **Trade**: Dumpster Rental
- **Service Areas**: ["Denver Metro Area"]
- **Plan**: Starter
- **Status**: Active
- **Test Scenarios**:
  - 20-yard dumpster rental
  - 30-yard dumpster rental
  - Rental duration pricing
  - Delivery fees

**5. Test Tenant: "Appliance Rentals Plus"**
- **Vertical**: Appliance Rental
- **Trade**: Appliance Rental
- **Service Areas**: ["Nationwide"]
- **Plan**: Enterprise
- **Status**: Active
- **Test Scenarios**:
  - Refrigerator rental
  - Washer/dryer rental
  - Daily/weekly/monthly pricing
  - Delivery and setup

---

## 🛠️ Test Data Seed Script

### Script Location
`scripts/seed-test-tenants.ts`

### What It Will Create

For each test tenant:
1. **Organization** (Org model)
2. **Tenant** (if separate from Org)
3. **Owner User** (with login credentials)
4. **Subscription** (active, with plan)
5. **Sample Leads** (5-10 leads per tenant)
   - Mix of statuses: NEW, CONTACTED, QUALIFIED, CONVERTED
   - Some with pending disputes
   - Some with quality scores
6. **Sample Invoices** (2-3 invoices)
   - 1 paid
   - 1 overdue (for Action Center testing)
   - 1 pending
7. **API Usage Data** (sample usage rows)
8. **Pricing Plan** (custom pricing for vertical)

### Test User Credentials

**Format**: `{vertical}@test.cortiware.com` / `Test123!`

Examples:
- `cleaning@test.cortiware.com` / `Test123!`
- `fencing@test.cortiware.com` / `Test123!`
- `portajohn@test.cortiware.com` / `Test123!`
- `rolloff@test.cortiware.com` / `Test123!`
- `appliance@test.cortiware.com` / `Test123!`

---

## 📋 Implementation Plan

### Phase 1: Create Seed Script (2-3 hours)

**File**: `scripts/seed-test-tenants.ts`

**Steps**:
1. ✅ Identify complete vertical packs (DONE)
2. ⏳ Create seed script structure
3. ⏳ Add organization creation logic
4. ⏳ Add user creation with bcrypt passwords
5. ⏳ Add subscription creation
6. ⏳ Add lead generation (using vertical-specific data)
7. ⏳ Add invoice generation
8. ⏳ Add API usage data
9. ⏳ Add pricing plan setup

**Output**: Script that creates 5 test tenants with full data

---

### Phase 2: Run Seed Script (30 minutes)

**Commands**:
```bash
# Run seed script
npm run seed:test-tenants

# Verify data
npm run prisma:studio
```

**Verification**:
- Check that 5 orgs exist
- Check that 5 users can log in
- Check that leads exist for each org
- Check that invoices exist
- Check that subscriptions are active

---

### Phase 3: Test Provider Portal (1-2 hours)

**Test Scenarios**:

**1. Clients Page** (`/provider/clients`)
- ✅ Should show all 5 test tenants
- ✅ Should show subscription status
- ✅ Should show service areas
- ✅ Should show vertical/trade

**2. Tenant Health** (`/provider/tenant-health`)
- ✅ Should show health scores for each tenant
- ✅ Should show churn risk indicators
- ✅ Should show activity metrics

**3. Action Center** (`/provider/action-center`)
- ✅ Should show pending disputes
- ✅ Should show overdue invoices
- ✅ Should show expiring subscriptions
- ✅ Should allow actions (approve/reject, send reminder)

**4. API Usage** (`/provider/api-usage`)
- ✅ Should show usage data for each tenant
- ✅ Should allow filtering by tenant
- ✅ Should show endpoint breakdown
- ✅ Should allow CSV export

**5. Analytics** (`/provider/analytics`)
- ✅ Should show revenue trends
- ✅ Should show user growth
- ✅ Should show conversion funnel
- ✅ Should show top clients by revenue

---

### Phase 4: Test Tenant App (1-2 hours)

**Test Scenarios**:

**1. Login** (`/login`)
- ✅ Should allow login with test credentials
- ✅ Should redirect to dashboard

**2. Dashboard** (`/dashboard`)
- ✅ Should show tenant-specific data
- ✅ Should show leads
- ✅ Should show invoices
- ✅ Should show subscription status

**3. Leads** (`/leads`)
- ✅ Should show leads for tenant
- ✅ Should allow creating new leads
- ✅ Should allow editing leads
- ✅ Should allow disputing leads

**4. Invoices** (`/invoices`)
- ✅ Should show invoices for tenant
- ✅ Should allow viewing invoice details
- ✅ Should allow paying invoices

**5. Settings** (`/settings`)
- ✅ Should show tenant settings
- ✅ Should allow updating profile
- ✅ Should allow configuring integrations

---

## 🎯 Success Criteria

### Provider Portal
- ✅ All 5 test tenants visible in Clients page
- ✅ Action Center shows actionable items
- ✅ API Usage shows data for all tenants
- ✅ Analytics shows aggregated metrics
- ✅ Tenant Health shows risk scores

### Tenant App
- ✅ All 5 test users can log in
- ✅ Each tenant sees only their own data
- ✅ Leads are visible and editable
- ✅ Invoices are visible and payable
- ✅ Settings are configurable

### Integration Testing
- ✅ Provider can view tenant data
- ✅ Provider can take actions (approve disputes, etc.)
- ✅ Tenant actions reflect in Provider Portal
- ✅ API usage is tracked correctly
- ✅ Billing flows work end-to-end

---

## 📝 Next Steps

1. **Create seed script** (`scripts/seed-test-tenants.ts`)
2. **Run seed script** to create test data
3. **Test Provider Portal** with test tenants
4. **Test Tenant App** with test users
5. **Fix any issues** found during testing
6. **Document test scenarios** for future reference

---

**Status**: ✅ Plan Complete | ⏳ Ready to Implement
**Estimated Time**: 4-6 hours total

