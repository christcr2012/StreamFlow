// src/lib/staff-constraints.ts
// Enterprise-grade Constraints and Safeguards for Staff Role
// Robinson Solutions B2B SaaS Platform

import { prisma as db } from "./prisma";
import { auditAction } from "./audit";

export interface DataVisibilityConstraints {
  byDepartment: boolean;
  byTerritory: boolean;
  byProject: boolean;
  assignedOnly: boolean;
  timeRestricted?: {
    businessHoursOnly: boolean;
    customSchedule?: {
      startTime: string;
      endTime: string;
      daysOfWeek: number[];
      timeZone: string;
    };
  };
}

export interface SensitiveActionConstraints {
  requireApproval: string[];
  blockedActions: string[];
  approvalWorkflow: {
    approverRoles: string[];
    requireReason: boolean;
    timeoutMinutes: number;
    escalationRules: {
      level: number;
      afterMinutes: number;
      toRoles: string[];
    }[];
  };
}

export interface SecuritySafeguards {
  maxConcurrentSessions: number;
  ipRestrictions: string[];
  deviceTracking: boolean;
  anomalyDetection: {
    enabled: boolean;
    thresholds: {
      unusualDataAccess: number;
      rapidActions: number;
      offHoursActivity: number;
    };
  };
  autoLockout: {
    enabled: boolean;
    maxFailedAttempts: number;
    lockoutDurationMinutes: number;
  };
}

export class StaffConstraintEnforcer {
  private orgId: string;
  private userId: string;
  private userRoles: string[];

  constructor(orgId: string, userId: string, userRoles: string[] = []) {
    this.orgId = orgId;
    this.userId = userId;
    this.userRoles = userRoles;
  }

  // Data Visibility Enforcement
  async enforceDataVisibility(
    query: any,
    entityType: string,
    action: string,
    constraints: DataVisibilityConstraints
  ): Promise<any> {
    let modifiedQuery = { ...query };

    // Always enforce organization boundary
    modifiedQuery.orgId = this.orgId;

    try {
      // Apply assigned-only constraints
      if (constraints.assignedOnly) {
        modifiedQuery = await this.applyAssignmentConstraints(modifiedQuery, entityType);
      }

      // Apply department-based constraints
      if (constraints.byDepartment) {
        modifiedQuery = await this.applyDepartmentConstraints(modifiedQuery);
      }

      // Apply territory-based constraints
      if (constraints.byTerritory) {
        modifiedQuery = await this.applyTerritoryConstraints(modifiedQuery);
      }

      // Apply project-based constraints
      if (constraints.byProject) {
        modifiedQuery = await this.applyProjectConstraints(modifiedQuery);
      }

      // Apply time-based constraints
      if (constraints.timeRestricted) {
        await this.enforceTimeRestrictions(constraints.timeRestricted, action);
      }

      // Log data access for audit
      await this.logDataAccess(entityType, action, modifiedQuery);

      return modifiedQuery;

    } catch (error) {
      await this.handleConstraintViolation('data_visibility', error, {
        entityType,
        action,
        originalQuery: query,
        constraints
      });
      throw error;
    }
  }

  private async applyAssignmentConstraints(query: any, entityType: string): Promise<any> {
    const assignmentFields = this.getAssignmentFields(entityType);
    
    if (assignmentFields.length > 0) {
      // Build OR conditions for assignment fields
      const assignmentConditions = assignmentFields.map(field => ({
        [field]: this.userId
      }));

      if (assignmentConditions.length === 1) {
        query = { ...query, ...assignmentConditions[0] };
      } else {
        query.OR = assignmentConditions;
      }
    }

    return query;
  }

  private async applyDepartmentConstraints(query: any): Promise<any> {
    // Get user's department
    const userProfile = await db.user.findFirst({
      where: { id: this.userId },
      include: { employeeProfile: true }
    });

    // TODO: Implement department field in EmployeeProfile model
    // const userDepartment = userProfile?.employeeProfile?.department;
    // if (userDepartment) {
    //   // Add department filter based on entity type
    //   query.department = userDepartment;
    // }

    return query;
  }

  private async applyTerritoryConstraints(query: any): Promise<any> {
    // Get user's assigned territories
    const territories = await this.getUserTerritories();

    if (territories.length > 0) {
      query.territory = { in: territories };
    }

    return query;
  }

  private async applyProjectConstraints(query: any): Promise<any> {
    // Get user's assigned projects
    const projects = await this.getUserProjects();

    if (projects.length > 0) {
      query.projectId = { in: projects };
    }

    return query;
  }

  private async enforceTimeRestrictions(
    timeRestrictions: DataVisibilityConstraints['timeRestricted'],
    action: string
  ): Promise<void> {
    if (!timeRestrictions) return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    if (timeRestrictions.businessHoursOnly) {
      // Default business hours: 6 AM - 6 PM, Monday-Friday
      if (currentHour < 6 || currentHour >= 18 || currentDay === 0 || currentDay === 6) {
        throw new Error('Access restricted to business hours only');
      }
    }

    if (timeRestrictions.customSchedule) {
      const schedule = timeRestrictions.customSchedule;
      
      // Check day of week
      if (!schedule.daysOfWeek.includes(currentDay)) {
        throw new Error('Access not permitted on this day');
      }

      // Check time range
      const startHour = parseInt(schedule.startTime.split(':')[0]);
      const endHour = parseInt(schedule.endTime.split(':')[0]);

      if (currentHour < startHour || currentHour >= endHour) {
        throw new Error('Access not permitted at this time');
      }
    }
  }

  // Sensitive Action Enforcement
  async enforceSensitiveActionConstraints(
    action: string,
    entityType: string,
    entityId: string,
    constraints: SensitiveActionConstraints
  ): Promise<{ approved: boolean; requiresApproval: boolean; approvalId?: string }> {
    // Check if action is blocked
    if (constraints.blockedActions.includes(action)) {
      await this.handleConstraintViolation('blocked_action', new Error('Action is blocked'), {
        action,
        entityType,
        entityId
      });
      throw new Error('This action is not permitted for your role');
    }

    // Check if action requires approval
    if (constraints.requireApproval.includes(action)) {
      const approvalRequest = await this.createApprovalRequest(
        action,
        entityType,
        entityId,
        constraints.approvalWorkflow
      );

      return {
        approved: false,
        requiresApproval: true,
        approvalId: approvalRequest.id
      };
    }

    // Action is permitted without approval
    await this.logActionExecution(action, entityType, entityId, 'auto_approved');
    
    return {
      approved: true,
      requiresApproval: false
    };
  }

  /* TODO: Implement ApprovalRequest model as part of DEVELOPMENT_ROADMAP.md Phase 6
   * This function will create approval requests for sensitive actions requiring workflow approval
   */
  /*
  private async createApprovalRequest(
    action: string,
    entityType: string,
    entityId: string,
    workflow: SensitiveActionConstraints['approvalWorkflow']
  ): Promise<any> {
    const approvalRequest = await db.approvalRequest.create({
      data: {
        orgId: this.orgId,
        requestedBy: this.userId,
        action,
        entityType,
        entityId,
        status: 'pending',
        approverRoles: workflow.approverRoles,
        requireReason: workflow.requireReason,
        expiresAt: new Date(Date.now() + workflow.timeoutMinutes * 60 * 1000),
        escalationRules: workflow.escalationRules,
        requestedAt: new Date()
      }
    });

    // Send notification to approvers
    await this.notifyApprovers(approvalRequest.id, workflow.approverRoles);

    // Schedule escalation if configured
    if (workflow.escalationRules.length > 0) {
      await this.scheduleEscalation(approvalRequest.id, workflow.escalationRules[0]);
    }

    return approvalRequest;
  }
  */

  // Security Safeguards Enforcement
  async enforceSecuritySafeguards(
    action: string,
    safeguards: SecuritySafeguards,
    request: any
  ): Promise<void> {
    try {
      // Check concurrent sessions
      await this.checkConcurrentSessions(safeguards.maxConcurrentSessions);

      // Check IP restrictions
      if (safeguards.ipRestrictions.length > 0) {
        await this.checkIpRestrictions(safeguards.ipRestrictions, request.ip);
      }

      // Track device if enabled
      if (safeguards.deviceTracking) {
        await this.trackDevice(request.headers['user-agent'], request.ip);
      }

      // Run anomaly detection
      if (safeguards.anomalyDetection.enabled) {
        await this.detectAnomalies(action, safeguards.anomalyDetection.thresholds);
      }

    } catch (error) {
      // Handle security violation
      await this.handleSecurityViolation(action, error, safeguards, request);
      throw error;
    }
  }

  private async checkConcurrentSessions(maxSessions: number): Promise<void> {
    const activeSessions = await db.userSession.count({
      where: {
        userId: this.userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });

    if (activeSessions >= maxSessions) {
      throw new Error(`Maximum concurrent sessions (${maxSessions}) exceeded`);
    }
  }

  private async checkIpRestrictions(allowedIps: string[], clientIp: string): Promise<void> {
    if (!allowedIps.includes(clientIp) && !this.isIpInCidrRange(clientIp, allowedIps)) {
      throw new Error('Access denied from this IP address');
    }
  }

  private async detectAnomalies(action: string, thresholds: any): Promise<void> {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Check for unusual data access patterns
    const recentDataAccess = await db.auditLog.count({
      where: {
        actorId: this.userId,
        action: { contains: 'read' },
        createdAt: { gte: hourAgo }
      }
    });

    if (recentDataAccess > thresholds.unusualDataAccess) {
      await this.triggerAnomalyAlert('unusual_data_access', {
        count: recentDataAccess,
        threshold: thresholds.unusualDataAccess
      });
    }

    // Check for rapid actions
    const recentActions = await db.auditLog.count({
      where: {
        actorId: this.userId,
        createdAt: { gte: new Date(now.getTime() - 5 * 60 * 1000) } // Last 5 minutes
      }
    });

    if (recentActions > thresholds.rapidActions) {
      await this.triggerAnomalyAlert('rapid_actions', {
        count: recentActions,
        threshold: thresholds.rapidActions
      });
    }

    // Check for off-hours activity
    const currentHour = now.getHours();
    if ((currentHour < 6 || currentHour > 22)) {
      const offHoursActions = await db.auditLog.count({
        where: {
          actorId: this.userId,
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // Last 24 hours
          action: { not: { contains: 'read' } } // Exclude read-only actions
        }
      });

      if (offHoursActions > thresholds.offHoursActivity) {
        await this.triggerAnomalyAlert('off_hours_activity', {
          count: offHoursActions,
          threshold: thresholds.offHoursActivity,
          hour: currentHour
        });
      }
    }
  }

  // Error Handling and Incident Response
  private async handleConstraintViolation(
    violationType: string,
    error: Error,
    context: any
  ): Promise<void> {
    // Log the violation
    // TODO: Implement SecurityIncident model - constraint violation logging
    // await db.securityIncident.create({
    //   data: {
    //     orgId: this.orgId,
    //     userId: this.userId,
    //     incidentType: 'constraint_violation',
    //     violationType,
    //     severity: this.determineSeverity(violationType),
    //     description: error.message,
    //     context: context,
    //     ipAddress: context.ipAddress || 'unknown',
    //     userAgent: context.userAgent || 'unknown',
    //     status: 'open',
    //     detectedAt: new Date()
    //   }
    // });

    // Send alert to security team
    await this.sendSecurityAlert(violationType, error.message, context);

    // Apply automatic response if configured
    await this.applyAutomaticResponse(violationType);
  }

  private async handleSecurityViolation(
    action: string,
    error: Error,
    safeguards: SecuritySafeguards,
    request: any
  ): Promise<void> {
    // Log security incident
    // TODO: Implement SecurityIncident model - security violation logging
    // await db.securityIncident.create({
    //   data: {
    //     orgId: this.orgId,
    //     userId: this.userId,
    //     incidentType: 'security_violation',
    //     violationType: 'safeguard_breach',
    //     severity: 'high',
    //     description: `Security safeguard violation: ${error.message}`,
    //     context: {
    //       action,
    //       safeguards: Object.keys(safeguards),
    //       userAgent: request.headers['user-agent'],
    //       ip: request.ip
    //     },
    //     ipAddress: request.ip,
    //     userAgent: request.headers['user-agent'],
    //     status: 'open',
    //     detectedAt: new Date()
    //   }
    // });

    // Apply lockout if configured
    if (safeguards.autoLockout.enabled) {
      await this.applyAutoLockout(safeguards.autoLockout);
    }

    // Immediate security team notification
    await this.sendImmediateSecurityAlert(action, error.message, request);
  }

  // Utility Methods
  private getAssignmentFields(entityType: string): string[] {
    const assignmentMappings: Record<string, string[]> = {
      'lead': ['assignedTo', 'createdBy'],
      'customer': ['accountManager', 'assignedTo'],
      'task': ['assignedTo', 'createdBy'],
      'job': ['assignedTo', 'supervisorId'],
      'workOrder': ['assignedTo', 'technicianId'],
      'opportunity': ['ownerId', 'assignedTo']
    };

    return assignmentMappings[entityType] || ['assignedTo'];
  }

  private async getUserTerritories(): Promise<string[]> {
    const userProfile = await db.user.findFirst({
      where: { id: this.userId },
      include: { employeeProfile: true }
    });

    // TODO: Implement assignedTerritories field in EmployeeProfile model
    return []; // userProfile?.employeeProfile?.assignedTerritories || [];
  }

  private async getUserProjects(): Promise<string[]> {
    // TODO: Fix JobAssignment model fields - userId and jobSite don't exist
    // const assignments = await db.jobAssignment.findMany({
    //   where: {
    //     userId: this.userId,
    //     isActive: true
    //   },
    //   select: { jobSite: { select: { projectId: true } } }
    // });
    // return assignments
    //   .map(a => a.jobSite?.projectId)
    //   .filter(Boolean) as string[];

    return []; // Temporary return until model is fixed
  }

  private async logDataAccess(entityType: string, action: string, query: any): Promise<void> {
    await db.auditLog.create({
      data: {
        orgId: this.orgId,
        actorId: this.userId,
        action: `${entityType}_${action}`,
        entityType: entityType,
        category: 'DATA_ACCESS',
        details: {
          entityType,
          action,
          queryFilters: Object.keys(query),
          constraintsApplied: true
        },
        ipAddress: 'system',
        userAgent: 'constraint_enforcer'
      }
    });
  }

  private async logActionExecution(
    action: string,
    entityType: string,
    entityId: string,
    approval: string
  ): Promise<void> {
    await db.auditLog.create({
      data: {
        orgId: this.orgId,
        actorId: this.userId,
        action: `${entityType}_${action}`,
        entityType: entityType,
        targetId: entityId,
        category: 'ACTION_EXECUTION',
        details: {
          action,
          entityType,
          entityId,
          approvalStatus: approval
        },
        ipAddress: 'system',
        userAgent: 'constraint_enforcer'
      }
    });
  }

  private determineSeverity(violationType: string): string {
    const severityMap: Record<string, string> = {
      'blocked_action': 'high',
      'data_visibility': 'medium',
      'time_restriction': 'low',
      'ip_restriction': 'high',
      'concurrent_session': 'medium'
    };

    return severityMap[violationType] || 'medium';
  }

  private isIpInCidrRange(ip: string, cidrs: string[]): boolean {
    // Simplified CIDR check - in production, use a proper CIDR library
    return cidrs.some(cidr => {
      if (cidr.includes('/')) {
        // Basic CIDR matching logic would go here
        return false;
      }
      return cidr === ip;
    });
  }

  private async notifyApprovers(approvalId: string, approverRoles: string[]): Promise<void> {
    // Implementation would integrate with notification system
    console.log(`Approval notification sent for ${approvalId} to roles: ${approverRoles.join(', ')}`);
  }

  private async scheduleEscalation(approvalId: string, escalationRule: any): Promise<void> {
    // Implementation would integrate with job scheduling system
    console.log(`Escalation scheduled for approval ${approvalId} after ${escalationRule.afterMinutes} minutes`);
  }

  private async trackDevice(userAgent: string, ip: string): Promise<void> {
    // TODO: Implement DeviceAccess model for device tracking
    // Device tracking implementation
    // await db.deviceAccess.upsert({
      where: { userId_userAgent: { userId: this.userId, userAgent } },
      update: { 
        lastSeenAt: new Date(),
        ipAddress: ip,
        accessCount: { increment: 1 }
      },
      create: {
        userId: this.userId,
        userAgent,
    //     ipAddress: ip,
    //     firstSeenAt: new Date(),
    //     lastSeenAt: new Date(),
    //     accessCount: 1
    //   }
    // });
  }

  private async triggerAnomalyAlert(type: string, details: any): Promise<void> {
    // TODO: Implement SecurityIncident model - anomaly alert
    // await db.securityIncident.create({
      data: {
        orgId: this.orgId,
        userId: this.userId,
        incidentType: 'anomaly_detection',
    //   violationType: type,
    //   severity: 'medium',
    //   description: `Anomalous behavior detected: ${type}`,
    //   context: details,
    //   status: 'open',
    //   detectedAt: new Date()
    // }
    // });
  }

  private async sendSecurityAlert(type: string, message: string, context: any): Promise<void> {
    // Security alert implementation
    console.log(`Security Alert [${type}]: ${message}`, context);
  }

  private async sendImmediateSecurityAlert(action: string, message: string, request: any): Promise<void> {
    // Immediate security alert implementation
    console.log(`IMMEDIATE Security Alert [${action}]: ${message}`, {
      user: this.userId,
      ip: request.ip,
      userAgent: request.headers['user-agent']
    });
  }

  private async applyAutomaticResponse(violationType: string): Promise<void> {
    // Automatic response implementation
    if (violationType === 'blocked_action') {
      // Could temporarily restrict user permissions
    }
  }

  private async applyAutoLockout(lockoutConfig: SecuritySafeguards['autoLockout']): Promise<void> {
    // TODO: Implement UserLockout model for automatic lockouts
    // await db.userLockout.create({
    //   data: {
    //     userId: this.userId,
    //     reason: 'Security violation - automatic lockout',
    //     lockedAt: new Date(),
    //     expiresAt: new Date(Date.now() + lockoutConfig.lockoutDurationMinutes * 60 * 1000),
    //     isActive: true
    //   }
    // });
  }
}

// Factory function to create constraint enforcer for a user
export async function createStaffConstraintEnforcer(
  orgId: string,
  userId: string
): Promise<StaffConstraintEnforcer> {
  const userRoles = await db.rbacUserRole.findMany({
    where: { userId, orgId },
    include: { role: true }
  });

  const roleNames = userRoles.map(ur => ur.role.slug);
  
  return new StaffConstraintEnforcer(orgId, userId, roleNames);
}

// Default constraint configurations for Staff role
export const DEFAULT_STAFF_CONSTRAINTS = {
  dataVisibility: {
    byDepartment: true,
    byTerritory: false,
    byProject: true,
    assignedOnly: true,
    timeRestricted: {
      businessHoursOnly: false
    }
  },
  sensitiveActions: {
    requireApproval: [
      'customer:delete',
      'task:delete',
      'job:cancel',
      'data:bulk_export',
      'schedule:override',
      'payment:process',
      'contract:modify'
    ],
    blockedActions: [
      'user:create',
      'user:delete',
      'user:modify_roles',
      'billing:access',
      'admin:access',
      'system:configure',
      'org:settings',
      'integration:manage',
      'audit:access',
      'security:configure'
    ],
    approvalWorkflow: {
      approverRoles: ['manager', 'admin', 'owner'],
      requireReason: true,
      timeoutMinutes: 240, // 4 hours
      escalationRules: [
        {
          level: 1,
          afterMinutes: 60,
          toRoles: ['admin', 'owner']
        },
        {
          level: 2,
          afterMinutes: 120,
          toRoles: ['owner']
        }
      ]
    }
  },
  securitySafeguards: {
    maxConcurrentSessions: 3,
    ipRestrictions: [], // Empty = no restrictions
    deviceTracking: true,
    anomalyDetection: {
      enabled: true,
      thresholds: {
        unusualDataAccess: 100,
        rapidActions: 50,
        offHoursActivity: 10
      }
    },
    autoLockout: {
      enabled: true,
      maxFailedAttempts: 5,
      lockoutDurationMinutes: 30
    }
  }
};

// Factory function already exported above