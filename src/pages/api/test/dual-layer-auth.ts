// src/pages/api/test/dual-layer-auth.ts

/**
 * API endpoint to test the dual-layer provider authentication system
 * 
 * This endpoint runs comprehensive tests to verify that both normal
 * and recovery mode authentication are working correctly.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { runDualLayerAuthTests } from '@/lib/test-dual-layer-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Starting dual-layer authentication tests...');
    
    const testResults = await runDualLayerAuthTests();
    
    const passedTests = testResults.filter(r => r.passed).length;
    const totalTests = testResults.length;
    const allPassed = passedTests === totalTests;
    
    return res.status(200).json({
      success: allPassed,
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests,
        percentage: Math.round((passedTests / totalTests) * 100)
      },
      results: testResults,
      message: allPassed 
        ? '🎉 All tests passed! Dual-layer authentication system is working correctly.'
        : '⚠️ Some tests failed. Please review the results.'
    });
    
  } catch (error) {
    console.error('Test execution failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Test execution failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
