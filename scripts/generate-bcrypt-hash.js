#!/usr/bin/env node
/**
 * Generate bcrypt hash for passwords
 * Usage: node scripts/generate-bcrypt-hash.js [password]
 * Example: node scripts/generate-bcrypt-hash.js MyPassword123
 */

const bcrypt = require("bcryptjs");

const password = process.argv[2];

if (!password) {
  console.error("❌ Error: Please provide a password");
  console.log("\nUsage: node scripts/generate-bcrypt-hash.js [password]");
  console.log("Example: node scripts/generate-bcrypt-hash.js MyPassword123\n");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);

console.log("\n✅ Bcrypt hash generated successfully!\n");
console.log("Password: [REDACTED]"); // Security: Don't log passwords
console.log("Hash:", hash);
console.log("\nCopy this hash to your .env file:");
console.log(`PROVIDER_ADMIN_PASSWORD_HASH="${hash}"`);
console.log("");
