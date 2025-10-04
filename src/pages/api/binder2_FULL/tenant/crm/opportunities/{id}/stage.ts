import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Implement PATCH /api/tenant/crm/opportunities/{id}/stage
    res.status(501).json({ error: 'Not implemented' });
  } catch (error) {
    console.error('Error in /api/tenant/crm/opportunities/{id}/stage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
