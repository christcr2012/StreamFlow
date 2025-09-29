/**
 * 💰 ACCOUNTANT DASHBOARD API
 * 
 * Provides dashboard data for the accountant system.
 * This endpoint is protected and only accessible to authenticated accountants.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { requireAccountantAuth, logAccountantAudit } from '@/lib/accountant-auth';

export default requireAccountantAuth(async (req, res, user) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Log dashboard access for audit
    await logAccountantAudit(user, 'dashboard:access', {
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    });

    // Mock dashboard data (would be fetched from database in production)
    const dashboardData = {
      user: {
        email: user.email,
        complianceLevel: user.complianceLevel,
        lastLogin: user.lastLogin.toISOString(),
      },
      financialSummary: {
        totalClients: 3, // Mock data
        pendingReconciliations: 2,
        overdueInvoices: 1,
        taxFilingsDue: 0,
      },
      integrations: {
        quickbooks: false, // Would check actual integration status
        xero: false,
        banking: false,
        payroll: false,
      },
      recentActivity: [
        {
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          operation: 'Bank Reconciliation',
          client: 'Mountain Vista Landscaping',
          status: 'completed',
        },
        {
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          operation: 'Financial Report Generation',
          client: 'Mountain Vista Landscaping',
          status: 'completed',
        },
        {
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          operation: 'Invoice Processing',
          client: 'Mountain Vista Landscaping',
          status: 'pending',
        },
      ],
    };

    return res.status(200).json(dashboardData);

  } catch (error) {
    console.error('Accountant dashboard API error:', error);
    
    // Log error for audit
    await logAccountantAudit(user, 'dashboard:error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    return res.status(500).json({ 
      error: 'Internal server error',
      code: 'DASHBOARD_ERROR'
    });
  }
});
