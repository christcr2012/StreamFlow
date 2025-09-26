// src/lib/ai-triage-agent/redaction-guard.ts
// Centralized Security Guard for PII/Secret Redaction - CRITICAL SECURITY COMPONENT
// Robinson Solutions B2B SaaS Platform

import { createHash } from 'crypto';
import { createStaffAuditSystem } from "../staff-audit-system";

export interface RedactionRule {
  name: string;
  pattern: RegExp;
  replacement: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

export interface RedactionConfig {
  enabled: boolean;
  failOnDetection: boolean; // Block processing if sensitive data detected
  logDetections: boolean;
  auditAllRedactions: boolean;
  
  // PII Rules
  piiRules: RedactionRule[];
  
  // Secret Rules  
  secretRules: RedactionRule[];
  
  // Custom Rules
  customRules: RedactionRule[];
  
  // Hash Configuration
  hashConfig: {
    algorithm: 'sha256' | 'sha1' | 'md5';
    saltPrefix: string;
    preserveLength: boolean; // Keep original length for debugging
  };
}

export interface RedactionResult {
  redacted: string;
  detections: Array<{
    type: 'pii' | 'secret' | 'custom';
    rule: string;
    matches: number;
    severity: 'high' | 'medium' | 'low';
    originalLength: number;
    hashedValue?: string;
  }>;
  hasHighSeverityDetections: boolean;
  originalHash: string; // Hash of original content for audit
  redactedHash: string; // Hash of redacted content
  processingTime: number; // milliseconds
}

export class RedactionGuard {
  private config: RedactionConfig;
  private auditSystem: any;
  private tenantId: string;

  constructor(tenantId: string, config: RedactionConfig) {
    this.tenantId = tenantId;
    this.config = config;
    this.auditSystem = createStaffAuditSystem(tenantId, 'redaction_guard', 'security_session');
  }

  // CRITICAL: Must be called before ANY LLM prompt or Provider escalation
  async redactSensitiveData(
    content: string,
    context: {
      operation: 'llm_prompt' | 'provider_escalation' | 'incident_export' | 'general';
      destination: string;
      userId?: string;
      sessionId?: string;
    }
  ): Promise<RedactionResult> {
    const startTime = Date.now();
    
    try {
      if (!this.config.enabled) {
        return this.createPassthroughResult(content, startTime);
      }

      // Step 1: Create baseline hashes
      const originalHash = this.hashContent(content);
      
      // Step 2: Apply all redaction rules
      let redactedContent = content;
      const detections: RedactionResult['detections'] = [];
      
      // Apply PII rules
      for (const rule of this.config.piiRules) {
        const result = this.applyRedactionRule(redactedContent, rule, 'pii');
        redactedContent = result.content;
        if (result.detections.length > 0) {
          detections.push(...result.detections);
        }
      }
      
      // Apply secret rules
      for (const rule of this.config.secretRules) {
        const result = this.applyRedactionRule(redactedContent, rule, 'secret');
        redactedContent = result.content;
        if (result.detections.length > 0) {
          detections.push(...result.detections);
        }
      }
      
      // Apply custom rules
      for (const rule of this.config.customRules) {
        const result = this.applyRedactionRule(redactedContent, rule, 'custom');
        redactedContent = result.content;
        if (result.detections.length > 0) {
          detections.push(...result.detections);
        }
      }
      
      // Step 3: Create final result
      const redactedHash = this.hashContent(redactedContent);
      const hasHighSeverityDetections = detections.some(d => d.severity === 'high');
      const processingTime = Date.now() - startTime;
      
      const result: RedactionResult = {
        redacted: redactedContent,
        detections,
        hasHighSeverityDetections,
        originalHash,
        redactedHash,
        processingTime
      };
      
      // Step 4: Security enforcement
      if (this.config.failOnDetection && hasHighSeverityDetections) {
        await this.auditRedactionBlock(result, context);
        throw new SecurityError(
          `HIGH SEVERITY SENSITIVE DATA DETECTED - Operation blocked`,
          result.detections.filter(d => d.severity === 'high')
        );
      }
      
      // Step 5: Audit logging
      if (this.config.auditAllRedactions && detections.length > 0) {
        await this.auditRedactionActivity(result, context);
      }
      
      return result;
      
    } catch (error) {
      await this.auditRedactionError(error, content.length, context);
      throw error;
    }
  }

  // Specialized method for LLM prompts with extra validation
  async redactLLMPrompt(
    systemPrompt: string,
    userPrompt: string,
    context: any,
    operationId: string
  ): Promise<{
    redactedSystemPrompt: string;
    redactedUserPrompt: string;
    redactionSummary: RedactionResult;
    safeToProceed: boolean;
  }> {
    try {
      // Combine prompts for comprehensive redaction
      const combinedPrompt = `SYSTEM: ${systemPrompt}\n\nUSER: ${userPrompt}\n\nCONTEXT: ${JSON.stringify(context)}`;
      
      const redactionResult = await this.redactSensitiveData(combinedPrompt, {
        operation: 'llm_prompt',
        destination: 'openai_api',
        sessionId: operationId
      });
      
      // Split redacted content back
      const redactedParts = redactionResult.redacted.split('\n\n');
      const redactedSystemPrompt = redactedParts[0]?.replace('SYSTEM: ', '') || systemPrompt;
      const redactedUserPrompt = redactedParts[1]?.replace('USER: ', '') || userPrompt;
      
      // Extra validation for LLM prompts
      const safeToProceed = !redactionResult.hasHighSeverityDetections && 
                           this.validateLLMPromptSafety(redactedSystemPrompt, redactedUserPrompt);
      
      if (!safeToProceed) {
        await this.auditUnsafeLLMPrompt(redactionResult, operationId);
      }
      
      return {
        redactedSystemPrompt,
        redactedUserPrompt,
        redactionSummary: redactionResult,
        safeToProceed
      };
      
    } catch (error) {
      await this.auditRedactionError(error, systemPrompt.length + userPrompt.length, {
        operation: 'llm_prompt',
        destination: 'openai_api',
        sessionId: operationId
      });
      throw error;
    }
  }

  // Specialized method for Provider escalation payloads
  async redactEscalationPayload(
    payload: any,
    escalationId: string,
    providerEndpoint: string
  ): Promise<{
    redactedPayload: any;
    redactionSummary: RedactionResult;
    safeToProceed: boolean;
  }> {
    try {
      // Serialize payload for redaction
      const serializedPayload = JSON.stringify(payload, null, 2);
      
      const redactionResult = await this.redactSensitiveData(serializedPayload, {
        operation: 'provider_escalation',
        destination: providerEndpoint,
        sessionId: escalationId
      });
      
      // Parse redacted payload back to object
      let redactedPayload: any;
      try {
        redactedPayload = JSON.parse(redactionResult.redacted);
      } catch (parseError) {
        // If parsing fails, create safe fallback payload
        redactedPayload = this.createSafeEscalationPayload(payload, redactionResult);
      }
      
      // Additional provider escalation validation
      const safeToProceed = !redactionResult.hasHighSeverityDetections &&
                           this.validateEscalationPayloadSafety(redactedPayload);
      
      if (!safeToProceed) {
        await this.auditUnsafeEscalation(redactionResult, escalationId);
      }
      
      return {
        redactedPayload,
        redactionSummary: redactionResult,
        safeToProceed
      };
      
    } catch (error) {
      await this.auditRedactionError(error, JSON.stringify(payload).length, {
        operation: 'provider_escalation',
        destination: providerEndpoint,
        sessionId: escalationId
      });
      throw error;
    }
  }

  // Hash identifiers deterministically for cross-reference
  hashIdentifier(identifier: string, type: 'user_id' | 'session_id' | 'email' | 'phone'): string {
    const salt = `${this.config.hashConfig.saltPrefix}_${type}_${this.tenantId}`;
    const hash = createHash(this.config.hashConfig.algorithm)
      .update(salt + identifier)
      .digest('hex');
    
    if (this.config.hashConfig.preserveLength) {
      // Truncate or pad to match original length
      const originalLength = identifier.length;
      if (hash.length > originalLength) {
        return hash.substring(0, originalLength);
      } else if (hash.length < originalLength) {
        return hash.padEnd(originalLength, '0');
      }
    }
    
    return hash;
  }

  // Private helper methods
  private applyRedactionRule(
    content: string,
    rule: RedactionRule,
    type: 'pii' | 'secret' | 'custom'
  ): {
    content: string;
    detections: RedactionResult['detections'];
  } {
    const matches = content.match(rule.pattern);
    const matchCount = matches ? matches.length : 0;
    
    if (matchCount === 0) {
      return { content, detections: [] };
    }
    
    // Apply redaction
    const redactedContent = content.replace(rule.pattern, rule.replacement);
    
    // Create detection record
    const detection = {
      type,
      rule: rule.name,
      matches: matchCount,
      severity: rule.severity,
      originalLength: content.length,
      hashedValue: this.hashContent(matches[0] || '')
    };
    
    return {
      content: redactedContent,
      detections: [detection]
    };
  }

  private hashContent(content: string): string {
    return createHash(this.config.hashConfig.algorithm)
      .update(content)
      .digest('hex')
      .substring(0, 16); // First 16 chars for audit logs
  }

  private createPassthroughResult(content: string, startTime: number): RedactionResult {
    return {
      redacted: content,
      detections: [],
      hasHighSeverityDetections: false,
      originalHash: this.hashContent(content),
      redactedHash: this.hashContent(content),
      processingTime: Date.now() - startTime
    };
  }

  private validateLLMPromptSafety(systemPrompt: string, userPrompt: string): boolean {
    // Additional safety checks for LLM prompts
    const unsafePatterns = [
      /\bAWSAccessKey\b/i,
      /\bAWSSecretKey\b/i,
      /\bpassword\s*[:=]\s*[^\s]+/i,
      /\btoken\s*[:=]\s*[^\s]+/i,
      /\bapi_key\s*[:=]\s*[^\s]+/i
    ];
    
    const combinedPrompt = systemPrompt + ' ' + userPrompt;
    return !unsafePatterns.some(pattern => pattern.test(combinedPrompt));
  }

  private validateEscalationPayloadSafety(payload: any): boolean {
    // Ensure no sensitive fields leaked through
    const serialized = JSON.stringify(payload).toLowerCase();
    const sensitiveFields = ['password', 'secret', 'private_key', 'access_token'];
    return !sensitiveFields.some(field => serialized.includes(field));
  }

  private createSafeEscalationPayload(originalPayload: any, redactionResult: RedactionResult): any {
    // Create a minimal safe payload if JSON parsing failed
    return {
      escalationId: originalPayload.escalationId || 'unknown',
      severity: originalPayload.severity || 'medium',
      message: `[REDACTED PAYLOAD - ${redactionResult.detections.length} sensitive items detected]`,
      timestamp: new Date().toISOString(),
      redactionApplied: true,
      originalHashPrefix: redactionResult.originalHash
    };
  }

  // Audit methods
  private async auditRedactionBlock(result: RedactionResult, context: any): Promise<void> {
    await this.auditSystem.logActivity({
      action: 'sensitive_data_blocked',
      target: 'redaction_guard',
      targetId: context.operation,
      category: 'SECURITY',
      severity: 'HIGH',
      details: {
        operation: context.operation,
        destination: context.destination,
        detectionsCount: result.detections.length,
        highSeverityCount: result.detections.filter(d => d.severity === 'high').length,
        originalHashPrefix: result.originalHash,
        processingTime: result.processingTime
      },
      context: {
        ipAddress: 'system',
        userAgent: 'redaction_guard',
        sessionId: context.sessionId || 'unknown'
      }
    });
  }

  private async auditRedactionActivity(result: RedactionResult, context: any): Promise<void> {
    await this.auditSystem.logActivity({
      action: 'sensitive_data_redacted',
      target: 'redaction_guard',
      targetId: context.operation,
      category: 'SECURITY',
      severity: 'MEDIUM',
      details: {
        operation: context.operation,
        destination: context.destination,
        detectionsCount: result.detections.length,
        redactionRules: result.detections.map(d => d.rule),
        originalHashPrefix: result.originalHash,
        redactedHashPrefix: result.redactedHash,
        processingTime: result.processingTime
      },
      context: {
        ipAddress: 'system',
        userAgent: 'redaction_guard',
        sessionId: context.sessionId || 'unknown'
      }
    });
  }

  private async auditUnsafeLLMPrompt(result: RedactionResult, operationId: string): Promise<void> {
    await this.auditSystem.logActivity({
      action: 'unsafe_llm_prompt_blocked',
      target: 'redaction_guard',
      targetId: operationId,
      category: 'SECURITY',
      severity: 'HIGH',
      details: {
        detectionsCount: result.detections.length,
        highSeverityDetections: result.detections.filter(d => d.severity === 'high'),
        originalHashPrefix: result.originalHash
      },
      context: {
        ipAddress: 'system',
        userAgent: 'redaction_guard',
        sessionId: operationId
      }
    });
  }

  private async auditUnsafeEscalation(result: RedactionResult, escalationId: string): Promise<void> {
    await this.auditSystem.logActivity({
      action: 'unsafe_escalation_blocked',
      target: 'redaction_guard',
      targetId: escalationId,
      category: 'SECURITY',
      severity: 'HIGH',
      details: {
        detectionsCount: result.detections.length,
        highSeverityDetections: result.detections.filter(d => d.severity === 'high'),
        originalHashPrefix: result.originalHash
      },
      context: {
        ipAddress: 'system',
        userAgent: 'redaction_guard',
        sessionId: escalationId
      }
    });
  }

  private async auditRedactionError(error: any, contentLength: number, context: any): Promise<void> {
    await this.auditSystem.logActivity({
      action: 'redaction_error',
      target: 'redaction_guard',
      targetId: context.operation,
      category: 'SYSTEM',
      severity: 'HIGH',
      details: {
        error: error.message,
        contentLength,
        operation: context.operation,
        destination: context.destination
      },
      context: {
        ipAddress: 'system',
        userAgent: 'redaction_guard',
        sessionId: context.sessionId || 'unknown'
      }
    });
  }
}

// Security Error Class
export class SecurityError extends Error {
  public detections: Array<{
    type: string;
    rule: string;
    severity: string;
  }>;

  constructor(message: string, detections: any[]) {
    super(message);
    this.name = 'SecurityError';
    this.detections = detections;
  }
}

// Factory Function
export function createRedactionGuard(tenantId: string, config: RedactionConfig): RedactionGuard {
  return new RedactionGuard(tenantId, config);
}

// Default Security Configuration
export const DEFAULT_REDACTION_CONFIG: RedactionConfig = {
  enabled: true,
  failOnDetection: true, // CRITICAL: Block operations when high severity data detected
  logDetections: true,
  auditAllRedactions: true,
  
  piiRules: [
    {
      name: 'email_address',
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      replacement: '[EMAIL_REDACTED]',
      severity: 'high',
      description: 'Email addresses'
    },
    {
      name: 'phone_number',
      pattern: /\b(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
      replacement: '[PHONE_REDACTED]',
      severity: 'high',
      description: 'Phone numbers'
    },
    {
      name: 'credit_card',
      pattern: /\b[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}\b/g,
      replacement: '[CARD_REDACTED]',
      severity: 'high',
      description: 'Credit card numbers'
    },
    {
      name: 'ssn',
      pattern: /\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b/g,
      replacement: '[SSN_REDACTED]',
      severity: 'high',
      description: 'Social Security Numbers'
    }
  ],
  
  secretRules: [
    {
      name: 'aws_access_key',
      pattern: /AKIA[0-9A-Z]{16}/g,
      replacement: '[AWS_KEY_REDACTED]',
      severity: 'high',
      description: 'AWS Access Keys'
    },
    {
      name: 'aws_secret_key',
      pattern: /[A-Za-z0-9/+=]{40}/g,
      replacement: '[AWS_SECRET_REDACTED]',
      severity: 'high',
      description: 'AWS Secret Keys'
    },
    {
      name: 'jwt_token',
      pattern: /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*/g,
      replacement: '[JWT_REDACTED]',
      severity: 'high',
      description: 'JWT Tokens'
    },
    {
      name: 'api_key',
      pattern: /\b[Aa]pi[_-]?[Kk]ey\s*[:=]\s*[\'"]?[A-Za-z0-9]{16,}[\'"]?/g,
      replacement: '[API_KEY_REDACTED]',
      severity: 'high',
      description: 'API Keys'
    },
    {
      name: 'bearer_token',
      pattern: /\bBearer\s+[A-Za-z0-9-_.+/=]{16,}/g,
      replacement: '[BEARER_TOKEN_REDACTED]',
      severity: 'high',
      description: 'Bearer Tokens'
    },
    {
      name: 'password_field',
      pattern: /\b[Pp]assword\s*[:=]\s*[\'"]?[^\s\'"]{6,}[\'"]?/g,
      replacement: '[PASSWORD_REDACTED]',
      severity: 'high',
      description: 'Password fields'
    }
  ],
  
  customRules: [
    {
      name: 'ip_address',
      pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
      replacement: '[IP_REDACTED]',
      severity: 'medium',
      description: 'IP Addresses'
    },
    {
      name: 'uuid',
      pattern: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
      replacement: '[UUID_REDACTED]',
      severity: 'low',
      description: 'UUIDs'
    }
  ],
  
  hashConfig: {
    algorithm: 'sha256',
    saltPrefix: 'mv_redact',
    preserveLength: false
  }
};

export type {
  RedactionRule,
  RedactionConfig,
  RedactionResult
};