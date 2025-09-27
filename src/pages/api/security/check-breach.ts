// src/pages/api/security/check-breach.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createHash } from "crypto";
import { getEmailFromReq } from "@/lib/rbac";

/**
 * Check password against HaveIBeenPwned database using k-anonymity
 * https://haveibeenpwned.com/API/v3#PwnedPasswords
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }

    // SECURITY: Ensure user is authenticated
    const email = getEmailFromReq(req);
    if (!email) {
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const password = body.password?.toString();

    if (!password) {
      return res.status(400).json({ ok: false, error: "Password required" });
    }

    // Create SHA-1 hash of password for HaveIBeenPwned API
    const hash = createHash('sha1').update(password).digest('hex').toUpperCase();
    const hashPrefix = hash.substring(0, 5);
    const hashSuffix = hash.substring(5);

    // Query HaveIBeenPwned API with k-anonymity (only send first 5 chars)
    const response = await fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'WorkStream-Security-Check',
        'Add-Padding': 'true', // Better privacy protection
      },
    });

    if (!response.ok) {
      console.error('HaveIBeenPwned API error:', response.status, response.statusText);
      return res.status(500).json({ 
        ok: false, 
        error: "Unable to check password breach status",
        breached: null 
      });
    }

    const responseText = await response.text();
    const lines = responseText.split('\n');
    
    // Look for our password hash in the results
    let breachCount = 0;
    let isBreached = false;

    for (const line of lines) {
      const [suffix, count] = line.trim().split(':');
      if (suffix === hashSuffix) {
        breachCount = parseInt(count, 10);
        isBreached = true;
        break;
      }
    }

    return res.status(200).json({
      ok: true,
      breached: isBreached,
      count: isBreached ? breachCount : 0,
    });

  } catch (error) {
    console.error('Password breach check error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: "Internal server error",
      breached: null 
    });
  }
}