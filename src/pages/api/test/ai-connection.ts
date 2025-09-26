// Test endpoint to verify OpenAI API integration
import type { NextApiRequest, NextApiResponse } from "next";
import { testAIConnection } from "@/lib/aiHelper";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await testAIConnection();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'AI integration working perfectly!',
        model: result.model,
        ready: true
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.message,
        model: result.model,
        ready: false
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ready: false
    });
  }
}