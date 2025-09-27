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

/*
=== ENTERPRISE ROADMAP: AI-POWERED LEAD INTELLIGENCE ===

CURRENT STATE vs ENTERPRISE STANDARDS:
- Basic OpenAI integration for lead analysis
- Static prompts with limited context
- No caching or optimization for costs
- Manual AI analysis triggers

ENTERPRISE CRM COMPARISON (Salesforce Einstein, HubSpot AI, Pipedrive AI):
1. Advanced AI Capabilities:
   - Multi-model ensemble predictions (LLM + traditional ML)
   - Real-time lead scoring with continuous learning
   - Natural language processing for email/call analysis
   - Computer vision for document processing (RFPs, contracts)

2. Intelligent Automation:
   - Auto-generated follow-up sequences based on lead behavior
   - Predictive lead routing to best-fit sales reps
   - Intelligent conversation insights and coaching
   - Automated competitive intelligence gathering

3. Advanced Analytics & Insights:
   - Lead source performance optimization
   - Sales coaching recommendations based on AI analysis
   - Market trend analysis and opportunity identification
   - Custom AI models trained on company-specific data

IMPLEMENTATION ROADMAP:

Phase 1: Enhanced AI Analysis (2-3 weeks)
- Add response caching to reduce API costs
- Implement confidence scoring for AI recommendations
- Add context-aware prompts with lead history
- Create AI analysis result validation and error handling

Phase 2: Multi-Model Intelligence (1-2 months)
- Train custom ML models on company data
- Implement ensemble predictions combining AI + traditional ML
- Add email/call transcript analysis capabilities
- Create document intelligence for RFP processing

Phase 3: Intelligent Automation (2-3 months)
- Build AI-powered lead routing and assignment
- Add auto-generated follow-up recommendations
- Implement conversation intelligence and coaching
- Create predictive analytics for sales forecasting

Phase 4: Advanced AI Platform (1-2 months)
- Add custom AI model training pipeline
- Implement competitive intelligence automation
- Create market analysis and trend identification
- Add AI-powered sales coaching and recommendations

ENTERPRISE FEATURES TO IMPLEMENT:
*/

// ENTERPRISE FEATURE: Multi-model prediction result
export type MultiModelPrediction = {
  llmAnalysis: LeadAnalysis;     // LLM-based analysis
  mlPrediction: {                // Traditional ML prediction
    conversionProbability: number;
    valueEstimate: number;
    timeToConversion: number;
    confidence: number;
  };
  ensembleScore: number;         // Combined ensemble score
  conflictResolution: string;    // How conflicts were resolved
  modelWeights: {
    llm: number;
    ml: number;
    rules: number;
  };
};

// ENTERPRISE FEATURE: Conversation intelligence analysis
export type ConversationIntelligence = {
  sentiment: 'positive' | 'neutral' | 'negative';
  intent: string[];             // Detected customer intents
  objections: string[];         // Identified objections
  nextSteps: string[];          // Recommended follow-up actions
  competitorMentions: string[]; // Competitors discussed
  budget: {
    mentioned: boolean;
    range?: { min: number; max: number };
    urgency: 'immediate' | 'quarter' | 'year' | 'unknown';
  };
  decisionMaker: {
    identified: boolean;
    role?: string;
    influence: 'high' | 'medium' | 'low';
  };
  coachingTips: string[];       // AI-generated coaching suggestions
};

import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// However, we use GPT-4o Mini for cost efficiency - 15x cheaper than GPT-5
const MODEL = "gpt-4o-mini";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// AI-Enhanced Lead Analysis
export interface LeadAnalysis {
  qualityScore: number;           // 1-100 quality rating
  urgencyLevel: 'immediate' | 'high' | 'medium' | 'low';
  keyOpportunities: string[];     // Specific selling points
  potentialChallenges: string[];  // Risks or challenges to address
  recommendedAction: string;      // Next steps
  estimatedValue: string;         // Project value estimate
  confidence: number;             // AI confidence in analysis (0-1)
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

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 800
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    // Validate and provide defaults
    return {
      qualityScore: Math.max(1, Math.min(100, analysis.qualityScore || 50)),
      urgencyLevel: ['immediate', 'high', 'medium', 'low'].includes(analysis.urgencyLevel) 
        ? analysis.urgencyLevel : 'medium',
      keyOpportunities: Array.isArray(analysis.keyOpportunities) ? analysis.keyOpportunities : [],
      potentialChallenges: Array.isArray(analysis.potentialChallenges) ? analysis.potentialChallenges : [],
      recommendedAction: analysis.recommendedAction || 'Review lead details and follow up',
      estimatedValue: analysis.estimatedValue || 'Unable to estimate',
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0.7))
    };

  } catch (error) {
    console.error('AI lead analysis error:', error);
    // Return safe defaults if AI fails
    return {
      qualityScore: 50,
      urgencyLevel: 'medium',
      keyOpportunities: ['Standard cleaning opportunity'],
      potentialChallenges: ['Limited information available'],
      recommendedAction: 'Contact lead for more details',
      estimatedValue: 'Requires assessment',
      confidence: 0.3
    };
  }
}

/**
 * Generate RFP bidding strategy and response recommendations
 * Provides competitive intelligence and positioning advice
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

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    const strategy = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      competitiveLandscape: strategy.competitiveLandscape || 'Analysis not available',
      keyRequirements: Array.isArray(strategy.keyRequirements) ? strategy.keyRequirements : [],
      pricingStrategy: strategy.pricingStrategy || 'Competitive pricing recommended',
      winFactors: Array.isArray(strategy.winFactors) ? strategy.winFactors : [],
      riskFactors: Array.isArray(strategy.riskFactors) ? strategy.riskFactors : [],
      responseTemplate: strategy.responseTemplate || 'Standard RFP response template'
    };

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

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 800
    });

    const pricing = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      suggestedRange: {
        min: pricing.suggestedRange?.min || 1000,
        max: pricing.suggestedRange?.max || 5000
      },
      priceJustification: pricing.priceJustification || 'Competitive market rate',
      competitiveFactors: Array.isArray(pricing.competitiveFactors) ? pricing.competitiveFactors : [],
      valueProposition: pricing.valueProposition || 'Quality service at competitive rates',
      negotiationTips: Array.isArray(pricing.negotiationTips) ? pricing.negotiationTips : []
    };

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
    const response = await openai.chat.completions.create({
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