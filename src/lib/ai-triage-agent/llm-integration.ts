// src/lib/ai-triage-agent/llm-integration.ts
// AI Triage Agent LLM Integration - Two-Tier Model System
// Robinson Solutions B2B SaaS Platform

import { SecureLLMGateway, type SecureLLMConfig } from './secure-gateways';
import { createCostControlManager, type TokenUsageRecord, type CostControlConfig } from './cost-control';
import { createStaffAuditSystem } from "../staff-audit-system";
import type { ErrorCluster, PerformanceAnomaly } from './core-agent';

export interface LLMModelConfig {
  // Tier A - Small, Fast Model (Default)
  tierA: {
    model: string;
    maxTokens: number;
    temperature: number;
    costPerTokenInput: number; // cents
    costPerTokenOutput: number; // cents
    maxContextLength: number;
    averageResponseTime: number; // milliseconds
  };
  
  // Tier B - Large, Comprehensive Model (Escalation)
  tierB: {
    model: string;
    maxTokens: number;
    temperature: number;
    costPerTokenInput: number; // cents
    costPerTokenOutput: number; // cents
    maxContextLength: number;
    averageResponseTime: number; // milliseconds
  };
}

export interface PromptTemplate {
  id: string;
  name: string;
  modelTier: 'tier_a_small' | 'tier_b_large';
  
  // Prompt Content
  systemPrompt: string;
  userPromptTemplate: string;
  
  // Token Management
  maxContextTokens: number;
  expectedOutputTokens: number;
  
  // Validation
  requiredFields: string[];
  outputSchema: any;
  
  // Performance
  targetConfidenceThreshold: number;
  fallbackBehavior: 'skip' | 'escalate' | 'retry_simplified';
}

export interface LLMRequest {
  requestId: string;
  tenantId: string;
  clusterId?: string;
  batchId: string;
  
  // Request Details
  promptTemplateId: string;
  modelTier: 'tier_a_small' | 'tier_b_large';
  context: any;
  
  // Cost Control
  estimatedTokens: number;
  maxTokenBudget: number;
  priorityLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Processing Options
  timeoutMs: number;
  retryCount: number;
  fallbackEnabled: boolean;
}

export interface LLMResponse {
  requestId: string;
  success: boolean;
  
  // Response Data
  result?: any;
  confidence?: number;
  reasoning?: string;
  
  // Performance Metrics
  responseTimeMs: number;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  
  // Cost Information
  estimatedCost: number;
  modelUsed: string;
  
  // Quality Indicators
  truncated: boolean;
  fallbackUsed: boolean;
  errorMessage?: string;
  
  // Escalation Indicators
  requiresEscalation: boolean;
  escalationReason?: string;
  suggestedFollowUp?: string;
}

export interface TierASummaryResult {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  shortCause: string; // ≤25 words
  impactedRoles: string[];
  endpoints: string[];
  likelyChange: 'deploy' | 'flag' | 'dependency' | 'config' | 'unknown';
  candidateRunbookId?: string;
  confidence: number; // 0.0-1.0
}

export interface TierBDeepDiveResult {
  briefReasoning: string; // ≤40 words
  hypothesis: string;
  topExperiments: string[]; // Top 2 safe experiments
  minimalCodeOrConfigDelta: string; // Sketch
  rollbackSteps: string[];
  confidence: number;
  
  // Additional Deep Analysis
  rootCauseAnalysis: string;
  impactAssessment: string;
  timelineRecommendation: string;
  stakeholderNotifications: string[];
}

export class LLMManager {
  private secureLLMGateway: SecureLLMGateway;
  private costControl: any;
  private auditSystem: any;
  private modelConfig: LLMModelConfig;
  private promptTemplates: Map<string, PromptTemplate> = new Map();
  private tenantId: string;

  constructor(
    tenantId: string,
    providerId: string,
    modelConfig: LLMModelConfig,
    costControlConfig: CostControlConfig,
    secureLLMConfig: SecureLLMConfig
  ) {
    this.tenantId = tenantId;
    // CRITICAL: Use SecureLLMGateway instead of direct OpenAI access
    this.secureLLMGateway = new SecureLLMGateway(secureLLMConfig);
    this.costControl = createCostControlManager(providerId, costControlConfig);
    this.auditSystem = createStaffAuditSystem(tenantId, providerId, 'llm_session');
    this.modelConfig = modelConfig;
    this.initializePromptTemplates();
  }

  // Main LLM Processing Entry Point
  async processClusterBatch(
    tenantId: string,
    clusters: ErrorCluster[],
    batchId: string
  ): Promise<{
    tierASummaries: TierASummaryResult[];
    tierBAnalyses: TierBDeepDiveResult[];
    totalTokensUsed: number;
    totalCost: number;
    escalations: any[];
  }> {
    try {
      const results: {
        tierASummaries: TierASummaryResult[];
        tierBAnalyses: TierBDeepDiveResult[];
        totalTokensUsed: number;
        totalCost: number;
        escalations: any[];
      } = {
        tierASummaries: [],
        tierBAnalyses: [],
        totalTokensUsed: 0,
        totalCost: 0,
        escalations: []
      };

      // Phase 1: Tier A Processing (Batch Summary)
      const tierAResults = await this.processTierABatch(tenantId, clusters, batchId);
      results.tierASummaries = tierAResults.summaries;
      results.totalTokensUsed += tierAResults.tokensUsed;
      results.totalCost += tierAResults.cost;

      // Phase 2: Identify Escalation Candidates
      const escalationCandidates = this.identifyEscalationCandidates(tierAResults.summaries, clusters);

      // Phase 3: Tier B Processing (Individual Deep Dives)
      for (const candidate of escalationCandidates) {
        try {
          const tierBResult = await this.processTierBDeepDive(
            tenantId,
            candidate.cluster,
            candidate.summary,
            batchId
          );
          
          if (tierBResult.success && tierBResult.analysis) {
            results.tierBAnalyses.push(tierBResult.analysis);
            results.totalTokensUsed += tierBResult.tokensUsed;
            results.totalCost += tierBResult.cost;
            
            // Check if this requires escalation to Provider Portal
            if (this.requiresProviderEscalation(tierBResult.analysis)) {
              results.escalations.push({
                clusterId: candidate.cluster.id,
                severity: candidate.summary.severity,
                analysis: tierBResult.analysis
              });
            }
          }
        } catch (error) {
          await this.logLLMEvent('tier_b_processing_error', {
            tenantId,
            clusterId: candidate.cluster.id,
            error: error.message
          });
        }
      }

      // Log batch completion
      await this.logLLMEvent('batch_processing_completed', {
        tenantId,
        batchId,
        clustersProcessed: clusters.length,
        tierASummaries: results.tierASummaries.length,
        tierBAnalyses: results.tierBAnalyses.length,
        totalTokensUsed: results.totalTokensUsed,
        totalCost: results.totalCost
      });

      return results;

    } catch (error) {
      await this.logLLMEvent('batch_processing_error', {
        tenantId,
        batchId,
        error: error.message
      });
      throw error;
    }
  }

  // Tier A: Batch Summary Processing
  private async processTierABatch(
    tenantId: string,
    clusters: ErrorCluster[],
    batchId: string
  ): Promise<{
    summaries: TierASummaryResult[];
    tokensUsed: number;
    cost: number;
  }> {
    const maxClustersPerBatch = 20; // As specified in requirements
    const clusterBatches = this.chunkArray(clusters, maxClustersPerBatch);
    
    let allSummaries: TierASummaryResult[] = [];
    let totalTokensUsed = 0;
    let totalCost = 0;

    for (const batch of clusterBatches) {
      try {
        // Prepare context for batch
        const context = this.prepareTierAContext(batch);
        
        // Create LLM request
        const request: LLMRequest = {
          requestId: `tier_a_${batchId}_${Date.now()}`,
          tenantId,
          batchId,
          promptTemplateId: 'tier_a_summary',
          modelTier: 'tier_a_small',
          context,
          estimatedTokens: this.estimateTokenUsage(context, 'tier_a_small'),
          maxTokenBudget: 1000, // Conservative limit for Tier A
          priorityLevel: 'medium',
          timeoutMs: 30000, // 30 seconds
          retryCount: 2,
          fallbackEnabled: true
        };

        // Check budget before request
        const budgetCheck = await this.costControl.checkBudgetAvailability(
          tenantId,
          request.estimatedTokens,
          'tier_a_small'
        );

        if (!budgetCheck.allowed) {
          await this.logLLMEvent('tier_a_budget_exceeded', {
            tenantId,
            batchId,
            reason: budgetCheck.reason
          });
          continue; // Skip this batch
        }

        // Execute LLM request
        const response = await this.executeLLMRequest(request);
        
        if (response.success && response.result) {
          const summaries = this.parseTierAResponse(response.result, batch);
          allSummaries.push(...summaries);
          
          totalTokensUsed += response.tokensUsed.total;
          totalCost += response.estimatedCost;
          
          // Record token usage
          await this.recordTokenUsage(tenantId, request, response);
        }

      } catch (error) {
        await this.logLLMEvent('tier_a_batch_error', {
          tenantId,
          batchId,
          batchSize: batch.length,
          error: error.message
        });
      }
    }

    return {
      summaries: allSummaries,
      tokensUsed: totalTokensUsed,
      cost: totalCost
    };
  }

  // Tier B: Individual Deep Dive Analysis
  private async processTierBDeepDive(
    tenantId: string,
    cluster: ErrorCluster,
    summary: TierASummaryResult,
    batchId: string
  ): Promise<{
    success: boolean;
    analysis?: TierBDeepDiveResult;
    tokensUsed: number;
    cost: number;
  }> {
    try {
      // Prepare detailed context for deep dive
      const context = this.prepareTierBContext(cluster, summary);
      
      // Create LLM request for Tier B
      const request: LLMRequest = {
        requestId: `tier_b_${cluster.id}_${Date.now()}`,
        tenantId,
        clusterId: cluster.id,
        batchId,
        promptTemplateId: 'tier_b_deep_dive',
        modelTier: 'tier_b_large',
        context,
        estimatedTokens: this.estimateTokenUsage(context, 'tier_b_large'),
        maxTokenBudget: 3000, // Higher limit for deep analysis
        priorityLevel: summary.severity === 'critical' ? 'critical' : 'high',
        timeoutMs: 60000, // 60 seconds for complex analysis
        retryCount: 1,
        fallbackEnabled: false
      };

      // Check budget for Tier B usage
      const budgetCheck = await this.costControl.checkBudgetAvailability(
        tenantId,
        request.estimatedTokens,
        'tier_b_large'
      );

      if (!budgetCheck.allowed) {
        await this.logLLMEvent('tier_b_budget_exceeded', {
          tenantId,
          clusterId: cluster.id,
          reason: budgetCheck.reason
        });
        return { success: false, tokensUsed: 0, cost: 0 };
      }

      // Execute deep dive analysis
      const response = await this.executeLLMRequest(request);
      
      if (response.success && response.result) {
        const analysis = this.parseTierBResponse(response.result, cluster, summary);
        
        // Record token usage
        await this.recordTokenUsage(tenantId, request, response);
        
        return {
          success: true,
          analysis,
          tokensUsed: response.tokensUsed.total,
          cost: response.estimatedCost
        };
      }

      return { success: false, tokensUsed: 0, cost: 0 };

    } catch (error) {
      await this.logLLMEvent('tier_b_deep_dive_error', {
        tenantId,
        clusterId: cluster.id,
        error: error.message
      });
      return { success: false, tokensUsed: 0, cost: 0 };
    }
  }

  // Core LLM Request Execution
  private async executeLLMRequest(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    
    try {
      // Get prompt template
      const template = this.promptTemplates.get(request.promptTemplateId);
      if (!template) {
        throw new Error(`Prompt template not found: ${request.promptTemplateId}`);
      }

      // Get model configuration
      const modelConfig = request.modelTier === 'tier_a_small' ? 
        this.modelConfig.tierA : this.modelConfig.tierB;

      // Prepare messages
      const messages = this.prepareMessages(template, request.context);
      
      // Truncate context if needed
      const truncatedMessages = this.truncateContext(messages, template.maxContextTokens);
      
      // Execute SECURE LLM request (with PII redaction, cost controls, auditing)
      const secureResponse = await this.secureLLMGateway.secureInvoke({
        requestId: request.requestId,
        operation: request.modelTier === 'tier_a_small' ? 'tier_a_summary' : 'tier_b_deep_dive',
        systemPrompt: truncatedMessages.find(m => m.role === 'system')?.content || '',
        userPrompt: truncatedMessages.find(m => m.role === 'user')?.content || '',
        context: request.context,
        estimatedTokens: request.estimatedTokens,
        maxTokenBudget: request.maxTokenBudget,
        modelTier: request.modelTier,
        model: modelConfig.model,
        maxTokens: Math.min(template.expectedOutputTokens, modelConfig.maxTokens),
        temperature: modelConfig.temperature,
        timeoutMs: request.timeoutMs
      });

      // Handle secure response (may contain security/budget violations)
      if (!secureResponse.success) {
        throw new Error(secureResponse.errorMessage || 'SecureLLMGateway rejected request');
      }

      // Transform SecureLLMResponse to completion-like object for compatibility
      const completion = {
        choices: [{ message: { content: secureResponse.result || '' } }],
        usage: {
          prompt_tokens: secureResponse.tokensUsed.input,
          completion_tokens: secureResponse.tokensUsed.output,
          total_tokens: secureResponse.tokensUsed.total
        }
      };

      // Calculate token usage and cost
      const tokensUsed = {
        input: completion.usage?.prompt_tokens || 0,
        output: completion.usage?.completion_tokens || 0,
        total: completion.usage?.total_tokens || 0
      };

      const estimatedCost = this.calculateCost(tokensUsed, modelConfig);
      const responseTime = Date.now() - startTime;

      // Parse response
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      const result = this.parseJsonResponse(content);
      const confidence = this.extractConfidence(result);

      return {
        requestId: request.requestId,
        success: true,
        result,
        confidence,
        responseTimeMs: responseTime,
        tokensUsed,
        estimatedCost,
        modelUsed: modelConfig.model,
        truncated: truncatedMessages.length !== messages.length,
        fallbackUsed: false,
        requiresEscalation: this.checkEscalationCriteria(result, confidence, template)
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        requestId: request.requestId,
        success: false,
        responseTimeMs: responseTime,
        tokensUsed: { input: 0, output: 0, total: 0 },
        estimatedCost: 0,
        modelUsed: 'none',
        truncated: false,
        fallbackUsed: false,
        requiresEscalation: false,
        errorMessage: error.message
      };
    }
  }

  // Identify clusters that need Tier B escalation
  private identifyEscalationCandidates(
    summaries: TierASummaryResult[],
    clusters: ErrorCluster[]
  ): Array<{ summary: TierASummaryResult; cluster: ErrorCluster }> {
    const candidates: Array<{ summary: TierASummaryResult; cluster: ErrorCluster }> = [];
    
    for (const summary of summaries) {
      const cluster = clusters.find(c => c.id === summary.id);
      if (!cluster) continue;
      
      // Escalation criteria from specification
      const shouldEscalate = 
        // High/critical severity
        summary.severity === 'high' || summary.severity === 'critical' ||
        // Low confidence from Tier A
        summary.confidence < 0.6 ||
        // Novel fingerprint with growing velocity
        this.isNovelFingerprintWithGrowingVelocity(cluster);
      
      if (shouldEscalate) {
        candidates.push({ summary, cluster });
      }
    }
    
    return candidates;
  }

  // Context Preparation Methods
  private prepareTierAContext(clusters: ErrorCluster[]): any {
    return {
      clusters: clusters.map(cluster => ({
        id: cluster.id,
        fingerprint: cluster.fingerprint.substring(0, 8), // Shortened for context
        severity: cluster.severity,
        eventCount: cluster.eventCount,
        uniqueUsers: cluster.uniqueUsers,
        firstSeen: cluster.firstSeen,
        lastSeen: cluster.lastSeen,
        representative: {
          message: cluster.representative.message,
          errorType: cluster.representative.errorType,
          route: cluster.representative.route,
          appVersion: cluster.representative.appVersion
        },
        endpoints: cluster.endpoints,
        impactedRoles: cluster.impactedRoles
      })),
      contextLimit: '2KB as specified'
    };
  }

  private prepareTierBContext(cluster: ErrorCluster, summary: TierASummaryResult): any {
    return {
      cluster: {
        id: cluster.id,
        severity: summary.severity,
        shortCause: summary.shortCause,
        confidence: summary.confidence,
        eventCount: cluster.eventCount,
        timespan: {
          firstSeen: cluster.firstSeen,
          lastSeen: cluster.lastSeen
        },
        representative: cluster.representative,
        exemplars: cluster.exemplars.slice(0, 3), // Max 3 as specified
        impactedRoles: cluster.impactedRoles,
        endpoints: cluster.endpoints
      },
      tierASummary: summary,
      contextLimit: '2KB as specified'
    };
  }

  // Response Parsing Methods
  private parseTierAResponse(response: any, clusters: ErrorCluster[]): TierASummaryResult[] {
    if (!Array.isArray(response)) {
      return [];
    }
    
    return response.map((item: any, index: number) => ({
      id: clusters[index]?.id || `cluster_${index}`,
      severity: item.severity || 'medium',
      shortCause: (item.short_cause || '').substring(0, 150), // Enforce word limit
      impactedRoles: item.impacted_roles || [],
      endpoints: item.endpoints || [],
      likelyChange: item.likely_change || 'unknown',
      candidateRunbookId: item.candidate_runbook_id,
      confidence: Math.max(0, Math.min(1, item.confidence || 0.5))
    }));
  }

  private parseTierBResponse(
    response: any,
    cluster: ErrorCluster,
    summary: TierASummaryResult
  ): TierBDeepDiveResult {
    return {
      briefReasoning: (response.brief_reasoning || '').substring(0, 200), // ≤40 words ≈ 200 chars
      hypothesis: response.hypothesis || 'Unknown root cause',
      topExperiments: response.top_2_safe_experiments || [],
      minimalCodeOrConfigDelta: response.minimal_code_or_config_delta || '',
      rollbackSteps: response.rollback_steps || [],
      confidence: Math.max(0, Math.min(1, response.confidence || 0.5)),
      rootCauseAnalysis: response.root_cause_analysis || '',
      impactAssessment: response.impact_assessment || '',
      timelineRecommendation: response.timeline_recommendation || '',
      stakeholderNotifications: response.stakeholder_notifications || []
    };
  }

  // Helper Methods
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private estimateTokenUsage(context: any, modelTier: 'tier_a_small' | 'tier_b_large'): number {
    const contextString = JSON.stringify(context);
    const baseTokens = Math.ceil(contextString.length / 4); // Rough estimate: 4 chars per token
    
    // Add expected output tokens
    const outputTokens = modelTier === 'tier_a_small' ? 150 : 400;
    
    return baseTokens + outputTokens;
  }

  private calculateCost(tokensUsed: any, modelConfig: any): number {
    return (tokensUsed.input * modelConfig.costPerTokenInput) + 
           (tokensUsed.output * modelConfig.costPerTokenOutput);
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

  private checkEscalationCriteria(result: any, confidence: number, template: PromptTemplate): boolean {
    return confidence < template.targetConfidenceThreshold;
  }

  private isNovelFingerprintWithGrowingVelocity(cluster: ErrorCluster): boolean {
    // Simplified check - in real implementation, would analyze velocity trends
    const hoursSinceFirst = (cluster.lastSeen.getTime() - cluster.firstSeen.getTime()) / 3600000;
    const eventsPerHour = cluster.eventCount / Math.max(hoursSinceFirst, 1);
    return eventsPerHour > 10; // Growing velocity threshold
  }

  private requiresProviderEscalation(analysis: TierBDeepDiveResult): boolean {
    return analysis.confidence < 0.5 || analysis.briefReasoning.includes('critical');
  }

  private prepareMessages(template: PromptTemplate, context: any): any[] {
    const userPrompt = template.userPromptTemplate.replace(/\{(\w+)\}/g, (match, key) => {
      return JSON.stringify(context[key] || '');
    });

    return [
      { role: 'system', content: template.systemPrompt },
      { role: 'user', content: userPrompt }
    ];
  }

  private truncateContext(messages: any[], maxTokens: number): any[] {
    // Simplified truncation - in real implementation, would use tiktoken
    const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    if (totalLength <= maxTokens * 4) { // Rough estimate: 4 chars per token
      return messages;
    }
    
    // Truncate user message if needed
    const systemMessage = messages[0];
    const userMessage = messages[1];
    const maxUserLength = (maxTokens * 4) - systemMessage.content.length;
    
    return [
      systemMessage,
      {
        ...userMessage,
        content: userMessage.content.substring(0, maxUserLength) + '...[truncated]'
      }
    ];
  }

  private async recordTokenUsage(
    tenantId: string,
    request: LLMRequest,
    response: LLMResponse
  ): Promise<void> {
    const usage: Omit<TokenUsageRecord, 'id' | 'timestamp' | 'providerBudgetId' | 'estimatedCost'> = {
      tenantId,
      modelTier: request.modelTier,
      modelName: response.modelUsed,
      tokensIn: response.tokensUsed.input,
      tokensOut: response.tokensUsed.output,
      totalTokens: response.tokensUsed.total,
      operationType: request.clusterId ? 'deep_dive' : 'cluster_summary',
      clusterId: request.clusterId,
      batchId: request.batchId,
      responseTimeMs: response.responseTimeMs,
      success: response.success,
      errorMessage: response.errorMessage
    };

    await this.costControl.recordTokenUsage(tenantId, usage);
  }

  // Initialize Prompt Templates
  private initializePromptTemplates(): void {
    // Tier A Summary Template
    this.promptTemplates.set('tier_a_summary', {
      id: 'tier_a_summary',
      name: 'Tier A Cluster Summary',
      modelTier: 'tier_a_small',
      systemPrompt: `You are an expert system reliability engineer. Summarize error/performance clusters efficiently.

CRITICAL CONSTRAINTS:
- Each cluster summary must be under 60 words total
- Return confidence 0.0-1.0 for each cluster
- Focus on actionable insights
- Identify likely root cause category

OUTPUT FORMAT: Return JSON array with objects containing:
{
  "id": "cluster_id",
  "severity": "low|medium|high|critical", 
  "short_cause": "Brief cause (≤25 words)",
  "impacted_roles": ["role1", "role2"],
  "endpoints": ["GET /api/endpoint"],
  "likely_change": "deploy|flag|dependency|config|unknown",
  "candidate_runbook_id": "runbook_ref",
  "confidence": 0.0-1.0
}`,
      userPromptTemplate: `Analyze these error clusters and provide concise summaries:

{clusters}

Context limit: {contextLimit}`,
      maxContextTokens: 512,
      expectedOutputTokens: 150,
      requiredFields: ['id', 'severity', 'short_cause', 'confidence'],
      outputSchema: {},
      targetConfidenceThreshold: 0.6,
      fallbackBehavior: 'escalate'
    });

    // Tier B Deep Dive Template
    this.promptTemplates.set('tier_b_deep_dive', {
      id: 'tier_b_deep_dive',
      name: 'Tier B Deep Dive Analysis',
      modelTier: 'tier_b_large',
      systemPrompt: `You are a senior site reliability engineer performing deep incident analysis.

CRITICAL CONSTRAINTS:
- brief_reasoning must be ≤40 words
- Provide exactly 2 safe experiments (internal-only)
- Focus on minimal, reversible changes
- Prioritize operational safety

OUTPUT FORMAT: Return JSON object:
{
  "brief_reasoning": "Concise analysis (≤40 words)",
  "hypothesis": "Root cause hypothesis",
  "top_2_safe_experiments": ["experiment1", "experiment2"],
  "minimal_code_or_config_delta": "Sketch of minimal change",
  "rollback_steps": ["step1", "step2"],
  "confidence": 0.0-1.0,
  "root_cause_analysis": "Detailed analysis",
  "impact_assessment": "Business impact assessment",
  "timeline_recommendation": "Suggested timeline",
  "stakeholder_notifications": ["team1", "team2"]
}`,
      userPromptTemplate: `Perform deep analysis of this severe/uncertain cluster:

Cluster: {cluster}
Initial Summary: {tierASummary}

Context limit: {contextLimit}`,
      maxContextTokens: 1024,
      expectedOutputTokens: 400,
      requiredFields: ['brief_reasoning', 'hypothesis', 'confidence'],
      outputSchema: {},
      targetConfidenceThreshold: 0.7,
      fallbackBehavior: 'skip'
    });
  }

  private async logLLMEvent(event: string, details: any): Promise<void> {
    await this.auditSystem.logActivity({
      action: event,
      target: 'llm_manager',
      targetId: details.tenantId || 'system',
      category: 'SYSTEM',
      severity: 'MEDIUM',
      details,
      context: {
        ipAddress: 'system',
        userAgent: 'llm_manager',
        sessionId: 'llm_session'
      }
    });
  }
}

// Factory Function
export function createLLMManager(
  tenantId: string,
  providerId: string,
  modelConfig: LLMModelConfig,
  costControlConfig: CostControlConfig,
  secureLLMConfig: SecureLLMConfig
): LLMManager {
  return new LLMManager(tenantId, providerId, modelConfig, costControlConfig, secureLLMConfig);
}

// Default Model Configuration
export const DEFAULT_LLM_MODEL_CONFIG: LLMModelConfig = {
  tierA: {
    model: 'gpt-3.5-turbo',
    maxTokens: 500,
    temperature: 0.1,
    costPerTokenInput: 0.0015, // $0.0015 per 1K tokens
    costPerTokenOutput: 0.002, // $0.002 per 1K tokens
    maxContextLength: 4096,
    averageResponseTime: 2000 // 2 seconds
  },
  tierB: {
    model: 'gpt-4-turbo-preview',
    maxTokens: 1000,
    temperature: 0.2,
    costPerTokenInput: 0.01, // $0.01 per 1K tokens
    costPerTokenOutput: 0.03, // $0.03 per 1K tokens
    maxContextLength: 8192,
    averageResponseTime: 8000 // 8 seconds
  }
};

// Types exported above with interfaces