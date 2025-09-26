// src/lib/ai-triage-agent/tenant-controls.ts
// AI Triage Agent Tenant Controls - Owner Dashboard & Feature Management
// Robinson Solutions B2B SaaS Platform

import { createStaffAuditSystem } from "../staff-audit-system";
import type { IncidentCard } from './incident-management';
import type { TokenUsageRecord, TenantCostProfile } from './cost-control';
import type { TriageConfig } from './core-agent';

export interface TenantTriageSettings {
  tenantId: string;
  ownerId: string;
  
  // Feature Control
  featureEnabled: boolean;
  sensitivity: 'conservative' | 'normal' | 'aggressive';
  
  // Notification Preferences
  notifications: {
    email: {
      enabled: boolean;
      addresses: string[];
      frequency: 'immediate' | 'hourly' | 'daily';
      severityThreshold: 'medium' | 'high' | 'critical';
    };
    slack: {
      enabled: boolean;
      webhookUrl?: string;
      channel?: string;
      mentionUsers: string[];
    };
    inApp: {
      enabled: boolean;
      desktopNotifications: boolean;
      soundEnabled: boolean;
    };
  };
  
  // Dashboard Preferences
  dashboard: {
    defaultTimeRange: '1h' | '6h' | '24h' | '7d' | '30d';
    autoRefresh: boolean;
    refreshInterval: number; // seconds
    showResolvedIncidents: boolean;
    hideLowSeverity: boolean;
    compactView: boolean;
  };
  
  // Privacy Controls
  privacy: {
    allowProviderAccess: boolean;
    shareAggregatedMetrics: boolean;
    retainIncidentHistory: boolean;
    anonymizeUserData: boolean;
  };
  
  // Advanced Controls
  advanced: {
    customThresholds: {
      latencyMs?: number;
      errorRatePercent?: number;
      userImpactCount?: number;
    };
    excludedEndpoints: string[];
    excludedErrorTypes: string[];
    customEscalationCriteria: string[];
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBy: string;
}

export interface DashboardWidget {
  id: string;
  type: 'incidents_summary' | 'cost_overview' | 'performance_metrics' | 'escalation_status' | 'recent_activity';
  title: string;
  
  // Widget Configuration
  config: {
    timeRange: string;
    refreshRate: number;
    showDetails: boolean;
    colorScheme: 'default' | 'colorblind' | 'high_contrast';
  };
  
  // Widget Data
  data: any;
  
  // Display Properties
  position: { x: number; y: number; width: number; height: number };
  visible: boolean;
  collapsed: boolean;
}

export interface TenantDashboard {
  tenantId: string;
  dashboardId: string;
  
  // Dashboard Metadata
  name: string;
  description: string;
  isDefault: boolean;
  
  // Layout Configuration
  layout: {
    columns: number;
    gridSize: number;
    responsiveBreakpoints: Record<string, number>;
  };
  
  // Widgets
  widgets: DashboardWidget[];
  
  // Access Control
  sharedWith: string[]; // User IDs who can view this dashboard
  publiclyVisible: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface TriageAgentStatus {
  // System Status
  systemStatus: 'healthy' | 'degraded' | 'error' | 'maintenance';
  lastProcessedAt: Date;
  processedEvents: number;
  
  // Cost Tracking (Provider-paid)
  costTracking: {
    currentMonthSpend: number; // Provider's cost
    budgetRemaining: number;
    tokenUsage: {
      tierA: number;
      tierB: number;
      total: number;
    };
    costEfficiency: number; // Cost per incident detected
  };
  
  // Performance Metrics
  performance: {
    averageProcessingTime: number; // milliseconds
    successRate: number; // percentage
    falsePositiveRate: number; // percentage
    escalationRate: number; // percentage
  };
  
  // Active Monitoring
  activeIncidents: {
    total: number;
    bySeverity: Record<string, number>;
    unresolved: number;
    escalated: number;
  };
  
  // System Health
  systemHealth: {
    llmApiStatus: 'healthy' | 'degraded' | 'unavailable';
    errorDetectionRate: number;
    clusteringAccuracy: number;
    providerConnectivity: 'connected' | 'disconnected' | 'limited';
  };
}

export interface UsageAnalytics {
  timeframe: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  
  // Event Processing
  eventProcessing: {
    totalEvents: number;
    processedEvents: number;
    sampledEvents: number;
    skippedEvents: number;
    errorEvents: number;
  };
  
  // Incident Generation
  incidentGeneration: {
    incidentsCreated: number;
    incidentsResolved: number;
    incidentsEscalated: number;
    avgResolutionTime: number; // hours
    falsePositives: number;
  };
  
  // AI Usage
  aiUsage: {
    tierAInvocations: number;
    tierBInvocations: number;
    totalTokensUsed: number;
    averageConfidence: number;
    successRate: number;
  };
  
  // Business Impact
  businessImpact: {
    detectedIssues: number;
    preventedDowntime: number; // estimated hours
    usersProtected: number;
    revenueProtected: number; // estimated
  };
  
  // Trends
  trends: {
    incidentTrend: 'increasing' | 'decreasing' | 'stable';
    performanceTrend: 'improving' | 'degrading' | 'stable';
    costTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

export class TenantControlsManager {
  private tenantId: string;
  private auditSystem: any;
  private settings: TenantTriageSettings | null = null;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.auditSystem = createStaffAuditSystem(tenantId, 'tenant_controls', 'controls_session');
  }

  // Initialize Tenant Controls
  async initializeTenantControls(ownerId: string): Promise<TenantTriageSettings> {
    try {
      // Create default settings
      const defaultSettings: TenantTriageSettings = {
        tenantId: this.tenantId,
        ownerId,
        featureEnabled: true,
        sensitivity: 'normal',
        notifications: {
          email: {
            enabled: true,
            addresses: [await this.getOwnerEmail(ownerId)],
            frequency: 'daily',
            severityThreshold: 'high'
          },
          slack: {
            enabled: false,
            mentionUsers: []
          },
          inApp: {
            enabled: true,
            desktopNotifications: true,
            soundEnabled: false
          }
        },
        dashboard: {
          defaultTimeRange: '24h',
          autoRefresh: true,
          refreshInterval: 300, // 5 minutes
          showResolvedIncidents: false,
          hideLowSeverity: true,
          compactView: false
        },
        privacy: {
          allowProviderAccess: true,
          shareAggregatedMetrics: true,
          retainIncidentHistory: true,
          anonymizeUserData: true
        },
        advanced: {
          customThresholds: {},
          excludedEndpoints: [],
          excludedErrorTypes: [],
          customEscalationCriteria: []
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUpdatedBy: ownerId
      };

      // Store settings
      await this.storeSettings(defaultSettings);
      this.settings = defaultSettings;

      // Create default dashboard
      await this.createDefaultDashboard(ownerId);

      await this.logControlsEvent('tenant_controls_initialized', {
        ownerId,
        featureEnabled: defaultSettings.featureEnabled,
        sensitivity: defaultSettings.sensitivity
      });

      return defaultSettings;

    } catch (error) {
      await this.logControlsEvent('controls_initialization_error', {
        ownerId,
        error: error.message
      });
      throw error;
    }
  }

  // Update Tenant Settings
  async updateSettings(
    updates: Partial<TenantTriageSettings>,
    updatedBy: string
  ): Promise<TenantTriageSettings> {
    try {
      if (!this.settings) {
        this.settings = await this.loadSettings();
      }

      // Validate settings updates
      const validationResult = this.validateSettingsUpdate(updates);
      if (!validationResult.valid) {
        throw new Error(`Invalid settings: ${validationResult.errors.join(', ')}`);
      }

      // Apply updates
      const updatedSettings: TenantTriageSettings = {
        ...this.settings,
        ...updates,
        updatedAt: new Date(),
        lastUpdatedBy: updatedBy
      };

      // Store updated settings
      await this.storeSettings(updatedSettings);
      this.settings = updatedSettings;

      // Apply runtime configuration changes
      await this.applyRuntimeConfigChanges(updates);

      await this.logControlsEvent('settings_updated', {
        updatedBy,
        changes: Object.keys(updates),
        newSensitivity: updatedSettings.sensitivity,
        featureEnabled: updatedSettings.featureEnabled
      });

      return updatedSettings;

    } catch (error) {
      await this.logControlsEvent('settings_update_error', {
        updatedBy,
        error: error.message
      });
      throw error;
    }
  }

  // Get Current Triage Agent Status
  async getTriageAgentStatus(): Promise<TriageAgentStatus> {
    try {
      // Gather status information from various components
      const systemHealth = await this.checkSystemHealth();
      const costTracking = await this.getCostTracking();
      const performance = await this.getPerformanceMetrics();
      const activeIncidents = await this.getActiveIncidentsStatus();

      const status: TriageAgentStatus = {
        systemStatus: systemHealth.overall,
        lastProcessedAt: await this.getLastProcessingTime(),
        processedEvents: await this.getTotalProcessedEvents(),
        costTracking,
        performance,
        activeIncidents,
        systemHealth: systemHealth.details
      };

      return status;

    } catch (error) {
      await this.logControlsEvent('status_retrieval_error', {
        error: error.message
      });
      throw error;
    }
  }

  // Generate Usage Analytics
  async generateUsageAnalytics(
    timeframe: 'daily' | 'weekly' | 'monthly',
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageAnalytics> {
    try {
      const end = endDate || new Date();
      const start = startDate || this.getTimeframeStart(timeframe, end);

      // Gather analytics data
      const eventProcessing = await this.getEventProcessingStats(start, end);
      const incidentGeneration = await this.getIncidentGenerationStats(start, end);
      const aiUsage = await this.getAIUsageStats(start, end);
      const businessImpact = await this.calculateBusinessImpact(start, end);
      const trends = await this.analyzeTrends(timeframe, start, end);

      const analytics: UsageAnalytics = {
        timeframe,
        startDate: start,
        endDate: end,
        eventProcessing,
        incidentGeneration,
        aiUsage,
        businessImpact,
        trends
      };

      await this.logControlsEvent('analytics_generated', {
        timeframe,
        startDate: start,
        endDate: end,
        totalIncidents: incidentGeneration.incidentsCreated
      });

      return analytics;

    } catch (error) {
      await this.logControlsEvent('analytics_generation_error', {
        timeframe,
        error: error.message
      });
      throw error;
    }
  }

  // Create and Manage Custom Dashboard
  async createCustomDashboard(
    name: string,
    description: string,
    createdBy: string,
    widgets: DashboardWidget[]
  ): Promise<TenantDashboard> {
    try {
      const dashboardId = `dashboard_${Date.now()}_${this.tenantId}`;
      
      const dashboard: TenantDashboard = {
        tenantId: this.tenantId,
        dashboardId,
        name,
        description,
        isDefault: false,
        layout: {
          columns: 12,
          gridSize: 20,
          responsiveBreakpoints: {
            sm: 576,
            md: 768,
            lg: 992,
            xl: 1200
          }
        },
        widgets: widgets.map((widget, index) => ({
          ...widget,
          id: `widget_${index}_${Date.now()}`
        })),
        sharedWith: [],
        publiclyVisible: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy
      };

      // Store dashboard
      await this.storeDashboard(dashboard);

      await this.logControlsEvent('custom_dashboard_created', {
        dashboardId,
        name,
        createdBy,
        widgetCount: widgets.length
      });

      return dashboard;

    } catch (error) {
      await this.logControlsEvent('dashboard_creation_error', {
        name,
        createdBy,
        error: error.message
      });
      throw error;
    }
  }

  // Export Incident Data
  async exportIncidentData(
    format: 'json' | 'csv' | 'excel',
    timeRange: { start: Date; end: Date },
    filters: {
      severities?: string[];
      statuses?: string[];
      serviceAreas?: string[];
      escalated?: boolean;
    },
    requestedBy: string
  ): Promise<{
    exportId: string;
    downloadUrl: string;
    format: string;
    recordCount: number;
    fileSizeBytes: number;
    expiresAt: Date;
  }> {
    try {
      // Check export permissions
      if (!this.settings?.privacy.allowProviderAccess && filters.escalated) {
        throw new Error('Provider access not permitted for escalated incident data');
      }

      // Get filtered incident data
      const incidents = await this.getFilteredIncidents(timeRange, filters);
      
      // Apply privacy controls
      const sanitizedIncidents = await this.sanitizeIncidentData(incidents);
      
      // Generate export file
      const exportResult = await this.generateExportFile(sanitizedIncidents, format);
      
      // Create download URL with expiration
      const downloadUrl = await this.createSecureDownloadUrl(exportResult.filePath);
      
      const exportInfo = {
        exportId: exportResult.exportId,
        downloadUrl,
        format,
        recordCount: sanitizedIncidents.length,
        fileSizeBytes: exportResult.fileSize,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      await this.logControlsEvent('incident_data_exported', {
        exportId: exportInfo.exportId,
        format,
        recordCount: exportInfo.recordCount,
        requestedBy,
        timeRange,
        filters
      });

      return exportInfo;

    } catch (error) {
      await this.logControlsEvent('export_error', {
        format,
        requestedBy,
        error: error.message
      });
      throw error;
    }
  }

  // Feature Toggle Management
  async toggleFeature(featureName: string, enabled: boolean, updatedBy: string): Promise<boolean> {
    try {
      if (!this.settings) {
        this.settings = await this.loadSettings();
      }

      // Update specific feature
      const updates: Partial<TenantTriageSettings> = {};
      
      switch (featureName) {
        case 'ai_triage_agent':
          updates.featureEnabled = enabled;
          break;
        case 'email_notifications':
          updates.notifications = {
            ...this.settings.notifications,
            email: { ...this.settings.notifications.email, enabled }
          };
          break;
        case 'slack_notifications':
          updates.notifications = {
            ...this.settings.notifications,
            slack: { ...this.settings.notifications.slack, enabled }
          };
          break;
        case 'provider_access':
          updates.privacy = {
            ...this.settings.privacy,
            allowProviderAccess: enabled
          };
          break;
        default:
          throw new Error(`Unknown feature: ${featureName}`);
      }

      // Apply update
      await this.updateSettings(updates, updatedBy);

      await this.logControlsEvent('feature_toggled', {
        featureName,
        enabled,
        updatedBy
      });

      return true;

    } catch (error) {
      await this.logControlsEvent('feature_toggle_error', {
        featureName,
        enabled,
        updatedBy,
        error: error.message
      });
      return false;
    }
  }

  // Helper Methods
  private validateSettingsUpdate(updates: Partial<TenantTriageSettings>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate sensitivity
    if (updates.sensitivity && !['conservative', 'normal', 'aggressive'].includes(updates.sensitivity)) {
      errors.push('Invalid sensitivity level');
    }

    // Validate notification frequency
    if (updates.notifications?.email?.frequency) {
      const validFrequencies = ['immediate', 'hourly', 'daily'];
      if (!validFrequencies.includes(updates.notifications.email.frequency)) {
        errors.push('Invalid email notification frequency');
      }
    }

    // Validate dashboard refresh interval
    if (updates.dashboard?.refreshInterval && updates.dashboard.refreshInterval < 60) {
      errors.push('Dashboard refresh interval must be at least 60 seconds');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private async applyRuntimeConfigChanges(updates: Partial<TenantTriageSettings>): Promise<void> {
    // Apply configuration changes to running triage agent
    if (updates.featureEnabled !== undefined) {
      await this.toggleTriageAgent(updates.featureEnabled);
    }

    if (updates.sensitivity) {
      await this.updateTriageSensitivity(updates.sensitivity);
    }

    if (updates.advanced?.customThresholds) {
      await this.updateThresholds(updates.advanced.customThresholds);
    }
  }

  private async createDefaultDashboard(createdBy: string): Promise<void> {
    const defaultWidgets: DashboardWidget[] = [
      {
        id: 'incidents_summary',
        type: 'incidents_summary',
        title: 'Incidents Overview',
        config: { timeRange: '24h', refreshRate: 300, showDetails: true, colorScheme: 'default' },
        data: {},
        position: { x: 0, y: 0, width: 6, height: 4 },
        visible: true,
        collapsed: false
      },
      {
        id: 'cost_overview',
        type: 'cost_overview',
        title: 'AI Triage Cost (Provider-Paid)',
        config: { timeRange: '30d', refreshRate: 600, showDetails: false, colorScheme: 'default' },
        data: {},
        position: { x: 6, y: 0, width: 6, height: 4 },
        visible: true,
        collapsed: false
      },
      {
        id: 'recent_activity',
        type: 'recent_activity',
        title: 'Recent Activity',
        config: { timeRange: '6h', refreshRate: 60, showDetails: true, colorScheme: 'default' },
        data: {},
        position: { x: 0, y: 4, width: 12, height: 6 },
        visible: true,
        collapsed: false
      }
    ];

    await this.createCustomDashboard(
      'Default AI Triage Dashboard',
      'Default dashboard for AI Triage Agent monitoring',
      createdBy,
      defaultWidgets
    );
  }

  private getTimeframeStart(timeframe: string, end: Date): Date {
    const start = new Date(end);
    switch (timeframe) {
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
    }
    return start;
  }

  // Placeholder implementations for external dependencies
  private async loadSettings(): Promise<TenantTriageSettings> {
    // Implementation would load from database
    throw new Error('Settings not found');
  }

  private async storeSettings(settings: TenantTriageSettings): Promise<void> {
    // Implementation would store in database
  }

  private async storeDashboard(dashboard: TenantDashboard): Promise<void> {
    // Implementation would store in database
  }

  private async getOwnerEmail(ownerId: string): Promise<string> {
    // Implementation would fetch owner email
    return 'owner@tenant.com';
  }

  private async checkSystemHealth(): Promise<any> {
    // Implementation would check system health
    return {
      overall: 'healthy',
      details: {
        llmApiStatus: 'healthy',
        errorDetectionRate: 95.5,
        clusteringAccuracy: 87.2,
        providerConnectivity: 'connected'
      }
    };
  }

  private async getCostTracking(): Promise<any> {
    // Implementation would get cost information
    return {
      currentMonthSpend: 45.67,
      budgetRemaining: 954.33,
      tokenUsage: { tierA: 12500, tierB: 3200, total: 15700 },
      costEfficiency: 2.34
    };
  }

  private async getPerformanceMetrics(): Promise<any> {
    // Implementation would get performance data
    return {
      averageProcessingTime: 1250,
      successRate: 98.5,
      falsePositiveRate: 3.2,
      escalationRate: 12.8
    };
  }

  private async getActiveIncidentsStatus(): Promise<any> {
    // Implementation would get incident status
    return {
      total: 23,
      bySeverity: { low: 8, medium: 10, high: 4, critical: 1 },
      unresolved: 15,
      escalated: 3
    };
  }

  private async getLastProcessingTime(): Promise<Date> {
    return new Date(Date.now() - 300000); // 5 minutes ago
  }

  private async getTotalProcessedEvents(): Promise<number> {
    return 125430;
  }

  private async getEventProcessingStats(start: Date, end: Date): Promise<any> {
    return {
      totalEvents: 15420,
      processedEvents: 14890,
      sampledEvents: 742,
      skippedEvents: 530,
      errorEvents: 148
    };
  }

  private async getIncidentGenerationStats(start: Date, end: Date): Promise<any> {
    return {
      incidentsCreated: 28,
      incidentsResolved: 22,
      incidentsEscalated: 3,
      avgResolutionTime: 4.2,
      falsePositives: 1
    };
  }

  private async getAIUsageStats(start: Date, end: Date): Promise<any> {
    return {
      tierAInvocations: 156,
      tierBInvocations: 12,
      totalTokensUsed: 18750,
      averageConfidence: 0.78,
      successRate: 96.4
    };
  }

  private async calculateBusinessImpact(start: Date, end: Date): Promise<any> {
    return {
      detectedIssues: 28,
      preventedDowntime: 12.5,
      usersProtected: 1247,
      revenueProtected: 45000
    };
  }

  private async analyzeTrends(timeframe: string, start: Date, end: Date): Promise<any> {
    return {
      incidentTrend: 'decreasing',
      performanceTrend: 'stable',
      costTrend: 'stable'
    };
  }

  private async getFilteredIncidents(timeRange: any, filters: any): Promise<IncidentCard[]> {
    // Implementation would filter and return incidents
    return [];
  }

  private async sanitizeIncidentData(incidents: IncidentCard[]): Promise<any[]> {
    // Implementation would sanitize data based on privacy settings
    return incidents.map(incident => ({
      ...incident,
      // Remove sensitive data based on settings
    }));
  }

  private async generateExportFile(data: any[], format: string): Promise<any> {
    // Implementation would generate export file
    return {
      exportId: `export_${Date.now()}`,
      filePath: `/tmp/exports/export_${Date.now()}.${format}`,
      fileSize: 1024000 // 1MB
    };
  }

  private async createSecureDownloadUrl(filePath: string): Promise<string> {
    // Implementation would create secure download URL
    return `https://secure.downloads.com/file/${encodeURIComponent(filePath)}`;
  }

  private async toggleTriageAgent(enabled: boolean): Promise<void> {
    // Implementation would enable/disable triage agent
  }

  private async updateTriageSensitivity(sensitivity: string): Promise<void> {
    // Implementation would update sensitivity settings
  }

  private async updateThresholds(thresholds: any): Promise<void> {
    // Implementation would update custom thresholds
  }

  private async logControlsEvent(event: string, details: any): Promise<void> {
    await this.auditSystem.logActivity({
      action: event,
      target: 'tenant_controls',
      targetId: this.tenantId,
      category: 'SYSTEM',
      severity: 'LOW',
      details: {
        ...details,
        tenantId: this.tenantId
      },
      context: {
        ipAddress: 'system',
        userAgent: 'tenant_controls',
        sessionId: 'controls_session'
      }
    });
  }
}

// Factory Function
export function createTenantControlsManager(tenantId: string): TenantControlsManager {
  return new TenantControlsManager(tenantId);
}

export type {
  TenantTriageSettings,
  DashboardWidget,
  TenantDashboard,
  TriageAgentStatus,
  UsageAnalytics
};