'use client';

import { useState, useEffect } from 'react';
import { showToast } from './ui/toast';

interface PaymentModalProps {
  invoiceId: string;
  amount: number;
  invoiceNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({
  invoiceId,
  amount,
  invoiceNumber,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load Stripe.js
  useEffect(() => {
    if (!isOpen) return;

    const loadStripe = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        // Get payment intent and publishable key
        const response = await fetch(`/api/invoices/${invoiceId}/payment-intent`, {
          method: 'POST',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to initialize payment');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
        setPublishableKey(data.publishableKey);

        // Load Stripe.js script
        const windowWithStripe = window as any;
        if (!windowWithStripe.Stripe) {
          const script = document.createElement('script');
          script.src = 'https://js.stripe.com/v3/';
          script.async = true;
          script.onload = () => {
            const stripeInstance = windowWithStripe.Stripe(data.publishableKey);
            setStripe(stripeInstance);

            const elementsInstance = stripeInstance.elements({
              clientSecret: data.clientSecret,
            });
            setElements(elementsInstance);

            // Mount card element
            const cardElement = elementsInstance.create('payment');
            cardElement.mount('#payment-element');
          };
          document.body.appendChild(script);
        } else {
          const stripeInstance = windowWithStripe.Stripe(data.publishableKey);
          setStripe(stripeInstance);

          const elementsInstance = stripeInstance.elements({
            clientSecret: data.clientSecret,
          });
          setElements(elementsInstance);

          // Mount card element
          const cardElement = elementsInstance.create('payment');
          cardElement.mount('#payment-element');
        }
      } catch (error) {
        console.error('Payment initialization error:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to initialize payment');
      } finally {
        setIsLoading(false);
      }
    };

    loadStripe();
  }, [isOpen, invoiceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/invoices/${invoiceId}?payment=success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        showToast(error.message || 'Payment failed', 'error');
      } else {
        showToast('Payment successful!', 'success');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage('An unexpected error occurred');
      showToast('Payment failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Pay Invoice</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isProcessing}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm text-gray-600">Invoice Number</p>
            <p className="text-lg font-medium text-gray-900">{invoiceNumber}</p>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600">Amount Due</p>
            <p className="text-3xl font-bold text-gray-900">
              ${(amount / 100).toFixed(2)}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Stripe Payment Element */}
              <div id="payment-element" className="mb-6"></div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing || !stripe || !elements}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Pay $${(amount / 100).toFixed(2)}`
                )}
              </button>
            </form>
          )}

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Powered by Stripe • Secure payment processing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

