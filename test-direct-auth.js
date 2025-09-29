// test-direct-auth.js - Direct authentication test

require('dotenv').config();

async function testDirectAuth() {
  console.log('🧪 Testing Direct Provider Authentication...\n');

  try {
    // Import the authentication function
    const { authenticateProvider } = require('./src/lib/provider-auth.ts');
    
    console.log('✅ Successfully imported authenticateProvider');
    
    // Test the authentication
    const result = await authenticateProvider({
      email: 'chris.tcr.2012@gmail.com',
      password: 'Thrillicious01no',
      ipAddress: '127.0.0.1',
      userAgent: 'Direct-Test/1.0'
    });
    
    console.log('\n📊 Authentication Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`\n✅ Authentication SUCCESSFUL (mode: ${result.mode})`);
      if (result.user) {
        console.log(`User: ${result.user.email}`);
        console.log(`Permissions: ${result.user.permissions?.join(', ')}`);
      }
    } else {
      console.log(`\n❌ Authentication FAILED: ${result.error}`);
      if (result.requiresTOTP) {
        console.log('🔐 TOTP code required');
      }
    }
    
  } catch (error) {
    console.error('❌ Error during direct authentication test:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDirectAuth();
