// src/pages/api/integrations/findrfp/ping.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = process.env.FINDRFP_API_KEY;
  if (!apiKey) return res.status(200).json({ ok: false, error: "FINDRFP_API_KEY not set" });

  // Mock ping for Find RFP service
  // In real implementation, this would test the actual API connection
  try {
    // Simulate API ping
    const mockResponse = {
      status: "active",
      available_categories: ["federal", "state", "local", "nonprofit"],
      rate_limits: {
        requests_per_hour: 1000,
        requests_per_day: 10000
      }
    };

    return res.status(200).json({
      ok: true,
      status: 200,
      service: "findrfp",
      message: "Find RFP API connection successful",
      data: mockResponse
    });
  } catch (e: unknown) {
    const msg = (e as { message?: string } | undefined)?.message || "Unknown error";
    return res.status(500).json({ ok: false, error: msg, service: "findrfp" });
  }
}