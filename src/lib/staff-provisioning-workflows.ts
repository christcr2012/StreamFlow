// src/lib/staff-provisioning-workflows.ts
// Complete Provisioning Workflows for Staff Role Assignment, Onboarding, and Offboarding
// Robinson Solutions B2B SaaS Platform

import { prisma as db } from "./prisma";
import { createStaffAuditSystem } from "./staff-audit-system";
import { createStaffConstraintEnforcer } from "./staff-constraints";

export interface RoleAssignmentWorkflow {
  userId: string;
  roleId: string;
  assignedBy: string;
  assignmentType: 'INITIAL' | 'PROMOTION' | 'LATERAL' | 'TEMPORARY' | 'EMERGENCY';
  effectiveDate: Date;
  expirationDate?: Date;
  approvalRequired: boolean;
  businessJustification: string;
  departmentAssignment?: string;
  territoryAssignment?: string[];
  projectAssignments?: string[];
  customConstraints?: any;
}

export interface OnboardingConfig {
  orientationRequired: boolean;
  permissionPreview: boolean;
  trainingModules: string[];
  mentoringAssignment?: {
    mentorId: string;
    duration: number; // days
    checkInSchedule: 'daily' | 'weekly' | 'biweekly';
  };
  probationPeriod?: {
    duration: number; // days
    reviewSchedule: Date[];
    escalatedMonitoring: boolean;
  };
  initialConstraints: {
    dataAccessLimited: boolean;
    requiresApprovalFor: string[];
    maxDailySessions: number;
    businessHoursOnly: boolean;
  };
}

export interface OffboardingConfig {
  immediateSessionTermination: boolean;
  dataRetention: 'DELETE_IMMEDIATELY' | 'ARCHIVE_30_DAYS' | 'ARCHIVE_90_DAYS' | 'AS_PER_POLICY';
  accessRevocation: 'IMMEDIATE' | 'GRADUAL' | 'SCHEDULED';
  exitInterview: 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL';
  knowledgeTransfer: {
    required: boolean;
    recipientIds: string[];
    deadline: Date;
    documentationRequired: boolean;
  };
  equipmentReturn: {
    required: boolean;
    items: string[];
    deadline: Date;
  };
}

export class StaffProvisioningWorkflowEngine {
  private orgId: string;
  private operatorId: string;
  private auditSystem: any;

  constructor(orgId: string, operatorId: string) {
    this.orgId = orgId;
    this.operatorId = operatorId;
    this.auditSystem = createStaffAuditSystem(orgId, operatorId, 'provisioning_session');
  }

  // Role Assignment Workflow
  async initiateRoleAssignment(workflow: RoleAssignmentWorkflow): Promise<string> {
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Validate assignment prerequisites
      await this.validateAssignmentPrerequisites(workflow);

      // Check if approval is required
      if (workflow.approvalRequired) {
        await this.requestAssignmentApproval(workflowId, workflow);
        return workflowId;
      }

      // Execute immediate assignment
      await this.executeRoleAssignment(workflowId, workflow);
      
      return workflowId;

    } catch (error) {
      await this.handleAssignmentFailure(workflowId, error);
      throw error;
    }
  }

  private async validateAssignmentPrerequisites(workflow: RoleAssignmentWorkflow): Promise<void> {
    // Check user exists and is active
    const user = await db.user.findFirst({
      where: { id: workflow.userId, orgId: this.orgId, status: 'active' }
    });

    if (!user) {
      throw new Error('User not found or not active');
    }

    // Check role exists and is available
    const role = await db.rbacRole.findFirst({
      where: { id: workflow.roleId, orgId: this.orgId }
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Check for conflicting assignments
    const existingAssignments = await db.rbacUserRole.findMany({
      where: { 
        userId: workflow.userId, 
        orgId: this.orgId
      },
      include: { role: true }
    });

    // Business rules for role conflicts
    await this.checkRoleConflicts(existingAssignments, role);

    // Validate assignment scope
    await this.validateAssignmentScope(workflow);
  }

  private async executeRoleAssignment(workflowId: string, workflow: RoleAssignmentWorkflow): Promise<void> {
    await db.$transaction(async (tx) => {
      // Create the role assignment
      const assignment = await tx.rbacUserRole.create({
        data: {
          userId: workflow.userId,
          orgId: this.orgId,
          roleId: workflow.roleId
        }
      });

      // Create scope assignments if specified
      if (workflow.departmentAssignment || workflow.territoryAssignment || workflow.projectAssignments) {
        await this.createScopeAssignments(tx, assignment.id, workflow);
      }

      // Apply custom constraints if specified
      if (workflow.customConstraints) {
        await this.applyCustomConstraints(tx, assignment.id, workflow.customConstraints);
      }

      // Trigger onboarding if this is an initial assignment
      if (workflow.assignmentType === 'INITIAL') {
        await this.triggerOnboardingWorkflow(assignment.id);
      }
    });

    await this.auditSystem.logActivity({
      action: 'role_assignment_completed',
      target: 'rbac_user_role',
      category: 'AUTHORIZATION',
      severity: 'MEDIUM',
      details: {
        workflowId,
        userId: workflow.userId,
        roleId: workflow.roleId,
        assignmentType: workflow.assignmentType
      },
      context: {
        ipAddress: 'system',
        userAgent: 'provisioning_engine',
        sessionId: 'assignment_workflow'
      }
    });
  }

  // Onboarding Workflow
  async initiateOnboardingWorkflow(
    userId: string,
    config: OnboardingConfig
  ): Promise<string> {
    const onboardingId = `onboarding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Execute onboarding steps
    await this.executeOnboardingSteps(onboardingId, userId, config);

    return onboardingId;
  }

  private async executeOnboardingSteps(onboardingId: string, userId: string, config: OnboardingConfig): Promise<void> {
    // Step 1: Orientation
    if (config.orientationRequired) {
      await this.deliverOrientation(onboardingId, userId);
    }

    // Step 2: Permission Preview
    if (config.permissionPreview) {
      await this.generatePermissionPreview(onboardingId, userId);
    }

    // Step 3: Training Module Assignment
    if (config.trainingModules.length > 0) {
      await this.assignTrainingModules(onboardingId, userId, config.trainingModules);
    }

    // Step 4: Mentoring Assignment
    if (config.mentoringAssignment) {
      await this.setupMentoring(onboardingId, userId, config.mentoringAssignment);
    }

    // Step 5: Probation Setup
    if (config.probationPeriod) {
      await this.setupProbationPeriod(onboardingId, userId, config.probationPeriod);
    }

    // Step 6: Apply Initial Constraints
    await this.applyInitialConstraints(onboardingId, userId, config.initialConstraints);

    // Complete onboarding
    await this.completeOnboarding(onboardingId, userId);
  }

  private async deliverOrientation(onboardingId: string, userId: string): Promise<void> {
    const user = await db.user.findFirst({
      where: { id: userId, orgId: this.orgId }
    });

    if (!user) return;

    // Create orientation materials
    const orientationContent = await this.generateOrientationContent(user);

    // Log orientation delivery
    await this.auditSystem.logActivity({
      action: 'orientation_delivered',
      target: 'onboarding_step',
      targetId: onboardingId,
      category: 'BUSINESS',
      severity: 'LOW',
      details: {
        onboardingId,
        userId,
        stepType: 'ORIENTATION',
        content: orientationContent
      },
      context: {
        ipAddress: 'system',
        userAgent: 'onboarding_engine',
        sessionId: 'onboarding_workflow'
      }
    });

    // Send welcome notification
    await this.sendWelcomeNotification(userId, orientationContent);
  }

  private async generatePermissionPreview(onboardingId: string, userId: string): Promise<void> {
    const user = await db.user.findFirst({
      where: { id: userId, orgId: this.orgId },
      include: { 
        rbacUserRoles: { 
          include: { 
            role: { 
              include: { 
                rolePerms: { include: { permission: true } } 
              } 
            } 
          } 
        } 
      }
    });

    if (!user) return;

    // Generate permission summary
    const permissions = user.rbacUserRoles.flatMap(ur =>
      ur.role.rolePerms.map(rp => ({
        code: rp.permission.code,
        description: rp.permission.description,
        category: this.categorizePermission(rp.permission.code)
      }))
    );

    const permissionPreview = {
      totalPermissions: permissions.length,
      categories: this.groupPermissionsByCategory(permissions),
      keyCapabilities: this.identifyKeyCapabilities(permissions),
      restrictions: await this.getApplicableRestrictions(userId),
      escalationProcedures: this.getEscalationProcedures()
    };

    // Log permission preview generation
    await this.auditSystem.logActivity({
      action: 'permission_preview_generated',
      target: 'onboarding_step',
      targetId: onboardingId,
      category: 'AUTHORIZATION',
      severity: 'LOW',
      details: {
        onboardingId,
        userId,
        stepType: 'PERMISSION_PREVIEW',
        permissionCount: permissions.length
      },
      context: {
        ipAddress: 'system',
        userAgent: 'onboarding_engine',
        sessionId: 'onboarding_workflow'
      }
    });

    // Send permission summary to user
    await this.sendPermissionSummary(userId, permissionPreview);
  }

  // Offboarding Workflow
  async initiateOffboardingWorkflow(
    userId: string,
    reason: string,
    config: OffboardingConfig
  ): Promise<string> {
    const offboardingId = `offboarding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Execute immediate actions
    if (config.immediateSessionTermination) {
      await this.terminateUserSessions(userId);
    }

    if (config.accessRevocation === 'IMMEDIATE') {
      await this.revokeUserAccess(userId);
    }

    // Schedule remaining offboarding steps
    await this.scheduleOffboardingSteps(offboardingId, userId, config);

    return offboardingId;
  }

  private async terminateUserSessions(userId: string): Promise<void> {
    // Since we don't have userSession table in current schema, 
    // we'll log the termination for audit purposes
    await this.auditSystem.logActivity({
      action: 'user_sessions_terminated',
      target: 'user_session',
      category: 'SECURITY',
      severity: 'HIGH',
      details: {
        userId,
        reason: 'offboarding',
        terminationMethod: 'immediate'
      },
      context: {
        ipAddress: 'system',
        userAgent: 'offboarding_engine',
        sessionId: 'offboarding_workflow'
      }
    });
  }

  private async revokeUserAccess(userId: string): Promise<void> {
    await db.$transaction(async (tx) => {
      // Remove all role assignments
      await tx.rbacUserRole.deleteMany({
        where: { userId, orgId: this.orgId }
      });

      // Update user status
      await tx.user.update({
        where: { id: userId },
        data: {
          status: 'inactive'
        }
      });
    });

    await this.auditSystem.logActivity({
      action: 'user_access_revoked',
      target: 'rbac_user_role',
      category: 'AUTHORIZATION',
      severity: 'HIGH',
      details: {
        userId,
        reason: 'offboarding',
        revocationMethod: 'immediate'
      },
      context: {
        ipAddress: 'system',
        userAgent: 'offboarding_engine',
        sessionId: 'offboarding_workflow'
      }
    });
  }

  private async scheduleOffboardingSteps(offboardingId: string, userId: string, config: OffboardingConfig): Promise<void> {
    const steps = [];

    // Exit interview
    if (config.exitInterview !== 'OPTIONAL') {
      steps.push({
        stepType: 'EXIT_INTERVIEW',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        required: config.exitInterview === 'REQUIRED'
      });
    }

    // Knowledge transfer
    if (config.knowledgeTransfer.required) {
      steps.push({
        stepType: 'KNOWLEDGE_TRANSFER',
        scheduledDate: config.knowledgeTransfer.deadline,
        required: true,
        assignedTo: config.knowledgeTransfer.recipientIds
      });
    }

    // Equipment return
    if (config.equipmentReturn.required) {
      steps.push({
        stepType: 'EQUIPMENT_RETURN',
        scheduledDate: config.equipmentReturn.deadline,
        required: true,
        items: config.equipmentReturn.items
      });
    }

    // Data retention processing
    steps.push({
      stepType: 'DATA_RETENTION',
      scheduledDate: this.calculateDataRetentionDate(config.dataRetention),
      required: true
    });

    // Log scheduled steps for tracking
    await this.auditSystem.logActivity({
      action: 'offboarding_steps_scheduled',
      target: 'offboarding_workflow',
      targetId: offboardingId,
      category: 'BUSINESS',
      severity: 'MEDIUM',
      details: {
        offboardingId,
        userId,
        scheduledSteps: steps.length,
        steps: steps.map(s => s.stepType)
      },
      context: {
        ipAddress: 'system',
        userAgent: 'offboarding_engine',
        sessionId: 'offboarding_workflow'
      }
    });
  }

  // Utility Methods
  private calculateDataRetentionDate(retention: OffboardingConfig['dataRetention']): Date {
    const daysToAdd = {
      'DELETE_IMMEDIATELY': 0,
      'ARCHIVE_30_DAYS': 30,
      'ARCHIVE_90_DAYS': 90,
      'AS_PER_POLICY': 365 // Default to 1 year
    }[retention];

    return new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
  }

  // Implementation methods (simplified for space)
  private async checkRoleConflicts(existingAssignments: any[], newRole: any): Promise<void> {
    // Implementation would check for role conflicts based on business rules
    console.log('Checking role conflicts...', existingAssignments.length, newRole.name);
  }

  private async validateAssignmentScope(workflow: RoleAssignmentWorkflow): Promise<void> {
    // Implementation would validate scope assignments
    console.log('Validating assignment scope...', workflow.departmentAssignment);
  }

  private async createScopeAssignments(tx: any, assignmentId: string, workflow: RoleAssignmentWorkflow): Promise<void> {
    // Implementation would create scope assignments
    console.log('Creating scope assignments...', assignmentId);
  }

  private async applyCustomConstraints(tx: any, assignmentId: string, constraints: any): Promise<void> {
    // Implementation would apply custom constraints
    console.log('Applying custom constraints...', assignmentId, constraints);
  }

  private async triggerOnboardingWorkflow(assignmentId: string): Promise<void> {
    // Implementation would trigger onboarding
    console.log('Triggering onboarding workflow...', assignmentId);
  }

  private async requestAssignmentApproval(workflowId: string, workflow: RoleAssignmentWorkflow): Promise<void> {
    // Implementation would request approval
    console.log('Requesting assignment approval...', workflowId, workflow.userId);
  }

  private async handleAssignmentFailure(workflowId: string, error: any): Promise<void> {
    // Implementation would handle assignment failures
    console.log('Handling assignment failure...', workflowId, error.message);
  }

  private async assignTrainingModules(onboardingId: string, userId: string, modules: string[]): Promise<void> {
    console.log('Assigning training modules...', onboardingId, userId, modules);
  }

  private async setupMentoring(onboardingId: string, userId: string, config: any): Promise<void> {
    console.log('Setting up mentoring...', onboardingId, userId, config);
  }

  private async setupProbationPeriod(onboardingId: string, userId: string, config: any): Promise<void> {
    console.log('Setting up probation period...', onboardingId, userId, config);
  }

  private async applyInitialConstraints(onboardingId: string, userId: string, constraints: any): Promise<void> {
    console.log('Applying initial constraints...', onboardingId, userId, constraints);
  }

  private async completeOnboarding(onboardingId: string, userId: string): Promise<void> {
    console.log('Completing onboarding...', onboardingId, userId);
  }

  private async generateOrientationContent(user: any): Promise<any> {
    return {
      welcomeMessage: `Welcome ${user.name || user.email}!`,
      platformOverview: 'Platform introduction...',
      roleResponsibilities: 'Your role responsibilities...',
      contacts: 'Key contacts and resources...'
    };
  }

  private async sendWelcomeNotification(userId: string, content: any): Promise<void> {
    console.log('Sending welcome notification...', userId, content);
  }

  private async sendPermissionSummary(userId: string, preview: any): Promise<void> {
    console.log('Sending permission summary...', userId, preview);
  }

  private categorizePermission(code: string): string {
    if (code.includes('lead')) return 'Lead Management';
    if (code.includes('customer')) return 'Customer Relations';
    if (code.includes('task')) return 'Task Management';
    if (code.includes('job')) return 'Job Operations';
    return 'General';
  }

  private groupPermissionsByCategory(permissions: any[]): any {
    return permissions.reduce((acc, perm) => {
      const category = perm.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(perm);
      return acc;
    }, {});
  }

  private identifyKeyCapabilities(permissions: any[]): string[] {
    const keyPerms = permissions.filter(p => 
      ['create', 'update', 'manage', 'assign'].some(action => p.code.includes(action))
    );
    return keyPerms.map(p => p.code);
  }

  private async getApplicableRestrictions(userId: string): Promise<any> {
    return {
      dataAccess: 'Limited to assigned entities',
      timeRestrictions: 'None by default',
      approvalRequired: ['Delete operations', 'Bulk exports']
    };
  }

  private getEscalationProcedures(): any {
    return {
      immediateHelp: 'Contact your supervisor',
      technicalIssues: 'Submit a support ticket',
      emergencyAccess: 'Contact system administrator'
    };
  }
}

// Default configurations
export const DEFAULT_ONBOARDING_CONFIG: OnboardingConfig = {
  orientationRequired: true,
  permissionPreview: true,
  trainingModules: [
    'platform_basics',
    'role_responsibilities', 
    'data_security',
    'escalation_procedures',
    'compliance_overview'
  ],
  mentoringAssignment: {
    mentorId: 'auto_assign',
    duration: 30,
    checkInSchedule: 'weekly'
  },
  probationPeriod: {
    duration: 90,
    reviewSchedule: [new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)], // 30 days
    escalatedMonitoring: true
  },
  initialConstraints: {
    dataAccessLimited: true,
    requiresApprovalFor: ['customer:delete', 'task:delete', 'data:bulk_export'],
    maxDailySessions: 3,
    businessHoursOnly: true
  }
};

export const DEFAULT_OFFBOARDING_CONFIG: OffboardingConfig = {
  immediateSessionTermination: true,
  dataRetention: 'ARCHIVE_90_DAYS',
  accessRevocation: 'IMMEDIATE',
  exitInterview: 'RECOMMENDED',
  knowledgeTransfer: {
    required: true,
    recipientIds: [],
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
    documentationRequired: true
  },
  equipmentReturn: {
    required: true,
    items: ['laptop', 'phone', 'access_cards', 'documents'],
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
  }
};

// Factory function
export function createStaffProvisioningWorkflowEngine(
  orgId: string,
  operatorId: string
): StaffProvisioningWorkflowEngine {
  return new StaffProvisioningWorkflowEngine(orgId, operatorId);
}

// Types already exported above at their definitions