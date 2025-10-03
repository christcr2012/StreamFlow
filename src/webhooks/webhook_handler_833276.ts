// Generated webhook handler for webhook_handler_833276
// Webhook: webhook
// Source: binder7_FULL lines 2327464-2327469

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function webhookHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Webhook received:', {
    id: 'webhook_handler_833276',
    description: 'Webhook: webhook',
    body: req.body,
    headers: req.headers
  });

  // TODO: Implement webhook logic for Webhook: webhook

  return res.status(200).json({
    status: 'received',
    webhook: 'webhook_handler_833276',
    binder: 'binder7_FULL',
    timestamp: new Date().toISOString()
  });
}
