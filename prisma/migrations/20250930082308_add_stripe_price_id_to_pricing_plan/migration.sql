/*
  Warnings:

  - The values [PROVIDER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `actorUserId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `entity` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `field` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `newValue` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `oldValue` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `AuditLog` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orgId,id]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orgId,id]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orgId,id]` on the table `Job` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orgId,id]` on the table `Lead` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orgId,id]` on the table `LeadInvoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orgId,id]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orgId,id]` on the table `Rfp` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orgId,id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `action` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityType` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Made the column `orgId` on table `LeadInvoice` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `orgId` to the `LeadInvoiceLine` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ElevationStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('CALL_OUTBOUND', 'CALL_INBOUND', 'EMAIL_SENT', 'EMAIL_RECEIVED', 'MEETING_SCHEDULED', 'MEETING_COMPLETED', 'PROPOSAL_SENT', 'CONTRACT_SENT', 'FOLLOW_UP', 'NOTE', 'TASK_CREATED', 'TASK_COMPLETED', 'STATUS_CHANGED', 'DOCUMENT_SHARED', 'PAYMENT_RECEIVED');

-- CreateEnum
CREATE TYPE "public"."TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "public"."ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."SecurityIncidentType" AS ENUM ('CONSTRAINT_VIOLATION', 'SECURITY_VIOLATION', 'ANOMALY_DETECTION', 'FAILED_AUTHENTICATION', 'UNAUTHORIZED_ACCESS', 'DATA_BREACH', 'SUSPICIOUS_ACTIVITY');

-- CreateEnum
CREATE TYPE "public"."SecuritySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."IncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED', 'FALSE_POSITIVE');

-- CreateEnum
CREATE TYPE "public"."DeviceType" AS ENUM ('DESKTOP', 'MOBILE', 'TABLET', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."LockoutType" AS ENUM ('SECURITY_VIOLATION', 'FAILED_ATTEMPTS', 'SUSPICIOUS_ACTIVITY', 'MANUAL_LOCKOUT', 'COMPLIANCE_VIOLATION');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."JobPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."TimesheetStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ChecklistStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "public"."IssueSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."IssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('PHOTO', 'VIDEO', 'DOCUMENT', 'AUDIO', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."PolicyCategory" AS ENUM ('AUTHENTICATION', 'SECURITY', 'COMPLIANCE', 'NETWORK_SECURITY', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "public"."FeatureCategory" AS ENUM ('AI_ANALYTICS', 'AUTOMATION', 'COMMUNICATION', 'INTEGRATION', 'MOBILE', 'DEVELOPER_TOOLS', 'MARKETING');

-- CreateEnum
CREATE TYPE "public"."IntegrationType" AS ENUM ('SSO_SAML', 'SSO_OIDC', 'SCIM', 'WEBHOOK', 'OAUTH_APP', 'API_INTEGRATION', 'ACCOUNTING', 'COMMUNICATION');

-- CreateEnum
CREATE TYPE "public"."WebhookDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "public"."BackupType" AS ENUM ('FULL', 'INCREMENTAL', 'DIFFERENTIAL');

-- CreateEnum
CREATE TYPE "public"."BackupStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."SupportSessionType" AS ENUM ('READ_ONLY', 'IMPERSONATION', 'BREAK_GLASS', 'TROUBLESHOOTING');

-- CreateEnum
CREATE TYPE "public"."SupportSessionStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."AuditSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."AuditCategory" AS ENUM ('GENERAL', 'AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'DATA_MODIFICATION', 'POLICY_CHANGE', 'ADMIN_ACTION', 'SECURITY_EVENT', 'FINANCIAL', 'SYSTEM', 'COMPLIANCE', 'AUTH', 'DATA', 'SECURITY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."LeadStatus" ADD VALUE 'CONTACTED';
ALTER TYPE "public"."LeadStatus" ADD VALUE 'QUALIFIED';
ALTER TYPE "public"."LeadStatus" ADD VALUE 'MEETING_SCHEDULED';
ALTER TYPE "public"."LeadStatus" ADD VALUE 'PROPOSAL_SENT';
ALTER TYPE "public"."LeadStatus" ADD VALUE 'NEGOTIATION';
ALTER TYPE "public"."LeadStatus" ADD VALUE 'WON';
ALTER TYPE "public"."LeadStatus" ADD VALUE 'LOST';
ALTER TYPE "public"."LeadStatus" ADD VALUE 'NURTURING';
ALTER TYPE "public"."LeadStatus" ADD VALUE 'FOLLOW_UP';
ALTER TYPE "public"."LeadStatus" ADD VALUE 'ON_HOLD';
ALTER TYPE "public"."LeadStatus" ADD VALUE 'UNRESPONSIVE';

-- AlterEnum
BEGIN;
CREATE TYPE "public"."Role_new" AS ENUM ('OWNER', 'MANAGER', 'STAFF', 'ACCOUNTANT', 'EMPLOYEE');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."User" ALTER COLUMN "role" TYPE "public"."Role_new" USING ("role"::text::"public"."Role_new");
ALTER TYPE "public"."Role" RENAME TO "Role_old";
ALTER TYPE "public"."Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "public"."User" ALTER COLUMN "role" SET DEFAULT 'STAFF';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Invoice" DROP CONSTRAINT "Invoice_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Job" DROP CONSTRAINT "Job_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Job" DROP CONSTRAINT "Job_rfpId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LeadInvoice" DROP CONSTRAINT "LeadInvoice_orgId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LeadInvoiceLine" DROP CONSTRAINT "LeadInvoiceLine_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LeadInvoiceLine" DROP CONSTRAINT "LeadInvoiceLine_leadId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Opportunity" DROP CONSTRAINT "Opportunity_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_invoiceId_fkey";

-- DropIndex
DROP INDEX "public"."Lead_orgId_identityHash_idx";

-- AlterTable
ALTER TABLE "public"."AuditLog" DROP COLUMN "actorUserId",
DROP COLUMN "entity",
DROP COLUMN "field",
DROP COLUMN "newValue",
DROP COLUMN "oldValue",
DROP COLUMN "reason",
ADD COLUMN     "action" TEXT NOT NULL,
ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "delta" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "entityType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Lead" ADD COLUMN     "customFields" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "industryType" TEXT,
ADD COLUMN     "leadType" TEXT NOT NULL DEFAULT 'job',
ADD COLUMN     "naicsCode" TEXT,
ADD COLUMN     "sicCode" TEXT;

-- AlterTable
ALTER TABLE "public"."LeadInvoice" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."LeadInvoiceLine" ADD COLUMN     "orgId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Org" ADD COLUMN     "activeCapabilities" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "externalCustomerId" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "industryConfig" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "industryType" TEXT,
ADD COLUMN     "naicsCode" TEXT,
ADD COLUMN     "plan" TEXT,
ADD COLUMN     "settings" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "sicCode" TEXT;

-- AlterTable
ALTER TABLE "public"."PricingPlan" ADD COLUMN     "stripePriceId" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."IndustryPack" (
    "id" TEXT NOT NULL,
    "industryCode" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "naicsRanges" JSONB NOT NULL DEFAULT '[]',
    "sicRanges" JSONB NOT NULL DEFAULT '[]',
    "leadFields" JSONB NOT NULL DEFAULT '{}',
    "workflowSteps" JSONB NOT NULL DEFAULT '[]',
    "catalogItems" JSONB NOT NULL DEFAULT '[]',
    "contractTemplates" JSONB NOT NULL DEFAULT '[]',
    "complianceReqs" JSONB NOT NULL DEFAULT '{}',
    "rateCards" JSONB NOT NULL DEFAULT '[]',
    "formulaSet" JSONB NOT NULL DEFAULT '{}',
    "measurementUnits" JSONB NOT NULL DEFAULT '[]',
    "requiredCapabilities" JSONB NOT NULL DEFAULT '[]',
    "optionalCapabilities" JSONB NOT NULL DEFAULT '[]',
    "hiddenCapabilities" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndustryPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Capability" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isCore" BOOLEAN NOT NULL DEFAULT false,
    "requiresSubscription" BOOLEAN NOT NULL DEFAULT false,
    "minimumPlan" TEXT,
    "apiEndpoints" JSONB NOT NULL DEFAULT '[]',
    "uiComponents" JSONB NOT NULL DEFAULT '[]',
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "dependencies" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IndustryCapability" (
    "id" TEXT NOT NULL,
    "industryPackId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "defaultEnabled" BOOLEAN NOT NULL DEFAULT false,
    "industryConfig" JSONB NOT NULL DEFAULT '{}',
    "displayOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndustryCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" TEXT,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserTwoFactor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "totpSecret" TEXT,
    "backupCodes" TEXT[],
    "phoneNumber" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTwoFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderSettings" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "totpSecret" TEXT,
    "displayName" TEXT,
    "permissions" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "ProviderSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderAuditLog" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "isRecoveryMode" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ThemeConfig" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "orgId" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customColors" JSONB,
    "customPatterns" JSONB,
    "customTypography" JSONB,
    "brandAssets" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ThemeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ThemeUsage" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "userId" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "ThemeUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoleVersion" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "changeReason" TEXT,
    "changedBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "permissions" JSONB NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "scopeConfig" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoleTemplate" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "industry" TEXT,
    "category" TEXT,
    "isSystemTemplate" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "permissions" JSONB NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "scopeConfig" JSONB NOT NULL DEFAULT '{}',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "complexity" TEXT NOT NULL DEFAULT 'BASIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "RoleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PermissionBundle" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "category" TEXT,
    "isReusable" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "PermissionBundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoleScope" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "scopeName" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "restrictions" JSONB NOT NULL DEFAULT '{}',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "timeZone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "RoleScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoleReview" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "roleId" TEXT,
    "reviewType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewFrequency" TEXT,
    "nextReviewDate" TIMESTAMP(3),
    "lastReviewDate" TIMESTAMP(3),
    "reviewerId" TEXT NOT NULL,
    "approvers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "findings" JSONB NOT NULL DEFAULT '{}',
    "actions" JSONB NOT NULL DEFAULT '{}',
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "complianceFramework" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "exceptions" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RoleReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProvisioningFlow" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "trigger" TEXT NOT NULL,
    "defaultRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "conditionalRoles" JSONB NOT NULL DEFAULT '{}',
    "scimMapping" JSONB NOT NULL DEFAULT '{}',
    "ssoGroupMapping" JSONB NOT NULL DEFAULT '{}',
    "steps" JSONB NOT NULL DEFAULT '{}',
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "approvers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notifyUsers" BOOLEAN NOT NULL DEFAULT true,
    "notifyManagers" BOOLEAN NOT NULL DEFAULT true,
    "emailTemplate" TEXT,
    "requireMFA" BOOLEAN NOT NULL DEFAULT false,
    "ipRestrictions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sessionDuration" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "ProvisioningFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TemporaryElevation" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "targetRole" TEXT NOT NULL,
    "currentRole" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedDuration" INTEGER NOT NULL,
    "actualDuration" INTEGER,
    "status" "public"."ElevationStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "terminatedAt" TIMESTAMP(3),
    "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
    "autoApproved" BOOLEAN NOT NULL DEFAULT false,
    "emergencyAccess" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "grantedPermissions" JSONB NOT NULL DEFAULT '{}',
    "previousPermissions" JSONB NOT NULL DEFAULT '{}',
    "usageTracked" BOOLEAN NOT NULL DEFAULT true,
    "alertsSent" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "terminationReason" TEXT,
    "terminatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemporaryElevation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "contactMethod" TEXT,
    "duration" INTEGER,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeadTask" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "public"."TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "reminderAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmployeeProfile" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adpWorkerId" TEXT,
    "managerId" TEXT,
    "mobilePrefs" JSONB NOT NULL DEFAULT '{}',
    "emergencyContact" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkOrder" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "customerId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'SCHEDULED',
    "priority" "public"."JobPriority" NOT NULL DEFAULT 'MEDIUM',
    "scheduledStartAt" TIMESTAMP(3),
    "scheduledEndAt" TIMESTAMP(3),
    "actualStartAt" TIMESTAMP(3),
    "actualEndAt" TIMESTAMP(3),
    "jobSiteId" TEXT,
    "estimatedValue" DECIMAL(12,2),
    "actualCost" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobSite" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "radiusMeters" INTEGER NOT NULL DEFAULT 100,
    "accessInstructions" TEXT,
    "emergencyContacts" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobAssignment" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'worker',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedAt" TIMESTAMP(3),

    CONSTRAINT "JobAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TimesheetEntry" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "jobId" TEXT,
    "jobSiteId" TEXT,
    "clockInAt" TIMESTAMP(3) NOT NULL,
    "clockOutAt" TIMESTAMP(3),
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "clockInLat" DECIMAL(10,8),
    "clockInLng" DECIMAL(11,8),
    "clockOutLat" DECIMAL(10,8),
    "clockOutLng" DECIMAL(11,8),
    "deviceInfo" JSONB,
    "notes" TEXT,
    "status" "public"."TimesheetStatus" NOT NULL DEFAULT 'ACTIVE',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimesheetEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobChecklistItem" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."ChecklistStatus" NOT NULL DEFAULT 'PENDING',
    "completedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "photosCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IssueReport" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "jobId" TEXT,
    "reportedBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "public"."IssueSeverity" NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "status" "public"."IssueStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MediaAsset" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "assetType" "public"."MediaType" NOT NULL,
    "workOrderId" TEXT,
    "issueReportId" TEXT,
    "checklistItemId" TEXT,
    "trainingModuleId" TEXT,
    "exifJson" JSONB DEFAULT '{}',
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TrainingModule" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "requiredForRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "requiresQuiz" BOOLEAN NOT NULL DEFAULT false,
    "passingScore" INTEGER,
    "validityDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TrainingCompletion" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER,
    "passed" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "timeSpentMinutes" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApprovalRequest" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" TEXT,
    "status" "public"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approverRoles" TEXT[],
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "escalationRules" JSONB,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SecurityIncident" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "incidentType" "public"."SecurityIncidentType" NOT NULL,
    "severity" "public"."SecuritySeverity" NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestPath" TEXT,
    "metadata" JSONB,
    "status" "public"."IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeviceAccess" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "deviceType" "public"."DeviceType" NOT NULL DEFAULT 'UNKNOWN',
    "deviceName" TEXT,
    "fingerprint" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessCount" INTEGER NOT NULL DEFAULT 1,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "lastIpAddress" TEXT,
    "lastLocation" TEXT,

    CONSTRAINT "DeviceAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserLockout" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "lockoutType" "public"."LockoutType" NOT NULL DEFAULT 'SECURITY_VIOLATION',
    "severity" "public"."SecuritySeverity" NOT NULL DEFAULT 'MEDIUM',
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "unlockedAt" TIMESTAMP(3),
    "unlockedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserLockout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SecurityPolicy" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "category" "public"."PolicyCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUpdatedBy" TEXT,

    CONSTRAINT "SecurityPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeatureModule" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."FeatureCategory" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "usageLimit" INTEGER,
    "costPerUnit" DECIMAL(8,4),
    "monthlyBudget" INTEGER,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeatureUsage" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "userId" TEXT,
    "amount" INTEGER NOT NULL,
    "costCents" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrganizationBudget" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "monthlyLimitCents" INTEGER NOT NULL DEFAULT 50000,
    "alertThreshold" INTEGER NOT NULL DEFAULT 80,
    "autoDisable" BOOLEAN NOT NULL DEFAULT false,
    "notifyOwners" BOOLEAN NOT NULL DEFAULT true,
    "currentSpendCents" INTEGER NOT NULL DEFAULT 0,
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Integration" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "type" "public"."IntegrationType" NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupportSession" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "supportUserId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "sessionType" "public"."SupportSessionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "status" "public"."SupportSessionStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,

    CONSTRAINT "SupportSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditEvent" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "targetId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "severity" "public"."AuditSeverity" NOT NULL DEFAULT 'INFO',
    "category" "public"."AuditCategory" NOT NULL DEFAULT 'GENERAL',
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "hash" TEXT,
    "previousEventId" TEXT,
    "previousHash" TEXT,
    "immutable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AppEvent" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "featureKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "metadata" JSONB,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeatureRegistry" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "public"."FeatureCategory" NOT NULL,
    "defaultEnabled" BOOLEAN NOT NULL DEFAULT false,
    "requiresPlan" TEXT,
    "dependencies" TEXT[],
    "incompatible" TEXT[],
    "discoverability" TEXT NOT NULL DEFAULT 'STANDARD',
    "recommendWhen" JSONB,
    "helpUrl" TEXT,
    "demoVideoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrgFeatureState" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "enabledAt" TIMESTAMP(3),
    "enabledBy" TEXT,
    "config" JSONB,
    "firstUsedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "recommended" BOOLEAN NOT NULL DEFAULT false,
    "recommendedAt" TIMESTAMP(3),
    "recommendedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgFeatureState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DelegationGrant" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "granteeId" TEXT NOT NULL,
    "granterId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "scope" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DelegationGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AiActionLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "requestedBy" TEXT NOT NULL,
    "authorizedBy" TEXT,
    "delegationId" TEXT,
    "status" TEXT NOT NULL,
    "beforeState" JSONB,
    "afterState" JSONB,
    "errorMessage" TEXT,
    "requestContext" JSONB,
    "approvalMethod" TEXT,
    "costCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "AiActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AiDocChunk" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "featureKey" TEXT,
    "tags" TEXT[],
    "version" TEXT,
    "embedding" TEXT,
    "tokenCount" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDocChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webhook_endpoints" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 5,
    "lastDeliveryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webhook_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "orgId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webhook_deliveries" (
    "id" TEXT NOT NULL,
    "webhookEndpointId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" "public"."WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "httpStatus" INTEGER,
    "responseBody" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."encryption_keys" (
    "id" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'aes-256-gcm',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotatedAt" TIMESTAMP(3),

    CONSTRAINT "encryption_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."backups" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "type" "public"."BackupType" NOT NULL DEFAULT 'FULL',
    "status" "public"."BackupStatus" NOT NULL DEFAULT 'PENDING',
    "size" INTEGER,
    "checksum" TEXT,
    "encrypted" BOOLEAN NOT NULL DEFAULT true,
    "compressed" BOOLEAN NOT NULL DEFAULT true,
    "destinations" TEXT[],
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TenantRegistration" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "externalCustomerId" TEXT,
    "welcomeEmailQueued" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeadSourceConfig" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadSourceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobTemplate" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "estimatedHours" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IdempotencyKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "response" TEXT,
    "orgId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StripeEvent" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TenantStripeConnect" (
    "orgId" TEXT NOT NULL,
    "stripeConnectedAccountId" TEXT NOT NULL,
    "connectStatus" TEXT NOT NULL DEFAULT 'pending',
    "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantStripeConnect_pkey" PRIMARY KEY ("orgId")
);

-- CreateIndex
CREATE UNIQUE INDEX "IndustryPack_industryCode_key" ON "public"."IndustryPack"("industryCode");

-- CreateIndex
CREATE INDEX "IndustryPack_industryCode_idx" ON "public"."IndustryPack"("industryCode");

-- CreateIndex
CREATE INDEX "IndustryPack_isActive_idx" ON "public"."IndustryPack"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Capability_code_key" ON "public"."Capability"("code");

-- CreateIndex
CREATE INDEX "Capability_code_idx" ON "public"."Capability"("code");

-- CreateIndex
CREATE INDEX "Capability_category_idx" ON "public"."Capability"("category");

-- CreateIndex
CREATE INDEX "Capability_isCore_idx" ON "public"."Capability"("isCore");

-- CreateIndex
CREATE INDEX "IndustryCapability_industryPackId_idx" ON "public"."IndustryCapability"("industryPackId");

-- CreateIndex
CREATE INDEX "IndustryCapability_capabilityId_idx" ON "public"."IndustryCapability"("capabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "IndustryCapability_industryPackId_capabilityId_key" ON "public"."IndustryCapability"("industryPackId", "capabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_sessionId_key" ON "public"."UserSession"("sessionId");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "public"."UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_sessionId_idx" ON "public"."UserSession"("sessionId");

-- CreateIndex
CREATE INDEX "UserSession_isActive_idx" ON "public"."UserSession"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "UserTwoFactor_userId_key" ON "public"."UserTwoFactor"("userId");

-- CreateIndex
CREATE INDEX "UserTwoFactor_userId_idx" ON "public"."UserTwoFactor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderSettings_email_key" ON "public"."ProviderSettings"("email");

-- CreateIndex
CREATE INDEX "ProviderSettings_email_idx" ON "public"."ProviderSettings"("email");

-- CreateIndex
CREATE INDEX "ProviderSettings_isActive_idx" ON "public"."ProviderSettings"("isActive");

-- CreateIndex
CREATE INDEX "ProviderSettings_lastLoginAt_idx" ON "public"."ProviderSettings"("lastLoginAt");

-- CreateIndex
CREATE INDEX "ProviderAuditLog_providerId_idx" ON "public"."ProviderAuditLog"("providerId");

-- CreateIndex
CREATE INDEX "ProviderAuditLog_action_idx" ON "public"."ProviderAuditLog"("action");

-- CreateIndex
CREATE INDEX "ProviderAuditLog_timestamp_idx" ON "public"."ProviderAuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "ProviderAuditLog_isRecoveryMode_idx" ON "public"."ProviderAuditLog"("isRecoveryMode");

-- CreateIndex
CREATE INDEX "ThemeConfig_orgId_idx" ON "public"."ThemeConfig"("orgId");

-- CreateIndex
CREATE INDEX "ThemeConfig_themeId_idx" ON "public"."ThemeConfig"("themeId");

-- CreateIndex
CREATE INDEX "ThemeConfig_isGlobal_idx" ON "public"."ThemeConfig"("isGlobal");

-- CreateIndex
CREATE INDEX "ThemeConfig_isActive_idx" ON "public"."ThemeConfig"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ThemeConfig_orgId_themeId_key" ON "public"."ThemeConfig"("orgId", "themeId");

-- CreateIndex
CREATE INDEX "ThemeUsage_orgId_idx" ON "public"."ThemeUsage"("orgId");

-- CreateIndex
CREATE INDEX "ThemeUsage_themeId_idx" ON "public"."ThemeUsage"("themeId");

-- CreateIndex
CREATE INDEX "ThemeUsage_appliedAt_idx" ON "public"."ThemeUsage"("appliedAt");

-- CreateIndex
CREATE INDEX "RoleVersion_orgId_roleId_idx" ON "public"."RoleVersion"("orgId", "roleId");

-- CreateIndex
CREATE INDEX "RoleVersion_isActive_idx" ON "public"."RoleVersion"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RoleVersion_roleId_version_key" ON "public"."RoleVersion"("roleId", "version");

-- CreateIndex
CREATE INDEX "RoleTemplate_orgId_industry_idx" ON "public"."RoleTemplate"("orgId", "industry");

-- CreateIndex
CREATE INDEX "RoleTemplate_isSystemTemplate_isPublic_idx" ON "public"."RoleTemplate"("isSystemTemplate", "isPublic");

-- CreateIndex
CREATE INDEX "RoleTemplate_industry_category_idx" ON "public"."RoleTemplate"("industry", "category");

-- CreateIndex
CREATE INDEX "PermissionBundle_orgId_category_idx" ON "public"."PermissionBundle"("orgId", "category");

-- CreateIndex
CREATE INDEX "PermissionBundle_isReusable_idx" ON "public"."PermissionBundle"("isReusable");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionBundle_orgId_name_key" ON "public"."PermissionBundle"("orgId", "name");

-- CreateIndex
CREATE INDEX "RoleScope_orgId_scopeType_idx" ON "public"."RoleScope"("orgId", "scopeType");

-- CreateIndex
CREATE INDEX "RoleScope_isActive_startDate_endDate_idx" ON "public"."RoleScope"("isActive", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "RoleScope_roleId_scopeType_scopeKey_key" ON "public"."RoleScope"("roleId", "scopeType", "scopeKey");

-- CreateIndex
CREATE INDEX "RoleReview_orgId_status_idx" ON "public"."RoleReview"("orgId", "status");

-- CreateIndex
CREATE INDEX "RoleReview_nextReviewDate_idx" ON "public"."RoleReview"("nextReviewDate");

-- CreateIndex
CREATE INDEX "RoleReview_reviewType_status_idx" ON "public"."RoleReview"("reviewType", "status");

-- CreateIndex
CREATE INDEX "ProvisioningFlow_orgId_isActive_idx" ON "public"."ProvisioningFlow"("orgId", "isActive");

-- CreateIndex
CREATE INDEX "ProvisioningFlow_trigger_idx" ON "public"."ProvisioningFlow"("trigger");

-- CreateIndex
CREATE UNIQUE INDEX "ProvisioningFlow_orgId_name_key" ON "public"."ProvisioningFlow"("orgId", "name");

-- CreateIndex
CREATE INDEX "TemporaryElevation_orgId_userId_idx" ON "public"."TemporaryElevation"("orgId", "userId");

-- CreateIndex
CREATE INDEX "TemporaryElevation_status_idx" ON "public"."TemporaryElevation"("status");

-- CreateIndex
CREATE INDEX "TemporaryElevation_expiresAt_idx" ON "public"."TemporaryElevation"("expiresAt");

-- CreateIndex
CREATE INDEX "TemporaryElevation_requestedAt_idx" ON "public"."TemporaryElevation"("requestedAt");

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_createdAt_idx" ON "public"."LeadActivity"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadActivity_orgId_type_idx" ON "public"."LeadActivity"("orgId", "type");

-- CreateIndex
CREATE INDEX "LeadActivity_userId_createdAt_idx" ON "public"."LeadActivity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadTask_leadId_status_idx" ON "public"."LeadTask"("leadId", "status");

-- CreateIndex
CREATE INDEX "LeadTask_assignedTo_dueDate_idx" ON "public"."LeadTask"("assignedTo", "dueDate");

-- CreateIndex
CREATE INDEX "LeadTask_orgId_status_idx" ON "public"."LeadTask"("orgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_userId_key" ON "public"."EmployeeProfile"("userId");

-- CreateIndex
CREATE INDEX "EmployeeProfile_orgId_adpWorkerId_idx" ON "public"."EmployeeProfile"("orgId", "adpWorkerId");

-- CreateIndex
CREATE INDEX "EmployeeProfile_userId_idx" ON "public"."EmployeeProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_orgId_id_key" ON "public"."EmployeeProfile"("orgId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_orgId_userId_key" ON "public"."EmployeeProfile"("orgId", "userId");

-- CreateIndex
CREATE INDEX "WorkOrder_orgId_status_idx" ON "public"."WorkOrder"("orgId", "status");

-- CreateIndex
CREATE INDEX "WorkOrder_customerId_idx" ON "public"."WorkOrder"("customerId");

-- CreateIndex
CREATE INDEX "WorkOrder_scheduledStartAt_idx" ON "public"."WorkOrder"("scheduledStartAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_orgId_id_key" ON "public"."WorkOrder"("orgId", "id");

-- CreateIndex
CREATE INDEX "JobSite_orgId_idx" ON "public"."JobSite"("orgId");

-- CreateIndex
CREATE INDEX "JobSite_latitude_longitude_idx" ON "public"."JobSite"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "JobSite_orgId_id_key" ON "public"."JobSite"("orgId", "id");

-- CreateIndex
CREATE INDEX "JobAssignment_orgId_employeeId_idx" ON "public"."JobAssignment"("orgId", "employeeId");

-- CreateIndex
CREATE INDEX "JobAssignment_jobId_idx" ON "public"."JobAssignment"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "JobAssignment_jobId_employeeId_key" ON "public"."JobAssignment"("jobId", "employeeId");

-- CreateIndex
CREATE INDEX "TimesheetEntry_orgId_employeeId_clockInAt_idx" ON "public"."TimesheetEntry"("orgId", "employeeId", "clockInAt");

-- CreateIndex
CREATE INDEX "TimesheetEntry_jobId_idx" ON "public"."TimesheetEntry"("jobId");

-- CreateIndex
CREATE INDEX "TimesheetEntry_clockInAt_idx" ON "public"."TimesheetEntry"("clockInAt");

-- CreateIndex
CREATE INDEX "JobChecklistItem_orgId_jobId_idx" ON "public"."JobChecklistItem"("orgId", "jobId");

-- CreateIndex
CREATE INDEX "JobChecklistItem_status_idx" ON "public"."JobChecklistItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "JobChecklistItem_orgId_id_key" ON "public"."JobChecklistItem"("orgId", "id");

-- CreateIndex
CREATE INDEX "IssueReport_orgId_status_idx" ON "public"."IssueReport"("orgId", "status");

-- CreateIndex
CREATE INDEX "IssueReport_jobId_idx" ON "public"."IssueReport"("jobId");

-- CreateIndex
CREATE INDEX "IssueReport_reportedBy_idx" ON "public"."IssueReport"("reportedBy");

-- CreateIndex
CREATE UNIQUE INDEX "IssueReport_orgId_id_key" ON "public"."IssueReport"("orgId", "id");

-- CreateIndex
CREATE INDEX "MediaAsset_orgId_workOrderId_idx" ON "public"."MediaAsset"("orgId", "workOrderId");

-- CreateIndex
CREATE INDEX "MediaAsset_orgId_issueReportId_idx" ON "public"."MediaAsset"("orgId", "issueReportId");

-- CreateIndex
CREATE INDEX "MediaAsset_orgId_checklistItemId_idx" ON "public"."MediaAsset"("orgId", "checklistItemId");

-- CreateIndex
CREATE INDEX "MediaAsset_orgId_trainingModuleId_idx" ON "public"."MediaAsset"("orgId", "trainingModuleId");

-- CreateIndex
CREATE INDEX "MediaAsset_uploadedBy_idx" ON "public"."MediaAsset"("uploadedBy");

-- CreateIndex
CREATE INDEX "MediaAsset_createdAt_idx" ON "public"."MediaAsset"("createdAt");

-- CreateIndex
CREATE INDEX "TrainingModule_orgId_isActive_idx" ON "public"."TrainingModule"("orgId", "isActive");

-- CreateIndex
CREATE INDEX "TrainingModule_requiredForRoles_idx" ON "public"."TrainingModule"("requiredForRoles");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingModule_orgId_id_key" ON "public"."TrainingModule"("orgId", "id");

-- CreateIndex
CREATE INDEX "TrainingCompletion_orgId_isValid_idx" ON "public"."TrainingCompletion"("orgId", "isValid");

-- CreateIndex
CREATE INDEX "TrainingCompletion_expiresAt_idx" ON "public"."TrainingCompletion"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCompletion_employeeId_moduleId_key" ON "public"."TrainingCompletion"("employeeId", "moduleId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_orgId_status_idx" ON "public"."ApprovalRequest"("orgId", "status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_requestedBy_status_idx" ON "public"."ApprovalRequest"("requestedBy", "status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_expiresAt_idx" ON "public"."ApprovalRequest"("expiresAt");

-- CreateIndex
CREATE INDEX "SecurityIncident_orgId_incidentType_detectedAt_idx" ON "public"."SecurityIncident"("orgId", "incidentType", "detectedAt");

-- CreateIndex
CREATE INDEX "SecurityIncident_userId_incidentType_idx" ON "public"."SecurityIncident"("userId", "incidentType");

-- CreateIndex
CREATE INDEX "SecurityIncident_status_severity_idx" ON "public"."SecurityIncident"("status", "severity");

-- CreateIndex
CREATE INDEX "DeviceAccess_orgId_userId_idx" ON "public"."DeviceAccess"("orgId", "userId");

-- CreateIndex
CREATE INDEX "DeviceAccess_lastSeenAt_idx" ON "public"."DeviceAccess"("lastSeenAt");

-- CreateIndex
CREATE INDEX "DeviceAccess_isBlocked_idx" ON "public"."DeviceAccess"("isBlocked");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceAccess_userId_userAgent_key" ON "public"."DeviceAccess"("userId", "userAgent");

-- CreateIndex
CREATE INDEX "UserLockout_orgId_userId_isActive_idx" ON "public"."UserLockout"("orgId", "userId", "isActive");

-- CreateIndex
CREATE INDEX "UserLockout_expiresAt_idx" ON "public"."UserLockout"("expiresAt");

-- CreateIndex
CREATE INDEX "UserLockout_lockedAt_idx" ON "public"."UserLockout"("lockedAt");

-- CreateIndex
CREATE INDEX "SecurityPolicy_orgId_enabled_idx" ON "public"."SecurityPolicy"("orgId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityPolicy_orgId_category_name_key" ON "public"."SecurityPolicy"("orgId", "category", "name");

-- CreateIndex
CREATE INDEX "FeatureModule_orgId_enabled_idx" ON "public"."FeatureModule"("orgId", "enabled");

-- CreateIndex
CREATE INDEX "FeatureModule_enabled_category_idx" ON "public"."FeatureModule"("enabled", "category");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureModule_orgId_moduleKey_key" ON "public"."FeatureModule"("orgId", "moduleKey");

-- CreateIndex
CREATE INDEX "FeatureUsage_orgId_moduleId_createdAt_idx" ON "public"."FeatureUsage"("orgId", "moduleId", "createdAt");

-- CreateIndex
CREATE INDEX "FeatureUsage_createdAt_idx" ON "public"."FeatureUsage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationBudget_orgId_key" ON "public"."OrganizationBudget"("orgId");

-- CreateIndex
CREATE INDEX "Integration_orgId_enabled_idx" ON "public"."Integration"("orgId", "enabled");

-- CreateIndex
CREATE INDEX "Integration_type_enabled_idx" ON "public"."Integration"("type", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_orgId_type_name_key" ON "public"."Integration"("orgId", "type", "name");

-- CreateIndex
CREATE INDEX "SupportSession_orgId_status_idx" ON "public"."SupportSession"("orgId", "status");

-- CreateIndex
CREATE INDEX "SupportSession_supportUserId_status_idx" ON "public"."SupportSession"("supportUserId", "status");

-- CreateIndex
CREATE INDEX "SupportSession_expiresAt_idx" ON "public"."SupportSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditEvent_orgId_createdAt_idx" ON "public"."AuditEvent"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_orgId_action_idx" ON "public"."AuditEvent"("orgId", "action");

-- CreateIndex
CREATE INDEX "AuditEvent_orgId_userId_idx" ON "public"."AuditEvent"("orgId", "userId");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "public"."AuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_severity_createdAt_idx" ON "public"."AuditEvent"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_orgId_hash_idx" ON "public"."AuditEvent"("orgId", "hash");

-- CreateIndex
CREATE INDEX "AppEvent_orgId_featureKey_createdAt_idx" ON "public"."AppEvent"("orgId", "featureKey", "createdAt");

-- CreateIndex
CREATE INDEX "AppEvent_orgId_userId_createdAt_idx" ON "public"."AppEvent"("orgId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "AppEvent_featureKey_eventType_idx" ON "public"."AppEvent"("featureKey", "eventType");

-- CreateIndex
CREATE INDEX "AppEvent_createdAt_idx" ON "public"."AppEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AppEvent_orgId_id_key" ON "public"."AppEvent"("orgId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureRegistry_key_key" ON "public"."FeatureRegistry"("key");

-- CreateIndex
CREATE INDEX "FeatureRegistry_category_defaultEnabled_idx" ON "public"."FeatureRegistry"("category", "defaultEnabled");

-- CreateIndex
CREATE INDEX "FeatureRegistry_discoverability_idx" ON "public"."FeatureRegistry"("discoverability");

-- CreateIndex
CREATE INDEX "OrgFeatureState_orgId_enabled_idx" ON "public"."OrgFeatureState"("orgId", "enabled");

-- CreateIndex
CREATE INDEX "OrgFeatureState_orgId_updatedAt_idx" ON "public"."OrgFeatureState"("orgId", "updatedAt");

-- CreateIndex
CREATE INDEX "OrgFeatureState_featureId_enabled_idx" ON "public"."OrgFeatureState"("featureId", "enabled");

-- CreateIndex
CREATE INDEX "OrgFeatureState_recommended_recommendedAt_idx" ON "public"."OrgFeatureState"("recommended", "recommendedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrgFeatureState_orgId_featureId_key" ON "public"."OrgFeatureState"("orgId", "featureId");

-- CreateIndex
CREATE INDEX "DelegationGrant_orgId_granteeId_isActive_idx" ON "public"."DelegationGrant"("orgId", "granteeId", "isActive");

-- CreateIndex
CREATE INDEX "DelegationGrant_orgId_granterId_createdAt_idx" ON "public"."DelegationGrant"("orgId", "granterId", "createdAt");

-- CreateIndex
CREATE INDEX "DelegationGrant_toolId_isActive_idx" ON "public"."DelegationGrant"("toolId", "isActive");

-- CreateIndex
CREATE INDEX "DelegationGrant_expiresAt_idx" ON "public"."DelegationGrant"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "DelegationGrant_orgId_id_key" ON "public"."DelegationGrant"("orgId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "DelegationGrant_orgId_granteeId_toolId_isActive_key" ON "public"."DelegationGrant"("orgId", "granteeId", "toolId", "isActive");

-- CreateIndex
CREATE INDEX "AiActionLog_orgId_createdAt_idx" ON "public"."AiActionLog"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "AiActionLog_orgId_requestedBy_createdAt_idx" ON "public"."AiActionLog"("orgId", "requestedBy", "createdAt");

-- CreateIndex
CREATE INDEX "AiActionLog_orgId_status_createdAt_idx" ON "public"."AiActionLog"("orgId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AiActionLog_toolId_status_idx" ON "public"."AiActionLog"("toolId", "status");

-- CreateIndex
CREATE INDEX "AiActionLog_status_createdAt_idx" ON "public"."AiActionLog"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AiActionLog_delegationId_idx" ON "public"."AiActionLog"("delegationId");

-- CreateIndex
CREATE UNIQUE INDEX "AiActionLog_orgId_id_key" ON "public"."AiActionLog"("orgId", "id");

-- CreateIndex
CREATE INDEX "AiDocChunk_contentType_isActive_idx" ON "public"."AiDocChunk"("contentType", "isActive");

-- CreateIndex
CREATE INDEX "AiDocChunk_featureKey_isActive_idx" ON "public"."AiDocChunk"("featureKey", "isActive");

-- CreateIndex
CREATE INDEX "AiDocChunk_priority_isActive_idx" ON "public"."AiDocChunk"("priority", "isActive");

-- CreateIndex
CREATE INDEX "AiDocChunk_isActive_updatedAt_idx" ON "public"."AiDocChunk"("isActive", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "encryption_keys_keyId_key" ON "public"."encryption_keys"("keyId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantRegistration_idempotencyKey_key" ON "public"."TenantRegistration"("idempotencyKey");

-- CreateIndex
CREATE INDEX "TenantRegistration_orgId_idx" ON "public"."TenantRegistration"("orgId");

-- CreateIndex
CREATE INDEX "TenantRegistration_ownerUserId_idx" ON "public"."TenantRegistration"("ownerUserId");

-- CreateIndex
CREATE INDEX "TenantRegistration_idempotencyKey_idx" ON "public"."TenantRegistration"("idempotencyKey");

-- CreateIndex
CREATE INDEX "TenantRegistration_createdAt_idx" ON "public"."TenantRegistration"("createdAt");

-- CreateIndex
CREATE INDEX "LeadSourceConfig_orgId_idx" ON "public"."LeadSourceConfig"("orgId");

-- CreateIndex
CREATE INDEX "LeadSourceConfig_active_idx" ON "public"."LeadSourceConfig"("active");

-- CreateIndex
CREATE UNIQUE INDEX "LeadSourceConfig_orgId_name_key" ON "public"."LeadSourceConfig"("orgId", "name");

-- CreateIndex
CREATE INDEX "JobTemplate_orgId_idx" ON "public"."JobTemplate"("orgId");

-- CreateIndex
CREATE INDEX "JobTemplate_active_idx" ON "public"."JobTemplate"("active");

-- CreateIndex
CREATE UNIQUE INDEX "JobTemplate_orgId_name_key" ON "public"."JobTemplate"("orgId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_key_key" ON "public"."IdempotencyKey"("key");

-- CreateIndex
CREATE INDEX "IdempotencyKey_key_idx" ON "public"."IdempotencyKey"("key");

-- CreateIndex
CREATE INDEX "IdempotencyKey_entityType_entityId_idx" ON "public"."IdempotencyKey"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "IdempotencyKey_expiresAt_idx" ON "public"."IdempotencyKey"("expiresAt");

-- CreateIndex
CREATE INDEX "IdempotencyKey_orgId_idx" ON "public"."IdempotencyKey"("orgId");

-- CreateIndex
CREATE INDEX "StripeEvent_source_idx" ON "public"."StripeEvent"("source");

-- CreateIndex
CREATE INDEX "StripeEvent_receivedAt_idx" ON "public"."StripeEvent"("receivedAt");

-- CreateIndex
CREATE INDEX "TenantStripeConnect_orgId_idx" ON "public"."TenantStripeConnect"("orgId");

-- CreateIndex
CREATE INDEX "TenantStripeConnect_connectStatus_idx" ON "public"."TenantStripeConnect"("connectStatus");

-- CreateIndex
CREATE INDEX "AuditLog_orgId_createdAt_idx" ON "public"."AuditLog"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "public"."AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_orgId_entityType_idx" ON "public"."AuditLog"("orgId", "entityType");

-- CreateIndex
CREATE INDEX "AuditLog_orgId_action_idx" ON "public"."AuditLog"("orgId", "action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "public"."AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_orgId_id_key" ON "public"."Customer"("orgId", "id");

-- CreateIndex
CREATE INDEX "Invoice_orgId_status_idx" ON "public"."Invoice"("orgId", "status");

-- CreateIndex
CREATE INDEX "Invoice_orgId_issuedAt_idx" ON "public"."Invoice"("orgId", "issuedAt");

-- CreateIndex
CREATE INDEX "Invoice_orgId_customerId_idx" ON "public"."Invoice"("orgId", "customerId");

-- CreateIndex
CREATE INDEX "Invoice_orgId_status_issuedAt_idx" ON "public"."Invoice"("orgId", "status", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_orgId_id_key" ON "public"."Invoice"("orgId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Job_orgId_id_key" ON "public"."Job"("orgId", "id");

-- CreateIndex
CREATE INDEX "Lead_orgId_status_createdAt_idx" ON "public"."Lead"("orgId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "public"."Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_phoneE164_idx" ON "public"."Lead"("phoneE164");

-- CreateIndex
CREATE INDEX "Lead_orgId_industryType_idx" ON "public"."Lead"("orgId", "industryType");

-- CreateIndex
CREATE INDEX "Lead_orgId_aiScore_idx" ON "public"."Lead"("orgId", "aiScore");

-- CreateIndex
CREATE INDEX "Lead_identityHash_idx" ON "public"."Lead"("identityHash");

-- CreateIndex
CREATE INDEX "Lead_publicId_idx" ON "public"."Lead"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_orgId_id_key" ON "public"."Lead"("orgId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LeadInvoice_orgId_id_key" ON "public"."LeadInvoice"("orgId", "id");

-- CreateIndex
CREATE INDEX "LeadInvoiceLine_orgId_leadId_idx" ON "public"."LeadInvoiceLine"("orgId", "leadId");

-- CreateIndex
CREATE INDEX "LeadInvoiceLine_orgId_invoiceId_idx" ON "public"."LeadInvoiceLine"("orgId", "invoiceId");

-- CreateIndex
CREATE INDEX "Payment_orgId_receivedAt_idx" ON "public"."Payment"("orgId", "receivedAt");

-- CreateIndex
CREATE INDEX "Payment_orgId_method_idx" ON "public"."Payment"("orgId", "method");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "public"."Payment"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orgId_id_key" ON "public"."Payment"("orgId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Rfp_orgId_id_key" ON "public"."Rfp"("orgId", "id");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_orgId_role_idx" ON "public"."User"("orgId", "role");

-- CreateIndex
CREATE INDEX "User_orgId_status_idx" ON "public"."User"("orgId", "status");

-- CreateIndex
CREATE INDEX "User_orgId_createdAt_idx" ON "public"."User"("orgId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_orgId_id_key" ON "public"."User"("orgId", "id");

-- AddForeignKey
ALTER TABLE "public"."Org" ADD CONSTRAINT "Org_industryType_fkey" FOREIGN KEY ("industryType") REFERENCES "public"."IndustryPack"("industryCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IndustryCapability" ADD CONSTRAINT "IndustryCapability_industryPackId_fkey" FOREIGN KEY ("industryPackId") REFERENCES "public"."IndustryPack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IndustryCapability" ADD CONSTRAINT "IndustryCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "public"."Capability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserTwoFactor" ADD CONSTRAINT "UserTwoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderAuditLog" ADD CONSTRAINT "ProviderAuditLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."ProviderSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ThemeConfig" ADD CONSTRAINT "ThemeConfig_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ThemeUsage" ADD CONSTRAINT "ThemeUsage_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ThemeUsage" ADD CONSTRAINT "ThemeUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Opportunity" ADD CONSTRAINT "Opportunity_orgId_customerId_fkey" FOREIGN KEY ("orgId", "customerId") REFERENCES "public"."Customer"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_orgId_customerId_fkey" FOREIGN KEY ("orgId", "customerId") REFERENCES "public"."Customer"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_orgId_invoiceId_fkey" FOREIGN KEY ("orgId", "invoiceId") REFERENCES "public"."Invoice"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Job" ADD CONSTRAINT "Job_orgId_customerId_fkey" FOREIGN KEY ("orgId", "customerId") REFERENCES "public"."Customer"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Job" ADD CONSTRAINT "Job_orgId_rfpId_fkey" FOREIGN KEY ("orgId", "rfpId") REFERENCES "public"."Rfp"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadInvoice" ADD CONSTRAINT "LeadInvoice_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadInvoiceLine" ADD CONSTRAINT "LeadInvoiceLine_orgId_invoiceId_fkey" FOREIGN KEY ("orgId", "invoiceId") REFERENCES "public"."LeadInvoice"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadInvoiceLine" ADD CONSTRAINT "LeadInvoiceLine_orgId_leadId_fkey" FOREIGN KEY ("orgId", "leadId") REFERENCES "public"."Lead"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleVersion" ADD CONSTRAINT "RoleVersion_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."RbacRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleVersion" ADD CONSTRAINT "RoleVersion_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleTemplate" ADD CONSTRAINT "RoleTemplate_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PermissionBundle" ADD CONSTRAINT "PermissionBundle_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleScope" ADD CONSTRAINT "RoleScope_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."RbacRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleScope" ADD CONSTRAINT "RoleScope_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleReview" ADD CONSTRAINT "RoleReview_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RoleReview" ADD CONSTRAINT "RoleReview_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."RbacRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProvisioningFlow" ADD CONSTRAINT "ProvisioningFlow_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemporaryElevation" ADD CONSTRAINT "TemporaryElevation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemporaryElevation" ADD CONSTRAINT "TemporaryElevation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadActivity" ADD CONSTRAINT "LeadActivity_orgId_leadId_fkey" FOREIGN KEY ("orgId", "leadId") REFERENCES "public"."Lead"("orgId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadActivity" ADD CONSTRAINT "LeadActivity_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadActivity" ADD CONSTRAINT "LeadActivity_orgId_userId_fkey" FOREIGN KEY ("orgId", "userId") REFERENCES "public"."User"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadTask" ADD CONSTRAINT "LeadTask_orgId_leadId_fkey" FOREIGN KEY ("orgId", "leadId") REFERENCES "public"."Lead"("orgId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadTask" ADD CONSTRAINT "LeadTask_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadTask" ADD CONSTRAINT "LeadTask_orgId_assignedTo_fkey" FOREIGN KEY ("orgId", "assignedTo") REFERENCES "public"."User"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadTask" ADD CONSTRAINT "LeadTask_orgId_createdBy_fkey" FOREIGN KEY ("orgId", "createdBy") REFERENCES "public"."User"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_orgId_userId_fkey" FOREIGN KEY ("orgId", "userId") REFERENCES "public"."User"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrder" ADD CONSTRAINT "WorkOrder_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrder" ADD CONSTRAINT "WorkOrder_orgId_customerId_fkey" FOREIGN KEY ("orgId", "customerId") REFERENCES "public"."Customer"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrder" ADD CONSTRAINT "WorkOrder_orgId_jobSiteId_fkey" FOREIGN KEY ("orgId", "jobSiteId") REFERENCES "public"."JobSite"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobSite" ADD CONSTRAINT "JobSite_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobAssignment" ADD CONSTRAINT "JobAssignment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobAssignment" ADD CONSTRAINT "JobAssignment_orgId_jobId_fkey" FOREIGN KEY ("orgId", "jobId") REFERENCES "public"."WorkOrder"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobAssignment" ADD CONSTRAINT "JobAssignment_orgId_employeeId_fkey" FOREIGN KEY ("orgId", "employeeId") REFERENCES "public"."EmployeeProfile"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimesheetEntry" ADD CONSTRAINT "TimesheetEntry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimesheetEntry" ADD CONSTRAINT "TimesheetEntry_orgId_employeeId_fkey" FOREIGN KEY ("orgId", "employeeId") REFERENCES "public"."EmployeeProfile"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimesheetEntry" ADD CONSTRAINT "TimesheetEntry_orgId_jobId_fkey" FOREIGN KEY ("orgId", "jobId") REFERENCES "public"."WorkOrder"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimesheetEntry" ADD CONSTRAINT "TimesheetEntry_orgId_jobSiteId_fkey" FOREIGN KEY ("orgId", "jobSiteId") REFERENCES "public"."JobSite"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobChecklistItem" ADD CONSTRAINT "JobChecklistItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobChecklistItem" ADD CONSTRAINT "JobChecklistItem_orgId_jobId_fkey" FOREIGN KEY ("orgId", "jobId") REFERENCES "public"."WorkOrder"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IssueReport" ADD CONSTRAINT "IssueReport_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IssueReport" ADD CONSTRAINT "IssueReport_orgId_jobId_fkey" FOREIGN KEY ("orgId", "jobId") REFERENCES "public"."WorkOrder"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IssueReport" ADD CONSTRAINT "IssueReport_orgId_reportedBy_fkey" FOREIGN KEY ("orgId", "reportedBy") REFERENCES "public"."EmployeeProfile"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MediaAsset" ADD CONSTRAINT "MediaAsset_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MediaAsset" ADD CONSTRAINT "MediaAsset_orgId_workOrderId_fkey" FOREIGN KEY ("orgId", "workOrderId") REFERENCES "public"."WorkOrder"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MediaAsset" ADD CONSTRAINT "MediaAsset_orgId_issueReportId_fkey" FOREIGN KEY ("orgId", "issueReportId") REFERENCES "public"."IssueReport"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MediaAsset" ADD CONSTRAINT "MediaAsset_orgId_checklistItemId_fkey" FOREIGN KEY ("orgId", "checklistItemId") REFERENCES "public"."JobChecklistItem"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MediaAsset" ADD CONSTRAINT "MediaAsset_orgId_trainingModuleId_fkey" FOREIGN KEY ("orgId", "trainingModuleId") REFERENCES "public"."TrainingModule"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrainingModule" ADD CONSTRAINT "TrainingModule_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrainingCompletion" ADD CONSTRAINT "TrainingCompletion_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrainingCompletion" ADD CONSTRAINT "TrainingCompletion_orgId_employeeId_fkey" FOREIGN KEY ("orgId", "employeeId") REFERENCES "public"."EmployeeProfile"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrainingCompletion" ADD CONSTRAINT "TrainingCompletion_orgId_moduleId_fkey" FOREIGN KEY ("orgId", "moduleId") REFERENCES "public"."TrainingModule"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SecurityIncident" ADD CONSTRAINT "SecurityIncident_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SecurityIncident" ADD CONSTRAINT "SecurityIncident_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SecurityIncident" ADD CONSTRAINT "SecurityIncident_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeviceAccess" ADD CONSTRAINT "DeviceAccess_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeviceAccess" ADD CONSTRAINT "DeviceAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserLockout" ADD CONSTRAINT "UserLockout_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserLockout" ADD CONSTRAINT "UserLockout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserLockout" ADD CONSTRAINT "UserLockout_unlockedBy_fkey" FOREIGN KEY ("unlockedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SecurityPolicy" ADD CONSTRAINT "SecurityPolicy_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeatureModule" ADD CONSTRAINT "FeatureModule_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeatureUsage" ADD CONSTRAINT "FeatureUsage_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeatureUsage" ADD CONSTRAINT "FeatureUsage_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."FeatureModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrganizationBudget" ADD CONSTRAINT "OrganizationBudget_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Integration" ADD CONSTRAINT "Integration_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupportSession" ADD CONSTRAINT "SupportSession_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditEvent" ADD CONSTRAINT "AuditEvent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditEvent" ADD CONSTRAINT "AuditEvent_previousEventId_fkey" FOREIGN KEY ("previousEventId") REFERENCES "public"."AuditEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AppEvent" ADD CONSTRAINT "AppEvent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AppEvent" ADD CONSTRAINT "AppEvent_orgId_userId_fkey" FOREIGN KEY ("orgId", "userId") REFERENCES "public"."User"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrgFeatureState" ADD CONSTRAINT "OrgFeatureState_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrgFeatureState" ADD CONSTRAINT "OrgFeatureState_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "public"."FeatureRegistry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrgFeatureState" ADD CONSTRAINT "OrgFeatureState_orgId_enabledBy_fkey" FOREIGN KEY ("orgId", "enabledBy") REFERENCES "public"."User"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DelegationGrant" ADD CONSTRAINT "DelegationGrant_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DelegationGrant" ADD CONSTRAINT "DelegationGrant_orgId_granteeId_fkey" FOREIGN KEY ("orgId", "granteeId") REFERENCES "public"."User"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DelegationGrant" ADD CONSTRAINT "DelegationGrant_orgId_granterId_fkey" FOREIGN KEY ("orgId", "granterId") REFERENCES "public"."User"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiActionLog" ADD CONSTRAINT "AiActionLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiActionLog" ADD CONSTRAINT "AiActionLog_orgId_requestedBy_fkey" FOREIGN KEY ("orgId", "requestedBy") REFERENCES "public"."User"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiActionLog" ADD CONSTRAINT "AiActionLog_orgId_authorizedBy_fkey" FOREIGN KEY ("orgId", "authorizedBy") REFERENCES "public"."User"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiActionLog" ADD CONSTRAINT "AiActionLog_delegationId_fkey" FOREIGN KEY ("delegationId") REFERENCES "public"."DelegationGrant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AiActionLog" ADD CONSTRAINT "AiActionLog_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "public"."FeatureRegistry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhook_events" ADD CONSTRAINT "webhook_events_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhookEndpointId_fkey" FOREIGN KEY ("webhookEndpointId") REFERENCES "public"."webhook_endpoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."webhook_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."encryption_keys" ADD CONSTRAINT "encryption_keys_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."backups" ADD CONSTRAINT "backups_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantRegistration" ADD CONSTRAINT "TenantRegistration_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantRegistration" ADD CONSTRAINT "TenantRegistration_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadSourceConfig" ADD CONSTRAINT "LeadSourceConfig_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobTemplate" ADD CONSTRAINT "JobTemplate_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TenantStripeConnect" ADD CONSTRAINT "TenantStripeConnect_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
