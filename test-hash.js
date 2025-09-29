// test-hash.js - Test password hash verification

const bcrypt = require('bcrypt');

async function testPasswordHash() {
  console.log('🔐 Testing Password Hash Verification...\n');

  const password = 'Thrillicious01no';
  const storedHash = process.env.PROVIDER_ADMIN_PASSWORD_HASH;
  
  console.log('Password:', password);
  console.log('Stored Hash:', storedHash);
  
  if (!storedHash) {
    console.log('❌ PROVIDER_ADMIN_PASSWORD_HASH environment variable not found');
    return;
  }
  
  try {
    const isValid = await bcrypt.compare(password, storedHash);
    console.log('Hash Verification Result:', isValid);
    
    if (isValid) {
      console.log('✅ Password hash verification PASSED');
    } else {
      console.log('❌ Password hash verification FAILED');
      
      // Let's generate a new hash for comparison
      console.log('\n🔧 Generating new hash for comparison...');
      const newHash = await bcrypt.hash(password, 12);
      console.log('New Hash:', newHash);
      
      const newVerification = await bcrypt.compare(password, newHash);
      console.log('New Hash Verification:', newVerification);
    }
  } catch (error) {
    console.log('❌ Error during hash verification:', error.message);
  }
}

// Load environment variables
require('dotenv').config();

testPasswordHash();
