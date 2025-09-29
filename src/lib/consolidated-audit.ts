/**
 * 🔍 CONSOLIDATED AUDIT SYSTEM
 * 
 * Unified audit logging for GitHub issue #5: "Audit consolidation"
 * Acceptance Criteria: Single audit interface; all systems use it; no duplicate logging.
 * Phase:0 Area:audit Priority:high
 * 
 * This consolidates all audit logging implementations into a single, comprehensive system.
 */

import { prisma } from './prisma';
import type { NextApiRequest } from 'next';

// Unified audit event types
export type ConsolidatedAuditEventType = 
  // Authentication events
  | 'AUTH_LOGIN' | 'AUTH_LOGOUT' | 'AUTH_FAILED' | 'AUTH_PASSWORD_CHANGE' | 'AUTH_2FA_SETUP'
  // Data operations
  | 'DATA_CREATE' | 'DATA_READ' | 'DATA_UPDATE' | 'DATA_DELETE' | 'DATA_EXPORT' | 'DATA_IMPORT'
  // System operations
  | 'SYSTEM_ACCESS' | 'SYSTEM_CONFIG' | 'SYSTEM_ERROR' | 'SYSTEM_BACKUP' | 'SYSTEM_RESTORE'
  // Security events
  | 'SECURITY_VIOLATION' | 'PERMISSION_DENIED' | 'SUSPICIOUS_ACTIVITY' | 'POLICY_VIOLATION'
  // Business operations
  | 'AI_USAGE' | 'BILLING_EVENT' | 'FEDERATION_ACCESS' | 'FINANCIAL_OPERATION'
  // Developer operations
  | 'DEVELOPER_ACTION' | 'SYSTEM_DEBUG' | 'DATABASE_QUERY' | 'DEPLOYMENT_ACTION'
  // Provider operations
  | 'PROVIDER_CONFIG' | 'TENANT_MANAGEMENT' | 'CROSS_TENANT_ACCESS'
  // Staff operations
  | 'STAFF_ACTION' | 'WORKFLOW_EXECUTION' | 'TASK_COMPLETION';

export type ConsolidatedAuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ConsolidatedAuditCategory = 
  | 'AUTHENTICATION' | 'AUTHORIZATION' | 'DATA_ACCESS' | 'SYSTEM_ADMIN' 
  | 'SECURITY' | 'COMPLIANCE' | 'BUSINESS' | 'FINANCIAL' | 'TECHNICAL';

export type UserSystem = 'CLIENT' | 'PROVIDER' | 'DEVELOPER' | 'ACCOUNTANT' | 'SYSTEM';

export interface ConsolidatedAuditEvent {
  // Core event data
  eventType: ConsolidatedAuditEventType;
  severity: ConsolidatedAuditSeverity;
  category: ConsolidatedAuditCategory;
  action: string;
  success: boolean;
  
  // User context
  userId?: string;
  userEmail?: string;
  userSystem: UserSystem;
  orgId?: string;
  
  // Target information
  targetType?: string;
  targetId?: string;
  entityType?: string;
  entityId?: string;
  
  // Request context
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  
  // Event details
  details: Record<string, any>;
  errorMessage?: string;
  
  // Compliance and security
  complianceFlags?: string[];
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Metadata
  timestamp?: Date;
  source?: string; // Which system/component generated this event
}

export interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
}

/**
 * Consolidated Audit Service - Single point for all audit logging
 */
class ConsolidatedAuditService {
  private static instance: ConsolidatedAuditService;
  
  static getInstance(): ConsolidatedAuditService {
    if (!ConsolidatedAuditService.instance) {
      ConsolidatedAuditService.instance = new ConsolidatedAuditService();
    }
    return ConsolidatedAuditService.instance;
  }

  /**
   * Main audit logging method - all other methods route through this
   */
  async logEvent(event: ConsolidatedAuditEvent): Promise<void> {
    try {
      const timestamp = event.timestamp || new Date();
      
      // Enhanced console logging for development
      console.log(`🔍 AUDIT [${event.severity}] [${event.userSystem}]: ${event.action}`, {
        type: event.eventType,
        category: event.category,
        user: event.userEmail,
        success: event.success,
        orgId: event.orgId,
        source: event.source,
        timestamp: timestamp.toISOString()
      });

      // Store in unified audit table (AuditEvent - the most comprehensive one)
      await prisma.auditEvent.create({
        data: {
          orgId: event.orgId || 'SYSTEM',
          userId: event.userId,
          sessionId: event.sessionId,
          action: event.action,
          target: event.targetType || event.entityType || 'unknown',
          targetId: event.targetId || event.entityId,
          details: {
            eventType: event.eventType,
            userSystem: event.userSystem,
            userEmail: event.userEmail,
            complianceFlags: event.complianceFlags,
            riskLevel: event.riskLevel,
            source: event.source,
            ...event.details
          },
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          severity: event.severity as any, // Map to Prisma enum
          category: this.mapCategory(event.category),
          success: event.success,
          errorMessage: event.errorMessage,
          createdAt: timestamp
        }
      });

      // Also store in legacy AuditLog for backward compatibility
      if (event.orgId && event.orgId !== 'SYSTEM') {
        await prisma.auditLog.create({
          data: {
            orgId: event.orgId,
            actorId: event.userId,
            action: event.action,
            entityType: event.entityType || event.targetType || 'unknown',
            entityId: event.entityId || event.targetId,
            delta: {
              eventType: event.eventType,
              userSystem: event.userSystem,
              success: event.success,
              details: event.details,
              timestamp: timestamp.toISOString()
            }
          }
        });
      }

    } catch (error) {
      console.error('Failed to log consolidated audit event:', error);
      // Never throw - audit logging should not break application flow
    }
  }

  /**
   * Authentication events
   */
  async logAuth(
    type: 'LOGIN' | 'LOGOUT' | 'FAILED' | 'PASSWORD_CHANGE' | '2FA_SETUP',
    userEmail: string,
    userSystem: UserSystem,
    context: AuditContext = {},
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: type === 'PASSWORD_CHANGE' ? 'AUTH_PASSWORD_CHANGE' :
                 type === '2FA_SETUP' ? 'AUTH_2FA_SETUP' :
                 `AUTH_${type}` as ConsolidatedAuditEventType,
      severity: type === 'FAILED' ? 'HIGH' : 'LOW',
      category: 'AUTHENTICATION',
      action: `User ${type.toLowerCase().replace('_', ' ')}`,
      success: type !== 'FAILED',
      userEmail,
      userSystem,
      details: {
        ...details,
        loginMethod: userSystem === 'CLIENT' ? 'database' : 'environment'
      },
      source: 'auth-system',
      ...context
    });
  }

  /**
   * Security violations and suspicious activities
   */
  async logSecurity(
    violationType: 'CROSS_SYSTEM_ACCESS' | 'PERMISSION_DENIED' | 'SUSPICIOUS_ACTIVITY' | 'POLICY_VIOLATION',
    userEmail: string,
    userSystem: UserSystem,
    attemptedAction: string,
    context: AuditContext = {},
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: violationType === 'CROSS_SYSTEM_ACCESS' ? 'SECURITY_VIOLATION' :
                 violationType === 'PERMISSION_DENIED' ? 'PERMISSION_DENIED' :
                 violationType === 'SUSPICIOUS_ACTIVITY' ? 'SUSPICIOUS_ACTIVITY' :
                 'POLICY_VIOLATION',
      severity: 'CRITICAL',
      category: 'SECURITY',
      action: `Security violation: ${attemptedAction}`,
      success: false,
      userEmail,
      userSystem,
      details: {
        ...details,
        violationType,
        blocked: true,
        riskFactors: details.riskFactors || []
      },
      riskLevel: 'CRITICAL',
      complianceFlags: ['SECURITY_INCIDENT'],
      source: 'security-system',
      ...context
    });
  }

  /**
   * Data access and manipulation events
   */
  async logDataAccess(
    operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT',
    userEmail: string,
    userSystem: UserSystem,
    resourceType: string,
    resourceId: string,
    orgId: string,
    context: AuditContext = {},
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: `DATA_${operation}` as ConsolidatedAuditEventType,
      severity: operation === 'DELETE' ? 'HIGH' : operation === 'EXPORT' ? 'MEDIUM' : 'LOW',
      category: 'DATA_ACCESS',
      action: `${operation} ${resourceType}`,
      success: true,
      userEmail,
      userSystem,
      orgId,
      targetType: resourceType,
      targetId: resourceId,
      entityType: resourceType,
      entityId: resourceId,
      details,
      complianceFlags: operation === 'EXPORT' ? ['DATA_EXPORT'] : undefined,
      source: 'data-system',
      ...context
    });
  }

  /**
   * System administration events
   */
  async logSystemAdmin(
    action: string,
    userEmail: string,
    userSystem: UserSystem,
    target: string,
    context: AuditContext = {},
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: 'SYSTEM_CONFIG',
      severity: 'HIGH',
      category: 'SYSTEM_ADMIN',
      action,
      success: true,
      userEmail,
      userSystem,
      targetType: target,
      details,
      complianceFlags: ['SYSTEM_CHANGE'],
      source: 'admin-system',
      ...context
    });
  }

  /**
   * Extract audit context from API request
   */
  extractContext(req: NextApiRequest): AuditContext {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? 
      (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) : 
      req.socket.remoteAddress;
    
    return {
      ipAddress: ip?.trim(),
      userAgent: req.headers['user-agent'],
      sessionId: req.headers['x-session-id'] as string,
      requestId: req.headers['x-request-id'] as string
    };
  }

  /**
   * Map category to Prisma enum
   */
  private mapCategory(category: ConsolidatedAuditCategory): any {
    const categoryMap: Record<ConsolidatedAuditCategory, string> = {
      'AUTHENTICATION': 'AUTH',
      'AUTHORIZATION': 'AUTH',
      'DATA_ACCESS': 'DATA',
      'SYSTEM_ADMIN': 'SYSTEM',
      'SECURITY': 'SECURITY',
      'COMPLIANCE': 'COMPLIANCE',
      'BUSINESS': 'GENERAL',
      'FINANCIAL': 'FINANCIAL',
      'TECHNICAL': 'SYSTEM'
    };
    
    return categoryMap[category] || 'GENERAL';
  }
}

// Export singleton instance
export const consolidatedAudit = ConsolidatedAuditService.getInstance();

// Convenience functions for backward compatibility
export const logAuth = consolidatedAudit.logAuth.bind(consolidatedAudit);
export const logSecurity = consolidatedAudit.logSecurity.bind(consolidatedAudit);
export const logDataAccess = consolidatedAudit.logDataAccess.bind(consolidatedAudit);
export const logSystemAdmin = consolidatedAudit.logSystemAdmin.bind(consolidatedAudit);

export default consolidatedAudit;
