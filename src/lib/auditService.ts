/**
 * 📋 ENTERPRISE AUDIT LOGGING SERVICE
 * Comprehensive compliance tracking and security monitoring
 */

import { prisma } from './prisma';

export type AuditEventType = 
  | 'AUTH_LOGIN' | 'AUTH_LOGOUT' | 'AUTH_FAILED'
  | 'DATA_CREATE' | 'DATA_READ' | 'DATA_UPDATE' | 'DATA_DELETE'
  | 'SYSTEM_ACCESS' | 'SYSTEM_CONFIG' | 'SYSTEM_ERROR'
  | 'SECURITY_VIOLATION' | 'PERMISSION_DENIED'
  | 'AI_USAGE' | 'BILLING_EVENT' | 'FEDERATION_ACCESS';

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditEvent {
  id?: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  userEmail?: string;
  userSystem: 'PROVIDER' | 'DEVELOPER' | 'CLIENT';
  orgId?: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

export interface AuditQuery {
  eventTypes?: AuditEventType[];
  severity?: AuditSeverity[];
  userSystem?: ('PROVIDER' | 'DEVELOPER' | 'CLIENT')[];
  userId?: string;
  orgId?: string;
  action?: string;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  limit?: number;
  offset?: number;
}

class AuditService {
  /**
   * Log an audit event
   */
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      // For now, log to console and database
      console.log(`🔍 AUDIT [${event.severity}]: ${event.action}`, {
        type: event.eventType,
        user: event.userEmail,
        system: event.userSystem,
        success: event.success,
        details: event.details
      });

      // Store in audit log table
      await prisma.auditLog.create({
        data: {
          orgId: event.orgId || 'SYSTEM',
          actorId: event.userId,
          action: event.action,
          entityType: event.entityType || 'UNKNOWN',
          entityId: event.entityId,
          delta: {
            userSystem: event.userSystem,
            success: event.success,
            details: event.details,
            timestamp: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Never throw - audit logging should not break application flow
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(
    type: 'LOGIN' | 'LOGOUT' | 'FAILED',
    userEmail: string,
    userSystem: 'PROVIDER' | 'DEVELOPER' | 'CLIENT',
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: `AUTH_${type}` as AuditEventType,
      severity: type === 'FAILED' ? 'HIGH' : 'LOW',
      userEmail,
      userSystem,
      action: `User ${type.toLowerCase()}`,
      details: {
        ...details,
        loginMethod: userSystem === 'CLIENT' ? 'database' : 'environment'
      },
      ipAddress,
      userAgent,
      success: type !== 'FAILED'
    });
  }

  /**
   * Log security violations
   */
  async logSecurityViolation(
    userEmail: string,
    userSystem: 'PROVIDER' | 'DEVELOPER' | 'CLIENT',
    attemptedAction: string,
    details: Record<string, any> = {},
    ipAddress?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'SECURITY_VIOLATION',
      severity: 'CRITICAL',
      userEmail,
      userSystem,
      action: `Security violation: ${attemptedAction}`,
      details: {
        ...details,
        violationType: 'cross_system_access',
        blocked: true
      },
      ipAddress,
      success: false
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
    userEmail: string,
    userSystem: 'PROVIDER' | 'DEVELOPER' | 'CLIENT',
    resourceType: string,
    resourceId: string,
    details: Record<string, any> = {},
    orgId?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: `DATA_${action}` as AuditEventType,
      severity: action === 'DELETE' ? 'HIGH' : 'LOW',
      userEmail,
      userSystem,
      orgId,
      resourceType,
      resourceId,
      action: `${action} ${resourceType}`,
      details,
      success: true
    });
  }

  /**
   * Log AI usage events
   */
  async logAiUsage(
    userEmail: string,
    userSystem: 'PROVIDER' | 'DEVELOPER' | 'CLIENT',
    feature: string,
    creditsUsed: number,
    costUsd: number,
    orgId?: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: 'AI_USAGE',
      severity: creditsUsed > 10000 ? 'HIGH' : 'LOW',
      userEmail,
      userSystem,
      orgId,
      action: `AI feature usage: ${feature}`,
      details: {
        ...details,
        feature,
        creditsUsed,
        costUsd,
        efficiency: creditsUsed < 5000 ? 'optimal' : 'high'
      },
      success: true
    });
  }

  /**
   * Log system configuration changes
   */
  async logSystemConfig(
    userEmail: string,
    userSystem: 'PROVIDER' | 'DEVELOPER' | 'CLIENT',
    configType: string,
    changes: Record<string, any>,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: 'SYSTEM_CONFIG',
      severity: 'HIGH',
      userEmail,
      userSystem,
      action: `System configuration change: ${configType}`,
      details: {
        ...details,
        configType,
        changes,
        requiresRestart: false
      },
      success: true
    });
  }

  /**
   * Log federation access events
   */
  async logFederationAccess(
    userEmail: string,
    endpoint: string,
    success: boolean,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: 'FEDERATION_ACCESS',
      severity: success ? 'MEDIUM' : 'HIGH',
      userEmail,
      userSystem: 'PROVIDER', // Only providers can access federation
      action: `Federation API access: ${endpoint}`,
      details: {
        ...details,
        endpoint,
        federationEnabled: true
      },
      success
    });
  }

  /**
   * Query audit events (for compliance reporting)
   */
  async queryEvents(query: AuditQuery): Promise<AuditEvent[]> {
    // Query audit logs from database
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        orgId: query.orgId,
        createdAt: {
          gte: query.startDate,
          lte: query.endDate
        },
        ...(query.userId && { actorId: query.userId }),
        ...(query.action && { action: { contains: query.action } }),
        ...(query.entityType && { entityType: query.entityType })
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit || 100
    });

    // Convert to AuditEvent format
    return auditLogs.map(log => ({
      id: log.id,
      eventType: 'SYSTEM_ACCESS' as AuditEventType,
      severity: 'LOW' as AuditSeverity,
      orgId: log.orgId,
      userId: log.actorId || undefined,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId || undefined,
      userSystem: (log.delta as any)?.userSystem || 'CLIENT' as 'PROVIDER' | 'DEVELOPER' | 'CLIENT',
      success: (log.delta as any)?.success ?? true,
      details: (log.delta as any)?.details || {},
      timestamp: log.createdAt
    }));

    // Fallback mock data for demonstration
    const mockEvents: AuditEvent[] = [
      {
        id: '1',
        eventType: 'AUTH_LOGIN',
        severity: 'LOW',
        userEmail: 'chris.tcr.2012@gmail.com',
        userSystem: 'PROVIDER',
        action: 'User login',
        details: { loginMethod: 'environment' },
        timestamp: new Date(),
        success: true
      },
      {
        id: '2',
        eventType: 'SECURITY_VIOLATION',
        severity: 'CRITICAL',
        userEmail: 'test@example.com',
        userSystem: 'CLIENT',
        action: 'Security violation: attempted provider access',
        details: { violationType: 'cross_system_access', blocked: true },
        timestamp: new Date(Date.now() - 3600000),
        success: false
      }
    ];

    return mockEvents.slice(0, query.limit || 50);
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date,
    orgId?: string
  ): Promise<{
    summary: {
      totalEvents: number;
      securityViolations: number;
      failedLogins: number;
      dataAccess: number;
      systemChanges: number;
    };
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    recommendations: string[];
  }> {
    // Query actual audit data
    const whereClause = {
      createdAt: { gte: startDate, lte: endDate },
      ...(orgId && { orgId })
    };

    const [
      totalEvents,
      securityViolations,
      failedLogins,
      dataAccess,
      systemChanges
    ] = await Promise.all([
      prisma.auditLog.count({ where: whereClause }),
      prisma.auditLog.count({
        where: {
          ...whereClause,
          action: { contains: 'SECURITY' }
        }
      }),
      prisma.auditLog.count({
        where: {
          ...whereClause,
          action: { contains: 'LOGIN_FAILED' }
        }
      }),
      prisma.auditLog.count({
        where: {
          ...whereClause,
          action: { contains: 'DATA_ACCESS' }
        }
      }),
      prisma.auditLog.count({
        where: {
          ...whereClause,
          action: { contains: 'SYSTEM_CHANGE' }
        }
      })
    ]);

    // Determine risk level based on violations
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (securityViolations > 10 || failedLogins > 50) {
      riskLevel = 'HIGH';
    } else if (securityViolations > 5 || failedLogins > 20) {
      riskLevel = 'MEDIUM';
    }

    // Generate recommendations based on data
    const recommendations: string[] = [];
    if (securityViolations > 0) {
      recommendations.push('Review security violation patterns');
    }
    if (failedLogins > 10) {
      recommendations.push('Implement additional MFA for high-privilege accounts');
    }
    if (riskLevel === 'HIGH') {
      recommendations.push('Consider IP whitelisting for provider access');
    }
    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring security metrics');
    }

    return {
      summary: {
        totalEvents,
        securityViolations,
        failedLogins,
        dataAccess,
        systemChanges
      },
      riskLevel,
      recommendations
    };
  }

  /**
   * Log generic event (for binder middleware)
   */
  async logBinderEvent(event: {
    action: string;
    expected?: string;
    actual?: string;
    tenantId?: string | null;
    path?: string;
    error?: string;
    ts: number;
  }): Promise<void> {
    try {
      // For now, just log to console - in production would save to database
      console.log('Audit Event:', {
        timestamp: new Date(event.ts).toISOString(),
        action: event.action,
        path: event.path,
        details: {
          expected: event.expected,
          actual: event.actual,
          tenantId: event.tenantId,
          error: event.error
        }
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }
}

// Export singleton instance
export { AuditService };
export const auditService = new AuditService();

// Convenience functions
export const logAuth = auditService.logAuth.bind(auditService);
export const logSecurityViolation = auditService.logSecurityViolation.bind(auditService);
export const logDataAccess = auditService.logDataAccess.bind(auditService);
export const logAiUsage = auditService.logAiUsage.bind(auditService);
export const logSystemConfig = auditService.logSystemConfig.bind(auditService);
export const logFederationAccess = auditService.logFederationAccess.bind(auditService);
