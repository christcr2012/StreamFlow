// AI Response Template Generation
// Creates tailored responses for different lead types and business scenarios
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o-mini"; // Cost-efficient model for response generation

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface ResponseTemplate {
  subject: string;           // Email subject line
  greeting: string;          // Opening paragraph
  mainContent: string;       // Core message body
  callToAction: string;      // Next steps/action items
  closing: string;           // Professional closing
  followUpSchedule: string;  // Recommended follow-up timing
  tone: 'professional' | 'warm' | 'urgent' | 'consultative';
}

export interface ResponseContext {
  leadType: 'hot' | 'warm' | 'cold';
  sourceType: string;        // RFP, construction permit, etc
  leadTitle?: string;
  companyName?: string;
  contactName?: string;
  location?: string;
  projectDetails?: string;
  estimatedValue?: number;
  urgencyLevel?: string;
  specialRequirements?: string;
}

/**
 * Generate AI-powered response template for federal RFPs
 * Creates professional, compliant responses emphasizing capabilities
 */
export async function generateRFPResponse(context: ResponseContext): Promise<ResponseTemplate> {
  try {
    const prompt = `
As a professional business development expert for a Northern Colorado cleaning company, create a tailored email response to a federal RFP opportunity.

COMPANY PROFILE:
- Established cleaning services company based in Sterling, Colorado
- Specializes in federal, healthcare, and commercial janitorial services
- NAICS 561720 certified, bonded and insured
- 10+ years of government contracting experience
- Known for reliability, compliance, and competitive pricing

LEAD CONTEXT:
- Lead Type: ${context.leadType} (federal RFP - immediate response required)
- Opportunity: ${context.leadTitle || 'Federal cleaning services contract'}
- Agency: ${context.companyName || 'Federal agency'}
- Location: ${context.location || 'Colorado'}
- Estimated Value: ${context.estimatedValue ? `$${context.estimatedValue.toLocaleString()}` : 'TBD'}
- Special Requirements: ${context.specialRequirements || 'Standard federal compliance'}

Create a professional email response that:
1. Expresses immediate interest and capability
2. Highlights relevant federal contracting experience
3. Mentions specific compliance capabilities (security clearance, green cleaning, etc.)
4. Requests additional information or clarification meeting
5. Positions company as reliable local partner

Respond with JSON in this exact format:
{
  "subject": "Professional subject line",
  "greeting": "Professional opening paragraph",
  "mainContent": "2-3 paragraph core message highlighting capabilities and interest",
  "callToAction": "Specific next steps request",
  "closing": "Professional closing statement",
  "followUpSchedule": "Recommended follow-up timing",
  "tone": "professional"
}
`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    const template = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      subject: template.subject || `Re: ${context.leadTitle || 'Federal Cleaning Services Opportunity'}`,
      greeting: template.greeting || 'Dear Contracting Officer,',
      mainContent: template.mainContent || 'We are writing to express our strong interest in this federal cleaning services opportunity.',
      callToAction: template.callToAction || 'We would welcome the opportunity to discuss our capabilities further.',
      closing: template.closing || 'Thank you for your consideration.',
      followUpSchedule: template.followUpSchedule || 'Follow up within 2 business days',
      tone: 'professional'
    };

  } catch (error) {
    console.error('RFP response generation error:', error);
    return generateFallbackRFPResponse(context);
  }
}

/**
 * Generate warm relationship-building response for construction leads
 * Creates educational, consultative responses for future opportunities
 */
export async function generateConstructionResponse(context: ResponseContext): Promise<ResponseTemplate> {
  try {
    const prompt = `
As a business development expert for a Northern Colorado cleaning company, create a warm, educational email to a construction project lead.

COMPANY PROFILE:
- Local cleaning services company based in Sterling, Colorado
- Specializes in post-construction cleanup and ongoing maintenance
- Serves Northern Colorado: Sterling, Greeley, Fort Collins, Denver area
- Known for quality, reliability, and building long-term relationships

LEAD CONTEXT:
- Lead Type: ${context.leadType} (construction permit - relationship building opportunity)
- Project: ${context.leadTitle || 'New construction project'}
- Contact: ${context.contactName || 'Project manager'}
- Company: ${context.companyName || 'Construction company'}
- Location: ${context.location || 'Northern Colorado'}
- Project Details: ${context.projectDetails || 'Commercial construction'}

Create a warm, consultative email that:
1. Congratulates them on their new project
2. Educates about post-construction cleaning importance
3. Offers free consultation or quote
4. Positions company as helpful local resource
5. Establishes relationship for future projects

Respond with JSON in this exact format:
{
  "subject": "Warm, helpful subject line",
  "greeting": "Warm, personalized opening",
  "mainContent": "2-3 paragraphs offering value and education",
  "callToAction": "Soft offer for consultation or information",
  "closing": "Warm, relationship-focused closing",
  "followUpSchedule": "Recommended follow-up timing",
  "tone": "warm"
}
`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    const template = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      subject: template.subject || `Congratulations on your ${context.location} project!`,
      greeting: template.greeting || `Dear ${context.contactName || 'Project Manager'},`,
      mainContent: template.mainContent || 'Congratulations on your new construction project! We wanted to reach out as a local cleaning services partner.',
      callToAction: template.callToAction || 'We would be happy to provide a complimentary consultation on post-construction cleaning needs.',
      closing: template.closing || 'We look forward to supporting your project success.',
      followUpSchedule: template.followUpSchedule || 'Follow up in 2-3 weeks as project progresses',
      tone: 'warm'
    };

  } catch (error) {
    console.error('Construction response generation error:', error);
    return generateFallbackConstructionResponse(context);
  }
}

/**
 * Generate follow-up response for existing leads
 * Creates appropriate follow-up messages based on lead temperature and timing
 */
export async function generateFollowUpResponse(context: ResponseContext & {
  lastContactDate?: string;
  previousInteraction?: string;
  leadStage?: string;
}): Promise<ResponseTemplate> {
  try {
    const prompt = `
Create a professional follow-up email for a cleaning services lead.

LEAD CONTEXT:
- Lead Type: ${context.leadType}
- Original Opportunity: ${context.leadTitle || 'Cleaning services inquiry'}
- Company: ${context.companyName || 'Prospect company'}
- Last Contact: ${context.lastContactDate || 'Recently'}
- Previous Interaction: ${context.previousInteraction || 'Initial contact'}
- Current Stage: ${context.leadStage || 'Initial interest'}

Create an appropriate follow-up that:
1. References previous interaction professionally
2. Provides additional value or information
3. Moves the relationship forward appropriately
4. Maintains professional persistence without being pushy
5. Offers specific next steps

Respond with JSON in this exact format:
{
  "subject": "Follow-up subject line",
  "greeting": "Professional greeting",
  "mainContent": "2-3 paragraphs adding value and moving forward",
  "callToAction": "Specific next step request",
  "closing": "Professional closing",
  "followUpSchedule": "Next follow-up timing",
  "tone": "consultative"
}
`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    const template = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      subject: template.subject || `Following up on ${context.leadTitle || 'cleaning services opportunity'}`,
      greeting: template.greeting || 'Hello,',
      mainContent: template.mainContent || 'I wanted to follow up on our previous conversation about cleaning services.',
      callToAction: template.callToAction || 'Would you be available for a brief call to discuss next steps?',
      closing: template.closing || 'Thank you for your time.',
      followUpSchedule: template.followUpSchedule || 'Follow up in 1 week if no response',
      tone: 'consultative'
    };

  } catch (error) {
    console.error('Follow-up response generation error:', error);
    return generateFallbackFollowUpResponse(context);
  }
}

// Fallback responses if AI fails
function generateFallbackRFPResponse(context: ResponseContext): ResponseTemplate {
  return {
    subject: `Re: ${context.leadTitle || 'Federal Cleaning Services Opportunity'}`,
    greeting: 'Dear Contracting Officer,',
    mainContent: `We are writing to express our strong interest in providing cleaning services for your federal facility. Our company has over 10 years of experience serving government clients in Colorado, with full compliance capabilities including security clearances and green cleaning protocols. We would welcome the opportunity to submit a comprehensive proposal that demonstrates our qualifications and competitive pricing.`,
    callToAction: 'Please let us know if you need any additional information or would like to schedule a capability briefing.',
    closing: 'Thank you for considering our services.',
    followUpSchedule: 'Follow up within 2 business days',
    tone: 'professional'
  };
}

function generateFallbackConstructionResponse(context: ResponseContext): ResponseTemplate {
  return {
    subject: `Congratulations on your ${context.location || 'local'} construction project!`,
    greeting: `Dear ${context.contactName || 'Project Manager'},`,
    mainContent: `Congratulations on your new construction project! As a local Northern Colorado cleaning company, we wanted to introduce ourselves and offer our post-construction cleanup expertise. We understand that final cleaning is critical for project completion and tenant move-in. Our team specializes in construction cleanup, from debris removal to final detailed cleaning that meets the highest standards.`,
    callToAction: 'We would be happy to provide a complimentary consultation and quote for your post-construction cleaning needs.',
    closing: 'We look forward to supporting your project success and building a lasting partnership.',
    followUpSchedule: 'Follow up in 2-3 weeks as construction progresses',
    tone: 'warm'
  };
}

function generateFallbackFollowUpResponse(context: ResponseContext): ResponseTemplate {
  return {
    subject: `Following up on ${context.leadTitle || 'cleaning services opportunity'}`,
    greeting: 'Hello,',
    mainContent: `I wanted to follow up on our previous conversation about cleaning services for your facility. We understand that selecting the right cleaning partner is an important decision. I thought you might find it helpful to know about some recent successful projects we have completed for similar organizations in the ${context.location || 'Colorado'} area.`,
    callToAction: 'Would you be available for a brief call this week to discuss how we can support your specific needs?',
    closing: 'Thank you for your consideration, and I look forward to hearing from you soon.',
    followUpSchedule: 'Follow up in 1 week if no response',
    tone: 'consultative'
  };
}