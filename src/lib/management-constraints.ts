// src/lib/management-constraints.ts
// Advanced Scoping and Constraint System for Supervisor and Manager Roles
// Robinson Solutions B2B SaaS Platform

import { prisma as db } from "./prisma";
import { createStaffAuditSystem } from "./staff-audit-system";
import type { SupervisorScope } from "./roles/supervisor-role-template";
import type { ManagerScope } from "./roles/manager-role-template";

export interface ManagementScope {
  // Core Scope Identifiers
  userId: string;
  orgId: string;
  roleType: 'SUPERVISOR' | 'MANAGER';
  
  // Scope Boundaries
  teams?: string[];
  departments?: string[];
  locations?: string[];
  projects?: string[];
  costCenters?: string[];
  serviceAreas?: string[];
  
  // Financial Limits
  budgetLimits: {
    daily: number;
    weekly: number;
    monthly: number;
    quarterly?: number;
  };
  
  // Approval Thresholds
  approvalLimits: {
    expenses: number;
    refunds: number;
    purchases: number;
    credits: number;
    adjustments: number;
  };
  
  // Time-Based Restrictions
  timeRestrictions: {
    businessHoursOnly: boolean;
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
    timezone?: string;
  };
  
  // Data Access Constraints
  dataConstraints: {
    historicalDataMonths: number;
    exportLimits: {
      daily: number;
      weekly: number;
      recordLimit: number;
    };
    sensitiveDataAccess: boolean;
    crossDepartmentView: boolean;
  };
  
  // Emergency and Escalation
  escalationRules: {
    canRequestElevation: boolean;
    maxElevationDuration: number; // minutes
    elevationApprovalRequired: boolean;
    emergencyOverride: boolean;
  };
}

export interface OperationalConstraints {
  // Action Frequency Limits
  actionLimits: {
    dailyApprovals: number;
    weeklyScheduleChanges: number;
    monthlyBulkOperations: number;
    escalationsPerDay: number;
  };
  
  // Approval Workflow Requirements
  approvalWorkflows: {
    requiresOwnerApproval: string[]; // Action types
    requiresSupervisorApproval: string[];
    bypassableActions: string[];
    emergencyBypassAllowed: boolean;
  };
  
  // Communication Restrictions
  communicationLimits: {
    customerContactAllowed: boolean;
    vendorContactAllowed: boolean;
    crossDepartmentMessaging: boolean;
    externalCommunication: boolean;
  };
  
  // Resource Management
  resourceConstraints: {
    maxTeamSize: number;
    maxConcurrentProjects: number;
    inventoryManagementAllowed: boolean;
    assetManagementLevel: 'NONE' | 'VIEW' | 'MODIFY' | 'FULL';
  };
}

export class ManagementConstraintEnforcer {
  private orgId: string;
  private userId: string;
  private auditSystem: any;

  constructor(orgId: string, userId: string) {
    this.orgId = orgId;
    this.userId = userId;
    this.auditSystem = createStaffAuditSystem(orgId, userId, 'management_session');
  }

  // Core Scope Validation
  async validateManagementAccess(
    resource: string,
    action: string,
    scope: ManagementScope,
    constraints: OperationalConstraints
  ): Promise<{ allowed: boolean; reason?: string; requiresApproval?: boolean }> {
    try {
      // Check basic scope boundaries
      const scopeValid = await this.validateScopeBoundaries(resource, scope);
      if (!scopeValid.allowed) {
        return scopeValid;
      }

      // Check time restrictions
      const timeValid = this.validateTimeRestrictions(scope.timeRestrictions);
      if (!timeValid) {
        await this.logViolation('time_restriction', resource, action);
        return { allowed: false, reason: 'Outside permitted time window' };
      }

      // Check action frequency limits
      const frequencyValid = await this.validateActionFrequency(action, constraints.actionLimits);
      if (!frequencyValid) {
        await this.logViolation('frequency_limit', resource, action);
        return { allowed: false, reason: 'Action frequency limit exceeded' };
      }

      // Check financial limits for monetary actions
      const financialValid = await this.validateFinancialLimits(action, scope.budgetLimits, scope.approvalLimits);
      if (!financialValid.allowed) {
        return financialValid;
      }

      // Check approval requirements
      const approvalCheck = this.checkApprovalRequirements(action, constraints.approvalWorkflows);
      if (approvalCheck.required) {
        return { 
          allowed: true, 
          requiresApproval: true,
          reason: `Requires ${approvalCheck.level} approval`
        };
      }

      // Log successful access
      await this.auditSystem.logActivity({
        action: 'management_access_granted',
        target: 'scoped_resource',
        targetId: resource,
        category: 'AUTHORIZATION',
        severity: 'LOW',
        details: {
          resource,
          action,
          scopeType: scope.roleType,
          constraints: Object.keys(constraints)
        },
        context: {
          ipAddress: 'system',
          userAgent: 'management_enforcer',
          sessionId: 'access_validation'
        }
      });

      return { allowed: true };

    } catch (error) {
      await this.logViolation('enforcement_error', resource, action, error);
      return { allowed: false, reason: 'System error during validation' };
    }
  }

  // Scope Boundary Validation
  private async validateScopeBoundaries(
    resource: string,
    scope: ManagementScope
  ): Promise<{ allowed: boolean; reason?: string }> {
    const resourceParts = resource.split(':');
    const resourceType = resourceParts[0];
    const resourceId = resourceParts[2];

    // Team scope validation
    if (resourceType.includes('team') && scope.teams) {
      if (!scope.teams.includes(resourceId)) {
        await this.logViolation('team_scope', resource, 'access');
        return { allowed: false, reason: 'Resource outside assigned team scope' };
      }
    }

    // Department scope validation
    if (resourceType.includes('department') && scope.departments) {
      if (!scope.departments.includes(resourceId)) {
        await this.logViolation('department_scope', resource, 'access');
        return { allowed: false, reason: 'Resource outside assigned department scope' };
      }
    }

    // Location scope validation
    if (resourceType.includes('location') && scope.locations) {
      if (!scope.locations.includes(resourceId)) {
        await this.logViolation('location_scope', resource, 'access');
        return { allowed: false, reason: 'Resource outside assigned location scope' };
      }
    }

    // Project scope validation
    if (resourceType.includes('project') && scope.projects) {
      if (!scope.projects.includes(resourceId)) {
        await this.logViolation('project_scope', resource, 'access');
        return { allowed: false, reason: 'Resource outside assigned project scope' };
      }
    }

    return { allowed: true };
  }

  // Time Restrictions Validation
  private validateTimeRestrictions(restrictions: ManagementScope['timeRestrictions']): boolean {
    if (!restrictions.businessHoursOnly) return true;

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    // Check day of week
    if (!restrictions.daysOfWeek.includes(currentDay)) {
      return false;
    }

    // Check time window
    if (currentTime < restrictions.startTime || currentTime > restrictions.endTime) {
      return false;
    }

    return true;
  }

  // Action Frequency Validation
  private async validateActionFrequency(
    action: string,
    limits: OperationalConstraints['actionLimits']
  ): Promise<boolean> {
    // Get current usage counts from database
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = this.getWeekStart();
    const thisMonth = new Date().toISOString().slice(0, 7);

    // Check daily approvals
    if (action.includes('approve')) {
      const dailyApprovals = await this.getActionCount('approve', today);
      if (dailyApprovals >= limits.dailyApprovals) {
        return false;
      }
    }

    // Check weekly schedule changes
    if (action.includes('schedule')) {
      const weeklyChanges = await this.getActionCount('schedule', thisWeek);
      if (weeklyChanges >= limits.weeklyScheduleChanges) {
        return false;
      }
    }

    // Check monthly bulk operations
    if (action.includes('bulk')) {
      const monthlyBulk = await this.getActionCount('bulk', thisMonth);
      if (monthlyBulk >= limits.monthlyBulkOperations) {
        return false;
      }
    }

    // Check daily escalations
    if (action.includes('escalate')) {
      const dailyEscalations = await this.getActionCount('escalate', today);
      if (dailyEscalations >= limits.escalationsPerDay) {
        return false;
      }
    }

    return true;
  }

  // Financial Limits Validation
  private async validateFinancialLimits(
    action: string,
    budgetLimits: ManagementScope['budgetLimits'],
    approvalLimits: ManagementScope['approvalLimits']
  ): Promise<{ allowed: boolean; reason?: string; requiresApproval?: boolean }> {
    const amount = this.extractAmountFromAction(action);
    if (!amount) return { allowed: true };

    // Check approval limits first
    if (action.includes('expense') && amount > approvalLimits.expenses) {
      return { allowed: false, reason: `Expense amount exceeds limit of ${approvalLimits.expenses}` };
    }

    if (action.includes('refund') && amount > approvalLimits.refunds) {
      return { allowed: false, reason: `Refund amount exceeds limit of ${approvalLimits.refunds}` };
    }

    if (action.includes('purchase') && amount > approvalLimits.purchases) {
      return { allowed: false, reason: `Purchase amount exceeds limit of ${approvalLimits.purchases}` };
    }

    if (action.includes('credit') && amount > approvalLimits.credits) {
      return { allowed: false, reason: `Credit amount exceeds limit of ${approvalLimits.credits}` };
    }

    // Check budget limits
    const currentSpending = await this.getCurrentSpending();
    if (currentSpending.daily + amount > budgetLimits.daily) {
      return { 
        allowed: true, 
        requiresApproval: true,
        reason: 'Exceeds daily budget limit - requires approval'
      };
    }

    return { allowed: true };
  }

  // Approval Requirements Check
  private checkApprovalRequirements(
    action: string,
    workflows: OperationalConstraints['approvalWorkflows']
  ): { required: boolean; level?: string } {
    if (workflows.requiresOwnerApproval.some(pattern => action.includes(pattern))) {
      return { required: true, level: 'owner' };
    }

    if (workflows.requiresSupervisorApproval.some(pattern => action.includes(pattern))) {
      return { required: true, level: 'supervisor' };
    }

    return { required: false };
  }

  // Data Export Validation
  async validateDataExport(
    exportType: string,
    recordCount: number,
    scope: ManagementScope
  ): Promise<boolean> {
    const constraints = scope.dataConstraints.exportLimits;
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = this.getWeekStart();

    // Check record limit
    if (recordCount > constraints.recordLimit) {
      await this.logViolation('export_record_limit', exportType, 'export');
      return false;
    }

    // Check daily export limit
    const dailyExports = await this.getExportCount(today);
    if (dailyExports >= constraints.daily) {
      await this.logViolation('export_daily_limit', exportType, 'export');
      return false;
    }

    // Check weekly export limit
    const weeklyExports = await this.getExportCount(thisWeek);
    if (weeklyExports >= constraints.weekly) {
      await this.logViolation('export_weekly_limit', exportType, 'export');
      return false;
    }

    // Log export activity
    await this.auditSystem.logActivity({
      action: 'data_export_approved',
      target: 'data_export',
      targetId: exportType,
      category: 'DATA_ACCESS',
      severity: 'MEDIUM',
      details: {
        exportType,
        recordCount,
        scopeType: scope.roleType
      },
      context: {
        ipAddress: 'system',
        userAgent: 'export_validator',
        sessionId: 'export_validation'
      }
    });

    return true;
  }

  // Emergency Override Validation
  async validateEmergencyOverride(
    action: string,
    justification: string,
    scope: ManagementScope
  ): Promise<boolean> {
    if (!scope.escalationRules.emergencyOverride) {
      await this.logViolation('emergency_override_disabled', action, 'override');
      return false;
    }

    // Log emergency override
    await this.auditSystem.logActivity({
      action: 'emergency_override_used',
      target: 'emergency_action',
      targetId: action,
      category: 'SECURITY',
      severity: 'CRITICAL',
      details: {
        action,
        justification,
        scopeType: scope.roleType,
        userId: this.userId
      },
      context: {
        ipAddress: 'system',
        userAgent: 'emergency_override',
        sessionId: 'emergency_session'
      }
    });

    return true;
  }

  // Helper Methods
  private extractAmountFromAction(action: string): number | null {
    const match = action.match(/amount:(\d+(?:\.\d{2})?)/);
    return match ? parseFloat(match[1]) : null;
  }

  private getWeekStart(): string {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    return weekStart.toISOString().split('T')[0];
  }

  private async getActionCount(actionType: string, period: string): Promise<number> {
    // Implementation would query audit logs for action counts
    return 0; // Placeholder
  }

  private async getCurrentSpending(): Promise<{ daily: number; weekly: number; monthly: number }> {
    // Implementation would query spending records
    return { daily: 0, weekly: 0, monthly: 0 }; // Placeholder
  }

  private async getExportCount(period: string): Promise<number> {
    // Implementation would query export logs
    return 0; // Placeholder
  }

  private async logViolation(
    violationType: string,
    resource: string,
    action: string,
    error?: any
  ): Promise<void> {
    await this.auditSystem.logActivity({
      action: 'management_constraint_violation',
      target: 'constraint_violation',
      targetId: resource,
      category: 'SECURITY',
      severity: 'HIGH',
      details: {
        violationType,
        resource,
        action,
        userId: this.userId,
        error: error?.message
      },
      context: {
        ipAddress: 'system',
        userAgent: 'constraint_enforcer',
        sessionId: 'constraint_validation'
      }
    });
  }
}

// Default Constraint Configurations
export const DEFAULT_SUPERVISOR_CONSTRAINTS: OperationalConstraints = {
  actionLimits: {
    dailyApprovals: 50,
    weeklyScheduleChanges: 20,
    monthlyBulkOperations: 5,
    escalationsPerDay: 10
  },
  approvalWorkflows: {
    requiresOwnerApproval: ['budget_increase', 'role_change', 'policy_override'],
    requiresSupervisorApproval: ['overtime_approval', 'schedule_exception'],
    bypassableActions: ['routine_approval', 'timesheet_correction'],
    emergencyBypassAllowed: true
  },
  communicationLimits: {
    customerContactAllowed: true,
    vendorContactAllowed: false,
    crossDepartmentMessaging: false,
    externalCommunication: false
  },
  resourceConstraints: {
    maxTeamSize: 15,
    maxConcurrentProjects: 5,
    inventoryManagementAllowed: false,
    assetManagementLevel: 'VIEW'
  }
};

export const DEFAULT_MANAGER_CONSTRAINTS: OperationalConstraints = {
  actionLimits: {
    dailyApprovals: 100,
    weeklyScheduleChanges: 50,
    monthlyBulkOperations: 15,
    escalationsPerDay: 20
  },
  approvalWorkflows: {
    requiresOwnerApproval: ['budget_increase', 'department_restructure', 'major_policy_change'],
    requiresSupervisorApproval: [],
    bypassableActions: ['routine_approval', 'timesheet_correction', 'minor_adjustments'],
    emergencyBypassAllowed: true
  },
  communicationLimits: {
    customerContactAllowed: true,
    vendorContactAllowed: true,
    crossDepartmentMessaging: true,
    externalCommunication: true
  },
  resourceConstraints: {
    maxTeamSize: 50,
    maxConcurrentProjects: 20,
    inventoryManagementAllowed: true,
    assetManagementLevel: 'MODIFY'
  }
};

// Factory Functions
export function createManagementConstraintEnforcer(
  orgId: string,
  userId: string
): ManagementConstraintEnforcer {
  return new ManagementConstraintEnforcer(orgId, userId);
}

export function createSupervisorScope(
  userId: string,
  orgId: string,
  config: Partial<SupervisorScope>
): ManagementScope {
  return {
    userId,
    orgId,
    roleType: 'SUPERVISOR',
    teams: config.teams || [],
    locations: config.locations || [],
    projects: config.projects || [],
    budgetLimits: config.budgetLimits || {
      daily: 1000,
      weekly: 5000,
      monthly: 20000
    },
    approvalLimits: {
      expenses: 500,
      refunds: 250,
      purchases: 1000,
      credits: 100,
      adjustments: 200
    },
    timeRestrictions: config.timeRestrictions || {
      businessHoursOnly: true,
      startTime: '06:00',
      endTime: '22:00',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7]
    },
    dataConstraints: {
      historicalDataMonths: 12,
      exportLimits: {
        daily: 5,
        weekly: 20,
        recordLimit: 1000
      },
      sensitiveDataAccess: false,
      crossDepartmentView: false
    },
    escalationRules: {
      canRequestElevation: true,
      maxElevationDuration: 60,
      elevationApprovalRequired: true,
      emergencyOverride: true
    }
  };
}

export function createManagerScope(
  userId: string,
  orgId: string,
  config: Partial<ManagerScope>
): ManagementScope {
  return {
    userId,
    orgId,
    roleType: 'MANAGER',
    departments: config.departments || [],
    locations: config.locations || [],
    costCenters: config.costCenters || [],
    budgetLimits: config.budgetLimits || {
      daily: 5000,
      weekly: 25000,
      monthly: 100000,
      quarterly: 300000
    },
    approvalLimits: config.approvalLimits || {
      expenses: 5000,
      refunds: 2500,
      purchases: 10000,
      credits: 1000,
      adjustments: 2000
    },
    timeRestrictions: config.timeRestrictions || {
      businessHoursOnly: false,
      startTime: '06:00',
      endTime: '22:00',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7]
    },
    dataConstraints: {
      historicalDataMonths: 24,
      exportLimits: {
        daily: 15,
        weekly: 50,
        recordLimit: 10000
      },
      sensitiveDataAccess: true,
      crossDepartmentView: true
    },
    escalationRules: {
      canRequestElevation: true,
      maxElevationDuration: 120,
      elevationApprovalRequired: false,
      emergencyOverride: true
    }
  };
}

export type {
  ManagementScope,
  OperationalConstraints
};