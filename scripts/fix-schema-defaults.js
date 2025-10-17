/**
 * Fix Prisma Schema Defaults
 * 
 * This script adds @default(cuid()) to all id fields and @updatedAt to updatedAt fields
 * that were lost during prisma db pull introspection.
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Add @default(cuid()) to id fields that don't have it
schema = schema.replace(/^(\s+id\s+String\s+@id)$/gm, '$1 @default(cuid())');

// Add @updatedAt to updatedAt DateTime fields that don't have it
schema = schema.replace(/^(\s+updatedAt\s+DateTime)$/gm, '$1 @updatedAt');

// Write back
fs.writeFileSync(schemaPath, schema, 'utf8');

console.log('✅ Fixed schema defaults');
console.log('   - Added @default(cuid()) to id fields');
console.log('   - Added @updatedAt to updatedAt fields');

