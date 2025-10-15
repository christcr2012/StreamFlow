'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader } from '@/components/ui/card';
import { showToast } from '@/components/ui/toast';

interface IntegrationsClientProps {
  settings: {
    emailProvider: string | null;
    emailFromAddress: string | null;
    emailFromName: string | null;
    emailConfigured: boolean;
    stripePublishableKey: string | null;
    stripeConfigured: boolean;
    smsProvider: string | null;
    smsFromNumber: string | null;
    smsConfigured: boolean;
  };
}

export function IntegrationsClient({ settings }: IntegrationsClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email configuration state
  const [emailProvider, setEmailProvider] = useState(settings.emailProvider || 'sendgrid');
  const [emailApiKey, setEmailApiKey] = useState('');
  const [emailFromAddress, setEmailFromAddress] = useState(settings.emailFromAddress || '');
  const [emailFromName, setEmailFromName] = useState(settings.emailFromName || '');

  // Stripe configuration state
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripePublishableKey, setStripePublishableKey] = useState(settings.stripePublishableKey || '');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');

  // SMS configuration state
  const [smsProvider, setSmsProvider] = useState(settings.smsProvider || 'twilio');
  const [smsApiKey, setSmsApiKey] = useState('');
  const [smsFromNumber, setSmsFromNumber] = useState(settings.smsFromNumber || '');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/settings/integrations/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: emailProvider,
          apiKey: emailApiKey,
          fromAddress: emailFromAddress,
          fromName: emailFromName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save email configuration');
      }

      showToast('Email configuration saved successfully', 'success');
      setEmailApiKey(''); // Clear sensitive field
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save email configuration', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStripeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/settings/integrations/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretKey: stripeSecretKey,
          publishableKey: stripePublishableKey,
          webhookSecret: stripeWebhookSecret,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save Stripe configuration');
      }

      showToast('Stripe configuration saved successfully', 'success');
      setStripeSecretKey(''); // Clear sensitive fields
      setStripeWebhookSecret('');
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save Stripe configuration', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/settings/integrations/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: smsProvider,
          apiKey: smsApiKey,
          fromNumber: smsFromNumber,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save SMS configuration');
      }

      showToast('SMS configuration saved successfully', 'success');
      setSmsApiKey(''); // Clear sensitive field
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save SMS configuration', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Integrations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
            Configure third-party services to enable email notifications, payment processing, and more.
          </p>
        </div>

        {/* Email Service Configuration */}
        <Card>
          <CardHeader
            title="Email Service"
            subtitle="Configure your email service to send invoice notifications, job updates, and customer communications."
          />
          <form onSubmit={handleEmailSubmit} className="p-4 md:p-6 space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
              {settings.emailConfigured ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                  ✓ Configured
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                  ⚠ Not Configured
                </span>
              )}
            </div>

            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Provider
              </label>
              <select
                value={emailProvider}
                onChange={(e) => setEmailProvider(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                style={{ minHeight: '44px' }}
              >
                <option value="sendgrid">SendGrid</option>
                <option value="resend">Resend</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Choose your preferred email service provider
              </p>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={emailApiKey}
                onChange={(e) => setEmailApiKey(e.target.value)}
                placeholder={settings.emailConfigured ? '••••••••••••••••' : 'Enter your API key'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!settings.emailConfigured}
              />
              <p className="text-xs text-gray-500 mt-1">
                {emailProvider === 'sendgrid' ? (
                  <>Get your API key from <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">SendGrid Dashboard</a></>
                ) : (
                  <>Get your API key from <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Resend Dashboard</a></>
                )}
              </p>
            </div>

            {/* From Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Email Address
              </label>
              <input
                type="email"
                value={emailFromAddress}
                onChange={(e) => setEmailFromAddress(e.target.value)}
                placeholder="noreply@yourcompany.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This email address will appear as the sender for all emails
              </p>
            </div>

            {/* From Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Name
              </label>
              <input
                type="text"
                value={emailFromName}
                onChange={(e) => setEmailFromName(e.target.value)}
                placeholder="Your Company Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This name will appear as the sender for all emails
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: '44px' }}
              >
                {isSubmitting ? 'Saving...' : settings.emailConfigured ? 'Update Configuration' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </Card>

        {/* Stripe Payment Configuration */}
        <Card>
          <CardHeader
            title="Stripe Payment Processing"
            subtitle="Configure your Stripe account to accept payments from customers on invoices."
          />
          <form onSubmit={handleStripeSubmit} className="p-4 md:p-6 space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              {settings.stripeConfigured ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Configured
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  ⚠ Not Configured
                </span>
              )}
            </div>

            {/* Secret Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secret Key
              </label>
              <input
                type="password"
                value={stripeSecretKey}
                onChange={(e) => setStripeSecretKey(e.target.value)}
                placeholder={settings.stripeConfigured ? '••••••••••••••••' : 'sk_live_...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!settings.stripeConfigured}
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your secret key from <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Stripe Dashboard</a>
              </p>
            </div>

            {/* Publishable Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Publishable Key
              </label>
              <input
                type="text"
                value={stripePublishableKey}
                onChange={(e) => setStripePublishableKey(e.target.value)}
                placeholder="pk_live_..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This key is safe to expose in your client-side code
              </p>
            </div>

            {/* Webhook Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook Secret
              </label>
              <input
                type="password"
                value={stripeWebhookSecret}
                onChange={(e) => setStripeWebhookSecret(e.target.value)}
                placeholder={settings.stripeConfigured ? '••••••••••••••••' : 'whsec_...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!settings.stripeConfigured}
              />
              <p className="text-xs text-gray-500 mt-1">
                Configure webhook endpoint: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">/api/webhooks/stripe</code>
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : settings.stripeConfigured ? 'Update Configuration' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </Card>

        {/* SMS Notification Configuration */}
        <Card>
          <CardHeader
            title="SMS Notifications (Twilio)"
            subtitle="Configure Twilio to send SMS notifications to customers for job updates and reminders."
          />
          <form onSubmit={handleSmsSubmit} className="p-6 space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              {settings.smsConfigured ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Configured
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  ⚠ Not Configured
                </span>
              )}
            </div>

            {/* Provider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider
              </label>
              <select
                value={smsProvider}
                onChange={(e) => setSmsProvider(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              >
                <option value="twilio">Twilio</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Only Twilio is supported at this time
              </p>
            </div>

            {/* API Key (Account SID:Auth Token) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twilio Credentials
              </label>
              <input
                type="password"
                value={smsApiKey}
                onChange={(e) => setSmsApiKey(e.target.value)}
                placeholder={settings.smsConfigured ? '••••••••••••••••' : 'ACCOUNT_SID:AUTH_TOKEN'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!settings.smsConfigured}
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: ACCOUNT_SID:AUTH_TOKEN (get from <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Twilio Console</a>)
              </p>
            </div>

            {/* From Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Phone Number
              </label>
              <input
                type="tel"
                value={smsFromNumber}
                onChange={(e) => setSmsFromNumber(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Use E.164 format (e.g., +1234567890). Must be a Twilio phone number.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : settings.smsConfigured ? 'Update Configuration' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader title="Need Help?" />
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Why do I need to configure these services?</h3>
              <p className="text-sm text-gray-600">
                Cortiware is a platform that helps you run your business. To send emails to your customers and accept payments,
                you need to connect your own third-party service accounts. This ensures that:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                <li>Emails come from your domain (builds trust with customers)</li>
                <li>Payments go directly to your bank account</li>
                <li>You maintain control over your customer communications</li>
                <li>You comply with email and payment regulations</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Is my data secure?</h3>
              <p className="text-sm text-gray-600">
                Yes. All API keys and sensitive credentials are encrypted before being stored in our database.
                We never have access to your actual keys, and they are only decrypted when needed to send emails or process payments on your behalf.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">What happens if I don&apos;t configure these?</h3>
              <p className="text-sm text-gray-600">
                Without email configuration, you won&apos;t be able to send automated notifications to customers.
                Without Stripe configuration, customers won&apos;t be able to pay invoices online.
                You can still use Cortiware for job management, customer tracking, and manual invoicing.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

