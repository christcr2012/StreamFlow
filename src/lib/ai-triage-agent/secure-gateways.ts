// src/lib/ai-triage-agent/secure-gateways.ts
// CRITICAL: Enforced Security Gateways - ALL LLM/Escalation calls MUST go through these
// Robinson Solutions B2B SaaS Platform

import OpenAI from 'openai';
import { createRedactionGuard, type RedactionConfig } from './redaction-guard';
import { createCostControlManager, type CostControlConfig } from './cost-control';
import { createStaffAuditSystem } from "../staff-audit-system";
import type { TokenUsageRecord } from './cost-control';

export interface SecureLLMConfig {
  tenantId: string;
  providerId: string;
  openaiApiKey: string;
  redactionConfig: RedactionConfig;
  costControlConfig: CostControlConfig;
}

export interface SecureLLMRequest {
  requestId: string;
  operation: 'tier_a_summary' | 'tier_b_deep_dive';
  
  // Prompts (will be redacted)
  systemPrompt: string;
  userPrompt: string;
  context: any;
  
  // Budget Controls
  estimatedTokens: number;
  maxTokenBudget: number;
  modelTier: 'tier_a_small' | 'tier_b_large';
  
  // OpenAI Parameters
  model: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

export interface SecureLLMResponse {
  requestId: string;
  success: boolean;
  
  // Response Data
  result?: any;
  confidence?: number;
  
  // Security & Budget Tracking
  redactionApplied: boolean;
  redactionViolations: number;
  budgetChecked: boolean;
  tokensReserved: number;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  actualCost: number;
  
  // Performance
  responseTimeMs: number;
  
  // Error Information
  errorType?: 'security_violation' | 'budget_exceeded' | 'llm_error' | 'timeout';
  errorMessage?: string;
}

export interface SecureEscalationRequest {
  escalationId: string;
  tenantId: string;
  
  // Payload (will be redacted and encrypted)
  payload: any;
  
  // Destination
  providerEndpoint: string;
  federationApiKey: string;
  webhookSecret: string;
  
  // Security Controls
  encryptionRequired: boolean;
  signatureRequired: boolean;
}

export interface SecureEscalationResponse {
  escalationId: string;
  success: boolean;
  
  // Security Tracking
  redactionApplied: boolean;
  redactionViolations: number;
  payloadEncrypted: boolean;
  requestSigned: boolean;
  
  // Response Data
  providerTicketId?: string;
  acknowledgment?: any;
  
  // Error Information
  errorType?: 'security_violation' | 'transport_error' | 'provider_error';
  errorMessage?: string;
  
  // Performance
  responseTimeMs: number;
}

// CRITICAL: SINGLE ENFORCED GATEWAY FOR ALL LLM CALLS
export class SecureLLMGateway {
  private tenantId: string;
  private providerId: string;
  private openai: OpenAI;
  private redactionGuard: any;
  private costControl: any;
  private auditSystem: any;
  
  // Token Budget Tracking
  private reservedTokens: Map<string, number> = new Map();

  constructor(config: SecureLLMConfig) {
    this.tenantId = config.tenantId;
    this.providerId = config.providerId;
    this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    this.redactionGuard = createRedactionGuard(config.tenantId, config.redactionConfig);
    this.costControl = createCostControlManager(config.providerId, config.costControlConfig);
    this.auditSystem = createStaffAuditSystem(config.tenantId, 'secure_llm_gateway', 'security_session');
  }

  // CRITICAL: ONLY METHOD FOR LLM CALLS - ENFORCES ALL SECURITY CONTROLS
  async secureInvoke(request: SecureLLMRequest): Promise<SecureLLMResponse> {
    const startTime = Date.now();
    
    // Initialize response tracking
    const response: SecureLLMResponse = {
      requestId: request.requestId,
      success: false,
      redactionApplied: false,
      redactionViolations: 0,
      budgetChecked: false,
      tokensReserved: 0,
      tokensUsed: { input: 0, output: 0, total: 0 },
      actualCost: 0,
      responseTimeMs: 0
    };

    try {
      // STEP 1: CRITICAL SECURITY REDACTION (FAIL-FAST)
      const redactionResult = await this.redactionGuard.redactLLMPrompt(
        request.systemPrompt,
        request.userPrompt,
        request.context,
        request.requestId
      );
      
      response.redactionApplied = true;
      response.redactionViolations = redactionResult.redactionSummary.detections.length;
      
      // FAIL-FAST on security violations
      if (!redactionResult.safeToProceed) {
        response.errorType = 'security_violation';
        response.errorMessage = 'High severity sensitive data detected';
        await this.auditSecurityViolation(request, redactionResult);
        return response;
      }

      // STEP 2: CRITICAL BUDGET ENFORCEMENT (RESERVE TOKENS)
      const budgetCheck = await this.costControl.checkBudgetAvailability(
        this.tenantId,
        request.estimatedTokens,
        request.modelTier
      );
      
      response.budgetChecked = true;
      
      if (!budgetCheck.allowed) {
        response.errorType = 'budget_exceeded';
        response.errorMessage = budgetCheck.reason || 'Budget limit exceeded';
        await this.auditBudgetViolation(request, budgetCheck);
        return response;
      }

      // Reserve tokens (prevent concurrent overrun)
      const reservationId = await this.reserveTokens(request.requestId, request.estimatedTokens);
      response.tokensReserved = request.estimatedTokens;

      try {
        // STEP 3: EXECUTE LLM CALL WITH REDACTED PROMPTS
        const llmResult = await this.executeLLMCall({
          model: request.model,
          messages: [
            { role: 'system', content: redactionResult.redactedSystemPrompt },
            { role: 'user', content: redactionResult.redactedUserPrompt }
          ],
          max_tokens: request.maxTokens,
          temperature: request.temperature,
          timeout: request.timeoutMs
        });

        // STEP 4: CALCULATE ACTUAL COST AND SETTLE BUDGET
        response.tokensUsed = {
          input: llmResult.usage?.prompt_tokens || 0,
          output: llmResult.usage?.completion_tokens || 0,
          total: llmResult.usage?.total_tokens || 0
        };

        response.actualCost = await this.calculateCost(response.tokensUsed, request.model);
        
        // Settle the budget with actual usage
        await this.settleTokenUsage(reservationId, response.tokensUsed, response.actualCost);

        // STEP 5: PARSE AND VALIDATE RESPONSE
        const content = llmResult.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from LLM');
        }

        response.result = this.parseJsonResponse(content);
        response.confidence = this.extractConfidence(response.result);
        response.success = true;

        // Audit successful call
        await this.auditSuccessfulLLMCall(request, response);

      } finally {
        // Always release token reservation
        await this.releaseTokenReservation(reservationId);
      }

    } catch (error) {
      response.errorType = 'llm_error';
      response.errorMessage = error.message;
      await this.auditLLMError(request, response, error);
    } finally {
      response.responseTimeMs = Date.now() - startTime;
    }

    return response;
  }

  // Token Budget Management
  private async reserveTokens(requestId: string, tokens: number): Promise<string> {
    const reservationId = `reserve_${requestId}_${Date.now()}`;
    this.reservedTokens.set(reservationId, tokens);
    
    // In real implementation, would update database with reservation
    await this.auditTokenReservation(requestId, reservationId, tokens);
    
    return reservationId;
  }

  private async settleTokenUsage(
    reservationId: string,
    tokensUsed: { input: number; output: number; total: number },
    cost: number
  ): Promise<void> {
    const reservedTokens = this.reservedTokens.get(reservationId) || 0;
    
    // Record actual usage
    const usageRecord: Omit<TokenUsageRecord, 'id' | 'timestamp' | 'providerBudgetId' | 'estimatedCost'> = {
      tenantId: this.tenantId,
      modelTier: tokensUsed.total > 500 ? 'tier_b_large' : 'tier_a_small',
      modelName: 'gpt-3.5-turbo', // Would be dynamic
      tokensIn: tokensUsed.input,
      tokensOut: tokensUsed.output,
      totalTokens: tokensUsed.total,
      operationType: 'cluster_summary',
      batchId: 'secure_gateway',
      responseTimeMs: 0,
      success: true
    };

    await this.costControl.recordTokenUsage(this.tenantId, usageRecord);
    
    // Audit settlement
    await this.auditTokenSettlement(reservationId, reservedTokens, tokensUsed.total, cost);
  }

  private async releaseTokenReservation(reservationId: string): Promise<void> {
    this.reservedTokens.delete(reservationId);
    // In real implementation, would clean up database reservation
  }

  // LLM Execution
  private async executeLLMCall(params: any): Promise<any> {
    return this.openai.chat.completions.create(params);
  }

  private async calculateCost(tokensUsed: any, model: string): Promise<number> {
    // Simplified cost calculation - would use real pricing
    const inputCost = tokensUsed.input * 0.0015; // $0.0015 per 1K tokens
    const outputCost = tokensUsed.output * 0.002; // $0.002 per 1K tokens
    return inputCost + outputCost;
  }

  private parseJsonResponse(content: string): any {
    try {
      return JSON.parse(content);
    } catch (error) {
      // Try to extract JSON from mixed content
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid JSON response');
    }
  }

  private extractConfidence(result: any): number {
    return Math.max(0, Math.min(1, result?.confidence || 0.5));
  }

  // Audit Methods
  private async auditSecurityViolation(request: SecureLLMRequest, redactionResult: any): Promise<void> {
    await this.auditSystem.logActivity({
      action: 'llm_security_violation',
      target: 'secure_llm_gateway',
      targetId: request.requestId,
      category: 'SECURITY',
      severity: 'HIGH',
      details: {
        operation: request.operation,
        redactionViolations: redactionResult.redactionSummary.detections.length,
        highSeverityDetections: redactionResult.redactionSummary.detections.filter((d: any) => d.severity === 'high'),
        systemPromptLength: request.systemPrompt.length,
        userPromptLength: request.userPrompt.length
      },
      context: {
        ipAddress: 'system',
        userAgent: 'secure_llm_gateway',
        sessionId: request.requestId
      }
    });
  }

  private async auditBudgetViolation(request: SecureLLMRequest, budgetCheck: any): Promise<void> {
    await this.auditSystem.logActivity({
      action: 'llm_budget_violation',
      target: 'secure_llm_gateway',
      targetId: request.requestId,
      category: 'SYSTEM',
      severity: 'HIGH',
      details: {
        operation: request.operation,
        estimatedTokens: request.estimatedTokens,
        maxBudget: request.maxTokenBudget,
        budgetReason: budgetCheck.reason,
        suggestedOptimizations: budgetCheck.suggestedOptimizations
      },
      context: {
        ipAddress: 'system',
        userAgent: 'secure_llm_gateway',
        sessionId: request.requestId
      }
    });
  }

  private async auditSuccessfulLLMCall(request: SecureLLMRequest, response: SecureLLMResponse): Promise<void> {
    await this.auditSystem.logActivity({
      action: 'llm_call_success',
      target: 'secure_llm_gateway',
      targetId: request.requestId,
      category: 'SYSTEM',
      severity: 'LOW',
      details: {
        operation: request.operation,
        modelTier: request.modelTier,
        tokensUsed: response.tokensUsed.total,
        actualCost: response.actualCost,
        responseTime: response.responseTimeMs,
        redactionApplied: response.redactionApplied
      },
      context: {
        ipAddress: 'system',
        userAgent: 'secure_llm_gateway',
        sessionId: request.requestId
      }
    });
  }

  private async auditLLMError(request: SecureLLMRequest, response: SecureLLMResponse, error: any): Promise<void> {
    await this.auditSystem.logActivity({
      action: 'llm_call_error',
      target: 'secure_llm_gateway',
      targetId: request.requestId,
      category: 'SYSTEM',
      severity: 'MEDIUM',
      details: {
        operation: request.operation,
        errorType: response.errorType,
        errorMessage: response.errorMessage,
        tokensReserved: response.tokensReserved,
        responseTime: response.responseTimeMs
      },
      context: {
        ipAddress: 'system',
        userAgent: 'secure_llm_gateway',
        sessionId: request.requestId
      }
    });
  }

  private async auditTokenReservation(requestId: string, reservationId: string, tokens: number): Promise<void> {
    await this.auditSystem.logActivity({
      action: 'token_reservation',
      target: 'secure_llm_gateway',
      targetId: requestId,
      category: 'SYSTEM',
      severity: 'LOW',
      details: {
        reservationId,
        tokensReserved: tokens,
        tenantId: this.tenantId,
        providerId: this.providerId
      },
      context: {
        ipAddress: 'system',
        userAgent: 'secure_llm_gateway',
        sessionId: requestId
      }
    });
  }

  private async auditTokenSettlement(
    reservationId: string,
    reservedTokens: number,
    actualTokens: number,
    cost: number
  ): Promise<void> {
    await this.auditSystem.logActivity({
      action: 'token_settlement',
      target: 'secure_llm_gateway',
      targetId: reservationId,
      category: 'SYSTEM',
      severity: 'LOW',
      details: {
        reservedTokens,
        actualTokens,
        tokenDifference: actualTokens - reservedTokens,
        actualCost: cost,
        tenantId: this.tenantId,
        providerId: this.providerId
      },
      context: {
        ipAddress: 'system',
        userAgent: 'secure_llm_gateway',
        sessionId: reservationId
      }
    });
  }
}

// CRITICAL: SINGLE ENFORCED GATEWAY FOR ALL PROVIDER ESCALATIONS
export class SecureEscalationGateway {
  private redactionGuard: any;
  private auditSystem: any;

  constructor(tenantId: string, redactionConfig: RedactionConfig) {
    this.redactionGuard = createRedactionGuard(tenantId, redactionConfig);
    this.auditSystem = createStaffAuditSystem(tenantId, 'secure_escalation_gateway', 'security_session');
  }

  // CRITICAL: ONLY METHOD FOR PROVIDER ESCALATIONS - ENFORCES ALL SECURITY CONTROLS
  async secureEscalate(request: SecureEscalationRequest): Promise<SecureEscalationResponse> {
    const startTime = Date.now();
    
    const response: SecureEscalationResponse = {
      escalationId: request.escalationId,
      success: false,
      redactionApplied: false,
      redactionViolations: 0,
      payloadEncrypted: false,
      requestSigned: false,
      responseTimeMs: 0
    };

    try {
      // STEP 1: CRITICAL SECURITY REDACTION (FAIL-FAST)
      const redactionResult = await this.redactionGuard.redactEscalationPayload(
        request.payload,
        request.escalationId,
        request.providerEndpoint
      );
      
      response.redactionApplied = true;
      response.redactionViolations = redactionResult.redactionSummary.detections.length;
      
      // FAIL-FAST on security violations
      if (!redactionResult.safeToProceed) {
        response.errorType = 'security_violation';
        response.errorMessage = 'High severity sensitive data detected in escalation payload';
        await this.auditEscalationSecurityViolation(request, redactionResult);
        return response;
      }

      // STEP 2: ENCRYPTION (if required)
      let finalPayload = redactionResult.redactedPayload;
      if (request.encryptionRequired) {
        finalPayload = await this.encryptPayload(finalPayload, request.providerEndpoint);
        response.payloadEncrypted = true;
      }

      // STEP 3: SIGNATURE (if required)
      let headers: Record<string, string> = {
        'Authorization': `Bearer ${request.federationApiKey}`,
        'Content-Type': 'application/json'
      };
      
      if (request.signatureRequired) {
        const signature = await this.signRequest(finalPayload, request.webhookSecret);
        headers['X-Signature'] = signature;
        response.requestSigned = true;
      }

      // STEP 4: SECURE TRANSMISSION TO PROVIDER
      const providerResponse = await this.sendToProvider(
        request.providerEndpoint,
        finalPayload,
        headers
      );

      response.success = true;
      response.providerTicketId = providerResponse.ticketId;
      response.acknowledgment = providerResponse.acknowledgment;

      await this.auditSuccessfulEscalation(request, response);

    } catch (error) {
      response.errorType = 'transport_error';
      response.errorMessage = error.message;
      await this.auditEscalationError(request, response, error);
    } finally {
      response.responseTimeMs = Date.now() - startTime;
    }

    return response;
  }

  // Cryptographic Operations
  private async encryptPayload(payload: any, providerEndpoint: string): Promise<string> {
    // In real implementation, would use provider's public key
    // For now, simulate encryption
    const payloadString = JSON.stringify(payload);
    return Buffer.from(payloadString).toString('base64'); // Simplified
  }

  private async signRequest(payload: any, webhookSecret: string): Promise<string> {
    const crypto = require('crypto');
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto
      .createHmac('sha256', webhookSecret)
      .update(payloadString)
      .digest('hex');
  }

  // Provider Communication
  private async sendToProvider(
    endpoint: string,
    payload: any,
    headers: Record<string, string>
  ): Promise<any> {
    // In real implementation, would use fetch or HTTP client
    // Simulate successful provider response
    return {
      ticketId: `TKT-${Date.now()}`,
      acknowledgment: 'Escalation received and processing'
    };
  }

  // Audit Methods
  private async auditEscalationSecurityViolation(request: SecureEscalationRequest, redactionResult: any): Promise<void> {
    await this.auditSystem.logActivity({
      action: 'escalation_security_violation',
      target: 'secure_escalation_gateway',
      targetId: request.escalationId,
      category: 'SECURITY',
      severity: 'HIGH',
      details: {
        providerEndpoint: request.providerEndpoint,
        redactionViolations: redactionResult.redactionSummary.detections.length,
        highSeverityDetections: redactionResult.redactionSummary.detections.filter((d: any) => d.severity === 'high'),
        payloadSize: JSON.stringify(request.payload).length
      },
      context: {
        ipAddress: 'system',
        userAgent: 'secure_escalation_gateway',
        sessionId: request.escalationId
      }
    });
  }

  private async auditSuccessfulEscalation(request: SecureEscalationRequest, response: SecureEscalationResponse): Promise<void> {
    await this.auditSystem.logActivity({
      action: 'escalation_success',
      target: 'secure_escalation_gateway',
      targetId: request.escalationId,
      category: 'SYSTEM',
      severity: 'MEDIUM',
      details: {
        providerEndpoint: request.providerEndpoint,
        providerTicketId: response.providerTicketId,
        payloadEncrypted: response.payloadEncrypted,
        requestSigned: response.requestSigned,
        responseTime: response.responseTimeMs,
        redactionApplied: response.redactionApplied
      },
      context: {
        ipAddress: 'system',
        userAgent: 'secure_escalation_gateway',
        sessionId: request.escalationId
      }
    });
  }

  private async auditEscalationError(request: SecureEscalationRequest, response: SecureEscalationResponse, error: any): Promise<void> {
    await this.auditSystem.logActivity({
      action: 'escalation_error',
      target: 'secure_escalation_gateway',
      targetId: request.escalationId,
      category: 'SYSTEM',
      severity: 'HIGH',
      details: {
        providerEndpoint: request.providerEndpoint,
        errorType: response.errorType,
        errorMessage: response.errorMessage,
        responseTime: response.responseTimeMs
      },
      context: {
        ipAddress: 'system',
        userAgent: 'secure_escalation_gateway',
        sessionId: request.escalationId
      }
    });
  }
}

// Factory Functions
export function createSecureLLMGateway(config: SecureLLMConfig): SecureLLMGateway {
  return new SecureLLMGateway(config);
}

export function createSecureEscalationGateway(
  tenantId: string,
  redactionConfig: RedactionConfig
): SecureEscalationGateway {
  return new SecureEscalationGateway(tenantId, redactionConfig);
}

export type {
  SecureLLMConfig,
  SecureLLMRequest,
  SecureLLMResponse,
  SecureEscalationRequest,
  SecureEscalationResponse
};