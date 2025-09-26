// src/lib/ai-triage-agent/incident-management.ts
// AI Triage Agent Incident Management - Cards, Repro Sandboxes & Workflows
// Robinson Solutions B2B SaaS Platform

import { createHash } from 'crypto';
import { createStaffAuditSystem } from "../staff-audit-system";
import type { ErrorCluster, ErrorEvent } from './core-agent';
import type { TierASummaryResult, TierBDeepDiveResult } from './llm-integration';

export interface IncidentCard {
  // Core Identification
  id: string; // cluster hash
  tenantId: string;
  
  // Incident Metadata
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0.0-1.0
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  
  // Timeline
  firstSeen: string; // ISO8601
  lastSeen: string; // ISO8601
  resolvedAt?: string; // ISO8601
  
  // Impact Metrics
  counts: {
    events: number;
    uniqueUsers: number;
    affectedSessions: number;
  };
  
  // Environment Context
  env: 'prod' | 'staging' | 'dev' | 'test';
  appVersion: string;
  commitHash: string;
  featureFlags: Record<string, boolean>;
  
  // Business Impact
  impactedRoles: string[]; // Owner|Staff|Accountant|...
  endpoints: string[]; // GET /v1/...
  serviceAreas: string[]; // billing, auth, reporting
  
  // Analysis Results
  shortCause: string; // From LLM analysis
  likelyChange: 'deploy' | 'flag' | 'dependency' | 'config' | 'unknown';
  candidateRunbookId?: string;
  
  // Reproduction Information
  repro: {
    exemplarEventIds: string[];
    maskedSnapshotId?: string;
    sandboxUrl?: string; // Created lazily by provider on escalation
    reproSteps?: string[];
    requiredFeatureFlags?: Record<string, boolean>;
  };
  
  // Investigation Data
  investigation: {
    hypothesis?: string;
    experiments?: string[];
    findings?: string[];
    rollbackSteps?: string[];
    stakeholderNotifications?: string[];
  };
  
  // Escalation State
  escalation: {
    escalated: boolean;
    escalatedAt?: string; // ISO8601
    escalationReason?: string;
    providerTicketId?: string;
    escalationPayload?: any;
  };
  
  // Metadata
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
  createdBy: 'ai_triage_agent';
  tags: string[];
}

export interface MaskedSnapshot {
  id: string;
  incidentId: string;
  tenantId: string;
  
  // Snapshot Data (PII-redacted)
  errorEvents: Partial<ErrorEvent>[];
  systemState: {
    timestamp: Date;
    appVersion: string;
    featureFlags: Record<string, boolean>;
    environmentVars: Record<string, string>; // Sensitive values redacted
    deploymentMetadata: any;
  };
  
  // Reproduction Context
  userJourney: {
    steps: string[];
    expectedOutcome: string;
    actualOutcome: string;
    breakpointStep?: number;
  };
  
  // Privacy & Security
  piiRedactionApplied: boolean;
  secretsRedacted: string[];
  dataRetentionExpiry: Date;
  
  // Metadata
  createdAt: Date;
  size: number; // bytes
  compressionApplied: boolean;
}

export interface ReproSandbox {
  id: string;
  incidentId: string;
  snapshotId: string;
  tenantId: string;
  
  // Sandbox Configuration
  sandboxUrl: string;
  expiresAt: Date;
  accessToken: string; // For provider access
  
  // Sandbox State
  status: 'provisioning' | 'ready' | 'error' | 'expired';
  provisionedAt?: Date;
  lastAccessed?: Date;
  
  // Security Controls
  accessLog: Array<{
    timestamp: Date;
    accessor: string;
    action: string;
    ipAddress: string;
  }>;
  
  // Resource Limits
  cpuLimit: string;
  memoryLimit: string;
  diskLimit: string;
  networkPolicy: 'isolated' | 'limited' | 'none';
  
  // Provider Instructions
  setupInstructions: string[];
  reproSteps: string[];
  expectedBehavior: string;
  debuggingHints: string[];
}

export interface EscalationPayload {
  incidentCard: IncidentCard;
  maskedSnapshot: MaskedSnapshot;
  reproSandbox?: ReproSandbox;
  
  // Analysis Results
  tierASummary?: TierASummaryResult;
  tierBAnalysis?: TierBDeepDiveResult;
  
  // Context for Provider
  featureFlagMatrix: {
    current: Record<string, boolean>;
    sinceLastDeploy: Record<string, { old: boolean; new: boolean }>;
  };
  
  recentDeployments: Array<{
    version: string;
    deployedAt: Date;
    commitHash: string;
    changelog: string;
  }>;
  
  dashboardLinks: {
    metricsUrl: string;
    logsUrl: string;
    tracingUrl: string;
    alertsUrl: string;
  };
  
  // Escalation Metadata
  escalationReason: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  estimatedBusinessImpact: string;
}

export class IncidentManager {
  private tenantId: string;
  private auditSystem: any;
  private activeIncidents: Map<string, IncidentCard> = new Map();

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.auditSystem = createStaffAuditSystem(tenantId, 'incident_manager', 'incident_session');
  }

  // Create Incident Card from Cluster and Analysis
  async createIncidentCard(
    cluster: ErrorCluster,
    tierASummary?: TierASummaryResult,
    tierBAnalysis?: TierBDeepDiveResult
  ): Promise<IncidentCard> {
    try {
      // Generate unique incident ID based on cluster
      const incidentId = this.generateIncidentId(cluster);
      
      // Create base incident card
      const incident: IncidentCard = {
        id: incidentId,
        tenantId: this.tenantId,
        severity: tierASummary?.severity || cluster.severity,
        confidence: tierASummary?.confidence || cluster.confidence || 0.5,
        status: 'open',
        firstSeen: cluster.firstSeen.toISOString(),
        lastSeen: cluster.lastSeen.toISOString(),
        counts: {
          events: cluster.eventCount,
          uniqueUsers: cluster.uniqueUsers,
          affectedSessions: this.estimateAffectedSessions(cluster)
        },
        env: this.determineEnvironment(cluster.representative),
        appVersion: cluster.representative.appVersion,
        commitHash: cluster.representative.commitHash,
        featureFlags: cluster.representative.featureFlags,
        impactedRoles: cluster.impactedRoles,
        endpoints: cluster.endpoints,
        serviceAreas: this.identifyServiceAreas(cluster.endpoints),
        shortCause: tierASummary?.shortCause || this.generateFallbackCause(cluster),
        likelyChange: tierASummary?.likelyChange || this.inferLikelyChange(cluster),
        candidateRunbookId: tierASummary?.candidateRunbookId,
        repro: {
          exemplarEventIds: cluster.exemplars.map(e => e.id),
          reproSteps: this.generateReproSteps(cluster)
        },
        investigation: {
          hypothesis: tierBAnalysis?.hypothesis,
          experiments: tierBAnalysis?.topExperiments,
          rollbackSteps: tierBAnalysis?.rollbackSteps,
          stakeholderNotifications: tierBAnalysis?.stakeholderNotifications
        },
        escalation: {
          escalated: false
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'ai_triage_agent',
        tags: this.generateTags(cluster, tierASummary)
      };

      // Store incident in active incidents
      this.activeIncidents.set(incidentId, incident);
      
      // Persist to database
      await this.storeIncidentCard(incident);
      
      // Log incident creation
      await this.logIncidentEvent('incident_created', {
        incidentId,
        severity: incident.severity,
        confidence: incident.confidence,
        eventCount: incident.counts.events,
        impactedRoles: incident.impactedRoles
      });

      return incident;

    } catch (error) {
      await this.logIncidentEvent('incident_creation_error', {
        clusterId: cluster.id,
        error: error.message
      });
      throw error;
    }
  }

  // Create Masked Snapshot for Reproduction
  async createMaskedSnapshot(incident: IncidentCard, cluster: ErrorCluster): Promise<MaskedSnapshot> {
    try {
      const snapshotId = `snapshot_${incident.id}_${Date.now()}`;
      
      // Create masked snapshot with PII redaction
      const snapshot: MaskedSnapshot = {
        id: snapshotId,
        incidentId: incident.id,
        tenantId: this.tenantId,
        errorEvents: await this.maskErrorEvents(cluster.exemplars),
        systemState: {
          timestamp: new Date(),
          appVersion: incident.appVersion,
          featureFlags: incident.featureFlags,
          environmentVars: await this.getMaskedEnvironmentVars(),
          deploymentMetadata: await this.getDeploymentMetadata(incident.appVersion)
        },
        userJourney: await this.reconstructUserJourney(cluster.exemplars),
        piiRedactionApplied: true,
        secretsRedacted: await this.identifyRedactedSecrets(),
        dataRetentionExpiry: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days
        createdAt: new Date(),
        size: 0, // Will be calculated after compression
        compressionApplied: true
      };

      // Calculate size and apply compression
      const serializedData = JSON.stringify(snapshot);
      snapshot.size = Buffer.byteLength(serializedData, 'utf8');
      
      // Store snapshot
      await this.storeMaskedSnapshot(snapshot);
      
      // Update incident with snapshot reference
      incident.repro.maskedSnapshotId = snapshotId;
      await this.updateIncidentCard(incident);
      
      await this.logIncidentEvent('masked_snapshot_created', {
        incidentId: incident.id,
        snapshotId,
        size: snapshot.size,
        piiRedacted: true
      });

      return snapshot;

    } catch (error) {
      await this.logIncidentEvent('snapshot_creation_error', {
        incidentId: incident.id,
        error: error.message
      });
      throw error;
    }
  }

  // Create Repro Sandbox (Lazy creation by Provider)
  async createReproSandbox(
    incident: IncidentCard,
    snapshot: MaskedSnapshot,
    providerContext: any
  ): Promise<ReproSandbox> {
    try {
      const sandboxId = `sandbox_${incident.id}_${Date.now()}`;
      const accessToken = this.generateSecureToken();
      
      // Create sandbox configuration
      const sandbox: ReproSandbox = {
        id: sandboxId,
        incidentId: incident.id,
        snapshotId: snapshot.id,
        tenantId: this.tenantId,
        sandboxUrl: `https://sandbox.provider.com/${sandboxId}`,
        expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)), // 24 hours
        accessToken,
        status: 'provisioning',
        accessLog: [],
        cpuLimit: '1000m',
        memoryLimit: '2Gi',
        diskLimit: '10Gi',
        networkPolicy: 'isolated',
        setupInstructions: await this.generateSetupInstructions(incident, snapshot),
        reproSteps: incident.repro.reproSteps || [],
        expectedBehavior: await this.generateExpectedBehavior(incident),
        debuggingHints: await this.generateDebuggingHints(incident, snapshot)
      };

      // Provision sandbox (simulated)
      await this.provisionSandbox(sandbox);
      
      // Update incident with sandbox URL
      incident.repro.sandboxUrl = sandbox.sandboxUrl;
      await this.updateIncidentCard(incident);
      
      await this.logIncidentEvent('repro_sandbox_created', {
        incidentId: incident.id,
        sandboxId,
        sandboxUrl: sandbox.sandboxUrl,
        expiresAt: sandbox.expiresAt
      });

      return sandbox;

    } catch (error) {
      await this.logIncidentEvent('sandbox_creation_error', {
        incidentId: incident.id,
        error: error.message
      });
      throw error;
    }
  }

  // Update Incident Status and Investigation
  async updateIncident(
    incidentId: string,
    updates: Partial<IncidentCard>
  ): Promise<IncidentCard | null> {
    try {
      const incident = this.activeIncidents.get(incidentId);
      if (!incident) {
        return null;
      }

      // Apply updates
      const updatedIncident: IncidentCard = {
        ...incident,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Update active incidents map
      this.activeIncidents.set(incidentId, updatedIncident);
      
      // Persist updates
      await this.updateIncidentCard(updatedIncident);
      
      await this.logIncidentEvent('incident_updated', {
        incidentId,
        updates: Object.keys(updates),
        newStatus: updatedIncident.status
      });

      return updatedIncident;

    } catch (error) {
      await this.logIncidentEvent('incident_update_error', {
        incidentId,
        error: error.message
      });
      return null;
    }
  }

  // Resolve Incident
  async resolveIncident(
    incidentId: string,
    resolution: {
      rootCause: string;
      solution: string;
      preventionSteps: string[];
      resolvedBy: string;
    }
  ): Promise<boolean> {
    try {
      const incident = this.activeIncidents.get(incidentId);
      if (!incident) {
        return false;
      }

      // Update incident with resolution
      const resolvedIncident: IncidentCard = {
        ...incident,
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        investigation: {
          ...incident.investigation,
          findings: [...(incident.investigation.findings || []), resolution.rootCause],
          // Add resolution details
        },
        updatedAt: new Date().toISOString(),
        tags: [...incident.tags, 'resolved', `resolved_by_${resolution.resolvedBy}`]
      };

      // Update storage
      this.activeIncidents.set(incidentId, resolvedIncident);
      await this.updateIncidentCard(resolvedIncident);
      
      // Clean up resources (sandboxes, snapshots beyond retention)
      await this.cleanupIncidentResources(resolvedIncident);
      
      await this.logIncidentEvent('incident_resolved', {
        incidentId,
        rootCause: resolution.rootCause,
        solution: resolution.solution,
        resolvedBy: resolution.resolvedBy
      });

      return true;

    } catch (error) {
      await this.logIncidentEvent('incident_resolution_error', {
        incidentId,
        error: error.message
      });
      return false;
    }
  }

  // Generate Escalation Payload for Provider Portal
  async generateEscalationPayload(
    incident: IncidentCard,
    tierASummary?: TierASummaryResult,
    tierBAnalysis?: TierBDeepDiveResult
  ): Promise<EscalationPayload> {
    try {
      // Get snapshot if available
      let snapshot: MaskedSnapshot | undefined;
      if (incident.repro.maskedSnapshotId) {
        snapshot = await this.getMaskedSnapshot(incident.repro.maskedSnapshotId);
      }

      // Generate feature flag matrix
      const featureFlagMatrix = await this.generateFeatureFlagMatrix(incident);
      
      // Get recent deployments
      const recentDeployments = await this.getRecentDeployments();
      
      // Generate dashboard links
      const dashboardLinks = this.generateDashboardLinks(incident);
      
      const payload: EscalationPayload = {
        incidentCard: incident,
        maskedSnapshot: snapshot!,
        tierASummary,
        tierBAnalysis,
        featureFlagMatrix,
        recentDeployments,
        dashboardLinks,
        escalationReason: this.determineEscalationReason(incident, tierASummary, tierBAnalysis),
        urgencyLevel: this.mapSeverityToUrgency(incident.severity),
        estimatedBusinessImpact: await this.estimateBusinessImpact(incident)
      };

      // Create repro sandbox if needed
      if (snapshot && this.shouldCreateReproSandbox(incident)) {
        payload.reproSandbox = await this.createReproSandbox(incident, snapshot, {});
      }

      return payload;

    } catch (error) {
      await this.logIncidentEvent('escalation_payload_error', {
        incidentId: incident.id,
        error: error.message
      });
      throw error;
    }
  }

  // Helper Methods
  private generateIncidentId(cluster: ErrorCluster): string {
    return `incident_${cluster.fingerprint}_${this.tenantId}`;
  }

  private estimateAffectedSessions(cluster: ErrorCluster): number {
    // Heuristic: unique users * average sessions per user (assume 1.5)
    return Math.ceil(cluster.uniqueUsers * 1.5);
  }

  private determineEnvironment(event: ErrorEvent): 'prod' | 'staging' | 'dev' | 'test' {
    return event.environment;
  }

  private identifyServiceAreas(endpoints: string[]): string[] {
    const serviceAreas: string[] = [];
    
    for (const endpoint of endpoints) {
      if (endpoint.includes('/auth') || endpoint.includes('/login')) {
        serviceAreas.push('authentication');
      } else if (endpoint.includes('/billing') || endpoint.includes('/payment')) {
        serviceAreas.push('billing');
      } else if (endpoint.includes('/api/')) {
        serviceAreas.push('api');
      } else if (endpoint.includes('/dashboard')) {
        serviceAreas.push('dashboard');
      } else {
        serviceAreas.push('general');
      }
    }
    
    return [...new Set(serviceAreas)];
  }

  private generateFallbackCause(cluster: ErrorCluster): string {
    const errorType = cluster.representative.errorType;
    const route = cluster.representative.route;
    return `${errorType} error on ${route} affecting ${cluster.uniqueUsers} users`;
  }

  private inferLikelyChange(cluster: ErrorCluster): 'deploy' | 'flag' | 'dependency' | 'config' | 'unknown' {
    // Simple heuristics based on timing and patterns
    const hoursSinceFirst = (cluster.lastSeen.getTime() - cluster.firstSeen.getTime()) / 3600000;
    
    if (hoursSinceFirst < 2) {
      return 'deploy'; // Recent sudden onset suggests deployment
    } else if (Object.keys(cluster.representative.featureFlags).length > 0) {
      return 'flag'; // Feature flags present
    } else {
      return 'unknown';
    }
  }

  private generateReproSteps(cluster: ErrorCluster): string[] {
    const steps: string[] = [
      '1. Navigate to the application',
      `2. Access ${cluster.endpoints[0]} endpoint`,
      '3. Perform the action that triggers the error',
      '4. Observe the error behavior'
    ];
    
    // Add role-specific steps if needed
    if (cluster.impactedRoles.length > 0) {
      steps.splice(1, 0, `1.5. Log in as ${cluster.impactedRoles[0]} role`);
    }
    
    return steps;
  }

  private generateTags(cluster: ErrorCluster, summary?: TierASummaryResult): string[] {
    const tags: string[] = [
      cluster.representative.errorType.toLowerCase(),
      cluster.severity,
      `events_${cluster.eventCount}`,
      `users_${cluster.uniqueUsers}`
    ];
    
    if (summary?.likelyChange) {
      tags.push(`likely_${summary.likelyChange}`);
    }
    
    if (cluster.impactedRoles.length > 0) {
      tags.push(...cluster.impactedRoles.map(role => `role_${role.toLowerCase()}`));
    }
    
    return tags;
  }

  private async maskErrorEvents(events: ErrorEvent[]): Promise<Partial<ErrorEvent>[]> {
    return events.map(event => ({
      id: event.id,
      timestamp: event.timestamp,
      message: this.redactPII(event.message),
      errorType: event.errorType,
      route: event.route,
      httpMethod: event.httpMethod,
      statusCode: event.statusCode,
      appVersion: event.appVersion,
      // Remove sensitive fields
      stackTrace: this.redactPII(event.stackTrace),
      userId: event.userId ? this.hashIdentifier(event.userId) : undefined,
      userRole: event.userRole
    }));
  }

  private async reconstructUserJourney(events: ErrorEvent[]): Promise<MaskedSnapshot['userJourney']> {
    const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return {
      steps: [
        'User navigated to application',
        `User accessed ${sortedEvents[0]?.route}`,
        'Error occurred during operation',
        'User experienced failure'
      ],
      expectedOutcome: 'Successful completion of the user action',
      actualOutcome: `${sortedEvents[0]?.errorType} error with message: ${this.redactPII(sortedEvents[0]?.message || '')}`,
      breakpointStep: 2
    };
  }

  private redactPII(text: string): string {
    return text
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, '[PHONE]')
      .replace(/\b[A-Za-z0-9]{32,}\b/g, '[TOKEN]');
  }

  private hashIdentifier(identifier: string): string {
    return createHash('sha256').update(identifier).digest('hex').substring(0, 16);
  }

  private generateSecureToken(): string {
    return createHash('sha256').update(`${Date.now()}_${Math.random()}`).digest('hex');
  }

  private determineEscalationReason(
    incident: IncidentCard,
    tierASummary?: TierASummaryResult,
    tierBAnalysis?: TierBDeepDiveResult
  ): string {
    if (incident.severity === 'critical') {
      return 'Critical severity incident requiring immediate attention';
    } else if (incident.confidence < 0.6) {
      return 'Low confidence analysis requires human expertise';
    } else if (incident.counts.uniqueUsers > 100) {
      return 'High user impact incident';
    } else {
      return 'Automated escalation based on configured criteria';
    }
  }

  private mapSeverityToUrgency(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    return severity as 'low' | 'medium' | 'high' | 'critical';
  }

  private shouldCreateReproSandbox(incident: IncidentCard): boolean {
    return incident.severity === 'high' || incident.severity === 'critical';
  }

  // Placeholder implementations for external dependencies
  private async getMaskedEnvironmentVars(): Promise<Record<string, string>> {
    return { NODE_ENV: 'production', DEBUG_LEVEL: 'error' };
  }

  private async getDeploymentMetadata(version: string): Promise<any> {
    return { version, deployedAt: new Date(), deployer: 'ci-system' };
  }

  private async identifyRedactedSecrets(): Promise<string[]> {
    return ['API_KEY', 'DATABASE_PASSWORD', 'JWT_SECRET'];
  }

  private async generateFeatureFlagMatrix(incident: IncidentCard): Promise<any> {
    return { current: incident.featureFlags, sinceLastDeploy: {} };
  }

  private async getRecentDeployments(): Promise<any[]> {
    return [];
  }

  private generateDashboardLinks(incident: IncidentCard): any {
    return {
      metricsUrl: `https://metrics.example.com/tenant/${this.tenantId}`,
      logsUrl: `https://logs.example.com/tenant/${this.tenantId}`,
      tracingUrl: `https://traces.example.com/tenant/${this.tenantId}`,
      alertsUrl: `https://alerts.example.com/tenant/${this.tenantId}`
    };
  }

  private async estimateBusinessImpact(incident: IncidentCard): Promise<string> {
    const userImpact = incident.counts.uniqueUsers;
    const serviceAreas = incident.serviceAreas;
    
    if (userImpact > 100 && serviceAreas.includes('billing')) {
      return 'High - Revenue impact likely';
    } else if (userImpact > 50) {
      return 'Medium - Significant user disruption';
    } else {
      return 'Low - Limited user impact';
    }
  }

  private async generateSetupInstructions(
    incident: IncidentCard,
    snapshot: MaskedSnapshot
  ): Promise<string[]> {
    return [
      'Clone the incident reproduction environment',
      `Set feature flags: ${JSON.stringify(incident.featureFlags)}`,
      'Install dependencies and start application',
      'Load snapshot data into local environment'
    ];
  }

  private async generateExpectedBehavior(incident: IncidentCard): Promise<string> {
    return `Application should handle ${incident.endpoints[0]} requests without errors`;
  }

  private async generateDebuggingHints(
    incident: IncidentCard,
    snapshot: MaskedSnapshot
  ): Promise<string[]> {
    return [
      `Check logs around ${incident.firstSeen}`,
      `Examine ${incident.likelyChange} changes`,
      'Monitor memory/CPU usage patterns',
      'Verify database connection stability'
    ];
  }

  // Database operations (placeholders)
  private async storeIncidentCard(incident: IncidentCard): Promise<void> {
    // Implementation would store in database
  }

  private async updateIncidentCard(incident: IncidentCard): Promise<void> {
    // Implementation would update database
  }

  private async storeMaskedSnapshot(snapshot: MaskedSnapshot): Promise<void> {
    // Implementation would store snapshot
  }

  private async getMaskedSnapshot(snapshotId: string): Promise<MaskedSnapshot | null> {
    // Implementation would retrieve snapshot
    return null;
  }

  private async provisionSandbox(sandbox: ReproSandbox): Promise<void> {
    // Implementation would provision sandbox infrastructure
    sandbox.status = 'ready';
    sandbox.provisionedAt = new Date();
  }

  private async cleanupIncidentResources(incident: IncidentCard): Promise<void> {
    // Implementation would clean up sandboxes and expired snapshots
  }

  private async logIncidentEvent(event: string, details: any): Promise<void> {
    await this.auditSystem.logActivity({
      action: event,
      target: 'incident_manager',
      targetId: details.incidentId || this.tenantId,
      category: 'SYSTEM',
      severity: 'MEDIUM',
      details: {
        ...details,
        tenantId: this.tenantId
      },
      context: {
        ipAddress: 'system',
        userAgent: 'incident_manager',
        sessionId: 'incident_session'
      }
    });
  }
}

// Factory Function
export function createIncidentManager(tenantId: string): IncidentManager {
  return new IncidentManager(tenantId);
}

export type {
  IncidentCard,
  MaskedSnapshot,
  ReproSandbox,
  EscalationPayload
};