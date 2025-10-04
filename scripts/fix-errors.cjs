#!/usr/bin/env node
/**
 * Universal Binder Error Fixer
 * Fixes TypeScript errors across the codebase:
 * - Missing handler arguments (req, res)
 * - withAudience arity issues
 * - AuditService.log property errors
 * - Missing imports
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'ops', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'error_fixes.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  logStream.write(logMessage);
  console.log(message);
}

/**
 * Recursively find all TypeScript files in a directory
 */
async function findTsFiles(dir, fileList = []) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileStat = await stat(filePath);
    
    if (fileStat.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!['node_modules', '.next', 'dist', 'out', 'build', '.git'].includes(file)) {
        await findTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

/**
 * Fix withAudience usage patterns
 */
function fixWithAudienceUsage(content, filePath) {
  let modified = false;
  let newContent = content;
  
  // Pattern 1: export default withAudience('client')(handler)
  // Convert to: export default withAudience('client', handler)
  const curriedPattern = /export\s+default\s+withAudience\s*\(\s*['"](\w+)['"]\s*\)\s*\(\s*(\w+)\s*\)/g;
  if (curriedPattern.test(content)) {
    newContent = newContent.replace(curriedPattern, "export default withAudience('$1', $2)");
    modified = true;
    log(`  Fixed curried withAudience in: ${filePath}`);
  }
  
  return { content: newContent, modified };
}

/**
 * Ensure handler has proper signature
 */
function fixHandlerSignature(content, filePath) {
  let modified = false;
  let newContent = content;
  
  // Check if NextApiRequest/NextApiResponse are imported
  const hasNextImport = /import.*\{[^}]*NextApiRequest[^}]*\}.*from\s+['"]next['"]/.test(content) ||
                        /import.*type.*\{[^}]*NextApiRequest[^}]*\}.*from\s+['"]next['"]/.test(content);
  
  if (!hasNextImport && /async\s+function\s+handler/.test(content)) {
    // Add import at the top
    const importStatement = "import type { NextApiRequest, NextApiResponse } from 'next';\n";
    newContent = importStatement + newContent;
    modified = true;
    log(`  Added Next.js types import to: ${filePath}`);
  }
  
  // Fix handler without parameters
  const handlerNoParams = /async\s+function\s+handler\s*\(\s*\)/g;
  if (handlerNoParams.test(content)) {
    newContent = newContent.replace(handlerNoParams, 'async function handler(req: NextApiRequest, res: NextApiResponse)');
    modified = true;
    log(`  Fixed handler signature in: ${filePath}`);
  }
  
  // Fix handler with untyped parameters
  const handlerUntypedParams = /async\s+function\s+handler\s*\(\s*req\s*,\s*res\s*\)/g;
  if (handlerUntypedParams.test(content)) {
    newContent = newContent.replace(handlerUntypedParams, 'async function handler(req: NextApiRequest, res: NextApiResponse)');
    modified = true;
    log(`  Added types to handler parameters in: ${filePath}`);
  }
  
  return { content: newContent, modified };
}

/**
 * Fix AuditService.log() calls
 */
function fixAuditServiceLog(content, filePath) {
  let modified = false;
  let newContent = content;

  // Replace auditService.log() with AuditService.log() (static method)
  const instanceLogPattern = /auditService\.log\s*\(/g;
  if (instanceLogPattern.test(content)) {
    newContent = newContent.replace(instanceLogPattern, 'AuditService.log(');
    modified = true;
    log(`  Fixed auditService.log() to AuditService.log() in: ${filePath}`);

    // Ensure AuditService is imported
    const hasAuditServiceImport = /import.*\{[^}]*AuditService[^}]*\}.*from.*auditService/.test(content);
    if (!hasAuditServiceImport) {
      // Add AuditService to existing import or create new one
      if (/import.*\{[^}]*auditService[^}]*\}.*from.*auditService/.test(content)) {
        newContent = newContent.replace(
          /(import.*\{[^}]*)(auditService)([^}]*\}.*from.*auditService)/,
          '$1AuditService, $2$3'
        );
      } else {
        const importStatement = "import { AuditService } from '@/lib/auditService';\n";
        newContent = importStatement + newContent;
      }
      log(`  Added AuditService import to: ${filePath}`);
    }
  }

  return { content: newContent, modified };
}

/**
 * Fix withAudience array argument
 */
function fixWithAudienceArray(content, filePath) {
  let modified = false;
  let newContent = content;

  // Pattern: withAudience(['client']) -> withAudience('client')
  const arrayPattern = /withAudience\s*\(\s*\[\s*['"](\w+)['"]\s*\]\s*\)/g;
  if (arrayPattern.test(content)) {
    newContent = newContent.replace(arrayPattern, "withAudience('$1')");
    modified = true;
    log(`  Fixed withAudience array argument in: ${filePath}`);
  }

  return { content: newContent, modified };
}

/**
 * Process a single file
 */
async function processFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    let newContent = content;
    let fileModified = false;
    
    // Apply all fixes
    const fixes = [
      fixWithAudienceUsage,
      fixHandlerSignature,
      fixAuditServiceLog,
      fixWithAudienceArray
    ];
    
    for (const fix of fixes) {
      const result = fix(newContent, filePath);
      newContent = result.content;
      fileModified = fileModified || result.modified;
    }
    
    // Write back if modified
    if (fileModified) {
      await writeFile(filePath, newContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    log(`  ERROR processing ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  log('='.repeat(80));
  log('UNIVERSAL BINDER ERROR FIXER - STARTING');
  log('='.repeat(80));
  
  const startTime = Date.now();
  
  // Find all TypeScript files in src/pages/api
  const apiDir = path.join(process.cwd(), 'src', 'pages', 'api');
  log(`\nScanning for TypeScript files in: ${apiDir}`);
  
  const files = await findTsFiles(apiDir);
  log(`Found ${files.length} TypeScript files\n`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    const wasFixed = await processFile(file);
    if (wasFixed) {
      fixedCount++;
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  log('\n' + '='.repeat(80));
  log('SUMMARY');
  log('='.repeat(80));
  log(`Total files scanned: ${files.length}`);
  log(`Files modified: ${fixedCount}`);
  log(`Duration: ${duration}s`);
  log('='.repeat(80));
  
  logStream.end();
  
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { processFile, findTsFiles };

