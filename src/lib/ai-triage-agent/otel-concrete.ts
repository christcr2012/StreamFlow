// src/lib/ai-triage-agent/otel-concrete.ts
// Concrete OpenTelemetry Implementation for AI Triage Agent
// Robinson Solutions B2B SaaS Platform

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import * as opentelemetry from '@opentelemetry/api';
import type { ObservabilityConfig } from './observability-integration';

export class ConcreteOTelManager {
  private sdk: NodeSDK | null = null;
  private tracer: opentelemetry.Tracer | null = null;
  private meter: opentelemetry.Meter | null = null;
  private isInitialized = false;
  private config: ObservabilityConfig;

  constructor(config: ObservabilityConfig) {
    this.config = config;
  }

  // Initialize OpenTelemetry SDK
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      // Create resource attributes
      const resource = new Resource({
        [SEMRESATTRS_SERVICE_NAME]: this.config.otel.serviceName,
        [SEMRESATTRS_SERVICE_VERSION]: this.config.otel.serviceVersion,
        ...this.config.otel.resourceAttributes,
      });

      // Configure trace exporter
      const traceExporter = new OTLPTraceExporter({
        url: `${this.config.otel.exporterEndpoint}/v1/traces`,
        headers: this.config.otel.exporterHeaders,
      });

      // Configure metric exporter
      const metricExporter = new OTLPMetricExporter({
        url: `${this.config.otel.exporterEndpoint}/v1/metrics`,
        headers: this.config.otel.exporterHeaders,
      });

      // Initialize SDK
      this.sdk = new NodeSDK({
        resource,
        traceExporter,
        metricReader: new PeriodicExportingMetricReader({
          exporter: metricExporter,
          exportIntervalMillis: 5000, // Export every 5 seconds
        }),
        instrumentations: [
          getNodeAutoInstrumentations({
            // Disable file system instrumentation to reduce noise
            '@opentelemetry/instrumentation-fs': {
              enabled: false,
            },
            // Enable HTTP instrumentation for API calls
            '@opentelemetry/instrumentation-http': {
              enabled: true,
            },
            // Enable fetch instrumentation for OpenAI API calls
            '@opentelemetry/instrumentation-fetch': {
              enabled: true,
            },
          }),
        ],
      });

      // Start SDK
      this.sdk.start();

      // Get tracer and meter instances
      this.tracer = opentelemetry.trace.getTracer(
        this.config.otel.serviceName,
        this.config.otel.serviceVersion
      );

      this.meter = opentelemetry.metrics.getMeter(
        this.config.otel.serviceName,
        this.config.otel.serviceVersion
      );

      this.isInitialized = true;
      console.log('OpenTelemetry initialized successfully');
      return true;

    } catch (error) {
      console.error('Failed to initialize OpenTelemetry:', error);
      return false;
    }
  }

  // Create a span for AI Triage operations
  createSpan(
    name: string,
    attributes: Record<string, any> = {},
    parentSpan?: opentelemetry.Span
  ): opentelemetry.Span | null {
    if (!this.tracer) {
      return null;
    }

    const span = this.tracer.startSpan(name, {
      attributes: {
        'triage.operation': name,
        'triage.tenant_id': attributes.tenantId || 'unknown',
        ...attributes,
      },
      parent: parentSpan,
    });

    return span;
  }

  // Record metrics for AI Triage operations
  recordMetric(
    name: string,
    value: number,
    attributes: Record<string, any> = {},
    unit = '1'
  ): void {
    if (!this.meter) {
      return;
    }

    const counter = this.meter.createCounter(name, {
      description: `AI Triage metric: ${name}`,
      unit,
    });

    counter.add(value, attributes);
  }

  // Record histogram metrics (for timing, token usage, etc.)
  recordHistogram(
    name: string,
    value: number,
    attributes: Record<string, any> = {},
    unit = '1'
  ): void {
    if (!this.meter) {
      return;
    }

    const histogram = this.meter.createHistogram(name, {
      description: `AI Triage histogram: ${name}`,
      unit,
    });

    histogram.record(value, attributes);
  }

  // Instrument LLM API calls
  async instrumentLLMCall<T>(
    operation: string,
    llmProvider: string,
    modelName: string,
    tokensEstimated: number,
    fn: () => Promise<T>
  ): Promise<T> {
    const span = this.createSpan('llm.api_call', {
      'llm.provider': llmProvider,
      'llm.model': modelName,
      'llm.operation': operation,
      'llm.tokens_estimated': tokensEstimated,
    });

    if (!span) {
      return fn();
    }

    const startTime = Date.now();
    
    try {
      const result = await fn();
      
      const duration = Date.now() - startTime;
      span.setAttributes({
        'llm.success': true,
        'llm.duration_ms': duration,
      });
      
      // Record metrics
      this.recordMetric('triage.llm.calls_total', 1, {
        provider: llmProvider,
        model: modelName,
        operation,
        status: 'success',
      });
      
      this.recordHistogram('triage.llm.duration_ms', duration, {
        provider: llmProvider,
        model: modelName,
        operation,
      }, 'ms');
      
      span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      span.setAttributes({
        'llm.success': false,
        'llm.error': error.message,
        'llm.duration_ms': duration,
      });
      
      this.recordMetric('triage.llm.calls_total', 1, {
        provider: llmProvider,
        model: modelName,
        operation,
        status: 'error',
      });
      
      span.recordException(error);
      span.setStatus({ 
        code: opentelemetry.SpanStatusCode.ERROR, 
        message: error.message 
      });
      throw error;
      
    } finally {
      span.end();
    }
  }

  // Instrument cost control operations
  instrumentCostOperation<T>(
    operation: string,
    tenantId: string,
    estimatedCost: number,
    fn: () => Promise<T>
  ): Promise<T> {
    const span = this.createSpan('cost_control.operation', {
      'cost.operation': operation,
      'cost.tenant_id': tenantId,
      'cost.estimated_cost': estimatedCost,
    });

    if (!span) {
      return fn();
    }

    return opentelemetry.context.with(
      opentelemetry.trace.setSpan(opentelemetry.context.active(), span),
      async () => {
        try {
          const result = await fn();
          span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
          
          this.recordMetric('triage.cost.operations_total', 1, {
            operation,
            tenant_id: tenantId,
            status: 'success',
          });
          
          return result;
        } catch (error) {
          span.recordException(error);
          span.setStatus({ 
            code: opentelemetry.SpanStatusCode.ERROR, 
            message: error.message 
          });
          
          this.recordMetric('triage.cost.operations_total', 1, {
            operation,
            tenant_id: tenantId,
            status: 'error',
          });
          
          throw error;
        } finally {
          span.end();
        }
      }
    );
  }

  // Instrument incident management operations
  instrumentIncidentOperation<T>(
    operation: string,
    incidentId: string,
    severity: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const span = this.createSpan('incident.operation', {
      'incident.operation': operation,
      'incident.id': incidentId,
      'incident.severity': severity,
    });

    if (!span) {
      return fn();
    }

    return opentelemetry.context.with(
      opentelemetry.trace.setSpan(opentelemetry.context.active(), span),
      async () => {
        try {
          const result = await fn();
          span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
          
          this.recordMetric('triage.incidents.operations_total', 1, {
            operation,
            severity,
            status: 'success',
          });
          
          return result;
        } catch (error) {
          span.recordException(error);
          span.setStatus({ 
            code: opentelemetry.SpanStatusCode.ERROR, 
            message: error.message 
          });
          
          this.recordMetric('triage.incidents.operations_total', 1, {
            operation,
            severity,
            status: 'error',
          });
          
          throw error;
        } finally {
          span.end();
        }
      }
    );
  }

  // Instrument provider escalation operations
  instrumentEscalationOperation<T>(
    operation: string,
    escalationId: string,
    priority: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const span = this.createSpan('escalation.operation', {
      'escalation.operation': operation,
      'escalation.id': escalationId,
      'escalation.priority': priority,
    });

    if (!span) {
      return fn();
    }

    return opentelemetry.context.with(
      opentelemetry.trace.setSpan(opentelemetry.context.active(), span),
      async () => {
        try {
          const result = await fn();
          span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
          
          this.recordMetric('triage.escalations.operations_total', 1, {
            operation,
            priority,
            status: 'success',
          });
          
          return result;
        } catch (error) {
          span.recordException(error);
          span.setStatus({ 
            code: opentelemetry.SpanStatusCode.ERROR, 
            message: error.message 
          });
          
          this.recordMetric('triage.escalations.operations_total', 1, {
            operation,
            priority,
            status: 'error',
          });
          
          throw error;
        } finally {
          span.end();
        }
      }
    );
  }

  // Instrument redaction guard operations
  instrumentRedactionOperation<T>(
    operation: string,
    contentLength: number,
    detectionsCount: number,
    fn: () => Promise<T>
  ): Promise<T> {
    const span = this.createSpan('redaction.operation', {
      'redaction.operation': operation,
      'redaction.content_length': contentLength,
      'redaction.detections_count': detectionsCount,
    });

    if (!span) {
      return fn();
    }

    return opentelemetry.context.with(
      opentelemetry.trace.setSpan(opentelemetry.context.active(), span),
      async () => {
        try {
          const result = await fn();
          span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
          
          this.recordMetric('triage.redaction.operations_total', 1, {
            operation,
            has_detections: detectionsCount > 0 ? 'true' : 'false',
            status: 'success',
          });
          
          if (detectionsCount > 0) {
            this.recordMetric('triage.redaction.detections_total', detectionsCount, {
              operation,
            });
          }
          
          return result;
        } catch (error) {
          span.recordException(error);
          span.setStatus({ 
            code: opentelemetry.SpanStatusCode.ERROR, 
            message: error.message 
          });
          
          this.recordMetric('triage.redaction.operations_total', 1, {
            operation,
            status: 'error',
          });
          
          throw error;
        } finally {
          span.end();
        }
      }
    );
  }

  // Get current span context for propagation
  getCurrentSpanContext(): opentelemetry.SpanContext | undefined {
    const activeSpan = opentelemetry.trace.getActiveSpan();
    return activeSpan?.spanContext();
  }

  // Create a child span from existing context
  createChildSpan(
    name: string,
    parentContext: opentelemetry.SpanContext,
    attributes: Record<string, any> = {}
  ): opentelemetry.Span | null {
    if (!this.tracer) {
      return null;
    }

    const parentSpan = opentelemetry.trace.wrapSpanContext(parentContext);
    return this.tracer.startSpan(name, {
      attributes,
      parent: parentSpan,
    });
  }

  // Shutdown OpenTelemetry gracefully
  async shutdown(): Promise<void> {
    if (this.sdk) {
      await this.sdk.shutdown();
      this.isInitialized = false;
      console.log('OpenTelemetry shutdown completed');
    }
  }

  // Health check for telemetry system
  isHealthy(): boolean {
    return this.isInitialized && this.tracer !== null && this.meter !== null;
  }
}

// Singleton instance for application-wide use
let otelManager: ConcreteOTelManager | null = null;

export function initializeGlobalOTel(config: ObservabilityConfig): Promise<boolean> {
  if (!otelManager) {
    otelManager = new ConcreteOTelManager(config);
  }
  return otelManager.initialize();
}

export function getGlobalOTel(): ConcreteOTelManager | null {
  return otelManager;
}

export async function shutdownGlobalOTel(): Promise<void> {
  if (otelManager) {
    await otelManager.shutdown();
    otelManager = null;
  }
}

// Instrumentation decorators for easy adoption
export function instrumentAsyncFunction<T extends (...args: any[]) => Promise<any>>(
  operationName: string,
  fn: T,
  getAttributes?: (...args: Parameters<T>) => Record<string, any>
): T {
  return (async (...args: Parameters<T>) => {
    const otel = getGlobalOTel();
    if (!otel) {
      return fn(...args);
    }

    const attributes = getAttributes ? getAttributes(...args) : {};
    const span = otel.createSpan(operationName, attributes);
    
    if (!span) {
      return fn(...args);
    }

    try {
      const result = await fn(...args);
      span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ 
        code: opentelemetry.SpanStatusCode.ERROR, 
        message: error.message 
      });
      throw error;
    } finally {
      span.end();
    }
  }) as T;
}

export type { ConcreteOTelManager };