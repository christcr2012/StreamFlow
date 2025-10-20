/**
 * Wallet Management API
 * 
 * Endpoints for wallet balance, top-up, and transaction history
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getWalletBalance,
  creditWallet,
  getWalletTransactions,
} from '@/lib/wallet';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/wallet
 *
 * Get wallet balance and recent transactions
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check when auth is implemented

    // Get orgId from query params
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId is required' },
        { status: 400 }
      );
    }

    // Get balance and transactions
    const [balance, transactions] = await Promise.all([
      getWalletBalance(orgId),
      getWalletTransactions(orgId, 50),
    ]);

    return NextResponse.json({
      balance,
      transactions,
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wallet/topup
 *
 * Top up wallet balance
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check when auth is implemented

    const { orgId, amountCents, paymentMethodId, userEmail } = await request.json();

    if (!orgId || !amountCents) {
      return NextResponse.json(
        { error: 'orgId and amountCents are required' },
        { status: 400 }
      );
    }

    // Validate amount (minimum $5, maximum $1000)
    if (amountCents < 500 || amountCents > 100000) {
      return NextResponse.json(
        { error: 'Amount must be between $5 and $1000' },
        { status: 400 }
      );
    }

    // TODO: Process payment with Stripe
    // For now, just credit the wallet directly
    // In production, this should:
    // 1. Create Stripe PaymentIntent
    // 2. Confirm payment
    // 3. Credit wallet on success

    const result = await creditWallet(
      orgId,
      amountCents,
      `Wallet top-up: $${(amountCents / 100).toFixed(2)}`,
      {
        paymentMethodId,
        email: userEmail,
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to top up wallet' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
    });
  } catch (error) {
    console.error('Error topping up wallet:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

