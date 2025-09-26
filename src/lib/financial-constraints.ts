// src/lib/financial-constraints.ts
// Financial-Specific Constraints and Compliance System
// Robinson Solutions B2B SaaS Platform

import { prisma as db } from "./prisma";
import { createStaffAuditSystem } from "./staff-audit-system";

export interface FinancialDataConstraints {
  // Tenant Isolation
  tenantIsolation: boolean;
  financialDataOnly: boolean;
  crossTenantAccess: boolean;

  // Module Access Restrictions
  moduleRestrictions: {
    payrollAccess: boolean;
    arAccess: boolean;
    apAccess: boolean;
    bankingAccess: boolean;
    investmentAccess: boolean;
    budgetingAccess: boolean;
  };

  // Data Export Controls
  exportControls: {
    requireApproval: boolean;
    logAllExports: boolean;
    bulkDataLimits: number;
    allowedFormats: string[];
    sensitiveDataMasking: boolean;
  };

  // Report Access Controls
  reportAccess: {
    executiveDashboard: boolean;
    boardReports: boolean;
    auditReports: boolean;
    complianceReports: boolean;
    customReports: boolean;
  };
}

export interface ComplianceRequirements {
  // Financial Standards
  gaapCompliance: boolean;
  ifrsCompliance: boolean;
  sox404Compliance: boolean;
  soc2TypeII: boolean;

  // Data Retention
  retentionPolicies: {
    financialRecords: number; // years
    auditTrails: number; // years
    taxDocuments: number; // years
    payrollRecords: number; // years
  };

  // Audit Requirements
  auditRequirements: {
    immutableLogs: boolean;
    changeTracking: boolean;
    approvalWorkflows: boolean;
    segregationOfDuties: boolean;
  };

  // Data Residency
  dataResidency: {
    respectLocalLaws: boolean;
    crossBorderRestrictions: boolean;
    encryptionRequirements: boolean;
  };
}

export interface FinancialApprovalWorkflow {
  // Approval Thresholds
  adjustmentThresholds: {
    minor: number; // No approval required
    moderate: number; // Supervisor approval
    major: number; // Owner approval
    critical: number; // Board approval
  };

  // Approval Types
  approvalTypes: {
    journalEntries: boolean;
    bankReconciliation: boolean;
    monthEndClose: boolean;
    yearEndClose: boolean;
    taxFilings: boolean;
    auditAdjustments: boolean;
  };

  // Escalation Rules
  escalationRules: {
    timeoutHours: number;
    escalationLevels: string[];
    emergencyOverride: boolean;
  };
}

export class FinancialConstraintEnforcer {
  private orgId: string;
  private userId: string;
  private auditSystem: any;

  constructor(orgId: string, userId: string) {
    this.orgId = orgId;
    this.userId = userId;
    this.auditSystem = createStaffAuditSystem(orgId, userId, 'financial_session');
  }

  // Data Access Constraints
  async enforceDataConstraints(
    resource: string,
    action: string,
    constraints: FinancialDataConstraints
  ): Promise<boolean> {
    try {
      // Check tenant isolation
      if (constraints.tenantIsolation && !await this.validateTenantAccess(resource)) {
        await this.logViolation('tenant_isolation', resource, action);
        return false;
      }

      // Check financial data only restriction
      if (constraints.financialDataOnly && !this.isFinancialResource(resource)) {
        await this.logViolation('financial_data_only', resource, action);
        return false;
      }

      // Check module restrictions
      if (!await this.validateModuleAccess(resource, constraints.moduleRestrictions)) {
        await this.logViolation('module_restriction', resource, action);
        return false;
      }

      // Check export controls
      if (action.includes('export') && !await this.validateExportAccess(constraints.exportControls)) {
        await this.logViolation('export_restriction', resource, action);
        return false;
      }

      // Log successful access
      await this.auditSystem.logActivity({
        action: 'financial_access_granted',
        target: 'financial_resource',
        targetId: resource,
        category: 'AUTHORIZATION',
        severity: 'LOW',
        details: {
          resource,
          action,
          constraints: Object.keys(constraints)
        },
        context: {
          ipAddress: 'system',
          userAgent: 'financial_enforcer',
          sessionId: 'financial_access'
        }
      });

      return true;

    } catch (error) {
      await this.logViolation('enforcement_error', resource, action, error);
      return false;
    }
  }

  // Compliance Enforcement
  async enforceCompliance(
    operation: string,
    data: any,
    requirements: ComplianceRequirements
  ): Promise<boolean> {
    try {
      // GAAP/IFRS Compliance
      if (requirements.gaapCompliance || requirements.ifrsCompliance) {
        if (!await this.validateFinancialStandards(operation, data)) {
          await this.logComplianceViolation('financial_standards', operation);
          return false;
        }
      }

      // SOX 404 Compliance
      if (requirements.sox404Compliance) {
        if (!await this.validateSOXCompliance(operation, data)) {
          await this.logComplianceViolation('sox_404', operation);
          return false;
        }
      }

      // Data Retention Compliance
      if (!await this.validateRetentionCompliance(operation, requirements.retentionPolicies)) {
        await this.logComplianceViolation('data_retention', operation);
        return false;
      }

      // Audit Requirements
      if (!await this.validateAuditRequirements(operation, requirements.auditRequirements)) {
        await this.logComplianceViolation('audit_requirements', operation);
        return false;
      }

      return true;

    } catch (error) {
      await this.logComplianceViolation('compliance_error', operation, error);
      return false;
    }
  }

  // Approval Workflow Enforcement
  async enforceApprovalWorkflow(
    operation: string,
    amount: number,
    workflow: FinancialApprovalWorkflow
  ): Promise<{ required: boolean; level: string; approvers: string[] }> {
    try {
      // Determine approval level based on amount
      let approvalLevel = 'none';
      let approvers: string[] = [];

      if (amount >= workflow.adjustmentThresholds.critical) {
        approvalLevel = 'board';
        approvers = await this.getBoardApprovers();
      } else if (amount >= workflow.adjustmentThresholds.major) {
        approvalLevel = 'owner';
        approvers = await this.getOwnerApprovers();
      } else if (amount >= workflow.adjustmentThresholds.moderate) {
        approvalLevel = 'supervisor';
        approvers = await this.getSupervisorApprovers();
      }

      // Check if operation type requires approval
      const requiresApproval = this.operationRequiresApproval(operation, workflow.approvalTypes);

      if (requiresApproval || approvalLevel !== 'none') {
        await this.auditSystem.logActivity({
          action: 'approval_workflow_triggered',
          target: 'financial_operation',
          targetId: operation,
          category: 'AUTHORIZATION',
          severity: 'MEDIUM',
          details: {
            operation,
            amount,
            approvalLevel,
            approvers: approvers.length
          },
          context: {
            ipAddress: 'system',
            userAgent: 'approval_enforcer',
            sessionId: 'approval_workflow'
          }
        });

        return {
          required: true,
          level: approvalLevel,
          approvers
        };
      }

      return {
        required: false,
        level: 'none',
        approvers: []
      };

    } catch (error) {
      await this.logViolation('approval_workflow_error', operation, 'approval_check', error);
      return {
        required: true,
        level: 'error',
        approvers: []
      };
    }
  }

  // Private Validation Methods
  private async validateTenantAccess(resource: string): Promise<boolean> {
    // Check if resource belongs to current tenant
    const resourceParts = resource.split(':');
    if (resourceParts.length < 3) return false;
    
    const resourceOrgId = resourceParts[1];
    return resourceOrgId === this.orgId;
  }

  private isFinancialResource(resource: string): boolean {
    const financialResources = [
      'accounting', 'ledger', 'invoice', 'payment', 'tax', 'budget',
      'financial_report', 'audit', 'compliance', 'banking'
    ];
    
    return financialResources.some(fr => resource.includes(fr));
  }

  private async validateModuleAccess(
    resource: string,
    restrictions: FinancialDataConstraints['moduleRestrictions']
  ): Promise<boolean> {
    if (resource.includes('payroll') && !restrictions.payrollAccess) return false;
    if (resource.includes('accounts_receivable') && !restrictions.arAccess) return false;
    if (resource.includes('accounts_payable') && !restrictions.apAccess) return false;
    if (resource.includes('banking') && !restrictions.bankingAccess) return false;
    if (resource.includes('investment') && !restrictions.investmentAccess) return false;
    if (resource.includes('budget') && !restrictions.budgetingAccess) return false;
    
    return true;
  }

  private async validateExportAccess(
    controls: FinancialDataConstraints['exportControls']
  ): Promise<boolean> {
    // Check if user has export permissions
    // This would integrate with your permission system
    return true; // Placeholder
  }

  private async validateFinancialStandards(operation: string, data: any): Promise<boolean> {
    // GAAP/IFRS validation logic
    return true; // Placeholder
  }

  private async validateSOXCompliance(operation: string, data: any): Promise<boolean> {
    // SOX 404 compliance checks
    return true; // Placeholder
  }

  private async validateRetentionCompliance(
    operation: string,
    policies: ComplianceRequirements['retentionPolicies']
  ): Promise<boolean> {
    // Data retention policy validation
    return true; // Placeholder
  }

  private async validateAuditRequirements(
    operation: string,
    requirements: ComplianceRequirements['auditRequirements']
  ): Promise<boolean> {
    // Audit requirement validation
    return true; // Placeholder
  }

  private operationRequiresApproval(
    operation: string,
    approvalTypes: FinancialApprovalWorkflow['approvalTypes']
  ): boolean {
    if (operation.includes('journal_entry') && approvalTypes.journalEntries) return true;
    if (operation.includes('reconciliation') && approvalTypes.bankReconciliation) return true;
    if (operation.includes('month_end') && approvalTypes.monthEndClose) return true;
    if (operation.includes('year_end') && approvalTypes.yearEndClose) return true;
    if (operation.includes('tax_filing') && approvalTypes.taxFilings) return true;
    if (operation.includes('audit_adjustment') && approvalTypes.auditAdjustments) return true;
    
    return false;
  }

  private async getBoardApprovers(): Promise<string[]> {
    // Get board-level approvers
    return []; // Placeholder
  }

  private async getOwnerApprovers(): Promise<string[]> {
    // Get owner-level approvers
    const owners = await db.user.findMany({
      where: { orgId: this.orgId, role: 'OWNER' }
    });
    return owners.map(o => o.id);
  }

  private async getSupervisorApprovers(): Promise<string[]> {
    // Get supervisor-level approvers
    return []; // Placeholder
  }

  private async logViolation(
    violationType: string,
    resource: string,
    action: string,
    error?: any
  ): Promise<void> {
    await this.auditSystem.logActivity({
      action: 'financial_constraint_violation',
      target: 'financial_resource',
      targetId: resource,
      category: 'SECURITY',
      severity: 'HIGH',
      details: {
        violationType,
        resource,
        action,
        error: error?.message
      },
      context: {
        ipAddress: 'system',
        userAgent: 'financial_enforcer',
        sessionId: 'constraint_violation'
      }
    });
  }

  private async logComplianceViolation(
    violationType: string,
    operation: string,
    error?: any
  ): Promise<void> {
    await this.auditSystem.logActivity({
      action: 'compliance_violation',
      target: 'financial_operation',
      targetId: operation,
      category: 'COMPLIANCE',
      severity: 'HIGH',
      details: {
        violationType,
        operation,
        error: error?.message
      },
      context: {
        ipAddress: 'system',
        userAgent: 'compliance_enforcer',
        sessionId: 'compliance_violation'
      }
    });
  }
}

// Default Financial Constraints
export const DEFAULT_FINANCIAL_CONSTRAINTS: FinancialDataConstraints = {
  tenantIsolation: true,
  financialDataOnly: true,
  crossTenantAccess: false,
  moduleRestrictions: {
    payrollAccess: false, // Owner configurable
    arAccess: true,
    apAccess: true,
    bankingAccess: true,
    investmentAccess: false, // Owner configurable
    budgetingAccess: true
  },
  exportControls: {
    requireApproval: true,
    logAllExports: true,
    bulkDataLimits: 10000,
    allowedFormats: ['pdf', 'excel', 'csv'],
    sensitiveDataMasking: true
  },
  reportAccess: {
    executiveDashboard: false,
    boardReports: false,
    auditReports: true,
    complianceReports: true,
    customReports: true
  }
};

export const DEFAULT_COMPLIANCE_REQUIREMENTS: ComplianceRequirements = {
  gaapCompliance: true,
  ifrsCompliance: false, // Organization configurable
  sox404Compliance: false, // Public companies only
  soc2TypeII: true,
  retentionPolicies: {
    financialRecords: 7,
    auditTrails: 7,
    taxDocuments: 7,
    payrollRecords: 4
  },
  auditRequirements: {
    immutableLogs: true,
    changeTracking: true,
    approvalWorkflows: true,
    segregationOfDuties: true
  },
  dataResidency: {
    respectLocalLaws: true,
    crossBorderRestrictions: true,
    encryptionRequirements: true
  }
};

export const DEFAULT_APPROVAL_WORKFLOW: FinancialApprovalWorkflow = {
  adjustmentThresholds: {
    minor: 100,
    moderate: 1000,
    major: 10000,
    critical: 100000
  },
  approvalTypes: {
    journalEntries: true,
    bankReconciliation: false,
    monthEndClose: true,
    yearEndClose: true,
    taxFilings: true,
    auditAdjustments: true
  },
  escalationRules: {
    timeoutHours: 24,
    escalationLevels: ['supervisor', 'owner', 'board'],
    emergencyOverride: false
  }
};

// Factory function
export function createFinancialConstraintEnforcer(
  orgId: string,
  userId: string
): FinancialConstraintEnforcer {
  return new FinancialConstraintEnforcer(orgId, userId);
}

export type {
  FinancialDataConstraints,
  ComplianceRequirements,
  FinancialApprovalWorkflow
};