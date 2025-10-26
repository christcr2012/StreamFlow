/**
 * Wallet System for Cost Guard
 * 
 * Implements prepaid wallet for AI and SMS features with HTTP 402 enforcement
 */

import { prisma } from '@cortiware/db';

export interface WalletBalance {
  orgId: string;
  balanceCents: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  orgId: string;
  amountCents: number;
  type: 'CREDIT' | 'DEBIT';
  category: 'AI' | 'SMS' | 'TOPUP';
  description: string;
  metadata?: any;
  createdAt: Date;
}

/**
 * Get wallet balance for an organization
 */
export async function getWalletBalance(orgId: string): Promise<WalletBalance> {
  // Get org settings
  const org = await prisma.org.findUnique({
    where: { id: orgId },
    select: { settingsJson: true },
  });
  
  if (!org) {
    throw new Error('Organization not found');
  }
  
  const settings = typeof org.settingsJson === 'string' 
    ? JSON.parse(org.settingsJson) 
    : org.settingsJson;
  
  return {
    orgId,
    balanceCents: settings.wallet?.balanceCents || 0,
    currency: settings.wallet?.currency || 'USD',
  };
}

/**
 * Check if organization has sufficient balance
 */
export async function checkSufficientBalance(
  orgId: string,
  requiredCents: number
): Promise<boolean> {
  const balance = await getWalletBalance(orgId);
  return balance.balanceCents >= requiredCents;
}

/**
 * Debit wallet for a transaction
 * 
 * Returns true if successful, false if insufficient balance
 */
export async function debitWallet(
  orgId: string,
  amountCents: number,
  category: 'AI' | 'SMS',
  description: string,
  metadata?: any
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    // Get current balance
    const balance = await getWalletBalance(orgId);
    
    // Check sufficient balance
    if (balance.balanceCents < amountCents) {
      return {
        success: false,
        newBalance: balance.balanceCents,
        error: 'Insufficient balance',
      };
    }
    
    // Calculate new balance
    const newBalance = balance.balanceCents - amountCents;
    
    // Update org settings with new balance
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: { settingsJson: true },
    });
    
    const settings = typeof org?.settingsJson === 'string'
      ? JSON.parse(org.settingsJson)
      : org?.settingsJson || {};
    
    settings.wallet = {
      ...settings.wallet,
      balanceCents: newBalance,
      currency: balance.currency,
    };
    
    await prisma.org.update({
      where: { id: orgId },
      data: {
        settingsJson: JSON.stringify(settings),
      },
    });
    
    // Log transaction
    await logWalletTransaction(orgId, {
      amountCents,
      type: 'DEBIT',
      category,
      description,
      metadata,
    });
    
    return {
      success: true,
      newBalance,
    };
  } catch (error) {
    console.error('Error debiting wallet:', error);
    return {
      success: false,
      newBalance: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Credit wallet (top-up)
 */
export async function creditWallet(
  orgId: string,
  amountCents: number,
  description: string,
  metadata?: any
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    // Get current balance
    const balance = await getWalletBalance(orgId);
    
    // Calculate new balance
    const newBalance = balance.balanceCents + amountCents;
    
    // Update org settings with new balance
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: { settingsJson: true },
    });
    
    const settings = typeof org?.settingsJson === 'string'
      ? JSON.parse(org.settingsJson)
      : org?.settingsJson || {};
    
    settings.wallet = {
      ...settings.wallet,
      balanceCents: newBalance,
      currency: balance.currency,
    };
    
    await prisma.org.update({
      where: { id: orgId },
      data: {
        settingsJson: JSON.stringify(settings),
      },
    });
    
    // Log transaction
    await logWalletTransaction(orgId, {
      amountCents,
      type: 'CREDIT',
      category: 'TOPUP',
      description,
      metadata,
    });
    
    return {
      success: true,
      newBalance,
    };
  } catch (error) {
    console.error('Error crediting wallet:', error);
    return {
      success: false,
      newBalance: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Log wallet transaction to Activity table
 */
async function logWalletTransaction(
  orgId: string,
  transaction: {
    amountCents: number;
    type: 'CREDIT' | 'DEBIT';
    category: 'AI' | 'SMS' | 'TOPUP';
    description: string;
    metadata?: any;
  }
) {
  await prisma.activity.create({
    data: {
      orgId,
      actorType: 'system',
      actorId: 'wallet',
      entityType: 'wallet',
      entityId: orgId,
      action: 'transaction',
      meta: JSON.stringify({
        ...transaction,
        timestamp: new Date().toISOString(),
      }),
    },
  });
}

/**
 * Get wallet transaction history
 */
export async function getWalletTransactions(
  orgId: string,
  limit: number = 50
): Promise<WalletTransaction[]> {
  const activities = await prisma.activity.findMany({
    where: {
      orgId,
      entityType: 'wallet',
      action: 'transaction',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
  
  return activities.map((activity: any) => {
    const metadata = typeof activity.metadata === 'string'
      ? JSON.parse(activity.metadata)
      : activity.metadata;
    
    return {
      id: activity.id,
      orgId: activity.orgId,
      amountCents: metadata.amountCents,
      type: metadata.type,
      category: metadata.category,
      description: activity.description,
      metadata: metadata.metadata,
      createdAt: activity.createdAt,
    };
  });
}

