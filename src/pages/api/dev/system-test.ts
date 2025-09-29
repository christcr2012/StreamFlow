// src/pages/api/dev/system-test.ts

/**
 * 🧪 COMPREHENSIVE SYSTEM TEST API
 * 
 * Complete system validation endpoint for testing all major components.
 * Tests database connectivity, authentication, security models, and integrations.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateDeveloper } from '@/lib/developer-auth';
import { prisma } from '@/lib/prisma';
import { AuditService } from '@/lib/auditService';
import { createStaffConstraintEnforcer } from '@/lib/staff-constraints';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  duration: number;
  details?: string;
  error?: string;
}

interface SystemTestResponse {
  success: boolean;
  overallStatus: 'passed' | 'failed' | 'warning';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  duration: number;
  results: TestResult[];
  summary: {
    database: 'healthy' | 'degraded' | 'failed';
    authentication: 'healthy' | 'degraded' | 'failed';
    security: 'healthy' | 'degraded' | 'failed';
    models: 'healthy' | 'degraded' | 'failed';
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SystemTestResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      overallStatus: 'failed',
      totalTests: 0,
      passedTests: 0,
      failedTests: 1,
      warningTests: 0,
      duration: 0,
      results: [{ name: 'Method Check', status: 'failed', duration: 0, error: 'Method not allowed' }],
      summary: { database: 'failed', authentication: 'failed', security: 'failed', models: 'failed' }
    });
  }

  // Authenticate developer
  const authResult = await authenticateDeveloper(req);
  if (!authResult) {
    return res.status(401).json({
      success: false,
      overallStatus: 'failed',
      totalTests: 0,
      passedTests: 0,
      failedTests: 1,
      warningTests: 0,
      duration: 0,
      results: [{ name: 'Authentication', status: 'failed', duration: 0, error: 'Unauthorized' }],
      summary: { database: 'failed', authentication: 'failed', security: 'failed', models: 'failed' }
    });
  }

  const startTime = Date.now();
  const results: TestResult[] = [];

  // Test 1: Database Connectivity
  await runTest(results, 'Database Connectivity', async () => {
    await prisma.$queryRaw`SELECT 1`;
    return 'Database connection successful';
  });

  // Test 2: User Model Operations
  await runTest(results, 'User Model Operations', async () => {
    const userCount = await prisma.user.count();
    return `Found ${userCount} users in database`;
  });

  // Test 3: Org Model Operations
  await runTest(results, 'Org Model Operations', async () => {
    const orgCount = await prisma.org.count();
    return `Found ${orgCount} organizations in database`;
  });

  // Test 4: Security Models
  await runTest(results, 'Security Models', async () => {
    // Test ApprovalRequest model
    const approvalCount = await prisma.approvalRequest.count();
    
    // Test SecurityIncident model
    const incidentCount = await prisma.securityIncident.count();
    
    // Test DeviceAccess model
    const deviceCount = await prisma.deviceAccess.count();
    
    // Test UserLockout model
    const lockoutCount = await prisma.userLockout.count();
    
    return `Security models operational: ${approvalCount} approvals, ${incidentCount} incidents, ${deviceCount} devices, ${lockoutCount} lockouts`;
  });

  // Test 5: Audit Service
  await runTest(results, 'Audit Service', async () => {
    const auditService = new AuditService();
    
    // Test audit logging
    await auditService.logEvent({
      eventType: 'SYSTEM_ACCESS',
      severity: 'LOW',
      orgId: 'test-org',
      userId: 'test-user',
      action: 'SYSTEM_TEST',
      entityType: 'TEST',
      entityId: 'test-entity',
      userSystem: 'DEVELOPER',
      success: true,
      details: { test: 'system validation' }
    });
    
    // Test compliance report
    const report = await auditService.generateComplianceReport(
      new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      new Date()
    );
    
    return `Audit service operational: ${report.summary.totalEvents} events, risk level ${report.riskLevel}`;
  });

  // Test 6: Staff Constraints
  await runTest(results, 'Staff Constraints', async () => {
    // Find a test user
    const testUser = await prisma.user.findFirst();
    if (!testUser) {
      throw new Error('No test user found');
    }
    
    const constraintEnforcer = await createStaffConstraintEnforcer(
      testUser.orgId,
      testUser.id
    );
    
    // Test constraint checking (should not throw)
    const result = await constraintEnforcer.enforceSensitiveActionConstraints(
      'read',
      'test_entity',
      'test_id',
      {
        requireApproval: [],
        blockedActions: [],
        approvalWorkflow: {
          approverRoles: [],
          requireReason: false,
          timeoutMinutes: 60,
          escalationRules: []
        }
      }
    );

    return `Staff constraints operational: action ${result.approved ? 'approved' : 'denied'}`;
  });

  // Test 7: Theme System
  await runTest(results, 'Theme System', async () => {
    const themeCount = await prisma.themeConfig.count();
    const usageCount = await prisma.themeUsage.count();
    
    return `Theme system operational: ${themeCount} configs, ${usageCount} usage records`;
  });

  // Test 8: Provider Settings
  await runTest(results, 'Provider Settings', async () => {
    const providerCount = await prisma.providerSettings.count();
    const auditCount = await prisma.providerAuditLog.count();
    
    return `Provider system operational: ${providerCount} settings, ${auditCount} audit logs`;
  });

  // Test 9: Employee System
  await runTest(results, 'Employee System', async () => {
    const employeeCount = await prisma.employeeProfile.count();
    const workOrderCount = await prisma.workOrder.count();
    
    return `Employee system operational: ${employeeCount} profiles, ${workOrderCount} work orders`;
  });

  // Test 10: AI Usage Tracking
  await runTest(results, 'AI Usage Tracking', async () => {
    const aiEventCount = await prisma.aiUsageEvent.count();
    const monthlySummaryCount = await prisma.aiMonthlySummary.count();
    
    return `AI tracking operational: ${aiEventCount} events, ${monthlySummaryCount} summaries`;
  });

  // Calculate summary
  const totalTests = results.length;
  const passedTests = results.filter(r => r.status === 'passed').length;
  const failedTests = results.filter(r => r.status === 'failed').length;
  const warningTests = results.filter(r => r.status === 'warning').length;
  const duration = Date.now() - startTime;

  // Determine overall status
  let overallStatus: 'passed' | 'failed' | 'warning' = 'passed';
  if (failedTests > 0) {
    overallStatus = 'failed';
  } else if (warningTests > 0) {
    overallStatus = 'warning';
  }

  // Generate component summary
  const summary = {
    database: getDatabaseHealth(results),
    authentication: getAuthHealth(results),
    security: getSecurityHealth(results),
    models: getModelsHealth(results)
  };

  return res.status(200).json({
    success: overallStatus !== 'failed',
    overallStatus,
    totalTests,
    passedTests,
    failedTests,
    warningTests,
    duration,
    results,
    summary
  });
}

async function runTest(
  results: TestResult[],
  name: string,
  testFn: () => Promise<string>
): Promise<void> {
  const startTime = Date.now();
  
  try {
    const details = await testFn();
    const duration = Date.now() - startTime;
    
    results.push({
      name,
      status: 'passed',
      duration,
      details
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    results.push({
      name,
      status: 'failed',
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function getDatabaseHealth(results: TestResult[]): 'healthy' | 'degraded' | 'failed' {
  const dbTests = results.filter(r => 
    r.name.includes('Database') || 
    r.name.includes('Model') ||
    r.name.includes('Audit')
  );
  
  const failedDbTests = dbTests.filter(r => r.status === 'failed');
  const warningDbTests = dbTests.filter(r => r.status === 'warning');
  
  if (failedDbTests.length > 0) return 'failed';
  if (warningDbTests.length > 0) return 'degraded';
  return 'healthy';
}

function getAuthHealth(results: TestResult[]): 'healthy' | 'degraded' | 'failed' {
  const authTests = results.filter(r => 
    r.name.includes('Provider') || 
    r.name.includes('Authentication')
  );
  
  const failedAuthTests = authTests.filter(r => r.status === 'failed');
  const warningAuthTests = authTests.filter(r => r.status === 'warning');
  
  if (failedAuthTests.length > 0) return 'failed';
  if (warningAuthTests.length > 0) return 'degraded';
  return 'healthy';
}

function getSecurityHealth(results: TestResult[]): 'healthy' | 'degraded' | 'failed' {
  const securityTests = results.filter(r => 
    r.name.includes('Security') || 
    r.name.includes('Constraints')
  );
  
  const failedSecurityTests = securityTests.filter(r => r.status === 'failed');
  const warningSecurityTests = securityTests.filter(r => r.status === 'warning');
  
  if (failedSecurityTests.length > 0) return 'failed';
  if (warningSecurityTests.length > 0) return 'degraded';
  return 'healthy';
}

function getModelsHealth(results: TestResult[]): 'healthy' | 'degraded' | 'failed' {
  const modelTests = results.filter(r => 
    r.name.includes('Model') || 
    r.name.includes('Theme') ||
    r.name.includes('Employee') ||
    r.name.includes('AI')
  );
  
  const failedModelTests = modelTests.filter(r => r.status === 'failed');
  const warningModelTests = modelTests.filter(r => r.status === 'warning');
  
  if (failedModelTests.length > 0) return 'failed';
  if (warningModelTests.length > 0) return 'degraded';
  return 'healthy';
}
