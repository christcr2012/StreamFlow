# Provider Portal User Guide

## Overview

The Provider Portal is the central management interface for Cortiware providers to manage tenants, monitor federation, handle monetization, and oversee developer access.

## Getting Started

### Accessing the Portal

1. Navigate to your Provider Portal URL
2. Enter your provider email and password
3. If MFA is enabled, enter your TOTP code or backup code
4. Click "Sign In"

### First-Time Setup

**Enable Multi-Factor Authentication (Recommended):**
1. Navigate to Security → MFA
2. Click "Enable MFA"
3. Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
4. Enter the 6-digit code to verify
5. Save your backup codes in a secure location

## Dashboard

### Overview Metrics

The dashboard displays key metrics:
- **Total Tenants:** Number of active tenant organizations
- **Active Federation Keys:** Currently valid federation keys
- **Monthly Revenue:** Total subscription revenue
- **API Requests:** Total API calls this month

### Recent Activity

View recent system events:
- Tenant registrations
- Federation key rotations
- Subscription changes
- API usage spikes

## Lead Management

### Viewing Leads

**List View:**
1. Navigate to Leads
2. Use filters to narrow results:
   - Status (NEW, CONVERTED)
   - Source Type
   - Date Range
   - AI Score Range
3. Click column headers to sort
4. Use search to find specific leads

**Detail View:**
1. Click on any lead to view details
2. View complete lead information
3. See activity timeline
4. Access custom field values

### Creating Leads

1. Click "New Lead" button
2. Fill in required fields:
   - Company Name
   - Contact Name
   - Email
   - Phone
3. Add optional information:
   - Website
   - Location (City, State, ZIP)
   - Notes
4. Click "Save Lead"

### Advanced Filtering

1. Click "Advanced Filters"
2. Add filter criteria:
   - Text search across multiple fields
   - Status (single or multiple)
   - Source type (single or multiple)
   - Date ranges (created, converted)
   - AI score range
   - Quality score range
   - Location filters
3. Click "Apply Filters"
4. Save filter presets for reuse

### Bulk Operations

**Select Multiple Leads:**
1. Check boxes next to leads
2. Click "Bulk Actions"
3. Choose operation:
   - Update Status
   - Update Dispute Status
   - Update Classification
   - Update Quality Score
   - Add Notes
   - Delete

**Update Status:**
1. Select leads
2. Choose "Update Status"
3. Select new status
4. Click "Update"

**Add Notes:**
1. Select leads
2. Choose "Add Notes"
3. Enter note text
4. Click "Add" (notes are timestamped)

### Exporting Leads

1. Apply desired filters
2. Click "Export"
3. Choose format (CSV)
4. Download file
5. File includes all filtered leads (max 10,000)

### Sending Emails

1. Select leads with email addresses
2. Click "Send Email"
3. Enter:
   - From Name
   - From Email
   - Subject
   - Body (use {contactName} and {company} variables)
4. Click "Send"
5. View success/failure report

## Federation Management

### Federation Keys

**View Keys:**
1. Navigate to Federation → Keys
2. View active and disabled keys
3. See key creation and expiration dates

**Create New Key:**
1. Click "Generate Key"
2. Copy the key ID and secret
3. Store secret securely (shown only once)
4. Distribute to tenant for integration

**Rotate Keys:**
1. Navigate to Security → Secrets Rotation
2. Create rotation policy:
   - Key Type (federation, API, encryption)
   - Rotation Interval (days)
   - Grace Period (days)
   - Auto-Rotate (yes/no)
3. Click "Save Policy"
4. Manual rotation: Click "Rotate Now"

### OIDC Configuration

1. Navigate to Federation → OIDC
2. Configure OIDC provider:
   - Issuer URL
   - Client ID
   - Client Secret
   - Scopes
3. Test connection
4. Save configuration

### Tenant Management

**View Tenants:**
1. Navigate to Federation → Tenants
2. View all registered tenants
3. See tenant status and metadata

**Tenant Details:**
1. Click on tenant
2. View:
   - Organization information
   - Federation keys
   - API usage
   - Subscription status

## Monetization

### Plans & Pricing

**View Plans:**
1. Navigate to Monetization → Plans
2. See all subscription plans
3. View pricing tiers

**Create Plan:**
1. Click "New Plan"
2. Enter:
   - Plan name
   - Description
   - Price (monthly/yearly)
   - Features
3. Click "Create"

### Subscriptions

**View Subscriptions:**
1. Navigate to Monetization → Subscriptions
2. Filter by status (active, canceled, past_due)
3. View subscription details

**Manage Subscription:**
1. Click on subscription
2. Actions available:
   - Change plan
   - Update payment method
   - Cancel subscription
   - View invoices

### Coupons

**Create Coupon:**
1. Navigate to Monetization → Coupons
2. Click "New Coupon"
3. Enter:
   - Name
   - Discount (percentage or amount)
   - Duration (once, repeating, forever)
   - Duration in months (if repeating)
4. Click "Create"

## Developer Portal

### API Keys

**Generate API Key:**
1. Navigate to Developer → API Keys
2. Click "Generate Key"
3. Enter key name
4. Copy key (shown only once)
5. Store securely

**Revoke Key:**
1. Find key in list
2. Click "Revoke"
3. Confirm action

### API Explorer

**Test Endpoints:**
1. Navigate to Developer → API Explorer
2. Select endpoint
3. Enter parameters
4. Click "Send Request"
5. View response

### Webhooks

**Create Webhook:**
1. Navigate to Developer → Webhooks
2. Click "New Webhook"
3. Enter:
   - URL
   - Events to subscribe to
   - Secret (for signature verification)
4. Click "Create"

**Test Webhook:**
1. Click "Test" on webhook
2. View test payload
3. Check endpoint receives event

### Usage Tracking

**View API Usage:**
1. Navigate to Developer → Usage
2. Select date range
3. View metrics:
   - Total requests
   - Requests by endpoint
   - Error rate
   - Response times

## RBAC Management

### Roles

**View Roles:**
1. Navigate to RBAC → Roles
2. See system and custom roles
3. View assigned permissions

**Create Custom Role:**
1. Click "New Role"
2. Enter:
   - Role name
   - Role slug
3. Select permissions (multi-select)
4. Click "Create"

**Delete Role:**
1. Find custom role
2. Click "Delete"
3. Confirm (system roles cannot be deleted)

### Permissions

**View Permissions:**
1. Navigate to RBAC → Permissions
2. See all 30+ permissions
3. Grouped by category:
   - Federation
   - Monetization
   - Developer
   - Leads
   - Analytics
   - Audit
   - RBAC
   - Secrets
   - System

### User Assignments

**Assign Role to User:**
1. Navigate to RBAC → Users
2. Find user
3. Click "Assign Role"
4. Select role
5. Click "Assign"

**Remove Role:**
1. Find user-role assignment
2. Click "Remove"
3. Confirm

## Security

### Multi-Factor Authentication

**Enable MFA:**
1. Navigate to Security → MFA
2. Click "Enable MFA"
3. Scan QR code with authenticator app
4. Enter verification code
5. Save backup codes

**Disable MFA:**
1. Navigate to Security → MFA
2. Click "Disable MFA"
3. Enter current TOTP code
4. Confirm

**Regenerate Backup Codes:**
1. Navigate to Security → MFA
2. Click "Regenerate Backup Codes"
3. Save new codes (old codes invalidated)

### Secrets Rotation

**Create Rotation Policy:**
1. Navigate to Security → Secrets Rotation
2. Click "New Policy"
3. Configure:
   - Name
   - Key Type
   - Rotation Interval (days)
   - Grace Period (days)
   - Auto-Rotate (yes/no)
   - Notify Before (days)
4. Click "Create"

**Manual Rotation:**
1. Find policy
2. Click "Rotate Now"
3. Confirm
4. View new key ID in history

**View History:**
1. Navigate to Rotation History tab
2. See all past rotations
3. Filter by key type or date

## Custom Fields

### Field Definitions

**Create Custom Field:**
1. Navigate to Settings → Custom Fields
2. Click "New Field"
3. Enter:
   - Entity Type (lead, customer, job, invoice)
   - Field Name (internal slug)
   - Display Name (user-facing)
   - Field Type (text, number, date, boolean, select, multiselect)
   - Options (for select/multiselect)
   - Required (yes/no)
   - Default Value
   - Validation Rules
4. Click "Create"

**Edit Field:**
1. Find field in list
2. Click "Edit"
3. Update properties
4. Click "Save"

**Delete Field:**
1. Find field
2. Click "Delete"
3. Confirm (deletes all values)

### Field Values

**Set Field Value:**
1. Open entity (lead, customer, etc.)
2. Find custom field
3. Enter value
4. Click "Save"

## Audit Logs

### Viewing Logs

1. Navigate to Audit → Logs
2. Filter by:
   - Actor (user email)
   - Entity Type
   - Action
   - Date Range
3. View event details

### Exporting Logs

1. Apply filters
2. Click "Export"
3. Download CSV

## Support

### Getting Help

- **Documentation:** docs.cortiware.com
- **Email:** support@cortiware.com
- **Status Page:** status.cortiware.com

### Reporting Issues

1. Navigate to Help → Report Issue
2. Describe problem
3. Include screenshots if applicable
4. Submit ticket

User Guide: Complete ✅

