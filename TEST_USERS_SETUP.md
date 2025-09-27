# Development Test Users Setup

## Overview
Your application now supports role-specific test users that work consistently across all environments (Replit, Vercel, local development) without requiring database setup.

## Environment Variables to Set

Add these environment variables to your Replit Secrets or .env file:

```bash
# Test users for each role type
DEV_OWNER_EMAIL=owner@test.com
DEV_MANAGER_EMAIL=manager@test.com
DEV_STAFF_EMAIL=staff@test.com
DEV_ACCOUNTANT_EMAIL=accountant@test.com
DEV_PROVIDER_EMAIL=provider@test.com

# Test organization ID (optional)
DEV_ORG_ID=test-org-id
```

## How to Use

1. **Login with any test email** - Simply enter one of the test emails above in the login form (no password needed in development)

2. **Each user gets proper role permissions**:
   - `owner@test.com` - Full system access (all 195 permissions)
   - `manager@test.com` - Operational control permissions
   - `staff@test.com` - Basic operational access
   - `accountant@test.com` - Financial and HR permissions
   - `provider@test.com` - Provider portal access only

3. **Cross-platform compatibility** - Works identically on:
   - Replit development
   - Vercel deployments
   - Local development
   - Any environment with the env vars set

## Technical Details

- **RBAC Compliant**: Uses your actual permission system, not bypasses
- **Database Independent**: No database records needed
- **Legacy Compatible**: Still supports DEV_USER_EMAIL if needed
- **Secure**: Only works in development environments

## Testing Different Roles

Simply log out and log back in with different test emails to test different user role functionality:

- Test Owner dashboard: `owner@test.com`
- Test Manager operations: `manager@test.com`  
- Test Staff workflows: `staff@test.com`
- Test Accountant billing: `accountant@test.com`
- Test Provider portal: `provider@test.com`

Each test user will see the appropriate UI, have correct permissions, and access only their designated features.