// src/pages/api/security/two-factor.ts
import { getEmailFromReq } from "@/lib/auth-helpers";
import { prisma as db } from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import * as crypto from "crypto";
import { authenticator } from "otplib";

/**
 * Two-Factor Authentication API
 * GET: Get user's 2FA status and setup data
 * POST: Enable/disable 2FA or generate setup data
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const email = await getEmailFromReq(req);
    if (!email) {
      return res.status(401).json({ ok: false, error: "Authentication required" });
    }

    // Get user info
    const user = await db.user.findFirst({
      where: { email },
      select: { id: true, name: true, orgId: true }
    });

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    if (req.method === "GET") {
      return handleGetTwoFactor(req, res, user.id);
    } else if (req.method === "POST") {
      return handlePostTwoFactor(req, res, user);
    } else {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Two-factor API error:", error);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

/**
 * Get user's 2FA status and configuration
 */
async function handleGetTwoFactor(req: NextApiRequest, res: NextApiResponse, userId: string) {
  // @ts-ignore - UserTwoFactor model exists but TypeScript hasn't refreshed yet
  const twoFactor = await (db as any).userTwoFactor.findUnique({
    where: { userId },
    select: {
      isEnabled: true,
      phoneNumber: true,
      verifiedAt: true,
      createdAt: true
    }
  });

  return res.status(200).json({
    ok: true,
    twoFactor: {
      isEnabled: twoFactor?.isEnabled || false,
      phoneNumber: twoFactor?.phoneNumber || null,
      verifiedAt: twoFactor?.verifiedAt || null,
      hasBackupCodes: twoFactor ? true : false
    }
  });
}

/**
 * Handle 2FA setup, enable, disable operations
 */
async function handlePostTwoFactor(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { action, totpCode, phoneNumber } = req.body;

  switch (action) {
    case "setup":
      return handleSetupTwoFactor(res, user);
    case "enable":
      return handleEnableTwoFactor(res, user, totpCode, phoneNumber);
    case "disable":
      return handleDisableTwoFactor(res, user.id);
    default:
      return res.status(400).json({ ok: false, error: "Invalid action" });
  }
}

/**
 * Generate TOTP secret and backup codes for 2FA setup
 */
async function handleSetupTwoFactor(res: NextApiResponse, user: any) {
  const secret = authenticator.generateSecret();
  const serviceName = "WorkStream";
  const issuer = "WorkStream";
  
  // Generate QR code URL for TOTP apps
  const otpauth = authenticator.keyuri(user.name || user.email, serviceName, secret);
  
  // Generate 10 backup codes
  const backupCodes = Array.from({ length: 10 }, () => 
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );

  // Hash backup codes for storage
  const hashedBackupCodes = backupCodes.map(code => 
    crypto.createHash('sha256').update(code).digest('hex')
  );

  // Store or update 2FA setup (not enabled yet)
  // @ts-ignore - UserTwoFactor model exists but TypeScript hasn't refreshed yet
  await (db as any).userTwoFactor.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      totpSecret: secret,
      backupCodes: hashedBackupCodes,
      isEnabled: false
    },
    update: {
      totpSecret: secret,
      backupCodes: hashedBackupCodes,
      isEnabled: false
    }
  });

  return res.status(200).json({
    ok: true,
    setup: {
      secret,
      otpauth,
      backupCodes, // Send plain codes to user for download/printing
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`
    }
  });
}

/**
 * Verify TOTP code and enable 2FA
 */
async function handleEnableTwoFactor(res: NextApiResponse, user: any, totpCode: string, phoneNumber?: string) {
  if (!totpCode) {
    return res.status(400).json({ ok: false, error: "TOTP code required" });
  }

  // @ts-ignore - UserTwoFactor model exists but TypeScript hasn't refreshed yet
  const twoFactor = await (db as any).userTwoFactor.findUnique({
    where: { userId: user.id },
    select: { totpSecret: true, isEnabled: true }
  });

  if (!twoFactor || !twoFactor.totpSecret) {
    return res.status(400).json({ ok: false, error: "2FA setup required first" });
  }

  if (twoFactor.isEnabled) {
    return res.status(400).json({ ok: false, error: "2FA already enabled" });
  }

  // Verify TOTP code
  const isValid = authenticator.check(totpCode, twoFactor.totpSecret);
  if (!isValid) {
    return res.status(400).json({ ok: false, error: "Invalid TOTP code" });
  }

  // Enable 2FA
  // @ts-ignore - UserTwoFactor model exists but TypeScript hasn't refreshed yet
  await (db as any).userTwoFactor.update({
    where: { userId: user.id },
    data: {
      isEnabled: true,
      phoneNumber: phoneNumber || null,
      verifiedAt: new Date()
    }
  });

  return res.status(200).json({
    ok: true,
    message: "Two-factor authentication enabled successfully"
  });
}

/**
 * Disable 2FA for user
 */
async function handleDisableTwoFactor(res: NextApiResponse, userId: string) {
  // @ts-ignore - UserTwoFactor model exists but TypeScript hasn't refreshed yet
  await (db as any).userTwoFactor.update({
    where: { userId },
    data: {
      isEnabled: false,
      verifiedAt: null
    }
  });

  return res.status(200).json({
    ok: true,
    message: "Two-factor authentication disabled"
  });
}