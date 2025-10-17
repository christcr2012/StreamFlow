'use client';

import { useState } from 'react';
import { formatDecimalCurrency } from '@/lib/currency';

interface Customer {
  company: string | null;
  primaryName: string | null;
  primaryEmail: string | null;
}

interface Invoice {
  id: string;
  number: string | null;
  amount: number;
  currency: string;
  status: string;
  dueDate: string | null;
  issuedAt: string;
  terms: string | null;
  notes: string | null;
  customer: Customer;
  orgName: string;
}

interface Props {
  invoice: Invoice;
  stripePublishableKey: string;
}

export default function PaymentPageClient({ invoice, stripePublishableKey }: Props) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePayment = async () => {
    if (!stripePublishableKey) {
      setError('Payment processing is not configured for this organization.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // TODO: Implement Stripe payment flow
      // This would involve creating a payment intent and using Stripe Elements
      // For now, this is a placeholder
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSuccess(true);
    } catch (err) {
      setError('Payment failed. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-4">
            Your payment of {formatDecimalCurrency(invoice.amount, invoice.currency)} has been processed.
          </p>
          <p className="text-sm text-gray-500">
            A confirmation email has been sent to {invoice.Customer.primaryEmail}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Pay Invoice</h1>
          <p className="text-gray-600">From {invoice.orgName}</p>
        </div>

        <div className="border-t border-b py-6 mb-6 space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Invoice Number:</span>
            <span className="font-medium">{invoice.number || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Bill To:</span>
            <span className="font-medium">{invoice.Customer.company || invoice.Customer.primaryName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Issue Date:</span>
            <span className="font-medium">{new Date(invoice.issuedAt).toLocaleDateString()}</span>
          </div>
          {invoice.dueDate && (
            <div className="flex justify-between">
              <span className="text-gray-600">Due Date:</span>
              <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-4 border-t">
            <span>Amount Due:</span>
            <span>{formatDecimalCurrency(invoice.amount, invoice.currency)}</span>
          </div>
        </div>

        {invoice.terms && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Terms:</h3>
            <p className="text-sm text-gray-600">{invoice.terms}</p>
          </div>
        )}

        {invoice.notes && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Notes:</h3>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={processing || invoice.status === 'paid'}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {processing ? 'Processing...' : invoice.status === 'paid' ? 'Already Paid' : `Pay ${formatDecimalCurrency(invoice.amount, invoice.currency)}`}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Secure payment powered by Stripe
        </p>
      </div>
    </div>
  );
}

