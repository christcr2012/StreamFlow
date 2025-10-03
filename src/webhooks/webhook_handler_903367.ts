// Generated webhook handler for webhook_handler_903367
// Webhook: webhook
// Source: binder7_FULL lines 2342344-2342349

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function webhookHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Webhook received:', {
    id: 'webhook_handler_903367',
    description: 'Webhook: webhook',
    body: req.body,
    headers: req.headers
  });

  // TODO: Implement webhook logic for Webhook: webhook

  return res.status(200).json({
    status: 'received',
    webhook: 'webhook_handler_903367',
    binder: 'binder7_FULL',
    timestamp: new Date().toISOString()
  });
}
