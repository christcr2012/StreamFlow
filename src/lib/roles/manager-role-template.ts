// src/lib/roles/manager-role-template.ts
// Comprehensive Manager Role Template for Operational Management
// Robinson Solutions B2B SaaS Platform

import { createStaffAuditSystem } from "../staff-audit-system";

export interface ManagerRoleCapabilities {
  // Operational Management
  operations_management: {
    capacity_planning: boolean;
    schedule_creation: boolean;
    schedule_optimization: boolean;
    inventory_management: boolean;
    asset_management: boolean;
    escalation_handling: boolean;
    refund_processing: boolean;
    credit_issuance: boolean;
    operational_workflow_design: boolean;
    resource_allocation: boolean;
    vendor_coordination: boolean;
    service_delivery_oversight: boolean;
  };

  // People Management
  people_management: {
    timesheet_review: boolean;
    timesheet_approval: boolean;
    expense_review: boolean;
    expense_approval: boolean;
    performance_monitoring: boolean;
    staff_coordination: boolean;
    training_coordination: boolean;
    workload_balancing: boolean;
    department_communication: boolean;
  };

  // Analytics & Reporting
  analytics_access: {
    operational_kpis: boolean;
    department_metrics: boolean;
    financial_performance: boolean;
    productivity_analytics: boolean;
    customer_satisfaction_metrics: boolean;
    resource_utilization: boolean;
    trend_analysis: boolean;
    custom_report_creation: boolean;
    data_export_scoped: boolean;
    dashboard_management: boolean;
  };

  // Customer & Service Management
  customer_service: {
    escalation_resolution: boolean;
    service_level_monitoring: boolean;
    customer_feedback_review: boolean;
    service_improvement_initiatives: boolean;
    client_relationship_management: boolean;
    contract_performance_monitoring: boolean;
  };

  // Financial Operations (Limited)
  financial_operations: {
    budget_monitoring: boolean;
    expense_oversight: boolean;
    cost_center_management: boolean;
    revenue_tracking: boolean;
    profit_margin_analysis: boolean;
    vendor_payment_approval: boolean;
    departmental_financial_planning: boolean;
  };

  // Quality & Compliance
  quality_compliance: {
    quality_assurance_oversight: boolean;
    compliance_monitoring: boolean;
    process_improvement: boolean;
    audit_coordination: boolean;
    policy_enforcement: boolean;
    safety_oversight: boolean;
    documentation_management: boolean;
  };

  // Communication & Coordination
  communication: {
    cross_department_coordination: boolean;
    stakeholder_communication: boolean;
    reporting_to_leadership: boolean;
    team_meetings: boolean;
    client_communication: boolean;
    vendor_communication: boolean;
  };

  // Self-Service
  self_service: {
    profile_management: boolean;
    password_change: boolean;
    notification_preferences: boolean;
    dashboard_customization: boolean;
    schedule_view: boolean;
    calendar_management: boolean;
  };
}

export interface ManagerRoleConstraints {
  // Scope Restrictions
  scope_restrictions: {
    tenant_isolation: boolean;
    department_based_access: boolean;
    location_based_access: boolean;
    budget_threshold_enforcement: boolean;
    assigned_scope_only: boolean;
    no_cross_department_access: boolean;
  };

  // Administrative Restrictions
  admin_restrictions: {
    no_user_role_administration: boolean;
    no_global_configurations: boolean;
    no_provider_portal: boolean;
    no_system_admin: boolean;
    no_tenant_settings: boolean;
    no_billing_system_access: boolean;
    scoped_approvals_only: boolean;
  };

  // Financial Constraints
  financial_constraints: {
    budget_limits_enforced: boolean;
    approval_thresholds: boolean;
    spending_category_restrictions: boolean;
    financial_data_scoped: boolean;
    no_global_financial_access: boolean;
  };

  // Data Access Constraints
  data_access_constraints: {
    scoped_data_access: boolean;
    department_data_only: boolean;
    historical_data_limited: boolean;
    sensitive_data_restrictions: boolean;
    export_logging_required: boolean;
  };

  // Operational Limits
  operational_limits: {
    approval_amount_limits: boolean;
    bulk_operation_restrictions: boolean;
    schedule_change_limits: boolean;
    vendor_interaction_limits: boolean;
    customer_refund_limits: boolean;
  };
}

// Manager Scope Configuration
export interface ManagerScope {
  departments: string[];
  locations: string[];
  costCenters: string[];
  budgetLimits: {
    daily: number;
    weekly: number;
    monthly: number;
    quarterly: number;
  };
  approvalLimits: {
    refunds: number;
    expenses: number;
    purchases: number;
    credits: number;
  };
  timeRestrictions?: {
    businessHoursOnly: boolean;
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  };
}

// Manager Permission Mappings
export const MANAGER_PERMISSIONS = {
  // Operations Management
  'operations:plan_capacity': 'Plan operational capacity',
  'operations:create_schedule': 'Create schedules',
  'operations:optimize_schedule': 'Optimize scheduling',
  'operations:manage_inventory': 'Manage inventory',
  'operations:manage_assets': 'Manage assets',
  'operations:handle_escalations': 'Handle escalations',
  'operations:process_refunds': 'Process refunds within limits',
  'operations:issue_credits': 'Issue credits within limits',
  'operations:design_workflow': 'Design operational workflows',
  'operations:allocate_resources': 'Allocate resources',
  'operations:coordinate_vendors': 'Coordinate with vendors',
  'operations:oversee_delivery': 'Oversee service delivery',

  // People Management
  'people:review_timesheets': 'Review timesheets',
  'people:approve_timesheets': 'Approve timesheets',
  'people:review_expenses': 'Review expense submissions',
  'people:approve_expenses': 'Approve expense submissions',
  'people:monitor_performance': 'Monitor staff performance',
  'people:coordinate_staff': 'Coordinate staff activities',
  'people:coordinate_training': 'Coordinate training',
  'people:balance_workload': 'Balance workloads',
  'people:communicate_department': 'Department communication',

  // Analytics & Reporting
  'analytics:view_kpis': 'View operational KPIs',
  'analytics:department_metrics': 'View department metrics',
  'analytics:financial_performance': 'View financial performance',
  'analytics:productivity': 'View productivity analytics',
  'analytics:customer_satisfaction': 'View customer satisfaction',
  'analytics:resource_utilization': 'View resource utilization',
  'analytics:trend_analysis': 'Perform trend analysis',
  'analytics:create_reports': 'Create custom reports',
  'analytics:export_data': 'Export scoped data',
  'analytics:manage_dashboard': 'Manage dashboards',

  // Customer Service
  'customer:resolve_escalations': 'Resolve customer escalations',
  'customer:monitor_service_levels': 'Monitor service levels',
  'customer:review_feedback': 'Review customer feedback',
  'customer:improve_service': 'Lead service improvements',
  'customer:manage_relationships': 'Manage client relationships',
  'customer:monitor_contracts': 'Monitor contract performance',

  // Financial Operations
  'finance:monitor_budget': 'Monitor budgets',
  'finance:oversee_expenses': 'Oversee expenses',
  'finance:manage_cost_center': 'Manage cost centers',
  'finance:track_revenue': 'Track revenue',
  'finance:analyze_margins': 'Analyze profit margins',
  'finance:approve_vendor_payments': 'Approve vendor payments',
  'finance:plan_departmental': 'Departmental financial planning',

  // Quality & Compliance
  'quality:oversee_assurance': 'Oversee quality assurance',
  'quality:monitor_compliance': 'Monitor compliance',
  'quality:improve_processes': 'Improve processes',
  'quality:coordinate_audits': 'Coordinate audits',
  'quality:enforce_policies': 'Enforce policies',
  'quality:oversee_safety': 'Oversee safety',
  'quality:manage_documentation': 'Manage documentation',

  // Communication
  'communication:cross_department': 'Cross-department coordination',
  'communication:stakeholders': 'Stakeholder communication',
  'communication:leadership_reporting': 'Report to leadership',
  'communication:team_meetings': 'Conduct team meetings',
  'communication:clients': 'Client communication',
  'communication:vendors': 'Vendor communication',

  // Self-Service
  'profile:read': 'View own profile',
  'profile:update': 'Update own profile',
  'notifications:manage': 'Manage notifications',
  'dashboard:customize': 'Customize dashboard',
  'schedule:view': 'View schedules',
  'calendar:manage': 'Manage calendar'
};

// Default Manager Role Template
export const MANAGER_ROLE_TEMPLATE: {
  capabilities: ManagerRoleCapabilities;
  constraints: ManagerRoleConstraints;
  permissions: string[];
  defaultScope: ManagerScope;
} = {
  capabilities: {
    operations_management: {
      capacity_planning: true,
      schedule_creation: true,
      schedule_optimization: true,
      inventory_management: true,
      asset_management: true,
      escalation_handling: true,
      refund_processing: true,
      credit_issuance: true,
      operational_workflow_design: true,
      resource_allocation: true,
      vendor_coordination: true,
      service_delivery_oversight: true
    },
    people_management: {
      timesheet_review: true,
      timesheet_approval: true,
      expense_review: true,
      expense_approval: true,
      performance_monitoring: true,
      staff_coordination: true,
      training_coordination: true,
      workload_balancing: true,
      department_communication: true
    },
    analytics_access: {
      operational_kpis: true,
      department_metrics: true,
      financial_performance: true,
      productivity_analytics: true,
      customer_satisfaction_metrics: true,
      resource_utilization: true,
      trend_analysis: true,
      custom_report_creation: true,
      data_export_scoped: true,
      dashboard_management: true
    },
    customer_service: {
      escalation_resolution: true,
      service_level_monitoring: true,
      customer_feedback_review: true,
      service_improvement_initiatives: true,
      client_relationship_management: true,
      contract_performance_monitoring: true
    },
    financial_operations: {
      budget_monitoring: true,
      expense_oversight: true,
      cost_center_management: true,
      revenue_tracking: true,
      profit_margin_analysis: true,
      vendor_payment_approval: true,
      departmental_financial_planning: true
    },
    quality_compliance: {
      quality_assurance_oversight: true,
      compliance_monitoring: true,
      process_improvement: true,
      audit_coordination: true,
      policy_enforcement: true,
      safety_oversight: true,
      documentation_management: true
    },
    communication: {
      cross_department_coordination: true,
      stakeholder_communication: true,
      reporting_to_leadership: true,
      team_meetings: true,
      client_communication: true,
      vendor_communication: true
    },
    self_service: {
      profile_management: true,
      password_change: true,
      notification_preferences: true,
      dashboard_customization: true,
      schedule_view: true,
      calendar_management: true
    }
  },
  constraints: {
    scope_restrictions: {
      tenant_isolation: true,
      department_based_access: true,
      location_based_access: true,
      budget_threshold_enforcement: true,
      assigned_scope_only: true,
      no_cross_department_access: true
    },
    admin_restrictions: {
      no_user_role_administration: true,
      no_global_configurations: true,
      no_provider_portal: true,
      no_system_admin: true,
      no_tenant_settings: true,
      no_billing_system_access: true,
      scoped_approvals_only: true
    },
    financial_constraints: {
      budget_limits_enforced: true,
      approval_thresholds: true,
      spending_category_restrictions: true,
      financial_data_scoped: true,
      no_global_financial_access: true
    },
    data_access_constraints: {
      scoped_data_access: true,
      department_data_only: true,
      historical_data_limited: true,
      sensitive_data_restrictions: true,
      export_logging_required: true
    },
    operational_limits: {
      approval_amount_limits: true,
      bulk_operation_restrictions: true,
      schedule_change_limits: true,
      vendor_interaction_limits: true,
      customer_refund_limits: true
    }
  },
  permissions: [
    // Core Operations Management
    'operations:plan_capacity',
    'operations:create_schedule',
    'operations:optimize_schedule',
    'operations:manage_inventory',
    'operations:manage_assets',
    'operations:handle_escalations',
    'operations:process_refunds',
    'operations:issue_credits',
    'operations:design_workflow',
    'operations:allocate_resources',
    'operations:coordinate_vendors',
    'operations:oversee_delivery',

    // People Management
    'people:review_timesheets',
    'people:approve_timesheets',
    'people:review_expenses',
    'people:approve_expenses',
    'people:monitor_performance',
    'people:coordinate_staff',
    'people:coordinate_training',
    'people:balance_workload',
    'people:communicate_department',

    // Analytics & Reporting
    'analytics:view_kpis',
    'analytics:department_metrics',
    'analytics:financial_performance',
    'analytics:productivity',
    'analytics:customer_satisfaction',
    'analytics:resource_utilization',
    'analytics:trend_analysis',
    'analytics:create_reports',
    'analytics:export_data',
    'analytics:manage_dashboard',

    // Customer Service
    'customer:resolve_escalations',
    'customer:monitor_service_levels',
    'customer:review_feedback',
    'customer:improve_service',
    'customer:manage_relationships',
    'customer:monitor_contracts',

    // Financial Operations
    'finance:monitor_budget',
    'finance:oversee_expenses',
    'finance:manage_cost_center',
    'finance:track_revenue',
    'finance:analyze_margins',
    'finance:approve_vendor_payments',
    'finance:plan_departmental',

    // Quality & Compliance
    'quality:oversee_assurance',
    'quality:monitor_compliance',
    'quality:improve_processes',
    'quality:coordinate_audits',
    'quality:enforce_policies',
    'quality:oversee_safety',
    'quality:manage_documentation',

    // Communication
    'communication:cross_department',
    'communication:stakeholders',
    'communication:leadership_reporting',
    'communication:team_meetings',
    'communication:clients',
    'communication:vendors',

    // Self-Service
    'profile:read',
    'profile:update',
    'notifications:manage',
    'dashboard:customize',
    'schedule:view',
    'calendar:manage'
  ],
  defaultScope: {
    departments: [], // Configured by Owner
    locations: [], // Configured by Owner
    costCenters: [], // Configured by Owner
    budgetLimits: {
      daily: 5000,
      weekly: 25000,
      monthly: 100000,
      quarterly: 300000
    },
    approvalLimits: {
      refunds: 2500,
      expenses: 5000,
      purchases: 10000,
      credits: 1000
    },
    timeRestrictions: {
      businessHoursOnly: false,
      startTime: '06:00',
      endTime: '22:00',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7]
    }
  }
};

// Manager Role Variants
export const MANAGER_ROLE_VARIANTS = {
  'Operations Manager': {
    ...MANAGER_ROLE_TEMPLATE,
    capabilities: {
      ...MANAGER_ROLE_TEMPLATE.capabilities,
      operations_management: {
        ...MANAGER_ROLE_TEMPLATE.capabilities.operations_management,
        operational_workflow_design: true,
        vendor_coordination: true
      }
    },
    defaultScope: {
      ...MANAGER_ROLE_TEMPLATE.defaultScope,
      budgetLimits: {
        daily: 10000,
        weekly: 50000,
        monthly: 200000,
        quarterly: 600000
      }
    },
    permissions: [
      ...MANAGER_ROLE_TEMPLATE.permissions,
      'operations:strategic_planning',
      'operations:process_optimization',
      'operations:vendor_contracts'
    ]
  },

  'Department Manager': {
    ...MANAGER_ROLE_TEMPLATE,
    capabilities: {
      ...MANAGER_ROLE_TEMPLATE.capabilities,
      people_management: {
        ...MANAGER_ROLE_TEMPLATE.capabilities.people_management,
        performance_monitoring: true,
        training_coordination: true
      }
    },
    permissions: [
      ...MANAGER_ROLE_TEMPLATE.permissions,
      'department:strategic_planning',
      'department:goal_setting',
      'department:performance_review'
    ]
  },

  'Regional Manager': {
    ...MANAGER_ROLE_TEMPLATE,
    defaultScope: {
      ...MANAGER_ROLE_TEMPLATE.defaultScope,
      budgetLimits: {
        daily: 15000,
        weekly: 75000,
        monthly: 300000,
        quarterly: 900000
      }
    },
    permissions: [
      ...MANAGER_ROLE_TEMPLATE.permissions,
      'regional:coordination',
      'regional:resource_sharing',
      'regional:performance_optimization'
    ]
  }
};

// Industry-Specific Manager Configurations
export const MANAGER_INDUSTRY_CONFIGS = {
  'Cleaning & Janitorial': {
    ...MANAGER_ROLE_TEMPLATE,
    permissions: [
      ...MANAGER_ROLE_TEMPLATE.permissions,
      'cleaning:quality_standards',
      'cleaning:chemical_management',
      'cleaning:equipment_procurement',
      'cleaning:site_audits'
    ]
  },

  'Healthcare': {
    ...MANAGER_ROLE_TEMPLATE,
    capabilities: {
      ...MANAGER_ROLE_TEMPLATE.capabilities,
      quality_compliance: {
        ...MANAGER_ROLE_TEMPLATE.capabilities.quality_compliance,
        compliance_monitoring: true,
        audit_coordination: true
      }
    },
    permissions: [
      ...MANAGER_ROLE_TEMPLATE.permissions,
      'healthcare:quality_metrics',
      'healthcare:compliance_reporting',
      'healthcare:patient_satisfaction',
      'healthcare:staff_certification'
    ]
  },

  'Professional Services': {
    ...MANAGER_ROLE_TEMPLATE,
    permissions: [
      ...MANAGER_ROLE_TEMPLATE.permissions,
      'projects:portfolio_management',
      'projects:resource_optimization',
      'client:account_planning',
      'revenue:forecasting'
    ]
  }
};

// Manager Scope Management
export class ManagerScopeManager {
  private orgId: string;
  private managerId: string;
  private auditSystem: any;

  constructor(orgId: string, managerId: string) {
    this.orgId = orgId;
    this.managerId = managerId;
    this.auditSystem = createStaffAuditSystem(orgId, managerId, 'manager_session');
  }

  async validateManagerScope(
    resource: string,
    action: string,
    scope: ManagerScope
  ): Promise<boolean> {
    try {
      // Extract resource information
      const resourceParts = resource.split(':');
      const resourceType = resourceParts[0];
      const resourceId = resourceParts[2];

      // Check department scope
      if (resourceType.includes('department') || resourceType.includes('dept')) {
        if (!scope.departments.includes(resourceId)) {
          await this.logScopeViolation('department_scope', resource, action);
          return false;
        }
      }

      // Check location scope
      if (resourceType.includes('location') || resourceType.includes('site')) {
        if (!scope.locations.includes(resourceId)) {
          await this.logScopeViolation('location_scope', resource, action);
          return false;
        }
      }

      // Check budget limits for financial actions
      if (action.includes('approve') || action.includes('spend') || action.includes('purchase')) {
        const amount = this.extractAmountFromAction(action);
        if (amount && !this.isWithinBudgetLimits(amount, scope.budgetLimits)) {
          await this.logScopeViolation('budget_limit', resource, action);
          return false;
        }
      }

      // Check approval limits
      if (action.includes('refund') || action.includes('credit') || action.includes('expense')) {
        const amount = this.extractAmountFromAction(action);
        if (amount && !this.isWithinApprovalLimits(action, amount, scope.approvalLimits)) {
          await this.logScopeViolation('approval_limit', resource, action);
          return false;
        }
      }

      // Check time restrictions
      if (scope.timeRestrictions && scope.timeRestrictions.businessHoursOnly) {
        if (!this.isWithinBusinessHours(scope.timeRestrictions)) {
          await this.logScopeViolation('time_restriction', resource, action);
          return false;
        }
      }

      return true;

    } catch (error) {
      await this.logScopeViolation('scope_validation_error', resource, action, error);
      return false;
    }
  }

  private extractAmountFromAction(action: string): number | null {
    // Extract amount from action string (implementation would parse action metadata)
    // This is a simplified version
    const match = action.match(/amount:(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  private isWithinBudgetLimits(amount: number, limits: ManagerScope['budgetLimits']): boolean {
    // Check against daily, weekly, monthly limits
    // Implementation would track current spending
    return amount <= limits.daily; // Simplified check
  }

  private isWithinApprovalLimits(action: string, amount: number, limits: ManagerScope['approvalLimits']): boolean {
    if (action.includes('refund')) return amount <= limits.refunds;
    if (action.includes('expense')) return amount <= limits.expenses;
    if (action.includes('purchase')) return amount <= limits.purchases;
    if (action.includes('credit')) return amount <= limits.credits;
    return true;
  }

  private isWithinBusinessHours(restrictions: ManagerScope['timeRestrictions']): boolean {
    if (!restrictions) return true;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);

    if (!restrictions.daysOfWeek.includes(currentDay)) return false;
    if (currentTime < restrictions.startTime || currentTime > restrictions.endTime) return false;

    return true;
  }

  private async logScopeViolation(
    violationType: string,
    resource: string,
    action: string,
    error?: any
  ): Promise<void> {
    await this.auditSystem.logActivity({
      action: 'manager_scope_violation',
      target: 'scoped_resource',
      targetId: resource,
      category: 'SECURITY',
      severity: 'HIGH',
      details: {
        violationType,
        resource,
        action,
        managerId: this.managerId,
        error: error?.message
      },
      context: {
        ipAddress: 'system',
        userAgent: 'manager_scope_manager',
        sessionId: 'scope_validation'
      }
    });
  }
}

// Utility Functions
export function createManagerScopeManager(
  orgId: string,
  managerId: string
): ManagerScopeManager {
  return new ManagerScopeManager(orgId, managerId);
}

export function validateManagerAccess(
  userId: string,
  orgId: string,
  resource: string,
  action: string,
  scope: ManagerScope
): Promise<boolean> {
  const scopeManager = createManagerScopeManager(orgId, userId);
  return scopeManager.validateManagerScope(resource, action, scope);
}

// Types already exported with interfaces above