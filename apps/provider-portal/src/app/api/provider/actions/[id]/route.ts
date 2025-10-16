/**
 * Provider Action Handler API
 * 
 * POST /api/provider/actions/[id] - Handle action (approve/reject/complete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProviderSession } from '@/lib/api/withProviderAuth';
import { z } from 'zod';

const ActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'complete'])
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getProviderSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = ActionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { action } = validationResult.data;
    const actionId = params.id;

    // Get user for activity logging
    const user = await prisma.user.findUnique({
      where: { email: session.email },
      select: { id: true, orgId: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle different action types
    // Note: This is a simplified implementation
    // In production, you'd have more specific handlers for each action type

    // Log the action
    await prisma.activity.create({
      data: {
        orgId: user.orgId || 'system',
        actorType: 'user',
        actorId: user.id,
        entityType: 'action_item',
        entityId: actionId,
        action: `action_${action}`,
        meta: JSON.stringify({
          actionId,
          actionType: action,
          timestamp: new Date().toISOString()
        })
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Action ${action}d successfully` 
    });
  } catch (error) {
    console.error('Error handling action:', error);
    return NextResponse.json(
      { error: 'Failed to handle action' },
      { status: 500 }
    );
  }
}

