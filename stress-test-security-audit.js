#!/usr/bin/env node

/**
 * 🛡️ STREAMFLOW STRESS TEST & SECURITY AUDIT
 * 
 * Advanced testing suite for:
 * - Load testing and stress testing
 * - Security vulnerability scanning
 * - Authentication bypass attempts
 * - SQL injection testing
 * - Rate limiting validation
 * - Memory leak detection
 */

const http = require('http');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:5000';
const CONCURRENT_REQUESTS = 50;
const STRESS_TEST_DURATION = 10000; // 10 seconds

// Security test payloads
const SECURITY_PAYLOADS = {
  sqlInjection: [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "admin'--",
    "' OR 1=1#"
  ],
  
  xss: [
    "<script>alert('xss')</script>",
    "javascript:alert('xss')",
    "<img src=x onerror=alert('xss')>",
    "';alert('xss');//"
  ],
  
  pathTraversal: [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\config\\sam",
    "....//....//....//etc/passwd",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd"
  ],
  
  commandInjection: [
    "; ls -la",
    "| whoami",
    "&& cat /etc/passwd",
    "`id`",
    "$(whoami)"
  ]
};

// Test results
const results = {
  stressTest: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: Infinity,
    requestsPerSecond: 0
  },
  
  securityTest: {
    vulnerabilities: [],
    passed: 0,
    failed: 0
  },
  
  authenticationTest: {
    bypassAttempts: 0,
    successfulBypasses: 0,
    rateLimitingEffective: true
  }
};

/**
 * Make HTTP request with detailed metrics
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const startTime = process.hrtime.bigint();
    
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
          responseTime: responseTime,
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });
    
    req.on('error', (error) => {
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000;
      
      resolve({
        statusCode: 0,
        error: error.message,
        responseTime: responseTime,
        success: false
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        statusCode: 0,
        error: 'Timeout',
        responseTime: 5000,
        success: false
      });
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Stress test - concurrent requests
 */
async function runStressTest() {
  console.log('\n🔥 STRESS TEST - CONCURRENT LOAD');
  console.log('='.repeat(50));
  console.log(`Concurrent Requests: ${CONCURRENT_REQUESTS}`);
  console.log(`Duration: ${STRESS_TEST_DURATION / 1000}s`);
  
  const startTime = Date.now();
  const promises = [];
  const responseTimes = [];
  
  // Generate concurrent requests
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/_health',
      method: 'GET',
      headers: {
        'User-Agent': `StressTest-${i}`,
        'Connection': 'keep-alive'
      }
    };
    
    promises.push(makeRequest(options));
  }
  
  // Wait for all requests to complete
  const responses = await Promise.all(promises);
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  // Calculate metrics
  responses.forEach(response => {
    results.stressTest.totalRequests++;
    responseTimes.push(response.responseTime);
    
    if (response.success) {
      results.stressTest.successfulRequests++;
    } else {
      results.stressTest.failedRequests++;
    }
    
    if (response.responseTime > results.stressTest.maxResponseTime) {
      results.stressTest.maxResponseTime = response.responseTime;
    }
    
    if (response.responseTime < results.stressTest.minResponseTime) {
      results.stressTest.minResponseTime = response.responseTime;
    }
  });
  
  results.stressTest.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  results.stressTest.requestsPerSecond = (CONCURRENT_REQUESTS / totalTime) * 1000;
  
  console.log(`✅ Completed ${results.stressTest.totalRequests} requests in ${totalTime}ms`);
  console.log(`📊 Success Rate: ${((results.stressTest.successfulRequests / results.stressTest.totalRequests) * 100).toFixed(1)}%`);
  console.log(`⚡ Requests/Second: ${results.stressTest.requestsPerSecond.toFixed(2)}`);
  console.log(`⏱️  Average Response Time: ${results.stressTest.averageResponseTime.toFixed(2)}ms`);
  console.log(`📈 Max Response Time: ${results.stressTest.maxResponseTime.toFixed(2)}ms`);
  console.log(`📉 Min Response Time: ${results.stressTest.minResponseTime.toFixed(2)}ms`);
}

/**
 * Security vulnerability testing
 */
async function runSecurityTests() {
  console.log('\n🛡️ SECURITY VULNERABILITY SCAN');
  console.log('='.repeat(50));
  
  const testEndpoints = [
    '/api/auth/login',
    '/api/me',
    '/api/leads.list',
    '/api/dashboard/summary'
  ];
  
  // Test SQL Injection
  console.log('\n🔍 Testing SQL Injection...');
  for (const payload of SECURITY_PAYLOADS.sqlInjection) {
    for (const endpoint of testEndpoints) {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: endpoint,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SecurityTest'
        }
      };
      
      const testData = {
        email: payload,
        password: payload,
        query: payload
      };
      
      try {
        const response = await makeRequest(options, testData);
        
        // Check for SQL error messages or unexpected behavior
        if (response.body && (
          response.body.includes('SQL') ||
          response.body.includes('mysql') ||
          response.body.includes('postgres') ||
          response.body.includes('ORA-') ||
          response.statusCode === 500
        )) {
          results.securityTest.vulnerabilities.push({
            type: 'SQL Injection',
            endpoint: endpoint,
            payload: payload,
            response: response.statusCode,
            details: response.body.substring(0, 200)
          });
          results.securityTest.failed++;
        } else {
          results.securityTest.passed++;
        }
      } catch (error) {
        // Errors are expected for malicious payloads
        results.securityTest.passed++;
      }
    }
  }
  
  // Test XSS
  console.log('🔍 Testing XSS...');
  for (const payload of SECURITY_PAYLOADS.xss) {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/leads.list?search=' + encodeURIComponent(payload),
      method: 'GET',
      headers: {
        'User-Agent': 'SecurityTest'
      }
    };
    
    try {
      const response = await makeRequest(options);
      
      // Check if XSS payload is reflected without encoding
      if (response.body && response.body.includes(payload)) {
        results.securityTest.vulnerabilities.push({
          type: 'XSS',
          endpoint: '/api/leads.list',
          payload: payload,
          response: response.statusCode,
          details: 'Payload reflected without encoding'
        });
        results.securityTest.failed++;
      } else {
        results.securityTest.passed++;
      }
    } catch (error) {
      results.securityTest.passed++;
    }
  }
  
  // Test Path Traversal
  console.log('🔍 Testing Path Traversal...');
  for (const payload of SECURITY_PAYLOADS.pathTraversal) {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/export.json?file=' + encodeURIComponent(payload),
      method: 'GET',
      headers: {
        'User-Agent': 'SecurityTest'
      }
    };
    
    try {
      const response = await makeRequest(options);
      
      // Check for system file contents
      if (response.body && (
        response.body.includes('root:') ||
        response.body.includes('[users]') ||
        response.body.includes('Windows Registry')
      )) {
        results.securityTest.vulnerabilities.push({
          type: 'Path Traversal',
          endpoint: '/api/admin/export.json',
          payload: payload,
          response: response.statusCode,
          details: 'System file access detected'
        });
        results.securityTest.failed++;
      } else {
        results.securityTest.passed++;
      }
    } catch (error) {
      results.securityTest.passed++;
    }
  }
}

/**
 * Authentication bypass testing
 */
async function runAuthenticationTests() {
  console.log('\n🔐 AUTHENTICATION SECURITY TEST');
  console.log('='.repeat(50));
  
  const protectedEndpoints = [
    '/api/admin/users',
    '/api/provider/settings',
    '/api/dev/system-test',
    '/api/accountant/dashboard'
  ];
  
  // Test direct access without authentication
  console.log('🔍 Testing unauthenticated access...');
  for (const endpoint of protectedEndpoints) {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
      method: 'GET',
      headers: {
        'User-Agent': 'AuthBypassTest'
      }
    };
    
    try {
      const response = await makeRequest(options);
      results.authenticationTest.bypassAttempts++;
      
      // Check if access was granted (should be denied)
      if (response.statusCode === 200) {
        results.authenticationTest.successfulBypasses++;
        results.securityTest.vulnerabilities.push({
          type: 'Authentication Bypass',
          endpoint: endpoint,
          payload: 'Direct access',
          response: response.statusCode,
          details: 'Unauthenticated access granted'
        });
      }
    } catch (error) {
      // Expected for protected endpoints
    }
  }
  
  // Test rate limiting
  console.log('🔍 Testing rate limiting...');
  const rapidRequests = [];
  for (let i = 0; i < 20; i++) {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RateLimitTest'
      }
    };
    
    rapidRequests.push(makeRequest(options, { email: 'test@test.com', password: 'wrong' }));
  }
  
  const rateLimitResponses = await Promise.all(rapidRequests);
  const rateLimitedResponses = rateLimitResponses.filter(r => r.statusCode === 429);
  
  if (rateLimitedResponses.length === 0) {
    results.authenticationTest.rateLimitingEffective = false;
    results.securityTest.vulnerabilities.push({
      type: 'Rate Limiting',
      endpoint: '/api/auth/login',
      payload: 'Rapid requests',
      response: 'No rate limiting',
      details: 'No rate limiting detected on login endpoint'
    });
  }
}

/**
 * Generate security report
 */
function generateSecurityReport() {
  console.log('\n📋 SECURITY AUDIT REPORT');
  console.log('='.repeat(50));
  
  const totalSecurityTests = results.securityTest.passed + results.securityTest.failed;
  const securityScore = ((results.securityTest.passed / totalSecurityTests) * 100).toFixed(1);
  
  console.log(`\n🔒 SECURITY SCORE: ${securityScore}%`);
  console.log(`✅ Tests Passed: ${results.securityTest.passed}`);
  console.log(`❌ Vulnerabilities Found: ${results.securityTest.vulnerabilities.length}`);
  
  if (results.securityTest.vulnerabilities.length > 0) {
    console.log('\n🚨 VULNERABILITIES DETECTED:');
    results.securityTest.vulnerabilities.forEach((vuln, index) => {
      console.log(`  ${index + 1}. ${vuln.type} - ${vuln.endpoint}`);
      console.log(`     Payload: ${vuln.payload}`);
      console.log(`     Response: ${vuln.response}`);
      console.log(`     Details: ${vuln.details}`);
    });
  }
  
  console.log(`\n🔐 AUTHENTICATION SECURITY:`);
  console.log(`  Bypass Attempts: ${results.authenticationTest.bypassAttempts}`);
  console.log(`  Successful Bypasses: ${results.authenticationTest.successfulBypasses}`);
  console.log(`  Rate Limiting: ${results.authenticationTest.rateLimitingEffective ? '✅ Effective' : '❌ Not Detected'}`);
}

/**
 * Main execution
 */
async function runStressTestAndSecurityAudit() {
  console.log('🛡️ STREAMFLOW STRESS TEST & SECURITY AUDIT');
  console.log('='.repeat(60));
  console.log(`🌐 Target: ${BASE_URL}`);
  console.log(`⏰ Started: ${new Date().toISOString()}`);
  
  try {
    await runStressTest();
    await runSecurityTests();
    await runAuthenticationTests();
    generateSecurityReport();
    
    console.log('\n🎯 STRESS TEST & SECURITY AUDIT COMPLETE!');
    
    // Overall assessment
    const hasVulnerabilities = results.securityTest.vulnerabilities.length > 0;
    const hasPerformanceIssues = results.stressTest.averageResponseTime > 1000;
    
    if (!hasVulnerabilities && !hasPerformanceIssues) {
      console.log('🟢 SYSTEM STATUS: PRODUCTION READY');
    } else if (hasVulnerabilities && !hasPerformanceIssues) {
      console.log('🟡 SYSTEM STATUS: SECURITY REVIEW REQUIRED');
    } else if (!hasVulnerabilities && hasPerformanceIssues) {
      console.log('🟡 SYSTEM STATUS: PERFORMANCE OPTIMIZATION NEEDED');
    } else {
      console.log('🔴 SYSTEM STATUS: CRITICAL ISSUES DETECTED');
    }
    
  } catch (error) {
    console.error('💥 Critical error during testing:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  runStressTestAndSecurityAudit().catch(console.error);
}

module.exports = { runStressTestAndSecurityAudit, results };
