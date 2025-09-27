// src/lib/roles/staff-role-template.ts
// Comprehensive Staff Role Implementation for Robinson Solutions B2B SaaS Platform

import { prisma as db } from "../prisma";

export interface StaffRoleCapabilities {
  coreOperations: {
    taskManagement: boolean;
    scheduleManagement: boolean;
    jobAssignments: boolean;
    customerInteraction: boolean;
    statusUpdates: boolean;
    dataEntry: boolean;
    readOnlyDashboards: boolean;
  };
  customerAccess: {
    contactInfo: 'none' | 'assigned' | 'department' | 'full';
    communicationHistory: 'none' | 'assigned' | 'department' | 'full';
    workLogs: boolean;
    followUps: boolean;
  };
  settingsAccess: {
    ownProfile: boolean;
    password: boolean;
    twoFactor: boolean;
    preferences: boolean;
    roleRequests: boolean;
  };
  featureUsage: {
    aiAssistants: boolean;
    analyticsAccess: 'none' | 'personal' | 'team' | 'department';
    moduleAccess: string[];
    reportGeneration: boolean;
  };
}

export interface StaffRoleConstraints {
  dataVisibility: {
    byDepartment: boolean;
    byTerritory: boolean;
    byProject: boolean;
    assignedOnly: boolean;
  };
  sensitiveActions: {
    requireApproval: string[];
    blockedActions: string[];
  };
  timeRestrictions: {
    businessHoursOnly: boolean;
    specificSchedule?: {
      startTime: string;
      endTime: string;
      daysOfWeek: number[];
    };
  };
  temporaryElevation: {
    enabled: boolean;
    maxDuration: number; // minutes
    autoExpiry: boolean;
    auditRequired: boolean;
    approvalRequired: boolean;
  };
}

export const STAFF_ROLE_TEMPLATE = {
  name: "Staff",
  description: "Enable regular employees to perform their job functions — no more, no less — with flexibility controlled by the Owner",
  category: "Core Business Roles",
  complexity: "INTERMEDIATE" as const,
  
  // Base permissions for Staff role
  basePermissions: [
    // Core Operations
    "task:read", "task:update", "task:complete",
    "schedule:read", "schedule:view_assigned",
    "job:read", "job:update_assigned", "job:complete",
    "customer:read_assigned", "customer:update_assigned",
    
    // Data Management
    "data:create_notes", "data:update_assigned", "data:upload_media",
    "worklog:create", "worklog:read_own", "worklog:submit",
    
    // Communication
    "communication:read_assigned", "communication:create_followup",
    "notification:receive", "message:read", "message:send_assigned",
    
    // Self-Management
    "profile:read_own", "profile:update_own",
    "password:change_own", "2fa:manage_own", "preferences:update_own",
    
    // Feature Usage
    "dashboard:view_personal", "report:view_assigned",
    "training:access", "help:access"
  ],

  // Expandable permissions (Owner can add these)
  expandablePermissions: [
    "customer:read_department", "customer:read_all",
    "task:create", "task:assign_others",
    "schedule:create_requests", "schedule:view_team",
    "report:generate_personal", "report:export_assigned",
    "ai:assistant_basic", "ai:assistant_advanced",
    "analytics:view_personal", "analytics:view_team"
  ],

  // Constraints and safeguards
  defaultConstraints: {
    dataVisibility: {
      byDepartment: true,
      byTerritory: false,
      byProject: true,
      assignedOnly: true
    },
    sensitiveActions: {
      requireApproval: [
        "customer:delete", "task:delete", "job:cancel",
        "data:bulk_export", "schedule:override"
      ],
      blockedActions: [
        "user:create", "user:delete", "user:modify_roles",
        "billing:access", "admin:access", "system:configure",
        "org:settings", "integration:manage"
      ]
    },
    timeRestrictions: {
      businessHoursOnly: false,
      specificSchedule: undefined
    },
    temporaryElevation: {
      enabled: true,
      maxDuration: 60, // 1 hour max
      autoExpiry: true,
      auditRequired: true,
      approvalRequired: true
    }
  },

  // Role customization options for Owner
  customizationOptions: {
    capabilities: {
      coreOperations: {
        expandable: true,
        restrictable: true,
        description: "Control access to task management, scheduling, and core job functions"
      },
      customerAccess: {
        expandable: true,
        restrictable: true,
        levels: ['none', 'assigned', 'department', 'full'],
        description: "Define customer data visibility and interaction rights"
      },
      featureUsage: {
        expandable: true,
        restrictable: true,
        description: "Enable or disable AI assistants, analytics, and advanced features"
      }
    },
    constraints: {
      dataScoping: {
        configurable: true,
        options: ['department', 'territory', 'project', 'assigned_only'],
        description: "Limit data visibility to specific organizational boundaries"
      },
      timeRestrictions: {
        configurable: true,
        description: "Set working hours, day restrictions, or location-based access"
      },
      approvalWorkflows: {
        configurable: true,
        description: "Define which actions require supervisor approval"
      }
    }
  },

  // Audit and monitoring configuration
  auditConfig: {
    logLevel: 'detailed' as const,
    trackActions: [
      'data:read', 'data:create', 'data:update', 'data:delete',
      'customer:access', 'task:complete', 'schedule:view',
      'elevation:request', 'elevation:granted', 'elevation:expired'
    ],
    reviewSchedule: {
      periodic: true,
      intervalDays: 90,
      autoNotify: true
    },
    incidentHandling: {
      unauthorizedAccess: 'log_and_alert',
      dataExport: 'require_approval',
      sensitiveAction: 'immediate_review'
    }
  },

  // Provisioning workflow configuration
  provisioningConfig: {
    assignment: {
      method: 'owner_assigned',
      bulkOperations: true,
      templateDerivation: true
    },
    onboarding: {
      orientationRequired: true,
      permissionPreview: true,
      trainingModules: [
        'platform_basics', 'role_boundaries', 'data_security',
        'escalation_procedures'
      ]
    },
    offboarding: {
      immediateSessionTermination: true,
      dataRetention: 'as_per_policy',
      accessRevocation: 'real_time',
      exitInterview: 'recommended'
    }
  }
};

// Staff role variants that can be cloned/derived
export const STAFF_ROLE_VARIANTS = {
  supervisor: {
    name: "Supervisor",
    description: "Staff role with additional team oversight capabilities",
    additionalPermissions: [
      "task:assign_team", "schedule:manage_team", "report:view_team",
      "user:view_team", "performance:review_team"
    ],
    expandedConstraints: {
      dataVisibility: { byDepartment: true, assignedOnly: false },
      temporaryElevation: { maxDuration: 120 } // 2 hours
    }
  },
  
  technician: {
    name: "Field Technician", 
    description: "Staff role optimized for field work and mobile access",
    additionalPermissions: [
      "location:checkin", "equipment:status_update", "photo:capture",
      "gps:tracking", "offline:sync"
    ],
    mobileOptimized: true,
    offlineCapabilities: true
  },

  specialist: {
    name: "Specialist",
    description: "Staff role with domain-specific expertise and expanded access",
    additionalPermissions: [
      "consultation:provide", "training:deliver", "documentation:create",
      "quality:inspect", "compliance:verify"
    ],
    expandedConstraints: {
      featureUsage: { aiAssistants: true, analyticsAccess: 'department' }
    }
  }
};

// Role builder integration functions
export async function createStaffRole(orgId: string, customizations: Partial<StaffRoleCapabilities & StaffRoleConstraints> = {}) {
  const template = { ...STAFF_ROLE_TEMPLATE };
  
  // Apply customizations
  if (customizations) {
    // Merge permissions based on capabilities
    const permissions = [...template.basePermissions];
    
    // Add expandable permissions based on customizations
    if (customizations.customerAccess?.contactInfo === 'department') {
      permissions.push("customer:read_department");
    }
    if (customizations.featureUsage?.aiAssistants) {
      permissions.push("ai:assistant_basic");
    }
    // ... additional customization logic
    
    template.basePermissions = permissions;
  }

  return template;
}

export async function cloneStaffVariant(
  orgId: string, 
  variant: keyof typeof STAFF_ROLE_VARIANTS,
  customizations: any = {}
) {
  const baseTemplate = STAFF_ROLE_TEMPLATE;
  const variantConfig = STAFF_ROLE_VARIANTS[variant];
  
  const clonedRole = {
    ...baseTemplate,
    name: variantConfig.name,
    description: variantConfig.description,
    basePermissions: [
      ...baseTemplate.basePermissions,
      ...(variantConfig.additionalPermissions || [])
    ],
    defaultConstraints: {
      ...baseTemplate.defaultConstraints,
      ...('expandedConstraints' in variantConfig ? variantConfig.expandedConstraints : {})
    },
    ...('mobileOptimized' in variantConfig && variantConfig.mobileOptimized ? { mobileOptimized: true } : {}),
    ...('offlineCapabilities' in variantConfig && variantConfig.offlineCapabilities ? { offlineCapabilities: true } : {})
  };

  return clonedRole;
}

// Temporary elevation functions
export async function requestTemporaryElevation(
  userId: string,
  orgId: string,
  targetRole: string,
  currentRole: string,
  reason: string,
  durationMinutes: number = 60
) {
  const elevationRequest = await db.temporaryElevation.create({
    data: {
      userId,
      orgId,
      requestedBy: userId,
      currentRole,
      targetRole,
      reason,
      requestedDuration: durationMinutes,
      status: 'PENDING',
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000)
    }
  });

  // Trigger approval workflow
  await triggerElevationApproval(elevationRequest.id);
  
  return elevationRequest;
}

async function triggerElevationApproval(elevationId: string) {
  // Implementation for approval workflow
  // This would integrate with your notification system
  console.log(`Elevation request ${elevationId} requires approval`);
}

// Types and constants already exported above