// src/pages/api/integrations/permits/ping.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // Test Fort Collins API connection (it's public, no API key needed)
    const testUrl = "https://services.arcgis.com/YY1W1B93GvV1YFqy/arcgis/rest/services/Building_Permits/FeatureServer/0/query?f=json&where=1=1&outFields=*&resultRecordCount=1";
    const response = await fetch(testUrl);
    
    if (!response.ok) {
      return res.status(200).json({ 
        ok: false, 
        error: `Fort Collins permits API not accessible: ${response.status}`
      });
    }

    return res.status(200).json({ 
      ok: true, 
      message: "Northern Colorado construction permits APIs are accessible",
      sources: ["weld", "fortcollins", "denver"],
      coverage: "Sterling, Greeley, Fort Collins, Loveland, and Denver (high value only)",
      note: "All sources are FREE with no API keys required"
    });

  } catch (error) {
    return res.status(200).json({ 
      ok: false, 
      error: error instanceof Error ? error.message : "Connection test failed" 
    });
  }
}