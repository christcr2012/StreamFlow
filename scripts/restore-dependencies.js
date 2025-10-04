#!/usr/bin/env node
/**
 * Restore Missing Dependencies
 * Finds and restores components/files that are imported but missing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

console.log('🔍 Finding missing dependencies...\n');

// Get all remaining files
function getAllFiles(dir, pattern) {
  const files = [];
  
  if (!fs.existsSync(dir)) return files;
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllFiles(fullPath, pattern));
      } else if (entry.name.endsWith(pattern)) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    // Ignore
  }
  
  return files;
}

// Extract imports from file
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports = [];
    
    // Match import statements
    const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1].startsWith('.')) {
        imports.push(match[1]);
      }
    }
    
    return imports;
  } catch (err) {
    return [];
  }
}

// Resolve import path to file path
function resolveImport(fromFile, importPath) {
  const fromDir = path.dirname(fromFile);
  let resolved = path.resolve(fromDir, importPath);
  
  // Try different extensions
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];
  for (const ext of extensions) {
    const withExt = resolved + ext;
    if (fs.existsSync(withExt)) {
      return withExt;
    }
  }
  
  // Try index files
  for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
    const indexPath = path.join(resolved, `index${ext}`);
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }
  
  return null;
}

// Find all remaining files
const remainingFiles = [
  ...getAllFiles(path.join(ROOT, 'src/components'), '.tsx'),
  ...getAllFiles(path.join(ROOT, 'src/app'), '.tsx'),
  ...getAllFiles(path.join(ROOT, 'src/pages'), '.tsx'),
  ...getAllFiles(path.join(ROOT, 'src/pages/api'), '.ts'),
];

console.log(`Found ${remainingFiles.length} remaining files\n`);

// Check each file for missing imports
const missingFiles = new Set();

for (const file of remainingFiles) {
  const imports = extractImports(file);
  
  for (const imp of imports) {
    const resolved = resolveImport(file, imp);
    if (!resolved) {
      const relativePath = path.relative(ROOT, file);
      missingFiles.add({ file: relativePath, import: imp });
    }
  }
}

if (missingFiles.size === 0) {
  console.log('✅ No missing dependencies found!\n');
  process.exit(0);
}

console.log(`Found ${missingFiles.size} missing imports:\n`);

// Try to restore missing files from git
let restored = 0;
let failed = 0;

for (const { file, import: imp } of missingFiles) {
  console.log(`   ${file} → ${imp}`);
  
  // Try to restore from git
  const fromDir = path.dirname(path.join(ROOT, file));
  const resolved = path.resolve(fromDir, imp);
  const relativePath = path.relative(ROOT, resolved).replace(/\\/g, '/');
  
  // Try different extensions
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];
  let restoredAny = false;
  
  for (const ext of extensions) {
    const tryPath = relativePath + ext;
    try {
      execSync(`git restore "${tryPath}"`, { cwd: ROOT, stdio: 'pipe' });
      console.log(`      ✅ Restored: ${tryPath}`);
      restored++;
      restoredAny = true;
      break;
    } catch (err) {
      // Try next extension
    }
  }
  
  if (!restoredAny) {
    // Try index file
    for (const ext of ['.ts', '.tsx']) {
      const indexPath = path.join(relativePath, `index${ext}`);
      try {
        execSync(`git restore "${indexPath}"`, { cwd: ROOT, stdio: 'pipe' });
        console.log(`      ✅ Restored: ${indexPath}`);
        restored++;
        restoredAny = true;
        break;
      } catch (err) {
        // Continue
      }
    }
  }
  
  if (!restoredAny) {
    console.log(`      ⚠️  Could not restore`);
    failed++;
  }
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Restored: ${restored} files`);
console.log(`Failed: ${failed} files`);
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

if (restored > 0) {
  console.log('✅ Run build again: npm run build\n');
}

