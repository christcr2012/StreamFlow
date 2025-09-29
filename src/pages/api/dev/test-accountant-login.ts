// src/pages/api/dev/test-accountant-login.ts

/**
 * 🔧 DEVELOPER ENDPOINT: Test Accountant Login
 * 
 * Direct test of accountant authentication logic
 */

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Only allow for developer users or in development
    const isDev = process.env.NODE_ENV === 'development';
    const developerCookie = req.cookies.ws_developer;
    const developerEmail = process.env.DEVELOPER_EMAIL?.toLowerCase();
    
    if (!isDev && (!developerCookie || !developerEmail || decodeURIComponent(developerCookie).toLowerCase() !== developerEmail)) {
      return res.status(403).json({ error: "Developer access required" });
    }

    console.log('🔧 DEVELOPER TESTING ACCOUNTANT LOGIN LOGIC');

    // HARDCODED accountant credentials (not environment variables)
    const HARDCODED_ACCOUNTANT_EMAIL = 'accountant@streamflow.com';
    const HARDCODED_ACCOUNTANT_PASSWORD = 'Thrillicious01no';
    const accountantEmail = HARDCODED_ACCOUNTANT_EMAIL.toLowerCase();
    const accountantPassword = HARDCODED_ACCOUNTANT_PASSWORD;

    // Test input
    const testEmail = 'accountant@streamflow.com';
    const testPassword = 'Thrillicious01no';

    // Test the full authentication condition
    const authSuccess = accountantEmail && accountantPassword &&
                       testEmail.toLowerCase() === accountantEmail &&
                       testPassword === accountantPassword;

    // Test middleware logic
    const cookieValue = encodeURIComponent(testEmail);
    const decodedCookieValue = decodeURIComponent(cookieValue);
    const middlewareMatch = decodedCookieValue.toLowerCase() === accountantEmail;

    const testResults = {
      environment: {
        HARDCODED_ACCOUNTANT_EMAIL: HARDCODED_ACCOUNTANT_EMAIL,
        ACCOUNTANT_EMAIL_LOWERCASE: accountantEmail,
        ACCOUNTANT_PASSWORD_SET: !!accountantPassword,
        NODE_ENV: process.env.NODE_ENV,
        NOTE: 'Accountant credentials are HARDCODED, not from environment variables'
      },
      testInput: {
        email: testEmail,
        emailLowercase: testEmail.toLowerCase(),
        password: testPassword
      },
      comparisons: {
        emailMatch: testEmail.toLowerCase() === accountantEmail,
        passwordMatch: testPassword === accountantPassword,
        environmentVariablesPresent: !!(accountantEmail && accountantPassword)
      },
      cookieTest: {
        original: testEmail,
        encoded: encodeURIComponent(testEmail),
        decoded: decodeURIComponent(encodeURIComponent(testEmail)),
        encodingWorks: testEmail === decodeURIComponent(encodeURIComponent(testEmail))
      },
      authenticationResult: {
        success: authSuccess,
        wouldRedirectTo: authSuccess ? '/accountant' : null
      },
      middlewareTest: {
        cookieValue,
        decodedCookieValue,
        middlewareMatch,
        wouldAllowAccess: middlewareMatch
      }
    };

    console.log('🔍 ACCOUNTANT LOGIN TEST RESULTS:', JSON.stringify(testResults, null, 2));

    return res.status(200).json({
      success: true,
      testResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Accountant login test error:', error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ 
      success: false, 
      error: message,
      timestamp: new Date().toISOString()
    });
  }
}
