// test-auth.js - Simple authentication test script

const https = require('http');

async function testProviderAuth() {
  console.log('🧪 Testing Provider Authentication...\n');

  const postData = JSON.stringify({
    email: 'chris.tcr.2012@gmail.com',
    password: 'Thrillicious01no'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('📊 Provider Authentication Test Results:');
          console.log('Status Code:', res.statusCode);
          console.log('Response:', JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200 && (response.ok || response.success)) {
            console.log('✅ Provider authentication PASSED');
            if (response.mode) {
              console.log(`🔧 Authentication mode: ${response.mode}`);
            }
            if (response.isRecoveryMode) {
              console.log('🚨 Recovery mode is active');
            }
          } else {
            console.log('❌ Provider authentication FAILED');
          }
          
          resolve(response);
        } catch (error) {
          console.log('❌ Failed to parse response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request failed:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testInvalidAuth() {
  console.log('\n🧪 Testing Invalid Credentials...\n');

  const postData = JSON.stringify({
    email: 'invalid@example.com',
    password: 'wrongpassword'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('📊 Invalid Credentials Test Results:');
          console.log('Status Code:', res.statusCode);
          console.log('Response:', JSON.stringify(response, null, 2));
          
          if (res.statusCode !== 200 || !response.ok) {
            console.log('✅ Invalid credentials correctly rejected');
          } else {
            console.log('❌ Invalid credentials were incorrectly accepted');
          }
          
          resolve(response);
        } catch (error) {
          console.log('❌ Failed to parse response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request failed:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  try {
    console.log('🚀 Starting Authentication System Tests...\n');
    
    // Test 1: Valid provider credentials
    await testProviderAuth();
    
    // Test 2: Invalid credentials
    await testInvalidAuth();
    
    console.log('\n🎉 Authentication tests completed!');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run the tests
runTests();
