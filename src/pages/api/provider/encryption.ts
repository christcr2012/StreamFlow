/**
 * 🔐 PROVIDER ENCRYPTION MANAGEMENT API
 * Enterprise encryption key management and PII protection
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { encryptionSystem } from '../../../lib/encryption-system';
import { createAuditEvent } from '../../../lib/audit';
import { prisma as db } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Provider authentication check
  const providerCookie = req.cookies.ws_provider;
  if (!providerCookie) {
    return res.status(401).json({ error: 'Provider authentication required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetEncryptionStats(req, res);
      case 'POST':
        return await handleEncryptionAction(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Encryption API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get encryption statistics for all organizations
 */
async function handleGetEncryptionStats(req: NextApiRequest, res: NextApiResponse) {
  const { orgId } = req.query;

  if (orgId && typeof orgId === 'string') {
    // Get stats for specific organization
    const stats = await encryptionSystem.getEncryptionStats(orgId);
    return res.json({ orgId, stats });
  }

  // Get stats for all organizations
  const orgs = await db.org.findMany({
    select: { id: true, name: true },
  });

  const allStats = await Promise.all(
    orgs.map(async (org) => {
      const stats = await encryptionSystem.getEncryptionStats(org.id);
      return {
        orgId: org.id,
        orgName: org.name,
        stats,
      };
    })
  );

  return res.json({ organizations: allStats });
}

/**
 * Handle encryption actions (key rotation, PII detection, etc.)
 */
async function handleEncryptionAction(req: NextApiRequest, res: NextApiResponse) {
  const { action, orgId, data } = req.body;

  if (!action || !orgId) {
    return res.status(400).json({ error: 'Action and orgId are required' });
  }

  // Verify organization exists
  const org = await db.org.findUnique({
    where: { id: orgId },
    select: { id: true, name: true },
  });

  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  switch (action) {
    case 'rotate_keys':
      return await handleKeyRotation(req, res, orgId);
    case 'detect_pii':
      return await handlePIIDetection(req, res, orgId, data);
    case 'encrypt_field':
      return await handleFieldEncryption(req, res, orgId, data);
    case 'decrypt_field':
      return await handleFieldDecryption(req, res, orgId, data);
    case 'generate_key':
      return await handleKeyGeneration(req, res, orgId);
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}

/**
 * Rotate encryption keys for organization
 */
async function handleKeyRotation(req: NextApiRequest, res: NextApiResponse, orgId: string) {
  try {
    await encryptionSystem.rotateOrgKeys(orgId);

    // Audit log
    await createAuditEvent(
      { userId: 'provider', orgId },
      {
        action: 'encryption.key_rotation',
        target: `org:${orgId}`,
        category: 'SECURITY_EVENT',
        details: {
          rotatedAt: new Date().toISOString(),
          rotatedBy: 'provider',
        },
      }
    );

    return res.json({
      success: true,
      message: 'Encryption keys rotated successfully',
      rotatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Key rotation error:', error);
    return res.status(500).json({ error: 'Failed to rotate encryption keys' });
  }
}

/**
 * Detect PII in provided data
 */
async function handlePIIDetection(req: NextApiRequest, res: NextApiResponse, orgId: string, data: any) {
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Data object is required for PII detection' });
  }

  try {
    const piiFields = encryptionSystem.detectPII(data);

    // Audit log
    await createAuditEvent(
      { userId: 'provider', orgId },
      {
        action: 'encryption.pii_detection',
        target: `org:${orgId}`,
        category: 'SECURITY_EVENT',
        details: {
          fieldsScanned: Object.keys(data).length,
          piiFieldsFound: piiFields.length,
          piiTypes: piiFields.map(f => f.dataType),
        },
      }
    );

    return res.json({
      success: true,
      piiFields,
      summary: {
        totalFields: Object.keys(data).length,
        piiFieldsFound: piiFields.length,
        encryptionRequired: piiFields.filter(f => f.encryptionRequired).length,
      },
    });
  } catch (error) {
    console.error('PII detection error:', error);
    return res.status(500).json({ error: 'Failed to detect PII' });
  }
}

/**
 * Encrypt a specific field
 */
async function handleFieldEncryption(req: NextApiRequest, res: NextApiResponse, orgId: string, data: any) {
  const { fieldName, fieldValue, dataType } = data;

  if (!fieldName || !fieldValue) {
    return res.status(400).json({ error: 'fieldName and fieldValue are required' });
  }

  try {
    const keyId = `${orgId}:${dataType || 'custom'}`;
    const encrypted = encryptionSystem.encrypt(fieldValue, keyId);

    // Audit log
    await createAuditEvent(
      { userId: 'provider', orgId },
      {
        action: 'encryption.field_encrypted',
        target: `field:${fieldName}`,
        category: 'SECURITY_EVENT',
        details: {
          fieldName,
          dataType: dataType || 'custom',
          keyId,
        },
      }
    );

    return res.json({
      success: true,
      encrypted,
      fieldName,
      keyId,
    });
  } catch (error) {
    console.error('Field encryption error:', error);
    return res.status(500).json({ error: 'Failed to encrypt field' });
  }
}

/**
 * Decrypt a specific field
 */
async function handleFieldDecryption(req: NextApiRequest, res: NextApiResponse, orgId: string, data: any) {
  const { fieldName, encryptedData } = data;

  if (!fieldName || !encryptedData) {
    return res.status(400).json({ error: 'fieldName and encryptedData are required' });
  }

  try {
    const decrypted = encryptionSystem.decrypt(encryptedData);

    // Audit log
    await createAuditEvent(
      { userId: 'provider', orgId },
      {
        action: 'encryption.field_decrypted',
        target: `field:${fieldName}`,
        category: 'SECURITY_EVENT',
        details: {
          fieldName,
          keyId: encryptedData.keyId,
        },
      }
    );

    return res.json({
      success: true,
      decrypted,
      fieldName,
    });
  } catch (error) {
    console.error('Field decryption error:', error);
    return res.status(500).json({ error: 'Failed to decrypt field' });
  }
}

/**
 * Generate new encryption key for organization
 */
async function handleKeyGeneration(req: NextApiRequest, res: NextApiResponse, orgId: string) {
  try {
    const keyId = await encryptionSystem.generateOrgKey(orgId);

    // Audit log
    await createAuditEvent(
      { userId: 'provider', orgId },
      {
        action: 'encryption.key_generated',
        target: `org:${orgId}`,
        category: 'SECURITY_EVENT',
        details: {
          keyId,
          generatedAt: new Date().toISOString(),
        },
      }
    );

    return res.json({
      success: true,
      keyId,
      message: 'New encryption key generated successfully',
    });
  } catch (error) {
    console.error('Key generation error:', error);
    return res.status(500).json({ error: 'Failed to generate encryption key' });
  }
}
