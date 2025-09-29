// src/pages/api/dev/accountant-diagnosis.ts

/**
 * 💰 ACCOUNTANT AUTHENTICATION DIAGNOSIS API
 * 
 * Developer endpoint to diagnose accountant authentication issues
 */

import type { NextApiRequest, NextApiResponse } from "next";
import AccountantAuthTester from "@/lib/accountant-auth-test";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Only allow in development or for developer users
    const isDev = process.env.NODE_ENV === 'development';
    const developerCookie = req.cookies.ws_developer;
    const developerEmail = process.env.DEVELOPER_EMAIL?.toLowerCase();
    
    if (!isDev && (!developerCookie || !developerEmail || decodeURIComponent(developerCookie).toLowerCase() !== developerEmail)) {
      return res.status(403).json({ error: "Developer access required" });
    }

    console.log('🔧 DEVELOPER REQUESTED ACCOUNTANT DIAGNOSIS');

    // Get base URL from request
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    // Run diagnosis
    const tester = new AccountantAuthTester(baseUrl);
    const diagnosis = await tester.runDiagnosis();

    return res.status(200).json({
      success: true,
      diagnosis,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        ACCOUNTANT_EMAIL: process.env.ACCOUNTANT_EMAIL ? '[SET]' : '[NOT SET]',
        ACCOUNTANT_PASSWORD: process.env.ACCOUNTANT_PASSWORD ? '[SET]' : '[NOT SET]',
      }
    });

  } catch (error) {
    console.error('Accountant diagnosis error:', error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ 
      success: false, 
      error: message,
      timestamp: new Date().toISOString()
    });
  }
}
