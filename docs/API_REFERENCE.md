# API Reference

## Overview

Complete API reference for Cortiware Provider Portal endpoints.

**Base URL:** `https://portal.cortiware.com/api`  
**Authentication:** Cookie-based session (`rs_provider`)  
**Content-Type:** `application/json`

---

## Authentication

### POST /api/auth/login

Authenticate provider or developer user.

**Request:**
```json
{
  "email": "provider@example.com",
  "password": "password123",
  "totpCode": "123456" // Optional, required if MFA enabled
}
```

**Response (200):**
```json
{
  "success": true,
  "redirect": "/dashboard"
}
```

**Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

### POST /api/auth/logout

Logout current user.

**Response (200):**
```json
{
  "success": true
}
```

---

## Multi-Factor Authentication

### POST /api/provider/mfa/enroll

Start MFA enrollment process.

**Response (200):**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,..."
}
```

### POST /api/provider/mfa/verify

Verify TOTP code and complete enrollment.

**Request:**
```json
{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "backupCodes": ["abc123", "def456", ...]
}
```

### POST /api/provider/mfa/disable

Disable MFA for current user.

**Request:**
```json
{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "success": true
}
```

### POST /api/provider/mfa/regenerate-backup-codes

Generate new backup codes.

**Response (200):**
```json
{
  "backupCodes": ["new123", "new456", ...]
}
```

### GET /api/provider/mfa/status

Get MFA status for current user.

**Response (200):**
```json
{
  "enabled": true,
  "backupCodesRemaining": 8
}
```

---

## Leads

### POST /api/provider/leads/advanced-filter

Advanced lead filtering with pagination.

**Request:**
```json
{
  "filters": {
    "search": "acme",
    "status": ["NEW", "CONVERTED"],
    "sourceType": "MANUAL",
    "createdFrom": "2025-01-01",
    "createdTo": "2025-12-31",
    "aiScoreMin": 50,
    "aiScoreMax": 100
  },
  "sortBy": "createdAt",
  "sortOrder": "desc",
  "page": 1,
  "pageSize": 20
}
```

**Response (200):**
```json
{
  "leads": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### POST /api/provider/leads/export

Export leads to CSV.

**Request:**
```json
{
  "filters": { /* same as advanced-filter */ },
  "format": "csv"
}
```

**Response (200):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="leads-export-2025-10-12.csv"

ID,Company,Contact Name,Email,...
```

### POST /api/provider/leads/bulk-operations

Perform bulk operations on leads.

**Request:**
```json
{
  "operation": "updateStatus",
  "leadIds": ["lead_123", "lead_456"],
  "data": {
    "status": "CONVERTED"
  }
}
```

**Operations:**
- `updateStatus` - Update lead status
- `updateDisputeStatus` - Update dispute status
- `updateClassification` - Update classification
- `updateQualityScore` - Update quality score
- `delete` - Delete leads
- `addNotes` - Add notes to leads

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "operation": "updateStatus"
}
```

### GET /api/provider/leads/[id]/timeline

Get activity timeline for a lead.

**Response (200):**
```json
{
  "timeline": [
    {
      "id": "evt_123",
      "action": "lead_created",
      "actorType": "provider",
      "actorId": "provider@example.com",
      "timestamp": "2025-10-12T10:00:00Z",
      "description": "Lead created from MANUAL source"
    }
  ]
}
```

### POST /api/provider/leads/send-email

Send email to leads.

**Request:**
```json
{
  "leadIds": ["lead_123", "lead_456"],
  "subject": "Follow up",
  "body": "Hi {contactName}, ...",
  "fromName": "Sales Team",
  "fromEmail": "sales@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "sent": 2,
  "failed": 0,
  "total": 2
}
```

---

## Custom Fields

### GET /api/provider/custom-fields

List custom field definitions.

**Query Parameters:**
- `entityType` - Filter by entity type (optional)

**Response (200):**
```json
{
  "fields": [
    {
      "id": "field_123",
      "entityType": "lead",
      "fieldName": "industry",
      "displayName": "Industry",
      "fieldType": "select",
      "options": ["Construction", "HVAC", "Roofing"],
      "required": false,
      "order": 0
    }
  ]
}
```

### POST /api/provider/custom-fields

Create custom field definition.

**Request:**
```json
{
  "entityType": "lead",
  "fieldName": "industry",
  "displayName": "Industry",
  "fieldType": "select",
  "options": ["Construction", "HVAC", "Roofing"],
  "required": false,
  "order": 0
}
```

**Response (200):**
```json
{
  "field": { /* field object */ }
}
```

### PUT /api/provider/custom-fields/[id]

Update custom field definition.

**Request:**
```json
{
  "displayName": "Industry Type",
  "options": ["Construction", "HVAC", "Roofing", "Plumbing"]
}
```

**Response (200):**
```json
{
  "field": { /* updated field */ }
}
```

### DELETE /api/provider/custom-fields/[id]

Delete custom field definition.

**Response (200):**
```json
{
  "success": true
}
```

### GET /api/provider/custom-fields/values

Get custom field values for an entity.

**Query Parameters:**
- `entityType` - Entity type (required)
- `entityId` - Entity ID (required)

**Response (200):**
```json
{
  "values": [
    {
      "id": "val_123",
      "fieldId": "field_123",
      "value": "Construction",
      "field": { /* field definition */ }
    }
  ]
}
```

### POST /api/provider/custom-fields/values

Set custom field value.

**Request:**
```json
{
  "fieldId": "field_123",
  "entityType": "lead",
  "entityId": "lead_123",
  "value": "Construction"
}
```

**Response (200):**
```json
{
  "value": { /* field value */ }
}
```

---

## RBAC

### GET /api/provider/rbac/roles

List all roles.

**Response (200):**
```json
{
  "roles": [
    {
      "id": "role_123",
      "name": "Admin",
      "slug": "admin",
      "isSystem": true,
      "permissions": [...]
    }
  ]
}
```

### POST /api/provider/rbac/roles

Create custom role.

**Request:**
```json
{
  "name": "Lead Manager",
  "slug": "lead-manager",
  "permissionIds": ["perm_123", "perm_456"]
}
```

**Response (200):**
```json
{
  "role": { /* role object */ }
}
```

### DELETE /api/provider/rbac/roles/[roleId]

Delete custom role.

**Response (200):**
```json
{
  "success": true
}
```

### GET /api/provider/rbac/permissions

List all permissions.

**Response (200):**
```json
{
  "permissions": [
    {
      "id": "perm_123",
      "name": "View Leads",
      "slug": "leads:view",
      "category": "leads"
    }
  ]
}
```

### GET /api/provider/rbac/users

List users with role assignments.

**Response (200):**
```json
{
  "users": [
    {
      "id": "user_123",
      "email": "user@example.com",
      "roles": [...]
    }
  ]
}
```

### POST /api/provider/rbac/user-roles

Assign role to user.

**Request:**
```json
{
  "userId": "user_123",
  "roleId": "role_456"
}
```

**Response (200):**
```json
{
  "success": true
}
```

---

## Secrets Rotation

### GET /api/provider/secrets-rotation/policies

List rotation policies.

**Response (200):**
```json
{
  "policies": [
    {
      "id": "pol_123",
      "name": "Federation Key Rotation",
      "keyType": "federation",
      "rotationIntervalDays": 90,
      "gracePeriodDays": 7,
      "autoRotate": true,
      "nextRotation": "2025-12-01T00:00:00Z"
    }
  ]
}
```

### POST /api/provider/secrets-rotation/policies

Create rotation policy.

**Request:**
```json
{
  "name": "API Key Rotation",
  "keyType": "api",
  "rotationIntervalDays": 30,
  "gracePeriodDays": 3,
  "autoRotate": false,
  "notifyBeforeDays": 7
}
```

**Response (200):**
```json
{
  "policy": { /* policy object */ }
}
```

### POST /api/provider/secrets-rotation/rotate

Manually rotate keys.

**Request:**
```json
{
  "policyId": "pol_123"
}
```

**Response (200):**
```json
{
  "success": true,
  "newKeyId": "fed_abc123",
  "oldKeyId": "fed_xyz789"
}
```

### GET /api/provider/secrets-rotation/history

Get rotation history.

**Response (200):**
```json
{
  "history": [
    {
      "id": "hist_123",
      "keyType": "federation",
      "oldKeyId": "fed_old",
      "newKeyId": "fed_new",
      "rotatedAt": "2025-10-12T10:00:00Z",
      "rotatedBy": "provider@example.com",
      "reason": "manual"
    }
  ]
}
```

---

## Error Responses

All endpoints may return these error responses:

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

**400 Bad Request:**
```json
{
  "error": "Invalid request parameters"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

API Reference: Complete ✅

