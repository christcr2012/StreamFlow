// src/lib/aiHelper.ts
// AI Integration Library - Lead Analysis and Business Intelligence
//
// PURPOSE:
// Provides AI-powered analysis for lead generation, RFP evaluation, and business advice.
// Uses OpenAI GPT-4o Mini for cost-effective analysis while maintaining high quality.
//
// FEATURES:
// - Lead quality analysis and scoring enhancement
// - RFP evaluation and bidding strategy recommendations  
// - Pricing optimization suggestions
// - Response template generation
// - Competitive analysis insights
//
// COST OPTIMIZATION:
// - Uses GPT-4o Mini ($0.15 input + $0.60 output per million tokens)
// - Structured prompts to minimize token usage
// - Caches common responses to reduce repeated calls
// - Estimated cost: $15-25/month for active cleaning business

import OpenAI from "openai";
import { createHash } from "crypto";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// However, we use GPT-4o Mini for cost efficiency - 15x cheaper than GPT-5
const MODEL = "gpt-4o-mini";

// PERFORMANCE: AI Response Cache (24-hour TTL)
// Caches AI responses by content hash to avoid repeated identical calls
// Estimated savings: 30-40% reduction in AI costs
const aiCache = new Map<string, { data: any; timestamp: number }>();
const AI_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate cache key from prompt content
 * Uses SHA-256 hash for consistent, collision-resistant keys
 */
function generateCacheKey(prefix: string, content: string): string {
  const hash = createHash('sha256').update(content).digest('hex');
  return `ai:${prefix}:${hash}`;
}

/**
 * Get cached AI response if available and not expired
 */
function getCachedResponse<T>(key: string): T | null {
  const cached = aiCache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > AI_CACHE_TTL) {
    aiCache.delete(key);
    return null;
  }

  return cached.data as T;
}

/**
 * Cache AI response with timestamp
 */
function setCachedResponse<T>(key: string, data: T): void {
  aiCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

// Supported AI models for multi-model management
export type AIModel = 'gpt-4o-mini' | 'gpt-4o' | 'gpt-3.5-turbo';

// Model cost per 1M tokens (input/output)
export const MODEL_COSTS: Record<AIModel, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4o': { input: 5.00, output: 15.00 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
};

// Lazy-load OpenAI client to avoid build-time initialization
// This prevents "Missing credentials" errors during Next.js build
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openaiClient;
}

// AI-Enhanced Lead Analysis
export interface LeadAnalysis {
  qualityScore: number;           // 1-100 quality rating
  urgencyLevel: 'immediate' | 'high' | 'medium' | 'low';
  keyOpportunities: string[];     // Specific selling points
  potentialChallenges: string[];  // Risks or challenges to address
  recommendedAction: string;      // Next steps
  estimatedValue: string;         // Project value estimate
  confidence: number;             // AI confidence in analysis (0-1)
  aiAnalysisFailed?: boolean;     // True if AI service was unavailable
}

// RFP Bidding Strategy Analysis
export interface RFPStrategy {
  competitiveLandscape: string;   // Competition analysis
  keyRequirements: string[];      // Must-have capabilities
  pricingStrategy: string;        // Recommended pricing approach
  winFactors: string[];          // What will win this bid
  riskFactors: string[];         // Potential issues
  responseTemplate: string;       // Draft response outline
}

// Pricing Intelligence
export interface PricingAdvice {
  suggestedRange: { min: number; max: number };
  priceJustification: string;     // Why this pricing makes sense
  competitiveFactors: string[];   // Market considerations
  valueProposition: string;       // Key selling points
  negotiationTips: string[];      // Advice for client discussions
}

/**
 * Analyze lead quality and provide actionable business intelligence
 * Enhances basic lead scoring with AI insights about opportunity and strategy
 *
 * PERFORMANCE: Cached by content hash (24h TTL) to avoid repeated identical calls
 */
export async function analyzeLead(leadData: {
  title?: string;
  description?: string;
  location?: string;
  sourceType?: string;
  agency?: string;
  estimatedValue?: number;
  requirements?: string;
}): Promise<LeadAnalysis> {
  try {
    // Generate cache key from lead data
    const cacheContent = JSON.stringify(leadData);
    const cacheKey = generateCacheKey('lead-analysis', cacheContent);

    // Check cache first
    const cached = getCachedResponse<LeadAnalysis>(cacheKey);
    if (cached) {
      return cached;
    }

    const prompt = `
As an expert cleaning services business consultant, analyze this lead and provide actionable intelligence:

LEAD DETAILS:
- Title: ${leadData.title || 'N/A'}
- Description: ${leadData.description || 'N/A'}
- Location: ${leadData.location || 'N/A'}
- Source: ${leadData.sourceType || 'N/A'}
- Agency/Client: ${leadData.agency || 'N/A'}
- Estimated Value: ${leadData.estimatedValue ? `$${leadData.estimatedValue.toLocaleString()}` : 'N/A'}
- Requirements: ${leadData.requirements || 'N/A'}

BUSINESS CONTEXT:
- Northern Colorado cleaning business based in Sterling
- Specializes in commercial janitorial, post-construction cleanup, carpet cleaning
- Competes on speed, quality, and local presence
- Serves government, healthcare, education, and commercial sectors

Respond with JSON in this exact format:
{
  "qualityScore": number (1-100),
  "urgencyLevel": "immediate|high|medium|low",
  "keyOpportunities": ["specific opportunity 1", "opportunity 2"],
  "potentialChallenges": ["challenge 1", "challenge 2"],
  "recommendedAction": "specific next step",
  "estimatedValue": "value range estimate",
  "confidence": number (0-1)
}
`;

    const response = await getOpenAIClient().chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 800
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');

    // Validate and provide defaults
    const result: LeadAnalysis = {
      qualityScore: Math.max(1, Math.min(100, analysis.qualityScore || 50)),
      urgencyLevel: ['immediate', 'high', 'medium', 'low'].includes(analysis.urgencyLevel)
        ? analysis.urgencyLevel : 'medium',
      keyOpportunities: Array.isArray(analysis.keyOpportunities) ? analysis.keyOpportunities : [],
      potentialChallenges: Array.isArray(analysis.potentialChallenges) ? analysis.potentialChallenges : [],
      recommendedAction: analysis.recommendedAction || 'Review lead details and follow up',
      estimatedValue: analysis.estimatedValue || 'Unable to estimate',
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0.7))
    };

    // Cache the result
    setCachedResponse(cacheKey, result);

    return result;

  } catch (error) {
    console.error('AI lead analysis error:', error);
    // Return safe defaults if AI fails - with indicator that AI was unavailable
    return {
      qualityScore: 50,
      urgencyLevel: 'medium',
      keyOpportunities: ['Standard cleaning opportunity'],
      potentialChallenges: ['Limited information available'],
      recommendedAction: 'Contact lead for more details',
      estimatedValue: 'Requires assessment',
      confidence: 0.3,
      aiAnalysisFailed: true // Indicate AI service was unavailable
    };
  }
}

/**
 * Generate RFP bidding strategy and response recommendations
 * Provides competitive intelligence and positioning advice
 *
 * PERFORMANCE: Cached by content hash (24h TTL) to avoid repeated identical calls
 */
export async function analyzeRFP(rfpData: {
  title?: string;
  description?: string;
  requirements?: string;
  agency?: string;
  responseDeadline?: string;
  estimatedValue?: number;
  location?: string;
}): Promise<RFPStrategy> {
  try {
    // Generate cache key from RFP data
    const cacheContent = JSON.stringify(rfpData);
    const cacheKey = generateCacheKey('rfp-analysis', cacheContent);

    // Check cache first
    const cached = getCachedResponse<RFPStrategy>(cacheKey);
    if (cached) {
      return cached;
    }

    const prompt = `
As a government contracting expert for cleaning services, analyze this RFP and provide a winning strategy:

RFP DETAILS:
- Title: ${rfpData.title || 'N/A'}
- Description: ${rfpData.description || 'N/A'}
- Requirements: ${rfpData.requirements || 'N/A'}
- Agency: ${rfpData.agency || 'N/A'}
- Deadline: ${rfpData.responseDeadline || 'N/A'}
- Estimated Value: ${rfpData.estimatedValue ? `$${rfpData.estimatedValue.toLocaleString()}` : 'N/A'}
- Location: ${rfpData.location || 'N/A'}

COMPANY PROFILE:
- Regional cleaning company based in Sterling, Colorado
- 10+ years experience in government, healthcare, education contracts
- NAICS 561720 (Janitorial Services), bonded and insured
- Local presence advantage in Northern Colorado
- Known for reliability, compliance, and competitive pricing

Respond with JSON in this exact format:
{
  "competitiveLandscape": "analysis of likely competition",
  "keyRequirements": ["requirement 1", "requirement 2"],
  "pricingStrategy": "recommended pricing approach",
  "winFactors": ["factor 1", "factor 2"],
  "riskFactors": ["risk 1", "risk 2"],
  "responseTemplate": "outline for RFP response"
}
`;

    const response = await getOpenAIClient().chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    const strategy = JSON.parse(response.choices[0].message.content || '{}');

    const result: RFPStrategy = {
      competitiveLandscape: strategy.competitiveLandscape || 'Analysis not available',
      keyRequirements: Array.isArray(strategy.keyRequirements) ? strategy.keyRequirements : [],
      pricingStrategy: strategy.pricingStrategy || 'Competitive pricing recommended',
      winFactors: Array.isArray(strategy.winFactors) ? strategy.winFactors : [],
      riskFactors: Array.isArray(strategy.riskFactors) ? strategy.riskFactors : [],
      responseTemplate: strategy.responseTemplate || 'Standard RFP response template'
    };

    // Cache the result
    setCachedResponse(cacheKey, result);

    return result;

  } catch (error) {
    console.error('AI RFP analysis error:', error);
    return {
      competitiveLandscape: 'Analysis unavailable',
      keyRequirements: ['Review RFP requirements'],
      pricingStrategy: 'Research market rates',
      winFactors: ['Local presence', 'Competitive pricing'],
      riskFactors: ['Limited information'],
      responseTemplate: 'Standard response format needed'
    };
  }
}

/**
 * Generate pricing recommendations based on project details
 * Considers market rates, project complexity, and competitive factors
 *
 * PERFORMANCE: Cached by content hash (24h TTL) to avoid repeated identical calls
 */
export async function generatePricingAdvice(projectData: {
  serviceType?: string;
  squareFootage?: number;
  frequency?: string;
  location?: string;
  specialRequirements?: string;
  timeline?: string;
  clientType?: string;
}): Promise<PricingAdvice> {
  try {
    // Generate cache key from project data
    const cacheContent = JSON.stringify(projectData);
    const cacheKey = generateCacheKey('pricing-advice', cacheContent);

    // Check cache first
    const cached = getCachedResponse<PricingAdvice>(cacheKey);
    if (cached) {
      return cached;
    }

    const prompt = `
As a commercial cleaning pricing expert in Northern Colorado, provide pricing recommendations:

PROJECT DETAILS:
- Service Type: ${projectData.serviceType || 'General cleaning'}
- Square Footage: ${projectData.squareFootage || 'Unknown'}
- Frequency: ${projectData.frequency || 'Unknown'}
- Location: ${projectData.location || 'Northern Colorado'}
- Special Requirements: ${projectData.specialRequirements || 'Standard cleaning'}
- Timeline: ${projectData.timeline || 'Standard'}
- Client Type: ${projectData.clientType || 'Commercial'}

MARKET CONTEXT:
- Northern Colorado rates: $0.08-0.15/sq ft for basic janitorial
- Post-construction cleanup: $0.20-0.35/sq ft
- Carpet cleaning: $0.25-0.50/sq ft
- Government contracts typically 10-20% below commercial rates
- Local competition from regional and national chains

Respond with JSON in this exact format:
{
  "suggestedRange": {"min": number, "max": number},
  "priceJustification": "explanation of pricing rationale",
  "competitiveFactors": ["factor 1", "factor 2"],
  "valueProposition": "key selling points for this price",
  "negotiationTips": ["tip 1", "tip 2"]
}
`;

    const response = await getOpenAIClient().chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 800
    });

    const pricing = JSON.parse(response.choices[0].message.content || '{}');

    const result: PricingAdvice = {
      suggestedRange: {
        min: pricing.suggestedRange?.min || 1000,
        max: pricing.suggestedRange?.max || 5000
      },
      priceJustification: pricing.priceJustification || 'Competitive market rate',
      competitiveFactors: Array.isArray(pricing.competitiveFactors) ? pricing.competitiveFactors : [],
      valueProposition: pricing.valueProposition || 'Quality service at competitive rates',
      negotiationTips: Array.isArray(pricing.negotiationTips) ? pricing.negotiationTips : []
    };

    // Cache the result
    setCachedResponse(cacheKey, result);

    return result;

  } catch (error) {
    console.error('AI pricing analysis error:', error);
    return {
      suggestedRange: { min: 1000, max: 5000 },
      priceJustification: 'Market research needed',
      competitiveFactors: ['Local market conditions'],
      valueProposition: 'Reliable local service',
      negotiationTips: ['Emphasize quality and reliability']
    };
  }
}

/**
 * Test OpenAI API connection and functionality
 * Returns simple analysis to verify everything is working
 */
export async function testAIConnection(): Promise<{ 
  success: boolean; 
  message: string; 
  model: string; 
}> {
  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: MODEL,
      messages: [{
        role: "user",
        content: "Respond with JSON: {\"status\": \"working\", \"message\": \"AI integration successful\"}"
      }],
      response_format: { type: "json_object" },
      max_tokens: 100
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      success: true,
      message: result.message || 'AI connection verified',
      model: MODEL
    };
  } catch (error) {
    return {
      success: false,
      message: `AI connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      model: MODEL
    };
  }
}

/**
 * Email Response Assistant
 * Generate AI-powered email response suggestions with context awareness
 */
export interface EmailResponseSuggestion {
  subject: string;
  body: string;
  tone: 'professional' | 'friendly' | 'formal';
  confidence: number;
}

export async function generateEmailResponse(context: {
  incomingEmail?: string;
  customerName?: string;
  topic?: string;
  tone?: 'professional' | 'friendly' | 'formal';
  additionalContext?: string;
  model?: AIModel;
}): Promise<EmailResponseSuggestion> {
  try {
    const selectedModel = context.model || MODEL;
    const tone = context.tone || 'professional';

    const prompt = `
As a professional customer service representative for a cleaning services company, generate an email response:

INCOMING EMAIL:
${context.incomingEmail || 'N/A'}

CUSTOMER: ${context.customerName || 'Valued Customer'}
TOPIC: ${context.topic || 'General Inquiry'}
DESIRED TONE: ${tone}
ADDITIONAL CONTEXT: ${context.additionalContext || 'None'}

Generate a ${tone} email response that:
1. Addresses the customer's concerns or questions
2. Maintains a ${tone} tone throughout
3. Provides clear next steps or action items
4. Includes appropriate closing

Return JSON with this structure:
{
  "subject": "Email subject line",
  "body": "Full email body with proper formatting",
  "tone": "${tone}",
  "confidence": 0.85
}`;

    const response = await getOpenAIClient().chat.completions.create({
      model: selectedModel,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      subject: result.subject || 'Re: Your Inquiry',
      body: result.body || 'Thank you for your inquiry. We will get back to you shortly.',
      tone: result.tone || tone,
      confidence: result.confidence || 0.7
    };
  } catch (error) {
    console.error('Email response generation failed:', error);
    return {
      subject: 'Re: Your Inquiry',
      body: 'Thank you for contacting us. We have received your message and will respond shortly.',
      tone: context.tone || 'professional',
      confidence: 0.5
    };
  }
}

/**
 * Select optimal AI model based on task complexity and budget
 */
export function selectOptimalModel(params: {
  taskComplexity: 'simple' | 'medium' | 'complex';
  budgetRemaining: number;
  estimatedTokens: number;
}): AIModel {
  const { taskComplexity, budgetRemaining, estimatedTokens } = params;

  // Calculate cost for each model
  const costs = Object.entries(MODEL_COSTS).map(([model, pricing]) => {
    const estimatedCost = (estimatedTokens / 1000000) * (pricing.input + pricing.output) / 2;
    return { model: model as AIModel, cost: estimatedCost };
  });

  // If budget is very low, use cheapest model
  if (budgetRemaining < 1) {
    return 'gpt-3.5-turbo';
  }

  // Select based on complexity and budget
  if (taskComplexity === 'complex' && budgetRemaining > 5) {
    return 'gpt-4o';
  } else if (taskComplexity === 'medium' && budgetRemaining > 2) {
    return 'gpt-4o-mini';
  } else {
    return 'gpt-3.5-turbo';
  }
}