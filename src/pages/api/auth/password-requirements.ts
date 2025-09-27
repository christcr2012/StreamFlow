// src/pages/api/auth/password-requirements.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { DEFAULT_PASSWORD_POLICY, getPasswordRequirements, validatePasswordPolicy } from "@/lib/password-policy";

/**
 * API endpoint to get current password requirements and validate passwords
 * GET: Returns current password policy requirements
 * POST: Validates a password against the policy (without storing it)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      // Return password requirements for frontend display
      const requirements = getPasswordRequirements();
      
      return res.status(200).json({
        ok: true,
        policy: DEFAULT_PASSWORD_POLICY,
        requirements,
        description: "Global password security standards enforced across the system"
      });
    } 
    
    else if (req.method === "POST") {
      // Validate password without storing (for real-time feedback)
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const password = body.password;
      
      if (!password) {
        return res.status(400).json({ ok: false, error: "Password required" });
      }
      
      const validation = validatePasswordPolicy(password);
      
      return res.status(200).json({
        ok: true,
        validation: {
          isValid: validation.isValid,
          errors: validation.errors,
          strength: validation.strength,
          score: validation.score
        },
        policy: DEFAULT_PASSWORD_POLICY
      });
    }
    
    else {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Password requirements API error:", error);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}