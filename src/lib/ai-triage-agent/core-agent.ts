// src/lib/ai-triage-agent/core-agent.ts
// Client-Side AI Triage Agent - Core System
// Robinson Solutions B2B SaaS Platform

import { createHash } from 'crypto';
import { createStaffAuditSystem } from "../staff-audit-system";

export interface ErrorEvent {
  id: string;
  timestamp: Date;
  tenantId: string;
  
  // Error Details
  message: string;
  stackTrace: string;
  errorType: string;
  route: string;
  httpMethod: string;
  statusCode?: number;
  
  // Context
  userId?: string;
  userRole?: string;
  appVersion: string;
  environment: 'prod' | 'staging' | 'dev';
  commitHash: string;
  featureFlags: Record<string, boolean>;
  
  // Performance Metrics
  responseTime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  
  // Request Context (PII-redacted)
  requestId: string;
  sessionId?: string;
  ipAddress?: string; // Hashed for privacy
  userAgent?: string;
  
  // Metadata
  severity: 'low' | 'medium' | 'high' | 'critical';
  fingerprint?: string;
  clusterId?: string;
}

export interface PerformanceAnomaly {
  id: string;
  timestamp: Date;
  tenantId: string;
  
  // Metrics
  metricType: 'latency' | 'throughput' | 'error_rate' | 'memory' | 'cpu';
  currentValue: number;
  baselineValue: number;
  threshold: number;
  spikeMultiplier: number;
  
  // Context
  endpoint: string;
  httpMethod: string;
  appVersion: string;
  environment: string;
  
  // Time Series Data
  timeWindow: string; // e.g., "5m", "15m", "1h"
  samples: number;
  
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorCluster {
  id: string;
  fingerprint: string;
  tenantId: string;
  
  // Cluster Metadata
  firstSeen: Date;
  lastSeen: Date;
  eventCount: number;
  uniqueUsers: number;
  
  // Representative Error
  representative: ErrorEvent;
  exemplars: ErrorEvent[]; // Top 3 examples
  
  // Analysis
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0.0-1.0
  shortCause?: string;
  likelyChange?: 'deploy' | 'flag' | 'dependency' | 'config' | 'unknown';
  impactedRoles: string[];
  endpoints: string[];
  
  // Triage Status
  triaged: boolean;
  escalated: boolean;
  lastTriageRun?: Date;
}

export interface TriageThresholds {
  // Performance Thresholds
  latencyP95Ms: number;
  errorRatePct: number;
  spikeMultiplier: number;
  novelFingerprintMinCount: number;
  
  // Cost Controls
  monthlyTokenBudget: number;
  perMinuteTokenLimit: number;
  batchingIntervalSeconds: number;
  reservoirSamplingPct: number;
  maxExamplesPerCluster: number;
  maxClustersPerSummary: number;
  guardedContextKb: number;
  
  // Escalation Gates
  escalationSeverityMin: 'medium' | 'high' | 'critical';
  escalationConfidenceThreshold: number;
}

export interface TriageConfig {
  tenantId: string;
  enabled: boolean;
  sensitivity: 'conservative' | 'normal' | 'aggressive';
  thresholds: TriageThresholds;
  
  // Provider Budget (not tenant's AI quota)
  providerBudget: {
    monthlyTokenLimit: number;
    currentUsage: number;
    lastReset: Date;
    hardStop: boolean;
  };
  
  // Data Retention
  dataRetentionDays: number;
  piiRedactionEnabled: boolean;
}

export class AITriageAgent {
  private tenantId: string;
  private config: TriageConfig;
  private auditSystem: any;
  private activeClusterMap: Map<string, ErrorCluster> = new Map();

  constructor(tenantId: string, config: TriageConfig) {
    this.tenantId = tenantId;
    this.config = config;
    this.auditSystem = createStaffAuditSystem(tenantId, 'ai_triage_agent', 'triage_session');
  }

  // Core Triage Processing Pipeline
  async processEvents(events: ErrorEvent[], anomalies: PerformanceAnomaly[]): Promise<{
    clustersUpdated: ErrorCluster[];
    newIncidents: any[];
    escalations: any[];
    tokenUsage: number;
  }> {
    try {
      if (!this.config.enabled) {
        return { clustersUpdated: [], newIncidents: [], escalations: [], tokenUsage: 0 };
      }

      // Check budget constraints
      const budgetCheck = await this.checkBudgetConstraints();
      if (!budgetCheck.allowed) {
        await this.logTriageEvent('budget_exhausted', { reason: budgetCheck.reason });
        return { clustersUpdated: [], newIncidents: [], escalations: [], tokenUsage: 0 };
      }

      // Apply reservoir sampling for cost control
      const sampledEvents = this.applyReservoirSampling(events);
      
      // Redact PII from events
      const redactedEvents = await this.redactPII(sampledEvents);
      
      // Generate fingerprints and cluster errors
      const clusters = await this.clusterErrors(redactedEvents);
      
      // Merge with existing clusters
      const updatedClusters = await this.mergeWithExistingClusters(clusters);
      
      // Analyze performance anomalies
      const anomalyAnalysis = await this.analyzePerformanceAnomalies(anomalies);
      
      // Determine which clusters need LLM analysis
      const triageableItems = this.selectItemsForLLMTriage(updatedClusters, anomalyAnalysis);
      
      // Run AI analysis (tier A and tier B)
      const llmResults = await this.runLLMAnalysis(triageableItems);
      
      // Generate incident cards
      const incidents = await this.generateIncidentCards(updatedClusters, llmResults.summaries);
      
      // Check escalation criteria
      const escalations = await this.checkEscalationCriteria(incidents);
      
      // Update cluster storage
      await this.updateClusterStorage(updatedClusters);
      
      // Log triage activity
      await this.logTriageEvent('triage_completed', {
        eventsProcessed: events.length,
        clustersUpdated: updatedClusters.length,
        incidentsGenerated: incidents.length,
        escalations: escalations.length,
        tokenUsage: llmResults.tokenUsage
      });

      return {
        clustersUpdated: updatedClusters,
        newIncidents: incidents,
        escalations,
        tokenUsage: llmResults.tokenUsage
      };

    } catch (error) {
      await this.logTriageEvent('triage_error', { error: error.message });
      throw error;
    }
  }

  // Error Fingerprinting and Clustering
  private async clusterErrors(events: ErrorEvent[]): Promise<ErrorCluster[]> {
    const clusterMap = new Map<string, ErrorEvent[]>();
    
    // Generate fingerprints and group events
    for (const event of events) {
      const fingerprint = this.generateErrorFingerprint(event);
      event.fingerprint = fingerprint;
      
      if (!clusterMap.has(fingerprint)) {
        clusterMap.set(fingerprint, []);
      }
      clusterMap.get(fingerprint)!.push(event);
    }
    
    // Create clusters from grouped events
    const clusters: ErrorCluster[] = [];
    for (const [fingerprint, groupedEvents] of clusterMap) {
      if (groupedEvents.length >= this.getMinClusterSize()) {
        const cluster = this.createClusterFromEvents(fingerprint, groupedEvents);
        clusters.push(cluster);
      }
    }
    
    return clusters;
  }

  // Generate Error Fingerprint for Clustering
  private generateErrorFingerprint(event: ErrorEvent): string {
    // Normalize error message (remove dynamic parts)
    const normalizedMessage = this.normalizeErrorMessage(event.message);
    
    // Extract stack trace top (most relevant for clustering)
    const stackTop = this.extractStackTop(event.stackTrace);
    
    // Create fingerprint components
    const components = [
      normalizedMessage,
      stackTop,
      event.route,
      event.httpMethod,
      event.errorType,
      event.appVersion
    ];
    
    // Generate hash
    const fingerprint = createHash('sha256')
      .update(components.join('|'))
      .digest('hex')
      .substring(0, 16);
    
    return fingerprint;
  }

  // Normalize Error Messages for Better Clustering
  private normalizeErrorMessage(message: string): string {
    return message
      // Remove dynamic IDs, timestamps, numbers
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, 'UUID')
      .replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, 'TIMESTAMP')
      .replace(/\b\d+\b/g, 'NUMBER')
      .replace(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, 'EMAIL')
      .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, 'IP')
      // Normalize paths and IDs
      .replace(/\/[0-9]+\//g, '/ID/')
      .replace(/id:\s*\d+/gi, 'id:ID')
      .replace(/user:\s*\d+/gi, 'user:ID')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Extract Top of Stack Trace for Fingerprinting
  private extractStackTop(stackTrace: string): string {
    const lines = stackTrace.split('\n');
    const relevantLines = lines
      .slice(0, 3) // Top 3 stack frames
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Extract function and file info, normalize line numbers
        return line.replace(/:\d+:\d+/g, ':LINE:COL');
      });
    
    return relevantLines.join('|');
  }

  // Create Cluster from Grouped Events
  private createClusterFromEvents(fingerprint: string, events: ErrorEvent[]): ErrorCluster {
    // Sort by timestamp to get chronological order
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    const representative = this.selectRepresentativeEvent(events);
    const exemplars = this.selectExemplars(events);
    
    // Calculate cluster metadata
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;
    // ENTERPRISE AUDIT NOTE: Improve role impact tracking
    // TODO: Add role hierarchy analysis, permission-based impact scoring
    // Current: Basic role filtering | Industry Standard: Role dependency mapping
    const impactedRoles = [...new Set(events.map(e => e.userRole).filter((role): role is string => Boolean(role)))];  // Type-safe filtering
    const endpoints = [...new Set(events.map(e => `${e.httpMethod} ${e.route}`))];
    
    // Determine initial severity
    const severity = this.calculateClusterSeverity(events);
    
    return {
      id: `cluster_${fingerprint}`,
      fingerprint,
      tenantId: this.tenantId,
      firstSeen: firstEvent.timestamp,
      lastSeen: lastEvent.timestamp,
      eventCount: events.length,
      uniqueUsers,
      representative,
      exemplars,
      severity,
      confidence: 0.8, // Initial confidence, will be updated by LLM
      impactedRoles,
      endpoints,
      triaged: false,
      escalated: false
    };
  }

  // Select Representative Event from Cluster
  private selectRepresentativeEvent(events: ErrorEvent[]): ErrorEvent {
    // Prefer events with more complete context
    return events.reduce((best, current) => {
      const bestScore = this.scoreEventCompleteness(best);
      const currentScore = this.scoreEventCompleteness(current);
      return currentScore > bestScore ? current : best;
    });
  }

  // Score Event Based on Context Completeness
  private scoreEventCompleteness(event: ErrorEvent): number {
    let score = 0;
    if (event.stackTrace && event.stackTrace.length > 10) score += 3;
    if (event.userId) score += 2;
    if (event.userRole) score += 1;
    if (event.responseTime) score += 1;
    if (event.statusCode) score += 1;
    if (Object.keys(event.featureFlags).length > 0) score += 2;
    return score;
  }

  // Select Best Exemplars for Cluster
  private selectExemplars(events: ErrorEvent[]): ErrorEvent[] {
    const maxExemplars = Math.min(this.config.thresholds.maxExamplesPerCluster, events.length);
    
    // Sort by completeness score and timestamp diversity
    const scoredEvents = events.map(event => ({
      event,
      score: this.scoreEventCompleteness(event),
      timestamp: event.timestamp.getTime()
    }));
    
    // Select diverse exemplars (time-wise and context-wise)
    const selected: ErrorEvent[] = [];
    const sortedByScore = scoredEvents.sort((a, b) => b.score - a.score);
    
    for (const scored of sortedByScore) {
      if (selected.length >= maxExemplars) break;
      
      // Check if this event adds temporal or contextual diversity
      const isDiverse = selected.length === 0 || selected.every(existing => {
        const timeDiff = Math.abs(existing.timestamp.getTime() - scored.timestamp);
        const contextDiff = existing.userRole !== scored.event.userRole || 
                           existing.route !== scored.event.route;
        return timeDiff > 300000 || contextDiff; // 5 minutes or different context
      });
      
      if (isDiverse) {
        selected.push(scored.event);
      }
    }
    
    return selected;
  }

  // Calculate Cluster Severity
  private calculateClusterSeverity(events: ErrorEvent[]): 'low' | 'medium' | 'high' | 'critical' {
    const recentEvents = events.filter(e => 
      Date.now() - e.timestamp.getTime() < 3600000 // Last hour
    );
    
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;
    const errorRate = recentEvents.length;
    
    // Critical: High volume affecting many users
    if (errorRate > 50 && uniqueUsers > 10) return 'critical';
    if (events.some(e => e.severity === 'critical')) return 'critical';
    
    // High: Moderate volume or affecting multiple users
    if (errorRate > 20 || uniqueUsers > 5) return 'high';
    if (events.some(e => e.severity === 'high')) return 'high';
    
    // Medium: Some impact
    if (errorRate > 5 || uniqueUsers > 1) return 'medium';
    
    return 'low';
  }

  // Merge with Existing Clusters
  private async mergeWithExistingClusters(newClusters: ErrorCluster[]): Promise<ErrorCluster[]> {
    const updatedClusters: ErrorCluster[] = [];
    
    for (const newCluster of newClusters) {
      const existingCluster = this.activeClusterMap.get(newCluster.fingerprint);
      
      if (existingCluster) {
        // Merge with existing cluster
        const merged = this.mergeClusters(existingCluster, newCluster);
        this.activeClusterMap.set(newCluster.fingerprint, merged);
        updatedClusters.push(merged);
      } else {
        // New cluster
        this.activeClusterMap.set(newCluster.fingerprint, newCluster);
        updatedClusters.push(newCluster);
      }
    }
    
    return updatedClusters;
  }

  // Merge Two Clusters
  private mergeClusters(existing: ErrorCluster, newCluster: ErrorCluster): ErrorCluster {
    return {
      ...existing,
      lastSeen: newCluster.lastSeen,
      eventCount: existing.eventCount + newCluster.eventCount,
      uniqueUsers: Math.max(existing.uniqueUsers, newCluster.uniqueUsers),
      exemplars: this.mergeExemplars(existing.exemplars, newCluster.exemplars),
      severity: this.maxSeverity(existing.severity, newCluster.severity),
      impactedRoles: [...new Set([...existing.impactedRoles, ...newCluster.impactedRoles])],
      endpoints: [...new Set([...existing.endpoints, ...newCluster.endpoints])],
      triaged: false // Reset triage status for updated clusters
    };
  }

  // Merge Exemplars from Two Clusters
  private mergeExemplars(existing: ErrorEvent[], newExemplars: ErrorEvent[]): ErrorEvent[] {
    const combined = [...existing, ...newExemplars];
    const maxExemplars = this.config.thresholds.maxExamplesPerCluster;
    
    // Re-select best exemplars from combined set
    return this.selectExemplars(combined).slice(0, maxExemplars);
  }

  // Get Maximum Severity
  private maxSeverity(a: string, b: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    const maxLevel = Math.max(severityOrder[a as keyof typeof severityOrder], 
                              severityOrder[b as keyof typeof severityOrder]);
    return Object.keys(severityOrder)[maxLevel] as 'low' | 'medium' | 'high' | 'critical';
  }

  // Apply Reservoir Sampling for Cost Control
  private applyReservoirSampling(events: ErrorEvent[]): ErrorEvent[] {
    const samplingRate = this.config.thresholds.reservoirSamplingPct / 100;
    if (samplingRate >= 1.0) return events;
    
    const sampleSize = Math.ceil(events.length * samplingRate);
    const sampled: ErrorEvent[] = [];
    
    for (let i = 0; i < events.length; i++) {
      if (sampled.length < sampleSize) {
        sampled.push(events[i]);
      } else {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        if (randomIndex < sampleSize) {
          sampled[randomIndex] = events[i];
        }
      }
    }
    
    return sampled;
  }

  // PII Redaction
  private async redactPII(events: ErrorEvent[]): Promise<ErrorEvent[]> {
    if (!this.config.piiRedactionEnabled) return events;
    
    return events.map(event => ({
      ...event,
      message: this.redactPIIFromText(event.message),
      stackTrace: this.redactPIIFromText(event.stackTrace),
      ipAddress: event.ipAddress ? this.hashIdentifier(event.ipAddress) : undefined,
      userId: event.userId ? this.hashIdentifier(event.userId) : undefined
    }));
  }

  // Redact PII from Text
  private redactPIIFromText(text: string): string {
    return text
      // Email addresses
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      // Phone numbers
      .replace(/\b(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, '[PHONE]')
      // Credit card-like numbers
      .replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[CARD]')
      // SSN-like patterns
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
      // Addresses (simple pattern)
      .replace(/\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/gi, '[ADDRESS]')
      // API keys and tokens (simple heuristic)
      .replace(/\b[A-Za-z0-9]{32,}\b/g, '[TOKEN]');
  }

  // Hash Identifier for Correlation
  private hashIdentifier(identifier: string): string {
    return createHash('sha256').update(identifier).digest('hex').substring(0, 16);
  }

  // Check Budget Constraints
  private async checkBudgetConstraints(): Promise<{ allowed: boolean; reason?: string }> {
    const budget = this.config.providerBudget;
    
    // Check if hard stop is enabled and budget exhausted
    if (budget.hardStop && budget.currentUsage >= budget.monthlyTokenLimit) {
      return { allowed: false, reason: 'Monthly token budget exhausted' };
    }
    
    // Check per-minute rate limit (simplified)
    const currentMinute = Math.floor(Date.now() / 60000);
    const estimatedTokensThisMinute = this.estimateTokenUsage();
    
    if (estimatedTokensThisMinute > this.config.thresholds.perMinuteTokenLimit) {
      return { allowed: false, reason: 'Per-minute token limit exceeded' };
    }
    
    return { allowed: true };
  }

  // Estimate Token Usage for Current Batch
  private estimateTokenUsage(): number {
    // Rough estimation based on cluster count and context size
    const activeClusters = this.activeClusterMap.size;
    const estimatedTokensPerCluster = 150; // Conservative estimate
    return activeClusters * estimatedTokensPerCluster;
  }

  // Get Minimum Cluster Size Based on Sensitivity
  private getMinClusterSize(): number {
    switch (this.config.sensitivity) {
      case 'aggressive': return 1;
      case 'normal': return 3;
      case 'conservative': return 5;
      default: return 3;
    }
  }

  // Placeholder methods for LLM integration and other features
  private selectItemsForLLMTriage(clusters: ErrorCluster[], anomalies: any[]): any[] {
    return clusters.filter(c => !c.triaged || c.severity === 'high' || c.severity === 'critical');
  }

  private async runLLMAnalysis(items: any[]): Promise<{ summaries: any[]; tokenUsage: number }> {
    // This will be implemented in the LLM integration component
    return { summaries: [], tokenUsage: 0 };
  }

  private async analyzePerformanceAnomalies(anomalies: PerformanceAnomaly[]): Promise<any[]> {
    // Performance anomaly analysis will be implemented
    return [];
  }

  private async generateIncidentCards(clusters: ErrorCluster[], summaries: any[]): Promise<any[]> {
    // Incident card generation will be implemented
    return [];
  }

  private async checkEscalationCriteria(incidents: any[]): Promise<any[]> {
    // Escalation logic will be implemented
    return [];
  }

  private async updateClusterStorage(clusters: ErrorCluster[]): Promise<void> {
    // Storage implementation will be added
  }

  private async logTriageEvent(event: string, details: any): Promise<void> {
    await this.auditSystem.logActivity({
      action: event,
      target: 'ai_triage_agent',
      targetId: this.tenantId,
      category: 'SYSTEM',
      severity: 'LOW',
      details: {
        ...details,
        tenantId: this.tenantId,
        configEnabled: this.config.enabled
      },
      context: {
        ipAddress: 'system',
        userAgent: 'ai_triage_agent',
        sessionId: 'triage_session'
      }
    });
  }
}

// Factory Function
export function createAITriageAgent(tenantId: string, config: TriageConfig): AITriageAgent {
  return new AITriageAgent(tenantId, config);
}

// Default Configuration
export const DEFAULT_TRIAGE_THRESHOLDS: TriageThresholds = {
  latencyP95Ms: 1500,
  errorRatePct: 2.0,
  spikeMultiplier: 3.0,
  novelFingerprintMinCount: 5,
  monthlyTokenBudget: 100000,
  perMinuteTokenLimit: 2000,
  batchingIntervalSeconds: 300,
  reservoirSamplingPct: 5,
  maxExamplesPerCluster: 3,
  maxClustersPerSummary: 20,
  guardedContextKb: 2,
  escalationSeverityMin: 'high',
  escalationConfidenceThreshold: 0.6
};

// ENTERPRISE AUDIT NOTE: AI Triage System Export Analysis
// Current: Basic type exports | Industry Standard: Comprehensive monitoring SDK
// TODO: Create enterprise-grade monitoring SDK with:
// - Real-time dashboards, alerting integrations, SLA tracking
// - ML-powered anomaly detection, root cause analysis
// - Enterprise compliance: SOC2, GDPR data handling
// Types already exported above as interfaces, no need to re-export