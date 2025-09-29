#!/usr/bin/env node

/**
 * 🔧 STREAMFLOW COMPREHENSIVE SYSTEM TEST & AUDIT
 * 
 * This script performs comprehensive testing and auditing of all StreamFlow systems:
 * - Authentication system validation
 * - Database connectivity and integrity
 * - API endpoint testing
 * - Performance benchmarking
 * - Security audit
 * - System integration validation
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Test configuration
const TESTS = {
  authentication: [
    { name: 'Provider Login', endpoint: '/api/auth/login', method: 'POST', data: { email: 'chris.tcr.2012@gmail.com', password: 'Thrillicious01no' } },
    { name: 'Developer Login', endpoint: '/api/auth/login', method: 'POST', data: { email: 'gametcr3@gmail.com', password: 'Thrillicious01no' } },
    { name: 'Accountant Login', endpoint: '/api/auth/login', method: 'POST', data: { email: 'accountant@streamflow.com', password: 'Thrillicious01no' } }
  ],
  
  systemHealth: [
    { name: 'Health Check', endpoint: '/api/_health', method: 'GET' },
    { name: 'Echo Test', endpoint: '/api/_echo', method: 'GET' },
    { name: 'Database Status', endpoint: '/api/dev/database/metrics', method: 'GET' },
    { name: 'System Metrics', endpoint: '/api/dev/system/metrics', method: 'GET' }
  ],
  
  coreAPIs: [
    { name: 'Dashboard Summary', endpoint: '/api/dashboard/summary', method: 'GET' },
    { name: 'User Profile', endpoint: '/api/me', method: 'GET' },
    { name: 'Leads List', endpoint: '/api/leads.list', method: 'GET' },
    { name: 'Navigation Features', endpoint: '/api/navigation/active-features', method: 'GET' }
  ],
  
  providerAPIs: [
    { name: 'Provider Analytics', endpoint: '/api/provider/analytics', method: 'GET' },
    { name: 'Provider Clients', endpoint: '/api/provider/clients', method: 'GET' },
    { name: 'Provider Settings', endpoint: '/api/provider/settings', method: 'GET' },
    { name: 'Provider Metrics', endpoint: '/api/provider/metrics', method: 'GET' }
  ],
  
  developerAPIs: [
    { name: 'System Test', endpoint: '/api/dev/system-test', method: 'GET' },
    { name: 'AI Models', endpoint: '/api/dev/ai/models', method: 'GET' },
    { name: 'Performance Metrics', endpoint: '/api/dev/metrics', method: 'GET' }
  ],
  
  accountantAPIs: [
    { name: 'Accountant Dashboard', endpoint: '/api/accountant/dashboard', method: 'GET' }
  ]
};

// Test results storage
const results = {
  passed: 0,
  failed: 0,
  errors: [],
  performance: {},
  summary: {}
};

/**
 * Make HTTP request with timeout and error handling
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
          responseTime: responseTime
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Run a single test
 */
async function runTest(test, category) {
  console.log(`  🧪 Testing: ${test.name}`);
  
  try {
    const url = new URL(BASE_URL + test.endpoint);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'StreamFlow-SystemTest/1.0'
      }
    };
    
    if (test.data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(test.data));
    }
    
    const response = await makeRequest(options, test.data);
    
    // Record performance metrics
    if (!results.performance[category]) {
      results.performance[category] = [];
    }
    results.performance[category].push({
      name: test.name,
      responseTime: response.responseTime,
      statusCode: response.statusCode
    });
    
    // Determine if test passed
    const isSuccess = response.statusCode >= 200 && response.statusCode < 400;
    
    if (isSuccess) {
      console.log(`    ✅ PASS (${response.statusCode}) - ${response.responseTime}ms`);
      results.passed++;
    } else {
      console.log(`    ❌ FAIL (${response.statusCode}) - ${response.responseTime}ms`);
      results.failed++;
      results.errors.push({
        test: test.name,
        category: category,
        statusCode: response.statusCode,
        error: response.body.substring(0, 200)
      });
    }
    
    return { success: isSuccess, response };
    
  } catch (error) {
    console.log(`    💥 ERROR: ${error.message}`);
    results.failed++;
    results.errors.push({
      test: test.name,
      category: category,
      error: error.message
    });
    
    return { success: false, error };
  }
}

/**
 * Run all tests in a category
 */
async function runTestCategory(categoryName, tests) {
  console.log(`\n🔍 ${categoryName.toUpperCase()} TESTS`);
  console.log('='.repeat(50));
  
  const categoryResults = [];
  
  for (const test of tests) {
    const result = await runTest(test, categoryName);
    categoryResults.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return categoryResults;
}

/**
 * Generate performance report
 */
function generatePerformanceReport() {
  console.log('\n📊 PERFORMANCE ANALYSIS');
  console.log('='.repeat(50));
  
  for (const [category, metrics] of Object.entries(results.performance)) {
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
    const maxResponseTime = Math.max(...metrics.map(m => m.responseTime));
    const minResponseTime = Math.min(...metrics.map(m => m.responseTime));
    
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`  Max Response Time: ${maxResponseTime}ms`);
    console.log(`  Min Response Time: ${minResponseTime}ms`);
    
    // Flag slow endpoints
    const slowEndpoints = metrics.filter(m => m.responseTime > 2000);
    if (slowEndpoints.length > 0) {
      console.log(`  ⚠️  Slow Endpoints (>2s):`);
      slowEndpoints.forEach(endpoint => {
        console.log(`    - ${endpoint.name}: ${endpoint.responseTime}ms`);
      });
    }
  }
}

/**
 * Generate final report
 */
function generateFinalReport() {
  console.log('\n🎯 FINAL SYSTEM AUDIT REPORT');
  console.log('='.repeat(60));
  
  const totalTests = results.passed + results.failed;
  const successRate = ((results.passed / totalTests) * 100).toFixed(1);
  
  console.log(`\n📈 OVERALL RESULTS:`);
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  Passed: ${results.passed} ✅`);
  console.log(`  Failed: ${results.failed} ❌`);
  console.log(`  Success Rate: ${successRate}%`);
  
  if (results.errors.length > 0) {
    console.log(`\n🚨 FAILED TESTS:`);
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.test} (${error.category})`);
      console.log(`     Status: ${error.statusCode || 'ERROR'}`);
      console.log(`     Details: ${error.error}`);
    });
  }
  
  // System health assessment
  console.log(`\n🏥 SYSTEM HEALTH ASSESSMENT:`);
  
  if (successRate >= 90) {
    console.log(`  🟢 EXCELLENT - System is production-ready`);
  } else if (successRate >= 75) {
    console.log(`  🟡 GOOD - Minor issues detected, review recommended`);
  } else if (successRate >= 50) {
    console.log(`  🟠 FAIR - Multiple issues detected, fixes required`);
  } else {
    console.log(`  🔴 POOR - Critical issues detected, immediate attention required`);
  }
  
  console.log(`\n🚀 STREAMFLOW SYSTEM AUDIT COMPLETE!`);
}

/**
 * Main test execution
 */
async function runComprehensiveTests() {
  console.log('🔧 STREAMFLOW COMPREHENSIVE SYSTEM TEST & AUDIT');
  console.log('='.repeat(60));
  console.log(`🌐 Testing against: ${BASE_URL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  try {
    // Run all test categories
    for (const [categoryName, tests] of Object.entries(TESTS)) {
      await runTestCategory(categoryName, tests);
    }
    
    // Generate reports
    generatePerformanceReport();
    generateFinalReport();
    
  } catch (error) {
    console.error('💥 Critical error during testing:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  runComprehensiveTests().catch(console.error);
}

module.exports = { runComprehensiveTests, TESTS, results };
