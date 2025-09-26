// Test endpoint for AI RFP strategy analysis
import type { NextApiRequest, NextApiResponse } from "next";
import { analyzeRFP, generatePricingAdvice } from "@/lib/aiHelper";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Sample federal RFP for testing
    const sampleRFP = {
      title: "Janitorial Services - Federal Building Complex",
      description: "Comprehensive janitorial and custodial services for a 150,000 square foot federal office complex including daily cleaning, waste management, restroom maintenance, and floor care. Must meet federal sustainability requirements and security clearance protocols.",
      requirements: "NAICS 561720, Previous federal contracting experience required, Security clearance for personnel, Green cleaning products mandatory, OSHA compliance",
      agency: "General Services Administration",
      responseDeadline: "2025-10-15",
      estimatedValue: 750000,
      location: "Denver, Colorado"
    };

    // Generate comprehensive AI analysis
    const [rfpStrategy, pricingAdvice] = await Promise.all([
      analyzeRFP(sampleRFP),
      generatePricingAdvice({
        serviceType: 'janitorial',
        squareFootage: 150000,
        frequency: 'daily',
        location: 'Denver, Colorado',
        specialRequirements: 'Federal compliance, security clearance, green cleaning',
        clientType: 'government'
      })
    ]);

    res.status(200).json({
      success: true,
      sampleRFP,
      rfpStrategy,
      pricingAdvice,
      analysisComplete: true
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    });
  }
}