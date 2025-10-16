/**
 * Provider API Keys Management
 * 
 * GET /api/provider/api-keys - Get all API keys (encrypted values masked)
 * POST /api/provider/api-keys - Save/update API keys with encryption
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProviderSession } from '@/lib/api/withProviderAuth';
import { z } from 'zod';
import crypto from 'crypto';

// Simple encryption using AES-256-GCM
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET || 'default-encryption-key-change-in-production';

function encrypt(text: string): string {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  try {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '****';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

const ApiKeysSchema = z.object({
  stripeApiKey: z.string().optional(),
  samGovApiKey: z.string().optional(),
  slackWebhookUrl: z.string().url().optional().or(z.literal('')),
  customWebhookUrl: z.string().url().optional().or(z.literal(''))
});

export async function GET(request: NextRequest) {
  try {
    const session = getProviderSession(request);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get provider config
    const config = await prisma.providerConfig.findFirst({
      select: {
        stripeSecretKey: true,
        samApiKey: true,
        otherConfig: true
      }
    });

    if (!config) {
      return NextResponse.json({
        stripeApiKey: '',
        samGovApiKey: '',
        slackWebhookUrl: '',
        customWebhookUrl: ''
      });
    }

    // Parse other config for webhooks
    const otherConfig = (config.otherConfig as any) || {};

    // Return masked values
    return NextResponse.json({
      stripeApiKey: config.stripeSecretKey ? maskApiKey(config.stripeSecretKey) : '',
      samGovApiKey: config.samApiKey ? maskApiKey(config.samApiKey) : '',
      slackWebhookUrl: otherConfig.slackWebhookUrl || '',
      customWebhookUrl: otherConfig.customWebhookUrl || ''
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getProviderSession(request);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = ApiKeysSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { stripeApiKey, samGovApiKey, slackWebhookUrl, customWebhookUrl } = validationResult.data;

    // Get or create provider config
    let config = await prisma.providerConfig.findFirst();

    if (!config) {
      config = await prisma.providerConfig.create({
        data: {}
      });
    }

    // Get current other config
    const currentOtherConfig = (config.otherConfig as any) || {};

    // Prepare update data
    const updateData: any = {};

    if (stripeApiKey) {
      updateData.stripeSecretKey = encrypt(stripeApiKey);
      currentOtherConfig.stripeConfigured = true;
    }

    if (samGovApiKey) {
      updateData.samApiKey = encrypt(samGovApiKey);
      currentOtherConfig.samGovConfigured = true;
    }

    if (slackWebhookUrl !== undefined) {
      currentOtherConfig.slackWebhookUrl = slackWebhookUrl || null;
    }

    if (customWebhookUrl !== undefined) {
      currentOtherConfig.customWebhookUrl = customWebhookUrl || null;
    }

    // Update other config
    updateData.otherConfig = currentOtherConfig;

    // Update config
    await prisma.providerConfig.update({
      where: { id: config.id },
      data: updateData
    });

    // Get user for activity logging
    const user = await prisma.user.findUnique({
      where: { email: session.email },
      select: { id: true, orgId: true }
    });

    // Log activity
    if (user) {
      await prisma.activity.create({
        data: {
          orgId: user.orgId || 'system',
          actorType: 'user',
          actorId: user.id,
          entityType: 'provider_config',
          entityId: config.id,
          action: 'api_keys_updated',
          meta: JSON.stringify({
            stripeUpdated: !!stripeApiKey,
            samGovUpdated: !!samGovApiKey,
            slackUpdated: slackWebhookUrl !== undefined,
            webhookUpdated: customWebhookUrl !== undefined
          })
        }
      });
    }

    return NextResponse.json({ success: true, message: 'API keys saved successfully' });
  } catch (error) {
    console.error('Error saving API keys:', error);
    return NextResponse.json(
      { error: 'Failed to save API keys' },
      { status: 500 }
    );
  }
}

