/**
 * Module: AES-GCM Utilities
 * Purpose: Encrypt/decrypt sensitive strings (e.g., Stripe acct_xxx) at rest
 * Scope: Server-side encryption for sensitive data
 * Notes: Codex Phase 8.7 - Requires APP_ENCRYPTION_KEY = 32-byte base64 (256-bit key)
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_B64 = process.env.APP_ENCRYPTION_KEY;

if (!KEY_B64 && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️ APP_ENCRYPTION_KEY not set - encryption will fail');
  // TODO(secrets): set APP_ENCRYPTION_KEY in env; 32-byte random key, base64-encoded
  // Generate with: node -e "console.log(crypto.randomBytes(32).toString('base64'))"
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns base64-encoded string in format: [12-byte IV][16-byte TAG][N-byte DATA]
 * 
 * @param plaintext - The string to encrypt
 * @returns Base64-encoded encrypted payload
 * @throws Error if APP_ENCRYPTION_KEY is not set
 */
export function encryptString(plaintext: string): string {
  if (!KEY_B64) {
    throw new Error('APP_ENCRYPTION_KEY environment variable is not set');
  }

  const key = Buffer.from(KEY_B64, 'base64');
  
  // Validate key length (must be 32 bytes for AES-256)
  if (key.length !== 32) {
    throw new Error('APP_ENCRYPTION_KEY must be 32 bytes (256 bits) when base64-decoded');
  }

  // Generate random 12-byte IV (96-bit nonce)
  const iv = crypto.randomBytes(12);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  
  // Get authentication tag
  const tag = cipher.getAuthTag();
  
  // Combine: [IV][TAG][DATA] and encode as base64
  const payload = Buffer.concat([iv, tag, encrypted]);
  return payload.toString('base64');
}

/**
 * Decrypt a base64-encoded encrypted string
 * Expects format: [12-byte IV][16-byte TAG][N-byte DATA]
 * 
 * @param payloadB64 - Base64-encoded encrypted payload
 * @returns Decrypted plaintext string
 * @throws Error if decryption fails or APP_ENCRYPTION_KEY is not set
 */
export function decryptString(payloadB64: string): string {
  if (!KEY_B64) {
    throw new Error('APP_ENCRYPTION_KEY environment variable is not set');
  }

  const key = Buffer.from(KEY_B64, 'base64');
  
  // Validate key length
  if (key.length !== 32) {
    throw new Error('APP_ENCRYPTION_KEY must be 32 bytes (256 bits) when base64-decoded');
  }

  // Decode payload
  const payload = Buffer.from(payloadB64, 'base64');
  
  // Extract components
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  
  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  // Decrypt
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  
  return decrypted.toString('utf8');
}

/**
 * Generate a new encryption key (for setup/rotation)
 * Returns a base64-encoded 32-byte key suitable for APP_ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Test if encryption is properly configured
 * Returns true if APP_ENCRYPTION_KEY is set and valid
 */
export function isEncryptionConfigured(): boolean {
  if (!KEY_B64) return false;
  
  try {
    const key = Buffer.from(KEY_B64, 'base64');
    return key.length === 32;
  } catch {
    return false;
  }
}

/**
 * Encrypt Stripe Connect account ID
 * Convenience wrapper for encrypting Stripe account IDs
 */
export function encryptStripeAccountId(accountId: string): string {
  if (!accountId.startsWith('acct_')) {
    throw new Error('Invalid Stripe account ID format');
  }
  return encryptString(accountId);
}

/**
 * Decrypt Stripe Connect account ID
 * Convenience wrapper for decrypting Stripe account IDs
 */
export function decryptStripeAccountId(encrypted: string): string {
  const decrypted = decryptString(encrypted);
  if (!decrypted.startsWith('acct_')) {
    throw new Error('Decrypted value is not a valid Stripe account ID');
  }
  return decrypted;
}

// PR-CHECKS:
// - [x] AES-256-GCM encryption implemented
// - [x] 12-byte IV (96-bit nonce)
// - [x] 16-byte authentication tag
// - [x] Base64 encoding for storage
// - [x] Key validation (32 bytes)
// - [x] Stripe account ID helpers
// - [x] Configuration check function

