/*
 * Lead Scoring Configuration - Northern Colorado Cleaning Business
 * 
 * This module defines the scoring weights and modifiers used to prioritize leads
 * for a janitorial/cleaning business headquartered in Sterling, CO.
 * 
 * ARCHITECTURE:
 * - Geographic Priority: Sterling (HQ) > Greeley > Fort Collins/Loveland > Denver
 * - Lead Type Modifiers: Hot (1.5x) > Warm (1.0x) > Cold (0.7x)
 * - Service Weights: Favor janitorial, carpet, floor care services
 * - Source Weights: Government RFPs get highest priority
 * 
 * HOT vs WARM LEAD CLASSIFICATION:
 * - HOT: Actively seeking cleaning services (RFPs, solicitations) - get 50% boost
 * - WARM: May need services eventually (construction permits) - no modifier
 * - COLD: General prospects - 30% reduction
 * 
 * FUTURE EXTENSIONS:
 * - Add seasonal modifiers (winter = higher indoor cleaning needs)
 * - Industry-specific weights (healthcare, schools get priority)
 * - Competition density scoring (fewer competitors = higher score)
 * - Customer lifetime value predictors
 * 
 * CUSTOMIZATION:
 * - Adjust geoPriority weights based on service capacity and profitability
 * - Modify leadTypeModifiers.hot to be more/less aggressive on hot leads
 * - Add new serviceWeights for specialized services (move-in/out, post-construction)
 */

export interface LeadScoringConfig {
  /**
   * Geographic priority scores. Keys are lowercase city or county names and values
   * are points added when a lead’s city matches. Adjust these values to reflect
   * your business’s target markets.
   */
  geoPriority: Record<string, number>;

  /**
   * Service weights. Keys are lowercase substrings of a service description
   * (e.g. "janitorial", "carpet"). A match adds the specified number of
   * points. Extend this map for additional service codes.
   */
  serviceWeights: Record<string, number>;

  /**
   * Source weights. These numbers are added based on the lead’s sourceType.
   * RFPs and other system-generated leads are weighted highest. Employee
   * referrals are intentionally non-billable and therefore receive no boost.
   */
  sourceWeights: Record<string, number>;

  /**
   * Lead type scoring modifiers. These multiply the base score to prioritize
   * leads who are actively seeking services vs. those who may need them eventually.
   */
  leadTypeModifiers: {
    hot: number;    // Actively seeking cleaning services (RFPs, solicitations)
    warm: number;   // May need services but not actively seeking (permits, new buildings)
    cold: number;   // General prospects
  };

  /**
   * Scoring thresholds for lead classification
   */
  thresholds: {
    hot: number;    // Score >= 70 = HOT lead (actively seeking)
    warm: number;   // Score >= 40 = WARM lead (below 40 = COLD)
  };
}

const config: LeadScoringConfig = {
  geoPriority: {
    // TIER 1: Sterling headquarters area (20+ points)
    sterling: 25,       // HQ location - 15 min drive, lowest costs, highest margin
    logan: 18,          // County contracts, Sterling is county seat
    
    // TIER 2: Primary service area (15-20 points)
    greeley: 20,        // Major market, 30 min drive, high commercial density
    evans: 15,          // Greeley suburb, growing commercial area
    weld: 15,           // County-level contracts, good size opportunities
    
    // TIER 3: Secondary service area (10-12 points)
    "fort collins": 12, // University town, 45 min drive, competitive market
    loveland: 12,       // Growing commercial area, reasonable drive time
    windsor: 10,        // Small but growing, between Greeley and Fort Collins
    
    // TIER 4: Extended area (6-8 points)
    longmont: 8,        // 1 hour drive, larger contracts only
    boulder: 8,         // University town, competitive, longer drive
    
    // TIER 5: Denver metro - high value only (6-8 points)
    denver: 8,          // 2+ hour drive, very competitive, $75k+ minimum
    arvada: 6,          // Denver suburb, longer drive
    westminster: 6,     // Denver suburb, longer drive  
    thornton: 6,        // Denver suburb, longer drive
    
    // FUTURE ADDITIONS:
    // "cheyenne": 10,    // Wyoming market expansion
    // "nebraska": 5,     // Long-term expansion possibility
  },
  serviceWeights: {
    // CORE SERVICES (high margin, regular contracts)
    janitorial: 20,    // Primary service, recurring revenue, highest priority
    carpet: 15,        // Specialized equipment, less competition, good margins
    floorcare: 12,     // Regular maintenance, predictable revenue
    
    // SPECIALTY SERVICES (growing demand)
    disinfection: 8,   // Post-COVID demand, premium pricing
    window: 5,         // Seasonal add-on service, good bundling opportunity
    
    // FUTURE SERVICE EXPANSIONS:
    // "post-construction": 18,  // Hot leads from new buildings
    // "medical": 15,           // Specialized cleaning, higher rates
    // "school": 12,            // Large contracts, seasonal
    // "emergency": 20,         // Flood/fire cleanup, urgent, premium rates
    // "move-out": 10,          // One-time service, good margins
  },
  sourceWeights: {
    // HIGHEST VALUE SOURCES (pre-qualified, ready to buy)
    LSA: 15,               // Lead Service Agreement partners, warm introductions
    RFP: 12,               // Government RFPs, clear budgets, less price shopping
    
    // AUTOMATED SOURCES (consistent quality, scalable)
    SYSTEM: 10,            // Auto-imports (permits, public records), FREE sources
    
    // MANUAL SOURCES (variable quality, sales team dependent)
    MANUAL: 5,             // Sales-generated, quality varies by rep
    EMPLOYEE_REFERRAL: 0,  // Free leads, no boost to avoid double-counting value
    
    // FUTURE SOURCE TYPES:
    // "PARTNERSHIP": 12,     // Referral partners (contractors, real estate)
    // "WEBSITE": 8,          // Inbound web leads, self-qualifying
    // "SOCIAL": 3,           // Social media leads, typically lower quality
    // "COLD_CALL": 2,        // Outbound calling, lowest conversion
    
    // NOTE: These map to LeadSource enum in Prisma schema
    // TODO: Track conversion rates by source and adjust weights accordingly
  },
  leadTypeModifiers: {
    // CRITICAL: These modifiers determine sales priority and response urgency
    
    hot: 1.5,   // 50% boost - ACTIVELY SEEKING services right now
                // Examples: Active RFPs, inbound quote requests, existing customers
                // Action: Respond within 2 hours, auto-SMS to sales team
    
    warm: 1.0,  // No modifier - MAY NEED services eventually  
                // Examples: Construction permits, new business openings, referrals
                // Action: Educational email sequence, monthly follow-up
    
    cold: 0.7,  // 30% reduction - General prospects
                // Examples: Prospect lists, old leads, low-engagement contacts
                // Action: Quarterly newsletter, no immediate follow-up
    
    // FUTURE TEMPERATURE TYPES:
    // urgent: 2.0,   // Emergency cleaning (flood, fire) - immediate response
    // renewal: 1.3,  // Existing customer contract renewals - high priority
    // lost: 0.5,     // Previously lost opportunities - lower priority
  },
  thresholds: {
    // WORKFLOW AUTOMATION TRIGGERS - these determine lead routing and response
    
    hot: 70,    // Score >= 70 = HOT LEAD
                // Actions: Immediate SMS alert, auto-assigned to senior rep,
                // 2-hour response requirement, AI auto-response enabled
                // Expected: ~15% of leads, 40%+ conversion rate
    
    warm: 40,   // Score 40-69 = WARM LEAD  
                // Actions: Weekly follow-up queue, educational email sequence,
                // monthly check-ins, no immediate response required
                // Expected: ~35% of leads, 10-15% conversion rate
                
                // Score <40 = COLD LEAD (implicit)
                // Actions: Quarterly newsletter, may archive after 6 months
                // Expected: ~50% of leads, 2-5% conversion rate
    
    // CALIBRATION NOTES:
    // - Monitor conversion rates and adjust thresholds for optimal ROI
    // - Hot threshold too low = overwhelmed sales team
    // - Hot threshold too high = missed opportunities
    // 
    // FUTURE ENHANCEMENTS:
    // - Dynamic thresholds based on sales team capacity
    // - Industry-specific thresholds (healthcare vs office cleaning)
    // - Seasonal adjustments (higher activity in fall/winter)
  },
};

export default config;