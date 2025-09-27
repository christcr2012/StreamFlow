// Client-side event tracking utilities

interface TrackEventOptions {
  featureKey: string;
  eventType: 'view' | 'click' | 'create' | 'update' | 'complete' | 'search' | 'export';
  metadata?: Record<string, any>;
  duration?: number;
}

class EventTracker {
  private sessionId: string;
  private startTimes: Map<string, number> = new Map();

  constructor() {
    // Generate a session ID for this browser session
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Track a user event
   */
  async track(options: TrackEventOptions): Promise<void> {
    try {
      await fetch('/api/ai/track-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId,
        },
        body: JSON.stringify(options),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
      // Don't throw - we don't want to break the user experience if tracking fails
    }
  }

  /**
   * Track page view with automatic feature detection
   */
  trackPageView(path: string, metadata?: Record<string, any>): void {
    const featureKey = this.pathToFeatureKey(path);
    this.track({
      featureKey,
      eventType: 'view',
      metadata: {
        ...metadata,
        path,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Start timing an operation (e.g., form completion, search)
   */
  startTiming(operationId: string): void {
    this.startTimes.set(operationId, Date.now());
  }

  /**
   * End timing and track the event with duration
   */
  endTiming(operationId: string, options: Omit<TrackEventOptions, 'duration'>): void {
    const startTime = this.startTimes.get(operationId);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.startTimes.delete(operationId);
      
      this.track({
        ...options,
        duration,
      });
    } else {
      // Track without duration if timing wasn't started
      this.track(options);
    }
  }

  /**
   * Track button clicks with automatic feature detection
   */
  trackClick(element: HTMLElement, metadata?: Record<string, any>): void {
    const featureKey = this.elementToFeatureKey(element);
    const buttonText = element.textContent?.trim() || '';
    
    this.track({
      featureKey,
      eventType: 'click',
      metadata: {
        ...metadata,
        buttonText,
        elementId: element.id,
        elementClass: element.className,
      },
    });
  }

  /**
   * Convert URL path to feature key
   */
  private pathToFeatureKey(path: string): string {
    // Remove leading slash and query parameters
    const cleanPath = path.replace(/^\//, '').split('?')[0];
    
    // Map common paths to feature keys
    const pathMappings: Record<string, string> = {
      '': 'dashboard.home',
      'dashboard': 'dashboard.home',
      'dashboard/premium': 'dashboard.premium',
      'dashboard/provider': 'dashboard.provider',
      'leads': 'leads.list',
      'leads/create': 'leads.create',
      'clients': 'clients.list',
      'schedule': 'scheduling.board',
      'jobs': 'jobs.list',
      'invoices': 'billing.invoices',
      'analytics': 'analytics.dashboard',
      'settings': 'settings.general',
      'admin': 'admin.dashboard',
      'admin/user-management': 'admin.users',
      'admin/feature-controls': 'admin.features',
      'admin/billing': 'admin.billing',
      'provider/analytics': 'provider.analytics',
      'provider/clients': 'provider.clients',
      'provider/revenue': 'provider.revenue',
    };

    return pathMappings[cleanPath] || cleanPath.replace(/\//g, '.');
  }

  /**
   * Convert DOM element to feature key based on context
   */
  private elementToFeatureKey(element: HTMLElement): string {
    // Try to get feature context from data attributes
    const featureKey = element.getAttribute('data-feature-key');
    if (featureKey) return featureKey;

    // Try to infer from parent containers
    let parent = element.parentElement;
    while (parent) {
      const parentFeatureKey = parent.getAttribute('data-feature-key');
      if (parentFeatureKey) return parentFeatureKey;
      parent = parent.parentElement;
    }

    // Fallback to current page
    return this.pathToFeatureKey(window.location.pathname);
  }
}

// Create a singleton instance
export const eventTracker = new EventTracker();

// React hook for easy usage in components
export function useEventTracking() {
  const trackEvent = (options: TrackEventOptions) => {
    eventTracker.track(options);
  };

  const trackPageView = (path?: string, metadata?: Record<string, any>) => {
    eventTracker.trackPageView(path || window.location.pathname, metadata);
  };

  const trackClick = (element: HTMLElement, metadata?: Record<string, any>) => {
    eventTracker.trackClick(element, metadata);
  };

  const startTiming = (operationId: string) => {
    eventTracker.startTiming(operationId);
  };

  const endTiming = (operationId: string, options: Omit<TrackEventOptions, 'duration'>) => {
    eventTracker.endTiming(operationId, options);
  };

  return {
    trackEvent,
    trackPageView,
    trackClick,
    startTiming,
    endTiming,
  };
}

// Helper function for manual event tracking without React
export function trackEvent(options: TrackEventOptions): void {
  eventTracker.track(options);
}

// Common event tracking helpers
export const Events = {
  // Lead Management
  LEAD_CREATED: (metadata?: any) => trackEvent({ featureKey: 'leads.create', eventType: 'create', metadata }),
  LEAD_VIEWED: (leadId: string) => trackEvent({ featureKey: 'leads.view', eventType: 'view', metadata: { leadId } }),
  LEAD_UPDATED: (leadId: string) => trackEvent({ featureKey: 'leads.update', eventType: 'update', metadata: { leadId } }),
  LEAD_CONVERTED: (leadId: string) => trackEvent({ featureKey: 'leads.convert', eventType: 'complete', metadata: { leadId } }),

  // Scheduling
  SCHEDULE_VIEWED: () => trackEvent({ featureKey: 'scheduling.board', eventType: 'view' }),
  WORK_ORDER_CREATED: (metadata?: any) => trackEvent({ featureKey: 'scheduling.create', eventType: 'create', metadata }),
  TECHNICIAN_ASSIGNED: (workOrderId: string) => trackEvent({ featureKey: 'scheduling.assign', eventType: 'update', metadata: { workOrderId } }),

  // Billing
  INVOICE_CREATED: (metadata?: any) => trackEvent({ featureKey: 'billing.create', eventType: 'create', metadata }),
  PAYMENT_PROCESSED: (invoiceId: string) => trackEvent({ featureKey: 'billing.payment', eventType: 'complete', metadata: { invoiceId } }),

  // Analytics
  REPORT_VIEWED: (reportType: string) => trackEvent({ featureKey: 'analytics.report', eventType: 'view', metadata: { reportType } }),
  DATA_EXPORTED: (exportType: string) => trackEvent({ featureKey: 'analytics.export', eventType: 'export', metadata: { exportType } }),

  // AI Features
  AI_ASSISTANT_USED: () => trackEvent({ featureKey: 'ai.assistant', eventType: 'click' }),
  AI_RECOMMENDATION_VIEWED: (featureKey: string) => trackEvent({ featureKey: 'ai.recommendation', eventType: 'view', metadata: { recommendedFeature: featureKey } }),
  AI_RECOMMENDATION_ACCEPTED: (featureKey: string) => trackEvent({ featureKey: 'ai.recommendation', eventType: 'complete', metadata: { recommendedFeature: featureKey } }),
};