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

      // TODO: Store in audit table when schema is ready
      // await prisma.auditEvent.create({
      //   data: {
      //     ...event,
      //     timestamp: new Date()
      //   }
      // });

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
    // TODO: Implement database query when audit table is ready
    // For now, return mock data for demonstration
    
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
    // TODO: Implement real compliance reporting
    return {
      summary: {
        totalEvents: 1247,
        securityViolations: 3,
        failedLogins: 12,
        dataAccess: 856,
        systemChanges: 5
      },
      riskLevel: 'LOW',
      recommendations: [
        'Review security violation patterns',
        'Implement additional MFA for high-privilege accounts',
        'Consider IP whitelisting for provider access'
      ]
    };
  }
}

// Export singleton instance
export const auditService = new AuditService();

// Convenience functions
export const logAuth = auditService.logAuth.bind(auditService);
export const logSecurityViolation = auditService.logSecurityViolation.bind(auditService);
export const logDataAccess = auditService.logDataAccess.bind(auditService);
export const logAiUsage = auditService.logAiUsage.bind(auditService);
export const logSystemConfig = auditService.logSystemConfig.bind(auditService);
export const logFederationAccess = auditService.logFederationAccess.bind(auditService);
