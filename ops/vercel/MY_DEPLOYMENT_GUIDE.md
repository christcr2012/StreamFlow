# My Cortiware Deployment Guide - Personalized

**Your specific deployment instructions with actual values**

---

## Your Current Setup

**Local Folder:** `C:\Users\chris\Git Local\StreamFlow` → Will rename to `Cortiware`  
**GitHub Repo:** `https://github.com/christcr2012/Cortiware.git`  
**Current Vercel Project:** `mountain-vista` (will be replaced)  
**Your Email:** chris.tcr.2012@gmail.com

---

## Step 1: Rename Project Folder (5 minutes)

### Close VS Code First!

### Commit Everything
```bash
cd "C:\Users\chris\Git Local\StreamFlow"
git add -A
git commit -m "Pre-rename checkpoint"
git push
```

### Rename Folder
```powershell
cd "C:\Users\chris\Git Local"
Rename-Item -Path "StreamFlow" -NewName "Cortiware"
```

### Reopen Project
1. Open VS Code
2. File → Open Folder
3. Navigate to `C:\Users\chris\Git Local\Cortiware`
4. Verify: `git status` (should work fine)

---

## Step 2: Remove Old Logos (10 minutes)

### Find Logo Files
```powershell
cd "C:\Users\chris\Git Local\Cortiware"
Get-ChildItem -Recurse -Include *.ico,favicon.*,logo.*,*icon*.png,*icon*.svg -Exclude node_modules
```

### Remove Files (adjust based on what you find)
```powershell
Remove-Item public/favicon.ico -ErrorAction SilentlyContinue
Remove-Item public/logo.png -ErrorAction SilentlyContinue
Remove-Item public/logo.svg -ErrorAction SilentlyContinue
Remove-Item -Recurse public/icons -ErrorAction SilentlyContinue
```

### Commit
```bash
git add -A
git commit -m "chore: remove old StreamFlow branding"
git push
```

---

## Step 3: Export from mountain-vista (10 minutes)

### Download Environment Variables

1. Go to: https://vercel.com/dashboard
2. Find "mountain-vista" project
3. Click on it
4. **Settings → Environment Variables**
5. Click "..." (three dots) at top right
6. Select "Download as .env file"
7. Save as `mountain-vista-backup.env` on your Desktop (NOT in git repo)

### Verify File Contains These Keys

Open `mountain-vista-backup.env` and verify you see:
- DATABASE_URL
- PROVIDER_EMAIL
- PROVIDER_PASSWORD
- DEVELOPER_EMAIL
- DEVELOPER_PASSWORD
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- AUTH_TICKET_HMAC_SECRET (for SSO between apps)

### Generate New Secrets (if missing)

```bash
# Generate HMAC secret for auth tickets
openssl rand -base64 32

# Generate bcrypt hashes for emergency access
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-password', 10));"
```

---

## Step 4: Create New Vercel Projects (45 minutes)

### 4.1 Create: cortiware-provider-portal

**This replaces mountain-vista**

1. Go to: https://vercel.com/new
2. Click "Add New" → "Project"
3. Select repository: `christcr2012/Cortiware`
4. Configure:
   - **Project Name:** `cortiware-provider-portal`
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/provider-portal`
   - **Build Command:** `cd ../.. && npm run build -- --filter=provider-portal`
   - **Output Directory:** `.next`
   - **Install Command:** `cd ../.. && npm install`
   - **Node.js Version:** 22.x

5. **Environment Variables** - Click "Environment Variables" and add these:

**NOTE:** For Stripe keys, copy them from your `.env.local` file (lines 35-37)

```bash
# Database (set in Vercel → never commit real credentials)
# Example:
# DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require

# SSO Ticket Secret (MUST match tenant-app)
AUTH_TICKET_HMAC_SECRET=SET_IN_VERCEL

# Provider Authentication
PROVIDER_EMAIL=provider@example.com
PROVIDER_PASSWORD=CHANGE_ME_IN_VERCEL
PROVIDER_BREAKGLASS_EMAIL=breakglass-provider@example.com
PROVIDER_BREAKGLASS_PASSWORD=CHANGE_ME_IN_VERCEL

# Developer Authentication
DEVELOPER_EMAIL=developer@example.com
DEVELOPER_PASSWORD=CHANGE_ME_IN_VERCEL
DEVELOPER_BREAKGLASS_EMAIL=breakglass-developer@example.com
DEVELOPER_BREAKGLASS_PASSWORD=CHANGE_ME_IN_VERCEL

# Development Mode (DISABLE IN PRODUCTION)
DEV_ACCEPT_ANY_PROVIDER_LOGIN=false
DEV_ACCEPT_ANY_DEVELOPER_LOGIN=false
DEV_ACCEPT_ANY_TENANT_LOGIN=false
DEV_ACCEPT_ANY_ACCOUNTANT_LOGIN=false
DEV_ACCEPT_ANY_VENDOR_LOGIN=false

# Stripe (Get from your Stripe dashboard; set in Vercel)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Federation (disabled for now)
FED_ENABLED=false
FED_OIDC_ENABLED=false

# Node Environment
NODE_ENV=production

# Session Secrets (GENERATE NEW ONES - see below)
PROVIDER_SESSION_SECRET=GENERATE_WITH_OPENSSL_RAND_HEX_32
TENANT_COOKIE_SECRET=GENERATE_WITH_OPENSSL_RAND_HEX_32
DEVELOPER_SESSION_SECRET=GENERATE_WITH_OPENSSL_RAND_HEX_32
ACCOUNTANT_SESSION_SECRET=GENERATE_WITH_OPENSSL_RAND_HEX_32

# Federation Keys (GENERATE NEW ONES - see below)
FED_HMAC_MASTER_KEY=GENERATE_WITH_OPENSSL_RAND_HEX_64

# Provider Credentials (bcrypt hashed - GENERATE NEW ONES - see below)
PROVIDER_CREDENTIALS=GENERATE_BCRYPT_HASH
DEVELOPER_CREDENTIALS=GENERATE_BCRYPT_HASH
```

6. **Generate Missing Secrets** - Open PowerShell and run:

```powershell
# Generate SSO ticket secret (CRITICAL - must be same in both apps)
node -e "console.log('AUTH_TICKET_HMAC_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"

# Generate session secrets (32 bytes hex)
node -e "console.log('PROVIDER_SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('TENANT_COOKIE_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('DEVELOPER_SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ACCOUNTANT_SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate federation key (64 bytes hex)
node -e "console.log('FED_HMAC_MASTER_KEY=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate bcrypt hashes for credentials
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('provider@example.com:CHANGE_ME_PASSWORD', 10, (e,h) => console.log('PROVIDER_CREDENTIALS=' + h))"
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('developer@example.com:CHANGE_ME_PASSWORD', 10, (e,h) => console.log('DEVELOPER_CREDENTIALS=' + h))"
```

**IMPORTANT:** Save the `AUTH_TICKET_HMAC_SECRET` value - you'll need it for tenant-app!

7. Copy the generated values and paste them into Vercel environment variables

8. **Set for all environments:** Check Production, Preview, and Development

9. Click "Deploy"

10. **Wait for deployment** - Should take 2-3 minutes

11. **Save the deployment URL:** Will be something like `cortiware-provider-portal.vercel.app`

---

### 4.2 Create: cortiware-marketing-robinson

1. Click "Add New" → "Project"
2. Select repository: `christcr2012/Cortiware`
3. Configure:
   - **Project Name:** `cortiware-marketing-robinson`
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/marketing-robinson`
   - **Build Command:** `cd ../.. && npm run build -- --filter=marketing-robinson`
   - **Output Directory:** `.next`
   - **Install Command:** `cd ../.. && npm install`

4. **Environment Variables:**
```bash
PROVIDER_PORTAL_URL=https://cortiware-provider-portal.vercel.app
NEXT_PUBLIC_BASE_URL=https://robinsonaisystems.com
```

5. Click "Deploy"

---

### 4.3 Create: cortiware-marketing-cortiware

1. Click "Add New" → "Project"
2. Select repository: `christcr2012/Cortiware`
3. Configure:
   - **Project Name:** `cortiware-marketing-cortiware`
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/marketing-cortiware`
   - **Build Command:** `cd ../.. && npm run build -- --filter=marketing-cortiware`
   - **Output Directory:** `.next`
   - **Install Command:** `cd ../.. && npm install`

4. **Environment Variables:**
```bash
TENANT_APP_URL=https://cortiware-tenant-app.vercel.app
NEXT_PUBLIC_BASE_URL=https://cortiware.com
```

5. Click "Deploy"

---

### 4.4 Create: cortiware-tenant-app

1. Click "Add New" → "Project"
2. Select repository: `christcr2012/Cortiware`
3. Configure:
   - **Project Name:** `cortiware-tenant-app`
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/tenant-app`
   - **Build Command:** `cd ../.. && npm run build -- --filter=tenant-app`
   - **Output Directory:** `.next`
   - **Install Command:** `cd ../.. && npm install`

4. **Environment Variables:**

**CRITICAL:** Use the SAME `AUTH_TICKET_HMAC_SECRET` from provider-portal!

```bash
# Database (set in Vercel; use placeholder here)
# Example: postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require

# SSO Ticket Secret (MUST match provider-portal)
AUTH_TICKET_HMAC_SECRET=SET_IN_VERCEL

# Tenant Cookie Secret
TENANT_COOKIE_SECRET=GENERATE_WITH_OPENSSL_RAND_HEX_32

# Emergency Access
EMERGENCY_LOGIN_ENABLED=true
PROVIDER_ADMIN_PASSWORD_HASH=GENERATE_BCRYPT_HASH
DEVELOPER_ADMIN_PASSWORD_HASH=GENERATE_BCRYPT_HASH

# Optional: IP allowlist for emergency access
# EMERGENCY_IP_ALLOWLIST=1.2.3.4,5.6.7.8

# Development Mode (DISABLE IN PRODUCTION)
DEV_ACCEPT_ANY_TENANT_LOGIN=false
DEV_ACCEPT_ANY_ACCOUNTANT_LOGIN=false
DEV_ACCEPT_ANY_VENDOR_LOGIN=false

# App URL
NEXT_PUBLIC_APP_URL=https://cortiware-tenant-app.vercel.app
```

5. **Generate Emergency Access Hashes:**

```powershell
# Generate bcrypt hashes for emergency access
node scripts/generate-bcrypt-hash.js YourProviderEmergencyPassword
node scripts/generate-bcrypt-hash.js YourDeveloperEmergencyPassword
```

Copy the generated hashes to `PROVIDER_ADMIN_PASSWORD_HASH` and `DEVELOPER_ADMIN_PASSWORD_HASH`

6. Click "Deploy"

---

## Step 5: Test New Provider Portal (30 minutes)

### 5.1 Find Your Deployment URL

1. Go to `cortiware-provider-portal` project
2. Click on latest deployment
3. Copy the URL (e.g., `cortiware-provider-portal.vercel.app`)

### 5.2 Test Provider Login

1. Visit: `https://cortiware-provider-portal.vercel.app/provider`
2. Login with:
   - **Email:** provider@example.com
   - **Password:** CHANGE_ME_IN_VERCEL
3. Should see provider dashboard

### 5.3 Test Key Features

- [ ] Provider dashboard loads
- [ ] `/provider/federation` - Federation keys page
- [ ] `/provider/incidents` - Incidents page
- [ ] `/provider/analytics` - Analytics page
- [ ] `/provider/clients` - Clients page

### 5.4 Check for Errors

1. Open browser console (F12)
2. Look for any red errors
3. If errors, check Vercel deployment logs

---

## Step 6: Update Stripe Webhook (If Needed)

**Only if you're using Stripe webhooks**

1. Go to: https://dashboard.stripe.com/webhooks
2. Find webhook pointing to `mountain-vista.vercel.app`
3. Click "..." → Edit
4. Update URL to: `https://cortiware-provider-portal.vercel.app/api/webhooks/stripe`
5. Save

---

## Step 7: Delete mountain-vista (ONLY AFTER TESTING)

### ⚠️ WAIT! Make sure everything works first!

- [ ] New provider portal fully functional
- [ ] Can login successfully
- [ ] All pages load without errors
- [ ] Database connections working
- [ ] Stripe webhook updated (if applicable)

### Delete Old Project

1. Go to mountain-vista project
2. **Settings → Advanced**
3. Scroll to bottom: "Delete Project"
4. Type `mountain-vista` to confirm
5. Click "Delete"

### Clean Up

1. Delete `mountain-vista-backup.env` from your Desktop
2. Update any bookmarks to new URL

---

## Your New URLs

**Provider Portal:** https://cortiware-provider-portal.vercel.app  
**Marketing (Robinson):** https://cortiware-marketing-robinson.vercel.app  
**Marketing (Cortiware):** https://cortiware-marketing-cortiware.vercel.app  
**Tenant App:** https://cortiware-tenant-app.vercel.app

---

## Next Steps (Optional)

### Add Custom Domains

See full guide: `ops/vercel/VERCEL_DEPLOYMENT_GUIDE.md` Section 6

### Add New Branding

1. Generate favicons at: https://realfavicongenerator.net/
2. Add to each app's `public/` folder
3. Commit and push

---

## Troubleshooting

### Build Fails
- Check Vercel deployment logs
- Verify Root Directory is correct
- Ensure Build Command includes `cd ../..`

### Can't Login
- Check environment variables are set
- Verify PROVIDER_EMAIL and PROVIDER_PASSWORD match
- Check browser console for errors

### Database Errors
- Verify DATABASE_URL is correct
- Check Neon database is running
- Verify Prisma migrations are applied

---

**Status:** Ready to deploy!  
**Estimated Time:** 1-2 hours total  
**Support:** See full guide in `ops/vercel/VERCEL_DEPLOYMENT_GUIDE.md`

