import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify invoice ownership
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice || invoice.orgId !== authContext.orgId) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Generate payment link token
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    // Update invoice with payment link
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        paymentLinkToken: token,
        paymentLinkExpiresAt: expiresAt,
      },
    });

    const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pay/${token}`;

    return NextResponse.json({
      token,
      expiresAt,
      paymentLink,
    });
  } catch (error) {
    console.error('Error generating payment link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify invoice ownership
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice || invoice.orgId !== authContext.orgId) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Remove payment link
    await prisma.invoice.update({
      where: { id },
      data: {
        paymentLinkToken: null,
        paymentLinkExpiresAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

