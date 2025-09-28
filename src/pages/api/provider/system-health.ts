/**
 * 🏥 PROVIDER SYSTEM HEALTH & PRODUCTION READINESS API
 * Comprehensive system analysis and production cleanup
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { productionCleanup } from '../../../lib/production-cleanup';
import { createAuditEvent } from '../../../lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Provider authentication check
  const providerCookie = req.cookies.ws_provider;
  if (!providerCookie) {
    return res.status(401).json({ error: 'Provider authentication required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleHealthCheck(req, res);
      case 'POST':
        return await handleSystemAction(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('System health API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get comprehensive system health report
 */
async function handleHealthCheck(req: NextApiRequest, res: NextApiResponse) {
  const { detailed } = req.query;

  try {
    // Perform comprehensive health check
    const healthReport = await productionCleanup.performHealthCheck();

    // Add deployment checklist if detailed report requested
    if (detailed === 'true') {
      const deploymentChecklist = productionCleanup.generateDeploymentChecklist();
      
      return res.json({
        ...healthReport,
        deploymentChecklist,
        timestamp: new Date().toISOString(),
        systemInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          environment: process.env.NODE_ENV,
          uptime: process.uptime(),
        },
      });
    }

    return res.json({
      ...healthReport,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({ 
      error: 'Health check failed',
      details: (error as Error).message,
    });
  }
}

/**
 * Handle system actions (cleanup, optimization, etc.)
 */
async function handleSystemAction(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'Action is required' });
  }

  try {
    switch (action) {
      case 'cleanup_development':
        return await handleDevelopmentCleanup(req, res);
      case 'optimize_performance':
        return await handlePerformanceOptimization(req, res);
      case 'validate_production':
        return await handleProductionValidation(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error(`System action ${action} error:`, error);
    return res.status(500).json({ 
      error: `Action ${action} failed`,
      details: (error as Error).message,
    });
  }
}

/**
 * Clean up development systems for production
 */
async function handleDevelopmentCleanup(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await productionCleanup.cleanupDevelopmentSystems();

    // Audit log
    await createAuditEvent(
      { userId: 'provider', orgId: 'system' },
      {
        action: 'system.development_cleanup',
        target: 'system',
        category: 'ADMIN_ACTION',
        details: {
          success: result.success,
          filesModified: result.filesModified,
          timestamp: new Date().toISOString(),
        },
      }
    );

    return res.json({
      success: result.success,
      message: result.message,
      filesModified: result.filesModified,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Development cleanup error:', error);
    return res.status(500).json({ 
      error: 'Development cleanup failed',
      details: (error as Error).message,
    });
  }
}

/**
 * Optimize system performance
 */
async function handlePerformanceOptimization(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await productionCleanup.optimizeSystemPerformance();

    // Audit log
    await createAuditEvent(
      { userId: 'provider', orgId: 'system' },
      {
        action: 'system.performance_optimization',
        target: 'system',
        category: 'ADMIN_ACTION',
        details: {
          success: result.success,
          optimizations: result.optimizations,
          recommendations: result.recommendations,
          timestamp: new Date().toISOString(),
        },
      }
    );

    return res.json({
      success: result.success,
      optimizations: result.optimizations,
      recommendations: result.recommendations,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Performance optimization error:', error);
    return res.status(500).json({ 
      error: 'Performance optimization failed',
      details: (error as Error).message,
    });
  }
}

/**
 * Validate production readiness
 */
async function handleProductionValidation(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Perform comprehensive health check
    const healthReport = await productionCleanup.performHealthCheck();
    
    // Get deployment checklist
    const deploymentChecklist = productionCleanup.generateDeploymentChecklist();

    // Determine production readiness
    const isProductionReady = healthReport.overallStatus === 'READY';
    const needsAttention = healthReport.overallStatus === 'NEEDS_ATTENTION';

    // Create validation summary
    const validationSummary = {
      isProductionReady,
      needsAttention,
      criticalIssuesCount: healthReport.criticalIssues.length,
      warningsCount: healthReport.warnings.length,
      recommendationsCount: healthReport.recommendations.length,
      healthScore: calculateHealthScore(healthReport),
    };

    // Audit log
    await createAuditEvent(
      { userId: 'provider', orgId: 'system' },
      {
        action: 'system.production_validation',
        target: 'system',
        category: 'ADMIN_ACTION',
        details: {
          validationSummary,
          timestamp: new Date().toISOString(),
        },
      }
    );

    return res.json({
      validationSummary,
      healthReport,
      deploymentChecklist,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Production validation error:', error);
    return res.status(500).json({ 
      error: 'Production validation failed',
      details: (error as Error).message,
    });
  }
}

/**
 * Calculate overall system health score
 */
function calculateHealthScore(healthReport: any): number {
  const totalChecks = healthReport.healthChecks.length;
  if (totalChecks === 0) return 0;

  let score = 0;
  for (const check of healthReport.healthChecks) {
    switch (check.status) {
      case 'HEALTHY':
        score += 100;
        break;
      case 'WARNING':
        score += 70;
        break;
      case 'CRITICAL':
        score += 0;
        break;
    }
  }

  return Math.round(score / totalChecks);
}
