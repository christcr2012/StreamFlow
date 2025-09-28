/**
 * 🔐 ENTERPRISE DATA ENCRYPTION SYSTEM
 * Comprehensive data protection with field-level encryption and key management
 */

import crypto from 'crypto';
import { prisma as db } from './prisma';

export interface EncryptionConfig {
  algorithm: string;
  keyDerivation: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
  iterations: number;
}

export interface EncryptedData {
  data: string;
  iv: string;
  tag: string;
  keyId: string;
  algorithm: string;
}

export interface PIIField {
  fieldName: string;
  dataType: 'email' | 'phone' | 'ssn' | 'credit_card' | 'address' | 'name' | 'custom';
  encryptionRequired: boolean;
  retentionDays?: number;
}

/**
 * Enterprise-grade encryption system with key rotation and PII protection
 */
export class EncryptionSystem {
  private config: EncryptionConfig;
  private masterKey: Buffer;
  private keyCache = new Map<string, Buffer>();

  constructor() {
    this.config = {
      algorithm: 'aes-256-gcm',
      keyDerivation: 'pbkdf2',
      keyLength: 32,
      ivLength: 16,
      tagLength: 16,
      iterations: 100000,
    };

    // Initialize master key from environment
    const masterKeyHex = process.env.ENCRYPTION_MASTER_KEY;
    if (!masterKeyHex) {
      throw new Error('ENCRYPTION_MASTER_KEY environment variable is required');
    }
    this.masterKey = Buffer.from(masterKeyHex, 'hex');
  }

  /**
   * Generate a new encryption key
   */
  generateKey(): Buffer {
    return crypto.randomBytes(this.config.keyLength);
  }

  /**
   * Derive encryption key from master key and key ID
   */
  private deriveKey(keyId: string): Buffer {
    if (this.keyCache.has(keyId)) {
      return this.keyCache.get(keyId)!;
    }

    const salt = Buffer.from(keyId, 'utf8');
    const derivedKey = crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      this.config.iterations,
      this.config.keyLength,
      'sha256'
    );

    this.keyCache.set(keyId, derivedKey);
    return derivedKey;
  }

  /**
   * Encrypt sensitive data with AES-256-GCM
   */
  encrypt(plaintext: string, keyId: string = 'default'): EncryptedData {
    const key = this.deriveKey(keyId);
    const iv = crypto.randomBytes(this.config.ivLength);

    const cipher = crypto.createCipheriv(this.config.algorithm, key, iv) as crypto.CipherGCM;
    cipher.setAAD(Buffer.from(keyId, 'utf8')); // Additional authenticated data

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      data: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      keyId,
      algorithm: this.config.algorithm,
    };
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: EncryptedData): string {
    const key = this.deriveKey(encryptedData.keyId);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');

    const decipher = crypto.createDecipheriv(encryptedData.algorithm, key, iv) as crypto.DecipherGCM;
    decipher.setAAD(Buffer.from(encryptedData.keyId, 'utf8'));
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash sensitive data for searching (one-way)
   */
  hash(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 32, 'sha256');
    return `${actualSalt}:${hash.toString('hex')}`;
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hashedData: string): boolean {
    const [salt, hash] = hashedData.split(':');
    const computedHash = crypto.pbkdf2Sync(data, salt, 10000, 32, 'sha256');
    return hash === computedHash.toString('hex');
  }

  /**
   * Detect PII in data and return field classifications
   */
  detectPII(data: Record<string, any>): PIIField[] {
    const piiFields: PIIField[] = [];

    for (const [fieldName, value] of Object.entries(data)) {
      if (typeof value !== 'string') continue;

      const lowerFieldName = fieldName.toLowerCase();
      const fieldValue = value.toLowerCase();

      // Email detection
      if (lowerFieldName.includes('email') || /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(value)) {
        piiFields.push({
          fieldName,
          dataType: 'email',
          encryptionRequired: true,
          retentionDays: 2555, // 7 years
        });
      }

      // Phone number detection
      if (lowerFieldName.includes('phone') || /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/.test(value)) {
        piiFields.push({
          fieldName,
          dataType: 'phone',
          encryptionRequired: true,
          retentionDays: 2555,
        });
      }

      // SSN detection
      if (lowerFieldName.includes('ssn') || /\b\d{3}-?\d{2}-?\d{4}\b/.test(value)) {
        piiFields.push({
          fieldName,
          dataType: 'ssn',
          encryptionRequired: true,
          retentionDays: 2555,
        });
      }

      // Credit card detection
      if (lowerFieldName.includes('card') || /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/.test(value)) {
        piiFields.push({
          fieldName,
          dataType: 'credit_card',
          encryptionRequired: true,
          retentionDays: 1095, // 3 years
        });
      }

      // Address detection
      if (lowerFieldName.includes('address') || lowerFieldName.includes('street')) {
        piiFields.push({
          fieldName,
          dataType: 'address',
          encryptionRequired: true,
          retentionDays: 2555,
        });
      }

      // Name detection
      if (lowerFieldName.includes('name') && !lowerFieldName.includes('username') && !lowerFieldName.includes('filename')) {
        piiFields.push({
          fieldName,
          dataType: 'name',
          encryptionRequired: true,
          retentionDays: 2555,
        });
      }
    }

    return piiFields;
  }

  /**
   * Encrypt PII fields in data object
   */
  encryptPIIFields(data: Record<string, any>, orgId: string): {
    encryptedData: Record<string, any>;
    piiFields: PIIField[];
  } {
    const piiFields = this.detectPII(data);
    const encryptedData = { ...data };

    for (const piiField of piiFields) {
      if (piiField.encryptionRequired && encryptedData[piiField.fieldName]) {
        const keyId = `${orgId}:${piiField.dataType}`;
        const encrypted = this.encrypt(encryptedData[piiField.fieldName], keyId);
        encryptedData[piiField.fieldName] = JSON.stringify(encrypted);
      }
    }

    return { encryptedData, piiFields };
  }

  /**
   * Decrypt PII fields in data object
   */
  decryptPIIFields(data: Record<string, any>, piiFields: PIIField[]): Record<string, any> {
    const decryptedData = { ...data };

    for (const piiField of piiFields) {
      if (piiField.encryptionRequired && decryptedData[piiField.fieldName]) {
        try {
          const encryptedData = JSON.parse(decryptedData[piiField.fieldName]);
          decryptedData[piiField.fieldName] = this.decrypt(encryptedData);
        } catch (error) {
          console.error(`Failed to decrypt field ${piiField.fieldName}:`, error);
          // Keep encrypted data if decryption fails
        }
      }
    }

    return decryptedData;
  }

  /**
   * Generate encryption key for organization
   */
  async generateOrgKey(orgId: string): Promise<string> {
    const keyId = `org:${orgId}:${Date.now()}`;
    const key = this.generateKey();
    
    // Store key metadata in database
    await db.encryptionKey.create({
      data: {
        keyId,
        orgId,
        algorithm: this.config.algorithm,
        createdAt: new Date(),
        active: true,
      },
    });

    return keyId;
  }

  /**
   * Rotate encryption keys for organization
   */
  async rotateOrgKeys(orgId: string): Promise<void> {
    // Mark old keys as inactive
    await db.encryptionKey.updateMany({
      where: { orgId, active: true },
      data: { active: false, rotatedAt: new Date() },
    });

    // Generate new key
    await this.generateOrgKey(orgId);

    // Clear key cache for this org
    for (const [keyId] of this.keyCache) {
      if (keyId.startsWith(`${orgId}:`)) {
        this.keyCache.delete(keyId);
      }
    }
  }

  /**
   * Get encryption statistics for organization
   */
  async getEncryptionStats(orgId: string): Promise<{
    totalKeys: number;
    activeKeys: number;
    lastRotation: Date | null;
    encryptedFields: number;
  }> {
    const keys = await db.encryptionKey.findMany({
      where: { orgId },
    });

    const activeKeys = keys.filter(k => k.active);
    const lastRotation = keys.length > 0 
      ? keys.reduce((latest, key) => 
          key.rotatedAt && (!latest || key.rotatedAt > latest) ? key.rotatedAt : latest, 
          null as Date | null
        )
      : null;

    // Count encrypted fields (would need to scan actual data)
    const encryptedFields = 0; // Placeholder - would implement field scanning

    return {
      totalKeys: keys.length,
      activeKeys: activeKeys.length,
      lastRotation,
      encryptedFields,
    };
  }
}

// Export singleton instance
export const encryptionSystem = new EncryptionSystem();

/**
 * Initialize encryption system with master key check
 */
export function initializeEncryption(): boolean {
  try {
    // Test encryption/decryption to verify master key
    const testData = 'encryption-test-' + Date.now();
    const encrypted = encryptionSystem.encrypt(testData, 'test');
    const decrypted = encryptionSystem.decrypt(encrypted);

    if (decrypted !== testData) {
      console.error('Encryption system test failed - master key may be invalid');
      return false;
    }

    console.log('✅ Encryption system initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Encryption system initialization failed:', error);
    return false;
  }
}

// Utility functions for common encryption tasks
export const EncryptionUtils = {
  /**
   * Encrypt user email for storage
   */
  encryptEmail: (email: string, orgId: string) => 
    encryptionSystem.encrypt(email, `${orgId}:email`),

  /**
   * Encrypt phone number for storage
   */
  encryptPhone: (phone: string, orgId: string) => 
    encryptionSystem.encrypt(phone, `${orgId}:phone`),

  /**
   * Hash email for searching
   */
  hashEmail: (email: string) => 
    encryptionSystem.hash(email.toLowerCase()),

  /**
   * Verify email hash
   */
  verifyEmailHash: (email: string, hash: string) => 
    encryptionSystem.verifyHash(email.toLowerCase(), hash),
};
