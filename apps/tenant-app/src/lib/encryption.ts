/**
 * Encryption utilities for sensitive credentials
 * 
 * Uses AES-256-GCM encryption with a master key from environment variables.
 * All sensitive credentials (API keys, secrets) should be encrypted before
 * storing in the database and decrypted only when needed.
 */

import crypto from 'crypto';

// Algorithm for encryption
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Get the master encryption key from environment variables
 * In production, this should be a strong random key stored securely
 */
function getMasterKey(): string {
  const key = process.env.ENCRYPTION_MASTER_KEY;
  
  if (!key) {
    // In development, use a default key (NOT for production!)
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Using default encryption key for development. Set ENCRYPTION_MASTER_KEY in production!');
      return 'dev-encryption-key-change-in-production-32-chars-minimum';
    }
    
    throw new Error('ENCRYPTION_MASTER_KEY environment variable is required');
  }
  
  return key;
}

/**
 * Derive a key from the master key using PBKDF2
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt a string value
 * 
 * @param plaintext - The value to encrypt
 * @returns Encrypted value in format: salt:iv:tag:ciphertext (all base64 encoded)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    return '';
  }

  try {
    const masterKey = getMasterKey();
    
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from master key
    const key = deriveKey(masterKey, salt);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the plaintext
    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    
    // Get the authentication tag
    const tag = cipher.getAuthTag();
    
    // Return format: salt:iv:tag:ciphertext (all base64)
    return [
      salt.toString('base64'),
      iv.toString('base64'),
      tag.toString('base64'),
      ciphertext,
    ].join(':');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt value');
  }
}

/**
 * Decrypt an encrypted string value
 * 
 * @param encrypted - The encrypted value in format: salt:iv:tag:ciphertext
 * @returns Decrypted plaintext value
 */
export function decrypt(encrypted: string): string {
  if (!encrypted) {
    return '';
  }

  try {
    const masterKey = getMasterKey();
    
    // Parse the encrypted value
    const parts = encrypted.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted value format');
    }
    
    const [saltB64, ivB64, tagB64, ciphertext] = parts;
    
    // Decode from base64
    const salt = Buffer.from(saltB64, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    
    // Derive key from master key
    const key = deriveKey(masterKey, salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt the ciphertext
    let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');
    
    return plaintext;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt value');
  }
}

/**
 * Check if a value is encrypted (has the correct format)
 */
export function isEncrypted(value: string): boolean {
  if (!value) {
    return false;
  }
  
  const parts = value.split(':');
  return parts.length === 4;
}

/**
 * Encrypt an object's sensitive fields
 * 
 * @param obj - Object containing sensitive fields
 * @param fields - Array of field names to encrypt
 * @returns New object with encrypted fields
 */
export function encryptFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj };
  
  for (const field of fields) {
    const value = obj[field];
    if (value && typeof value === 'string') {
      result[field] = encrypt(value) as T[keyof T];
    }
  }
  
  return result;
}

/**
 * Decrypt an object's encrypted fields
 * 
 * @param obj - Object containing encrypted fields
 * @param fields - Array of field names to decrypt
 * @returns New object with decrypted fields
 */
export function decryptFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj };
  
  for (const field of fields) {
    const value = obj[field];
    if (value && typeof value === 'string' && isEncrypted(value)) {
      result[field] = decrypt(value) as T[keyof T];
    }
  }
  
  return result;
}

/**
 * Generate a secure random key suitable for use as ENCRYPTION_MASTER_KEY
 * This is a utility function for generating keys, not for runtime use
 */
export function generateMasterKey(): string {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Hash a value using SHA-256 (one-way, for comparison only)
 * Use this for values that need to be compared but never decrypted
 */
export function hash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('base64');
}

/**
 * Verify a value against a hash
 */
export function verifyHash(value: string, hashedValue: string): boolean {
  return hash(value) === hashedValue;
}

