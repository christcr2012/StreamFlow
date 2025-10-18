#!/usr/bin/env node

/**
 * Generate Secrets for Vercel Deployment
 * 
 * This script generates all the required secrets for your Vercel deployment.
 * Run this and copy the output into your Vercel environment variables.
 * 
 * Usage:
 *   node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('='.repeat(80));
console.log('CORTIWARE DEPLOYMENT SECRETS');
console.log('='.repeat(80));
console.log('');
console.log('Copy these values into Vercel → Settings → Environment Variables');
console.log('');
console.log('='.repeat(80));
console.log('');

// Generate session secrets (32 bytes = 64 hex characters)
console.log('# Session Secrets (32 bytes hex)');
console.log('PROVIDER_SESSION_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('TENANT_COOKIE_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('DEVELOPER_SESSION_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('ACCOUNTANT_SESSION_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('');

// Generate federation key (64 bytes = 128 hex characters)
console.log('# Federation Key (64 bytes hex)');
console.log('FED_HMAC_MASTER_KEY=' + crypto.randomBytes(64).toString('hex'));
console.log('');

// Generate JWT secret (64 bytes)
console.log('# JWT Secret (64 bytes hex)');
console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex'));
console.log('');

// Generate breakglass key (32 bytes)
console.log('# Breakglass Master Key (32 bytes hex)');
console.log('BREAKGLASS_MASTER_KEY=' + crypto.randomBytes(32).toString('hex'));
console.log('');

// Generate bcrypt hashes for credentials
console.log('# Credential Hashes (bcrypt)');
console.log('# These will be generated asynchronously...');
console.log('');

// Use bcryptjs if available, otherwise provide instructions
try {
  const bcrypt = require('bcryptjs');

  // Provider credentials (example placeholders)
  bcrypt.hash('provider@example.com:CHANGE_ME_PASSWORD', 10, (err, hash) => {
    if (err) {
      console.error('Error generating PROVIDER_CREDENTIALS:', err);
    } else {
      console.log('PROVIDER_CREDENTIALS=' + hash);
    }
  });

  // Developer credentials (example placeholders)
  bcrypt.hash('developer@example.com:CHANGE_ME_PASSWORD', 10, (err, hash) => {
    if (err) {
      console.error('Error generating DEVELOPER_CREDENTIALS:', err);
    } else {
      console.log('DEVELOPER_CREDENTIALS=' + hash);
    }
  });

  setTimeout(() => {
    console.log('');
    console.log('='.repeat(80));
    console.log('DONE! Copy all values above into Vercel.');
    console.log('='.repeat(80));
  }, 1000);

} catch (e) {
  console.log('# bcryptjs not installed - install it first:');
  console.log('# npm install bcryptjs');
  console.log('# Then run this script again');
  console.log('');
  console.log('# Or generate manually:');
  console.log('node -e "const bcrypt = require(\'bcryptjs\'); bcrypt.hash(\'provider@example.com:CHANGE_ME_PASSWORD\', 10, (e,h) => console.log(\'PROVIDER_CREDENTIALS=\' + h))"');
  console.log('node -e "const bcrypt = require(\'bcryptjs\'); bcrypt.hash(\'developer@example.com:CHANGE_ME_PASSWORD\', 10, (e,h) => console.log(\'DEVELOPER_CREDENTIALS=\' + h))"');
  console.log('');
  console.log('='.repeat(80));
  console.log('DONE! Copy all values above into Vercel.');
  console.log('='.repeat(80));
}

