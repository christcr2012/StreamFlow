'use client';

import { useState } from 'react';

type WebhookEvent = {
  id: string;
  event: string;
  payload: any;
  timestamp: string;
  status: 'pending' | 'delivered' | 'failed';
};

const SAMPLE_EVENTS = [
  { value: 'subscription.created', label: 'Subscription Created' },
  { value: 'subscription.updated', label: 'Subscription Updated' },
  { value: 'subscription.cancelled', label: 'Subscription Cancelled' },
  { value: 'invoice.created', label: 'Invoice Created' },
  { value: 'invoice.paid', label: 'Invoice Paid' },
  { value: 'payment.succeeded', label: 'Payment Succeeded' },
  { value: 'payment.failed', label: 'Payment Failed' },
];

export default function WebhooksPage() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(SAMPLE_EVENTS[0].value);
  const [customPayload, setCustomPayload] = useState('{}');
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [sending, setSending] = useState(false);

  const handleSendWebhook = async () => {
    if (!webhookUrl) {
      alert('Please enter a webhook URL');
      return;
    }

    setSending(true);

    try {
      const payload = JSON.parse(customPayload);
      const event: WebhookEvent = {
        id: `evt_${Date.now()}`,
        event: selectedEvent,
        payload,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };

      setEvents((prev) => [event, ...prev]);

      // Simulate webhook delivery
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': selectedEvent,
          'X-Webhook-ID': event.id,
        },
        body: JSON.stringify({
          id: event.id,
          event: selectedEvent,
          created: Math.floor(Date.now() / 1000),
          data: payload,
        }),
      });

      // Update event status
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? { ...e, status: response.ok ? 'delivered' : 'failed' }
            : e
        )
      );
    } catch (error) {
      console.error('Error sending webhook:', error);
      alert('Failed to send webhook: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Webhooks Sandbox</h1>
        <p className="mt-2 text-sm text-gray-600">
          Test webhook integrations by sending sample events to your endpoint
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Webhook Configuration</h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="webhook-url" className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    id="webhook-url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-app.com/webhooks"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter your webhook endpoint URL to receive test events
                  </p>
                </div>

                <div>
                  <label htmlFor="event-type" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type
                  </label>
                  <select
                    id="event-type"
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {SAMPLE_EVENTS.map((event) => (
                      <option key={event.value} value={event.value}>
                        {event.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="payload" className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Payload (JSON)
                  </label>
                  <textarea
                    id="payload"
                    value={customPayload}
                    onChange={(e) => setCustomPayload(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder='{"key": "value"}'
                  />
                </div>

                <button
                  onClick={handleSendWebhook}
                  disabled={sending || !webhookUrl}
                  className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send Test Webhook'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Event History Panel */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Event History</h3>

            {events.length === 0 ? (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No events sent yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            event.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : event.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {event.status}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{event.event}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">ID: {event.id}</div>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                        View Payload
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Documentation Section */}
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Webhook Testing Tips</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Use tools like webhook.site or ngrok to create test endpoints</li>
                <li>Verify your endpoint returns a 2xx status code</li>
                <li>Check that your endpoint can handle the webhook signature verification</li>
                <li>Test error scenarios by returning different status codes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

