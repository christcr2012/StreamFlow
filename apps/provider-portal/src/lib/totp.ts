/**
 * TOTP (Time-based One-Time Password) / 2FA System
 * 
 * Implements two-factor authentication using TOTP (compatible with Google Authenticator,
 * Authy, 1Password, etc.) and backup codes for account recovery.
 * 
 * Features:
 * - TOTP secret generation
 * - QR code generation for easy enrollment
 * - TOTP code verification
 * - Backup codes generation and verification
 * - Compatible with all major authenticator apps
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Configure TOTP settings
authenticator.options = {
  window: 1, // Allow 1 step before/after for clock skew
  step: 30, // 30-second time step (standard)
};

/**
 * Generate a new TOTP secret for a user
 */
export function generateTOTPSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate a TOTP URI for QR code generation
 * 
 * @param email - User's email address
 * @param secret - TOTP secret
 * @param issuer - Application name (default: Robinson Solutions)
 */
export function generateTOTPUri(
  email: string,
  secret: string,
  issuer: string = 'Robinson Solutions'
): string {
  return authenticator.keyuri(email, issuer, secret);
}

/**
 * Generate a QR code data URL for TOTP enrollment
 * 
 * @param email - User's email address
 * @param secret - TOTP secret
 * @param issuer - Application name
 * @returns Promise<string> - Data URL for QR code image
 */
export async function generateTOTPQRCode(
  email: string,
  secret: string,
  issuer: string = 'Robinson Solutions'
): Promise<string> {
  const otpauth = generateTOTPUri(email, secret, issuer);
  return await QRCode.toDataURL(otpauth);
}

/**
 * Verify a TOTP code
 * 
 * @param token - 6-digit code from authenticator app
 * @param secret - User's TOTP secret
 * @returns boolean - True if code is valid
 */
export function verifyTOTPCode(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('[TOTP] Verification error:', error);
    return false;
  }
}

/**
 * Generate backup codes for account recovery
 * 
 * @param count - Number of backup codes to generate (default: 10)
 * @returns Array of backup codes (plain text)
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    // Format as XXXX-XXXX for readability
    const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}`;
    codes.push(formatted);
  }
  
  return codes;
}

/**
 * Hash backup codes for storage
 * 
 * @param codes - Array of plain text backup codes
 * @returns Promise<string> - JSON string of hashed codes
 */
export async function hashBackupCodes(codes: string[]): Promise<string> {
  const hashedCodes = await Promise.all(
    codes.map(async (code) => {
      const hash = await bcrypt.hash(code, 10);
      return { hash, used: false };
    })
  );
  
  return JSON.stringify(hashedCodes);
}

/**
 * Verify a backup code
 * 
 * @param code - Plain text backup code
 * @param hashedCodesJson - JSON string of hashed codes from database
 * @returns Promise<{ valid: boolean; updatedJson?: string }> - Validation result and updated JSON if valid
 */
export async function verifyBackupCode(
  code: string,
  hashedCodesJson: string
): Promise<{ valid: boolean; updatedJson?: string }> {
  try {
    const codes = JSON.parse(hashedCodesJson) as Array<{ hash: string; used: boolean }>;
    
    // Find matching unused code
    for (let i = 0; i < codes.length; i++) {
      if (!codes[i].used) {
        const isMatch = await bcrypt.compare(code, codes[i].hash);
        if (isMatch) {
          // Mark code as used
          codes[i].used = true;
          return {
            valid: true,
            updatedJson: JSON.stringify(codes),
          };
        }
      }
    }
    
    return { valid: false };
  } catch (error) {
    console.error('[TOTP] Backup code verification error:', error);
    return { valid: false };
  }
}

/**
 * Check if user has any unused backup codes
 * 
 * @param hashedCodesJson - JSON string of hashed codes from database
 * @returns number - Count of unused backup codes
 */
export function countUnusedBackupCodes(hashedCodesJson: string): number {
  try {
    const codes = JSON.parse(hashedCodesJson) as Array<{ hash: string; used: boolean }>;
    return codes.filter((c: any) => !c.used).length;
  } catch (error) {
    return 0;
  }
}

/**
 * Enable TOTP for a user
 * 
 * This is a helper function that:
 * 1. Generates a new TOTP secret
 * 2. Generates backup codes
 * 3. Returns everything needed for enrollment
 * 
 * @param email - User's email address
 * @returns Promise<EnrollmentData> - All data needed for TOTP enrollment
 */
export async function enrollTOTP(email: string): Promise<{
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
  backupCodesHash: string;
}> {
  // Generate secret
  const secret = generateTOTPSecret();
  
  // Generate QR code
  const qrCodeDataUrl = await generateTOTPQRCode(email, secret);
  
  // Generate backup codes
  const backupCodes = generateBackupCodes(10);
  const backupCodesHash = await hashBackupCodes(backupCodes);
  
  return {
    secret,
    qrCodeDataUrl,
    backupCodes,
    backupCodesHash,
  };
}

/**
 * Verify TOTP enrollment
 * 
 * User must provide a valid TOTP code to confirm they've set up their authenticator app correctly
 * 
 * @param token - 6-digit code from authenticator app
 * @param secret - TOTP secret that was generated during enrollment
 * @returns boolean - True if enrollment is confirmed
 */
export function verifyTOTPEnrollment(token: string, secret: string): boolean {
  return verifyTOTPCode(token, secret);
}

/**
 * Disable TOTP for a user
 * 
 * This should:
 * 1. Clear the TOTP secret
 * 2. Clear backup codes
 * 3. Set totpEnabled to false
 * 
 * (Implementation is in the API route, this is just a helper)
 */
export function disableTOTP(): {
  totpSecret: null;
  totpEnabled: false;
  backupCodesHash: null;
} {
  return {
    totpSecret: null,
    totpEnabled: false,
    backupCodesHash: null,
  };
}

/**
 * Generate new backup codes (for when user runs out)
 * 
 * @returns Promise<{ codes: string[]; hash: string }> - New backup codes and their hash
 */
export async function regenerateBackupCodes(): Promise<{
  codes: string[];
  hash: string;
}> {
  const codes = generateBackupCodes(10);
  const hash = await hashBackupCodes(codes);
  
  return { codes, hash };
}

