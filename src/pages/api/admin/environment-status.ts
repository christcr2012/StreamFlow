// src/pages/api/admin/environment-status.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getEnvironmentStatus, validateEnvironment, ENV } from '../../../lib/environment';
import { assertPermission, PERMS } from '../../../lib/rbac';

/**
 * 🎯 ENVIRONMENT STATUS & MANAGEMENT API
 * 
 * Provides visibility into current environment configuration
 * and allows safe environment transitions for development/staging/production.
 * 
 * GET: View current environment status
 * POST: Update environment settings (admin only)
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Require admin permissions for environment management
    if (!(await assertPermission(req, res, PERMS.ADMIN_OVERRIDE))) {
      return; // assertPermission already sent response
    }

    if (req.method === 'GET') {
      // Get comprehensive environment status
      const status = getEnvironmentStatus();
      const validation = validateEnvironment();
      
      return res.status(200).json({
        ok: true,
        environment: status,
        validation,
        recommendations: getEnvironmentRecommendations(),
        devUsers: {
          enabled: ENV.allowDevUsers,
          accounts: ENV.allowDevUsers ? [
            'owner@test.com',
            'manager@test.com',
            'staff@test.com'
          ] : [],
        }
      });
    }
    
    else if (req.method === 'POST') {
      // Environment management (for future use)
      const { action } = req.body;
      
      switch (action) {
        case 'validate':
          const validation = validateEnvironment();
          return res.status(200).json({
            ok: true,
            validation,
            message: validation.valid ? 'Environment is properly configured' : 'Environment has warnings'
          });
          
        case 'prepare_for_clients':
          return res.status(200).json({
            ok: true,
            message: 'To prepare for client production, set DISABLE_DEV_USERS=true in Vercel environment variables',
            steps: [
              '1. Go to Vercel Dashboard → StreamFlow → Settings → Environment Variables',
              '2. Add: DISABLE_DEV_USERS = true',
              '3. Redeploy the application',
              '4. Dev users will be disabled, only real accounts will work'
            ]
          });
          
        default:
          return res.status(400).json({
            ok: false,
            error: 'Invalid action. Supported: validate, prepare_for_clients'
          });
      }
    }
    
    else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Environment status error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to get environment status'
    });
  }
}

function getEnvironmentRecommendations(): string[] {
  const recommendations: string[] = [];
  
  if (ENV.isDevelopment) {
    recommendations.push('Development mode: All debug features enabled');
  }
  
  if (ENV.isStaging) {
    recommendations.push('Staging mode: Production-quality with dev users enabled for testing');
    recommendations.push('Perfect for evaluation, demos, and pre-launch testing');
  }
  
  if (ENV.isProduction) {
    recommendations.push('Production mode: Maximum security, dev users disabled');
    recommendations.push('Only real user accounts will work');
  }
  
  if (ENV.allowDevUsers) {
    recommendations.push('Dev users enabled: Use owner@test.com, manager@test.com, etc. with any password');
  }
  
  return recommendations;
}
