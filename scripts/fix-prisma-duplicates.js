const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

console.log('🔧 Fixing duplicate ID fields in Prisma schema...');

try {
  let content = fs.readFileSync(schemaPath, 'utf8');
  
  // More comprehensive pattern to match duplicate id fields
  // Matches: id String @id @default(cuid()) followed by id String on next line
  const duplicateIdPattern = /(id\s+String\s+@id\s+@default\(cuid\(\)\))\s*\r?\n\s*id\s+String(?:\s*\r?\n)?/g;
  
  let fixCount = 0;
  const originalLength = content.length;
  
  content = content.replace(duplicateIdPattern, (match, idDeclaration) => {
    fixCount++;
    console.log(`  Fixing duplicate ID #${fixCount}`);
    return idDeclaration + '\n';
  });
  
  if (fixCount > 0) {
    fs.writeFileSync(schemaPath, content, 'utf8');
    console.log(`✅ Fixed ${fixCount} duplicate ID fields`);
    console.log(`📊 Schema size: ${originalLength} → ${content.length} chars`);
  } else {
    console.log('ℹ️  No duplicate ID fields found');
  }
  
} catch (error) {
  console.error('❌ Error fixing Prisma schema:', error.message);
  process.exit(1);
}
