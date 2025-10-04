import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Implement POST /api/tenant/crm/opportunities/246/tasks
    res.status(501).json({ error: 'Not implemented' });
  } catch (error) {
    console.error('Error in /api/tenant/crm/opportunities/246/tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
