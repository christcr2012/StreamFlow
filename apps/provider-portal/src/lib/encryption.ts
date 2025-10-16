/**
 * Provider-Portal Encryption Utilities (AES-256-GCM)
 * Mirrors tenant-app implementation to keep a single pattern across the stack.
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100_000;

function getMasterKey(): string {
  const key = process.env.ENCRYPTION_MASTER_KEY || process.env.FED_HMAC_MASTER_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_MASTER_KEY is not set');
  }
  return key;
}

function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return '';
  const masterKey = getMasterKey();
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(masterKey, salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  const tag = cipher.getAuthTag();
  return [salt.toString('base64'), iv.toString('base64'), tag.toString('base64'), ciphertext].join(':');
}

export function decrypt(encrypted: string): string {
  if (!encrypted) return '';
  const masterKey = getMasterKey();
  const parts = encrypted.split(':');
  if (parts.length !== 4) throw new Error('Invalid encrypted value format');
  const [saltB64, ivB64, tagB64, ciphertext] = parts;
  const salt = Buffer.from(saltB64, 'base64');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const key = deriveKey(masterKey, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
  plaintext += decipher.final('utf8');
  return plaintext;
}

export function isEncrypted(value: string): boolean {
  if (!value) return false;
  return value.split(':').length === 4;
}

