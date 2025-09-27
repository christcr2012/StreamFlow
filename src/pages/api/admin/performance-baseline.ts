import { NextApiRequest, NextApiResponse } from 'next';
import { getPerformanceBaseline, validatePerformanceImprovement, queryMetrics, PERFORMANCE_TARGETS } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth-helpers';
import { assertPermission, PERMS } from '../../../lib/rbac';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Ensure only authenticated users can access performance metrics
    const user = await requireAuth(req, res);
    if (!user) return;

    // Require admin permissions for performance monitoring (using FEATURE_TOGGLE for admin-level access)
    if (!(await assertPermission(req, res, PERMS.FEATURE_TOGGLE))) return;

    if (req.method === 'GET') {
      // Get current performance baseline
      const baseline = await getPerformanceBaseline();
      
      return res.status(200).json({
        success: true,
        data: {
          ...baseline,
          rawMetrics: queryMetrics,
          performanceTargets: PERFORMANCE_TARGETS,
          systemUptime: Date.now() - queryMetrics.startTime,
        }
      });
    }

    if (req.method === 'POST') {
      // Validate performance improvement for a specific phase
      const { phase, testDuration = 300000 } = req.body;
      
      if (!phase || !PERFORMANCE_TARGETS[phase as keyof typeof PERFORMANCE_TARGETS]) {
        return res.status(400).json({
          error: 'Invalid phase',
          message: 'Phase must be one of: CURRENT_AVG_QUERY_TIME, SPRINT1_AVG_QUERY_TIME, SPRINT2_AVG_QUERY_TIME'
        });
      }

      const validation = await validatePerformanceImprovement(
        phase as keyof typeof PERFORMANCE_TARGETS,
        testDuration
      );

      return res.status(200).json({
        success: true,
        data: validation
      });
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['GET', 'POST']
    });

  } catch (error) {
    console.error('Performance baseline API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}