/*
 * Configuration for lead scoring. This module exports a simple object used by
 * src/lib/leadScoring.ts to calculate lead scores. Keeping this data in its own
 * module makes it easy to adjust weighting without touching the scoring logic.
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
}

const config: LeadScoringConfig = {
  geoPriority: {
    // Sterling headquarters - highest priority
    sterling: 25,
    // Weld County coverage areas
    greeley: 20,        // High priority, high value
    evans: 15,          // Near Greeley
    weld: 15,           // County-level contracts
    // Northern Colorado surrounding areas  
    "fort collins": 12,
    loveland: 12,
    windsor: 10,
    // Logan County
    logan: 18,          // County seat is Sterling
    // Denver area - only very high value
    denver: 8,
    arvada: 6,
    westminster: 6,
    thornton: 6,
    // Other Northern Colorado
    longmont: 8,
    boulder: 8,
  },
  serviceWeights: {
    janitorial: 20,
    carpet: 15,
    floorcare: 12,
    disinfection: 8,
    window: 5,
  },
  sourceWeights: {
    RFP: 12,
    SYSTEM: 10,
    EMPLOYEE_REFERRAL: 0,
    MANUAL: 5,
    LSA: 15,
  },
};

export default config;