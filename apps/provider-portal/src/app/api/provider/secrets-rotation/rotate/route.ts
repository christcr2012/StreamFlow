import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// POST /api/provider/secrets-rotation/rotate - Manually rotate keys for a policy
export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get('rs_provider')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = decodeURIComponent(cookie);
    const user = await prisma.user.findUnique({
      where: { email },
      select: { orgId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { policyId } = await request.json();

    if (!policyId) {
      return NextResponse.json({ error: 'policyId is required' }, { status: 400 });
    }

    // Get policy
    const policy = await prisma.secretsRotationPolicy.findUnique({
      where: { id: policyId, orgId: user.orgId },
    });

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    // Get current active key for this key type
    let oldKeyId = 'none';
    let newKeyId = '';
    let newSecret = '';

    if (policy.keyType === 'federation') {
      // Get most recent active federation key
      const currentKey = await prisma.federationKey.findFirst({
        where: { orgId: user.orgId, disabledAt: null },
        orderBy: { createdAt: 'desc' },
      });

      if (currentKey) {
        oldKeyId = currentKey.keyId;
        
        // Schedule old key for disabling after grace period
        const disableAt = new Date();
        disableAt.setDate(disableAt.getDate() + policy.gracePeriodDays);
        
        await prisma.federationKey.update({
          where: { id: currentKey.id },
          data: { disabledAt: disableAt },
        });
      }

      // Create new federation key
      newKeyId = `fed_${crypto.randomBytes(16).toString('hex')}`;
      newSecret = crypto.randomBytes(32).toString('hex');
      const secretHash = await bcrypt.hash(newSecret, 10);

      await prisma.federationKey.create({
        data: {
          orgId: user.orgId,
          keyId: newKeyId,
          secretHash,
        },
      });
    } else if (policy.keyType === 'api') {
      // Similar logic for API keys
      newKeyId = `api_${crypto.randomBytes(16).toString('hex')}`;
      newSecret = crypto.randomBytes(32).toString('hex');
      // TODO: Implement API key rotation logic
    } else if (policy.keyType === 'encryption') {
      // Similar logic for encryption keys
      newKeyId = `enc_${crypto.randomBytes(16).toString('hex')}`;
      newSecret = crypto.randomBytes(32).toString('hex');
      // TODO: Implement encryption key rotation logic
    }

    // Record rotation in history
    await prisma.secretsRotationHistory.create({
      data: {
        orgId: user.orgId,
        policyId: policy.id,
        keyType: policy.keyType,
        oldKeyId,
        newKeyId,
        rotatedBy: email,
        reason: 'manual',
        metadata: {
          gracePeriodDays: policy.gracePeriodDays,
        },
      },
    });

    // Update policy with last rotation and next rotation
    const nextRotation = new Date();
    nextRotation.setDate(nextRotation.getDate() + policy.rotationIntervalDays);

    await prisma.secretsRotationPolicy.update({
      where: { id: policyId },
      data: {
        lastRotation: new Date(),
        nextRotation,
      },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        action: 'secrets_rotation',
        entityType: policy.keyType,
        entityId: newKeyId,
        actorType: 'provider',
        actorId: email,
        orgId: user.orgId,
        metadata: {
          policyId,
          oldKeyId,
          newKeyId,
          reason: 'manual',
        },
      },
    });

    return NextResponse.json({
      success: true,
      newKeyId,
      secret: newSecret,
      warning: 'Save this secret now. It will not be shown again.',
      gracePeriodEnds: new Date(Date.now() + policy.gracePeriodDays * 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    console.error('Error rotating keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

