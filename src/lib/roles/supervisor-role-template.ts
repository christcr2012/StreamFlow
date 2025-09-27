// src/lib/roles/supervisor-role-template.ts
// Comprehensive Supervisor Role Template for Team Oversight and Scoped Management
// Robinson Solutions B2B SaaS Platform

import { createStaffAuditSystem } from "../staff-audit-system";

export interface SupervisorRoleCapabilities {
  // Team Operations
  team_operations: {
    task_assignment: boolean;
    task_reassignment: boolean;
    schedule_management: boolean;
    schedule_modification: boolean;
    timesheet_approval: boolean;
    work_log_approval: boolean;
    job_completion_approval: boolean;
    team_coordination: boolean;
    priority_adjustments: boolean;
  };

  // Visibility & Monitoring
  visibility_access: {
    team_performance_dashboard: boolean;
    customer_details_scoped: boolean;
    job_details_scoped: boolean;
    project_status_monitoring: boolean;
    location_specific_data: boolean;
    assigned_team_metrics: boolean;
    workload_distribution: boolean;
    performance_analytics: boolean;
  };

  // Escalation Capabilities
  escalation_management: {
    temporary_elevation_request: boolean;
    urgent_action_override: boolean;
    escalation_to_management: boolean;
    emergency_task_assignment: boolean;
    priority_escalation: boolean;
    resource_request: boolean;
    support_escalation: boolean;
  };

  // Communication & Coordination
  communication: {
    team_messaging: boolean;
    customer_communication_scoped: boolean;
    status_updates: boolean;
    progress_reporting: boolean;
    issue_reporting: boolean;
    notification_management: boolean;
  };

  // Quality Control
  quality_oversight: {
    work_quality_review: boolean;
    checklist_validation: boolean;
    issue_identification: boolean;
    corrective_action_initiation: boolean;
    training_recommendation: boolean;
  };

  // Limited Administrative
  limited_admin: {
    team_member_guidance: boolean;
    procedure_clarification: boolean;
    resource_allocation_scoped: boolean;
    temporary_schedule_adjustments: boolean;
    local_policy_enforcement: boolean;
  };

  // Self-Service
  self_service: {
    profile_management: boolean;
    password_change: boolean;
    notification_preferences: boolean;
    dashboard_customization: boolean;
    schedule_view: boolean;
  };
}

export interface SupervisorRoleConstraints {
  // Scope Restrictions
  scope_restrictions: {
    tenant_isolation: boolean;
    team_based_access: boolean;
    location_based_access: boolean;
    project_based_access: boolean;
    assigned_scope_only: boolean;
    no_cross_team_access: boolean;
  };

  // Administrative Restrictions
  admin_restrictions: {
    no_tenant_settings: boolean;
    no_billing_access: boolean;
    no_role_management: boolean;
    no_user_creation: boolean;
    no_global_configurations: boolean;
    no_provider_portal: boolean;
    no_system_admin: boolean;
  };

  // Approval Requirements
  approval_requirements: {
    sensitive_actions_require_approval: boolean;
    out_of_scope_actions_blocked: boolean;
    owner_approval_for_exceptions: boolean;
    escalation_approval_required: boolean;
    budget_threshold_enforcement: boolean;
  };

  // Data Access Constraints
  data_access_constraints: {
    scoped_customer_data: boolean;
    scoped_financial_data: boolean;
    limited_historical_access: boolean;
    no_cross_tenant_data: boolean;
    sensitive_data_restrictions: boolean;
  };

  // Action Limits
  action_limits: {
    daily_action_quotas: boolean;
    bulk_operation_limits: boolean;
    schedule_change_limits: boolean;
    approval_count_limits: boolean;
    escalation_frequency_limits: boolean;
  };
}

// Supervisor Scope Configuration
export interface SupervisorScope {
  teams: string[];
  locations: string[];
  projects: string[];
  departments?: string[];
  serviceAreas?: string[];
  timeRestrictions?: {
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  };
  budgetLimits?: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

// Supervisor Permission Mappings
export const SUPERVISOR_PERMISSIONS = {
  // Team Operations
  'team:assign_tasks': 'Assign tasks to team members',
  'team:reassign_tasks': 'Reassign tasks between team members',
  'team:manage_schedule': 'Manage team schedules',
  'team:modify_schedule': 'Modify existing schedules',
  'team:approve_timesheet': 'Approve team member timesheets',
  'team:approve_worklog': 'Approve work logs and entries',
  'team:approve_completion': 'Approve job completion',
  'team:coordinate': 'Coordinate team activities',
  'team:adjust_priorities': 'Adjust task priorities',

  // Visibility Access
  'dashboard:team_performance': 'View team performance dashboard',
  'customer:read_scoped': 'View customer details within scope',
  'job:read_scoped': 'View job details within scope',
  'project:monitor_status': 'Monitor project status',
  'location:access_data': 'Access location-specific data',
  'metrics:team_assigned': 'View assigned team metrics',
  'analytics:workload': 'View workload distribution',
  'analytics:performance': 'View performance analytics',

  // Escalation Management
  'escalation:request_elevation': 'Request temporary elevation',
  'escalation:urgent_override': 'Override for urgent actions',
  'escalation:to_management': 'Escalate to management',
  'escalation:emergency_assign': 'Emergency task assignment',
  'escalation:priority': 'Escalate priority issues',
  'escalation:request_resources': 'Request additional resources',
  'escalation:support': 'Escalate to support',

  // Communication
  'communication:team_messaging': 'Send messages to team',
  'communication:customer_scoped': 'Communicate with scoped customers',
  'communication:status_updates': 'Send status updates',
  'communication:progress_reporting': 'Report progress',
  'communication:issue_reporting': 'Report issues',
  'communication:notifications': 'Manage notifications',

  // Quality Control
  'quality:review_work': 'Review work quality',
  'quality:validate_checklist': 'Validate checklists',
  'quality:identify_issues': 'Identify quality issues',
  'quality:initiate_corrective': 'Initiate corrective actions',
  'quality:recommend_training': 'Recommend training',

  // Limited Administrative
  'admin:guide_team': 'Guide team members',
  'admin:clarify_procedures': 'Clarify procedures',
  'admin:allocate_resources_scoped': 'Allocate resources within scope',
  'admin:adjust_schedule_temporary': 'Make temporary schedule adjustments',
  'admin:enforce_policy_local': 'Enforce local policies',

  // Self-Service
  'profile:read': 'View own profile',
  'profile:update': 'Update own profile',
  'notifications:manage': 'Manage notifications',
  'dashboard:customize': 'Customize dashboard',
  'schedule:view': 'View schedules'
};

// Default Supervisor Role Template
export const SUPERVISOR_ROLE_TEMPLATE: {
  capabilities: SupervisorRoleCapabilities;
  constraints: SupervisorRoleConstraints;
  permissions: string[];
  defaultScope: SupervisorScope;
} = {
  capabilities: {
    team_operations: {
      task_assignment: true,
      task_reassignment: true,
      schedule_management: true,
      schedule_modification: true,
      timesheet_approval: true,
      work_log_approval: true,
      job_completion_approval: true,
      team_coordination: true,
      priority_adjustments: true
    },
    visibility_access: {
      team_performance_dashboard: true,
      customer_details_scoped: true,
      job_details_scoped: true,
      project_status_monitoring: true,
      location_specific_data: true,
      assigned_team_metrics: true,
      workload_distribution: true,
      performance_analytics: true
    },
    escalation_management: {
      temporary_elevation_request: true,
      urgent_action_override: false, // Owner configurable
      escalation_to_management: true,
      emergency_task_assignment: true,
      priority_escalation: true,
      resource_request: true,
      support_escalation: true
    },
    communication: {
      team_messaging: true,
      customer_communication_scoped: true,
      status_updates: true,
      progress_reporting: true,
      issue_reporting: true,
      notification_management: true
    },
    quality_oversight: {
      work_quality_review: true,
      checklist_validation: true,
      issue_identification: true,
      corrective_action_initiation: true,
      training_recommendation: true
    },
    limited_admin: {
      team_member_guidance: true,
      procedure_clarification: true,
      resource_allocation_scoped: true,
      temporary_schedule_adjustments: true,
      local_policy_enforcement: true
    },
    self_service: {
      profile_management: true,
      password_change: true,
      notification_preferences: true,
      dashboard_customization: true,
      schedule_view: true
    }
  },
  constraints: {
    scope_restrictions: {
      tenant_isolation: true,
      team_based_access: true,
      location_based_access: true,
      project_based_access: true,
      assigned_scope_only: true,
      no_cross_team_access: true
    },
    admin_restrictions: {
      no_tenant_settings: true,
      no_billing_access: true,
      no_role_management: true,
      no_user_creation: true,
      no_global_configurations: true,
      no_provider_portal: true,
      no_system_admin: true
    },
    approval_requirements: {
      sensitive_actions_require_approval: true,
      out_of_scope_actions_blocked: true,
      owner_approval_for_exceptions: true,
      escalation_approval_required: true,
      budget_threshold_enforcement: true
    },
    data_access_constraints: {
      scoped_customer_data: true,
      scoped_financial_data: true,
      limited_historical_access: true,
      no_cross_tenant_data: true,
      sensitive_data_restrictions: true
    },
    action_limits: {
      daily_action_quotas: true,
      bulk_operation_limits: true,
      schedule_change_limits: true,
      approval_count_limits: true,
      escalation_frequency_limits: true
    }
  },
  permissions: [
    // Core Team Operations
    'team:assign_tasks',
    'team:reassign_tasks',
    'team:manage_schedule',
    'team:modify_schedule',
    'team:approve_timesheet',
    'team:approve_worklog',
    'team:approve_completion',
    'team:coordinate',
    'team:adjust_priorities',

    // Visibility and Monitoring
    'dashboard:team_performance',
    'customer:read_scoped',
    'job:read_scoped',
    'project:monitor_status',
    'location:access_data',
    'metrics:team_assigned',
    'analytics:workload',
    'analytics:performance',

    // Escalation Management
    'escalation:request_elevation',
    'escalation:to_management',
    'escalation:emergency_assign',
    'escalation:priority',
    'escalation:request_resources',
    'escalation:support',

    // Communication
    'communication:team_messaging',
    'communication:customer_scoped',
    'communication:status_updates',
    'communication:progress_reporting',
    'communication:issue_reporting',
    'communication:notifications',

    // Quality Control
    'quality:review_work',
    'quality:validate_checklist',
    'quality:identify_issues',
    'quality:initiate_corrective',
    'quality:recommend_training',

    // Limited Administrative
    'admin:guide_team',
    'admin:clarify_procedures',
    'admin:allocate_resources_scoped',
    'admin:adjust_schedule_temporary',
    'admin:enforce_policy_local',

    // Self-Service
    'profile:read',
    'profile:update',
    'notifications:manage',
    'dashboard:customize',
    'schedule:view'
  ],
  defaultScope: {
    teams: [], // Configured by Owner
    locations: [], // Configured by Owner
    projects: [], // Configured by Owner
    timeRestrictions: {
      startTime: '06:00',
      endTime: '22:00',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7] // All days by default
    },
    budgetLimits: {
      daily: 1000,
      weekly: 5000,
      monthly: 20000
    }
  }
};

// Supervisor Role Variants
export const SUPERVISOR_ROLE_VARIANTS = {
  'Site Supervisor': {
    ...SUPERVISOR_ROLE_TEMPLATE,
    capabilities: {
      ...SUPERVISOR_ROLE_TEMPLATE.capabilities,
      escalation_management: {
        ...SUPERVISOR_ROLE_TEMPLATE.capabilities.escalation_management,
        urgent_action_override: true
      }
    },
    defaultScope: {
      ...SUPERVISOR_ROLE_TEMPLATE.defaultScope,
      timeRestrictions: {
        startTime: '05:00',
        endTime: '23:00',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7]
      }
    },
    permissions: [
      ...SUPERVISOR_ROLE_TEMPLATE.permissions,
      'escalation:urgent_override',
      'site:emergency_access',
      'equipment:basic_management'
    ]
  },

  'Team Lead': {
    ...SUPERVISOR_ROLE_TEMPLATE,
    capabilities: {
      ...SUPERVISOR_ROLE_TEMPLATE.capabilities,
      team_operations: {
        ...SUPERVISOR_ROLE_TEMPLATE.capabilities.team_operations,
        priority_adjustments: true
      },
      quality_oversight: {
        ...SUPERVISOR_ROLE_TEMPLATE.capabilities.quality_oversight,
        training_recommendation: true,
        corrective_action_initiation: true
      }
    },
    permissions: [
      ...SUPERVISOR_ROLE_TEMPLATE.permissions,
      'training:assign',
      'performance:evaluate',
      'mentoring:provide'
    ]
  },

  'Shift Supervisor': {
    ...SUPERVISOR_ROLE_TEMPLATE,
    defaultScope: {
      ...SUPERVISOR_ROLE_TEMPLATE.defaultScope,
      timeRestrictions: {
        startTime: '00:00',
        endTime: '23:59',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7] // 24/7 access
      }
    },
    permissions: [
      ...SUPERVISOR_ROLE_TEMPLATE.permissions,
      'shift:handover',
      'emergency:response',
      'security:basic_access'
    ]
  }
};

// Industry-Specific Supervisor Configurations
export const SUPERVISOR_INDUSTRY_CONFIGS = {
  'Cleaning & Janitorial': {
    ...SUPERVISOR_ROLE_TEMPLATE,
    permissions: [
      ...SUPERVISOR_ROLE_TEMPLATE.permissions,
      'equipment:cleaning_management',
      'supplies:inventory_basic',
      'client_site:access_management',
      'safety:compliance_check'
    ]
  },

  'Healthcare': {
    ...SUPERVISOR_ROLE_TEMPLATE,
    capabilities: {
      ...SUPERVISOR_ROLE_TEMPLATE.capabilities,
      quality_oversight: {
        ...SUPERVISOR_ROLE_TEMPLATE.capabilities.quality_oversight,
        work_quality_review: true,
        checklist_validation: true
      }
    },
    permissions: [
      ...SUPERVISOR_ROLE_TEMPLATE.permissions,
      'patient_care:quality_review',
      'compliance:hipaa_basic',
      'safety:patient_safety',
      'documentation:care_plans'
    ]
  },

  'Manufacturing': {
    ...SUPERVISOR_ROLE_TEMPLATE,
    permissions: [
      ...SUPERVISOR_ROLE_TEMPLATE.permissions,
      'production:line_supervision',
      'quality:production_check',
      'safety:manufacturing_compliance',
      'equipment:operational_check'
    ]
  }
};

// Supervisor Scope Management
export class SupervisorScopeManager {
  private orgId: string;
  private supervisorId: string;
  private auditSystem: any;

  constructor(orgId: string, supervisorId: string) {
    this.orgId = orgId;
    this.supervisorId = supervisorId;
    this.auditSystem = createStaffAuditSystem(orgId, supervisorId, 'supervisor_session');
  }

  async validateScope(
    resource: string,
    action: string,
    scope: SupervisorScope
  ): Promise<boolean> {
    try {
      // Extract resource identifiers
      const resourceParts = resource.split(':');
      const resourceType = resourceParts[0];
      const resourceId = resourceParts[2];

      // Check team scope
      if (resourceType.includes('team') || resourceType.includes('member')) {
        if (!scope.teams.includes(resourceId)) {
          await this.logScopeViolation('team_scope', resource, action);
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

      // Check project scope
      if (resourceType.includes('project') || resourceType.includes('job')) {
        if (!scope.projects.includes(resourceId)) {
          await this.logScopeViolation('project_scope', resource, action);
          return false;
        }
      }

      // Check time restrictions
      if (scope.timeRestrictions && !this.isWithinTimeRestrictions(scope.timeRestrictions)) {
        await this.logScopeViolation('time_restriction', resource, action);
        return false;
      }

      return true;

    } catch (error) {
      await this.logScopeViolation('scope_validation_error', resource, action, error);
      return false;
    }
  }

  private isWithinTimeRestrictions(restrictions: SupervisorScope['timeRestrictions']): boolean {
    if (!restrictions) return true;

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    // Check day of week
    if (!restrictions.daysOfWeek.includes(currentDay)) {
      return false;
    }

    // Check time range
    if (currentTime < restrictions.startTime || currentTime > restrictions.endTime) {
      return false;
    }

    return true;
  }

  private async logScopeViolation(
    violationType: string,
    resource: string,
    action: string,
    error?: any
  ): Promise<void> {
    await this.auditSystem.logActivity({
      action: 'supervisor_scope_violation',
      target: 'scoped_resource',
      targetId: resource,
      category: 'SECURITY',
      severity: 'HIGH',
      details: {
        violationType,
        resource,
        action,
        supervisorId: this.supervisorId,
        error: error?.message
      },
      context: {
        ipAddress: 'system',
        userAgent: 'supervisor_scope_manager',
        sessionId: 'scope_validation'
      }
    });
  }
}

// Utility Functions
export function createSupervisorScopeManager(
  orgId: string,
  supervisorId: string
): SupervisorScopeManager {
  return new SupervisorScopeManager(orgId, supervisorId);
}

export function validateSupervisorAccess(
  userId: string,
  orgId: string,
  resource: string,
  action: string,
  scope: SupervisorScope
): Promise<boolean> {
  const scopeManager = createSupervisorScopeManager(orgId, userId);
  return scopeManager.validateScope(resource, action, scope);
}

// Types already exported with interfaces above