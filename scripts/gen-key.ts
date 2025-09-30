#!/usr/bin/env ts-node
/**
 * Encryption Key Generator
 * 
 * Purpose: Generate a cryptographically secure 32-byte AES-256-GCM encryption key
 * Usage: npm run gen-key
 * 
 * This script:
 * 1. Generates a random 32-byte key using Node.js crypto
 * 2. Encodes it as base64
 * 3. Adds it to .env file as APP_ENCRYPTION_KEY
 * 4. Creates backup of existing .env
 * 5. Provides instructions for production deployment
 */

import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { join } from 'path';

const ENV_FILE = join(process.cwd(), '.env');
const ENV_BACKUP = join(process.cwd(), '.env.backup');

/**
 * Generate a cryptographically secure 32-byte key
 */
function generateKey(): string {
  const key = randomBytes(32); // 256 bits for AES-256
  return key.toString('base64');
}

/**
 * Check if APP_ENCRYPTION_KEY already exists in .env
 */
function keyExists(): boolean {
  if (!existsSync(ENV_FILE)) {
    return false;
  }

  const envContent = readFileSync(ENV_FILE, 'utf-8');
  return /^APP_ENCRYPTION_KEY=/m.test(envContent);
}

/**
 * Add or update APP_ENCRYPTION_KEY in .env file
 */
function updateEnvFile(key: string): void {
  let envContent = '';

  // Read existing .env if it exists
  if (existsSync(ENV_FILE)) {
    // Create backup
    copyFileSync(ENV_FILE, ENV_BACKUP);
    console.log(`✅ Created backup: ${ENV_BACKUP}`);

    envContent = readFileSync(ENV_FILE, 'utf-8');

    // Check if key already exists
    if (/^APP_ENCRYPTION_KEY=/m.test(envContent)) {
      // Update existing key
      envContent = envContent.replace(
        /^APP_ENCRYPTION_KEY=.*/m,
        `APP_ENCRYPTION_KEY=${key}`
      );
      console.log('✅ Updated existing APP_ENCRYPTION_KEY in .env');
    } else {
      // Add new key
      envContent += `\n# AES-256-GCM Encryption Key (Generated: ${new Date().toISOString()})\nAPP_ENCRYPTION_KEY=${key}\n`;
      console.log('✅ Added APP_ENCRYPTION_KEY to .env');
    }
  } else {
    // Create new .env file
    envContent = `# StreamFlow Environment Variables
# Generated: ${new Date().toISOString()}

# AES-256-GCM Encryption Key
# Used for encrypting sensitive data at rest (e.g., Stripe account IDs)
APP_ENCRYPTION_KEY=${key}
`;
    console.log('✅ Created new .env file with APP_ENCRYPTION_KEY');
  }

  // Write updated content
  writeFileSync(ENV_FILE, envContent, 'utf-8');
}

/**
 * Main execution
 */
function main() {
  console.log('🔐 StreamFlow Encryption Key Generator\n');

  // Check if key already exists
  if (keyExists()) {
    console.log('⚠️  APP_ENCRYPTION_KEY already exists in .env');
    console.log('');
    console.log('Options:');
    console.log('  1. Keep existing key (recommended for production)');
    console.log('  2. Generate new key (will invalidate existing encrypted data)');
    console.log('');
    console.log('To generate a new key, delete the existing APP_ENCRYPTION_KEY line and run this script again.');
    console.log('');
    process.exit(0);
  }

  // Generate new key
  const key = generateKey();
  console.log('✅ Generated 32-byte AES-256-GCM key');

  // Update .env file
  updateEnvFile(key);

  // Display key (for manual deployment)
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 ENCRYPTION KEY (for production deployment):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`APP_ENCRYPTION_KEY=${key}`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Production deployment instructions
  console.log('📦 PRODUCTION DEPLOYMENT INSTRUCTIONS:');
  console.log('');
  console.log('1. Vercel:');
  console.log('   vercel env add APP_ENCRYPTION_KEY production');
  console.log('   (Paste the key when prompted)');
  console.log('');
  console.log('2. AWS/GCP/Azure:');
  console.log('   Add APP_ENCRYPTION_KEY to your secrets manager');
  console.log('');
  console.log('3. Docker:');
  console.log('   Add to docker-compose.yml or Kubernetes secrets');
  console.log('');
  console.log('⚠️  SECURITY WARNINGS:');
  console.log('   - Never commit this key to version control');
  console.log('   - Store securely in secrets manager');
  console.log('   - Rotate periodically (requires data re-encryption)');
  console.log('   - Use different keys for dev/staging/production');
  console.log('');
  console.log('✅ Key generation complete!');
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { generateKey, updateEnvFile };

