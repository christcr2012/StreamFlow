// test-env.js - Test environment variables loading

require('dotenv').config();

console.log('🔍 Environment Variables Check:\n');

const requiredVars = [
  'PROVIDER_ADMIN_EMAIL',
  'PROVIDER_ADMIN_PASSWORD_HASH',
  'PROVIDER_ADMIN_TOTP_SECRET',
  'MASTER_ENC_KEY'
];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}:`, value ? '✅ Set' : '❌ Missing');
  if (value) {
    console.log(`  Value: ${value.substring(0, 20)}...`);
  }
  console.log('');
});

// Test the specific values we're using
console.log('🧪 Specific Values:');
console.log('PROVIDER_ADMIN_EMAIL:', process.env.PROVIDER_ADMIN_EMAIL);
console.log('PROVIDER_ADMIN_PASSWORD_HASH:', process.env.PROVIDER_ADMIN_PASSWORD_HASH);
console.log('MASTER_ENC_KEY length:', process.env.MASTER_ENC_KEY?.length);
