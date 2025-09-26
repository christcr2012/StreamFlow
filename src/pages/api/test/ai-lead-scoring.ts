// Test endpoint for AI-enhanced lead scoring demonstration
import type { NextApiRequest, NextApiResponse } from "next";
import { scoreLeadNormalized } from "@/lib/leadScoringAdapter";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Sample lead data for testing AI enhancement
    const sampleLeads = [
      {
        title: "Federal Janitorial Services - VA Medical Center",
        serviceDescription: "Comprehensive janitorial services for 200,000 sq ft medical facility including specialized infection control cleaning",
        city: "Denver",
        state: "CO",
        sourceType: "RFP",
        leadType: "hot",
        agency: "Department of Veterans Affairs",
        naics: "561720",
        psc: "S201"
      },
      {
        title: "Construction Cleanup - New Office Building", 
        serviceDescription: "Post-construction cleanup for 50,000 sq ft commercial office building",
        city: "Greeley",
        state: "CO", 
        sourceType: "SYSTEM",
        leadType: "warm",
        naics: "561790"
      }
    ];

    const results = [];
    
    for (const lead of sampleLeads) {
      const result = await scoreLeadNormalized(lead, true); // Enable AI analysis
      results.push({
        leadTitle: lead.title,
        baseScore: result.score,
        aiAnalysis: result.aiAnalysis,
        scoringReasons: result.details
      });
    }

    res.status(200).json({
      success: true,
      message: "AI-enhanced lead scoring test completed",
      results
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}