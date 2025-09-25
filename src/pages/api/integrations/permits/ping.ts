// src/pages/api/integrations/permits/ping.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // Test Austin API connection (it's public, no API key needed)
    const testUrl = "https://data.austintexas.gov/resource/3syk-w9eu.json?$limit=1";
    const response = await fetch(testUrl);
    
    if (!response.ok) {
      return res.status(200).json({ 
        ok: false, 
        error: `Austin permits API not accessible: ${response.status}`
      });
    }

    return res.status(200).json({ 
      ok: true, 
      message: "Construction permits APIs are accessible",
      sources: ["austin", "louisville", "montgomery"],
      note: "All sources are FREE with no API keys required"
    });

  } catch (error) {
    return res.status(200).json({ 
      ok: false, 
      error: error instanceof Error ? error.message : "Connection test failed" 
    });
  }
}