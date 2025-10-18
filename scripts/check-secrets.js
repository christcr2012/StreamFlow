#!/usr/bin/env node
/**
 * Secret Detection Script
 * 
 * Scans staged files for potential secrets before commit.
 * Prevents accidental commits of sensitive information.
 * 
 * Usage: node scripts/check-secrets.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Patterns to detect secrets
const SECRET_PATTERNS = [
  // Generic high-entropy strings (64+ hex chars)
  {
    name: 'High Entropy Hex String (64+ chars)',
    pattern: /\b[0-9a-f]{64,}\b/gi,
    severity: 'HIGH',
  },
  // API Keys and Tokens
  {
    name: 'Generic API Key',
    pattern: /(?:api[_-]?key|apikey|api[_-]?token)[\s]*[=:]["']?([a-zA-Z0-9_\-]{20,})["']?/gi,
    severity: 'HIGH',
  },
  // AWS Keys
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'CRITICAL',
  },
  {
    name: 'AWS Secret Key',
    pattern: /(?:aws[_-]?secret[_-]?access[_-]?key|aws[_-]?secret)[\s]*[=:]["']?([a-zA-Z0-9/+=]{40})["']?/gi,
    severity: 'CRITICAL',
  },
  // Private Keys
  {
    name: 'Private Key',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    severity: 'CRITICAL',
  },
  // Database URLs
  {
    name: 'Database URL with Password',
    pattern: /(?:postgres|mysql|mongodb):\/\/[^:]+:[^@]+@[^/]+/gi,
    severity: 'HIGH',
  },
  // JWT Tokens
  {
    name: 'JWT Token',
    pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    severity: 'MEDIUM',
  },
  // Stripe Keys
  {
    name: 'Stripe Secret Key',
    pattern: /sk_live_[a-zA-Z0-9]{24,}/g,
    severity: 'CRITICAL',
  },
  // GitHub Tokens
  {
    name: 'GitHub Token',
    pattern: /gh[pousr]_[a-zA-Z0-9]{36,}/g,
    severity: 'CRITICAL',
  },
  // Vercel Tokens
  {
    name: 'Vercel Token',
    pattern: /(?:vercel[_-]?token)[\s]*[=:]["']?([a-zA-Z0-9]{24,})["']?/gi,
    severity: 'HIGH',
  },
  // Generic Secrets
  {
    name: 'Generic Secret',
    pattern: /(?:secret|password|passwd|pwd)[\s]*[=:]["']?([a-zA-Z0-9_\-!@#$%^&*()+=]{16,})["']?/gi,
    severity: 'MEDIUM',
  },
];

// Files to always ignore
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.git\//,
  /\.next\//,
  /\.turbo\//,
  /dist\//,
  /build\//,
  /\.env\.example$/,
  /\.env\.template$/,
  /\.env\.vercel\.template$/,
  /package-lock\.json$/,
  /pnpm-lock\.yaml$/,
  /yarn\.lock$/,
  /\.md$/i, // Markdown files (documentation)
  /INCIDENT_RESPONSE/i, // Incident response docs
  /SECRET_ROTATION/i, // Secret rotation docs
  /tests\/.*\.test\.(ts|js)$/i, // Test files
  /tests\/.*\.sh$/i, // Test scripts
];

// Get staged files
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
    });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error getting staged files:', error.message);
    return [];
  }
}

// Check if file should be ignored
function shouldIgnoreFile(filePath) {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filePath));
}

// Scan file for secrets
function scanFile(filePath) {
  if (shouldIgnoreFile(filePath)) {
    return [];
  }

  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    return [];
  }

  const stat = fs.statSync(fullPath);
  if (!stat.isFile() || stat.size > 1024 * 1024) { // Skip files > 1MB
    return [];
  }

  let content;
  try {
    content = fs.readFileSync(fullPath, 'utf-8');
  } catch (error) {
    // Skip binary files or files that can't be read as text
    return [];
  }

  const findings = [];
  const lines = content.split('\n');

  SECRET_PATTERNS.forEach(({ name, pattern, severity }) => {
    lines.forEach((line, lineNumber) => {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        findings.push({
          file: filePath,
          line: lineNumber + 1,
          pattern: name,
          severity,
          match: match[0].substring(0, 50) + (match[0].length > 50 ? '...' : ''),
        });
      }
    });
  });

  return findings;
}

// Main function
function main() {
  console.log('🔍 Scanning staged files for secrets...\n');

  const stagedFiles = getStagedFiles();
  
  if (stagedFiles.length === 0) {
    console.log('✅ No staged files to scan');
    process.exit(0);
  }

  console.log(`📁 Scanning ${stagedFiles.length} staged file(s)...\n`);

  let allFindings = [];
  stagedFiles.forEach(file => {
    const findings = scanFile(file);
    allFindings = allFindings.concat(findings);
  });

  if (allFindings.length === 0) {
    console.log('✅ No secrets detected in staged files');
    console.log('✅ Safe to commit\n');
    process.exit(0);
  }

  // Group findings by severity
  const critical = allFindings.filter(f => f.severity === 'CRITICAL');
  const high = allFindings.filter(f => f.severity === 'HIGH');
  const medium = allFindings.filter(f => f.severity === 'MEDIUM');

  console.log('🚨 POTENTIAL SECRETS DETECTED!\n');
  console.log('=' .repeat(80));

  if (critical.length > 0) {
    console.log('\n🔴 CRITICAL SEVERITY:');
    critical.forEach(f => {
      console.log(`  ${f.file}:${f.line}`);
      console.log(`    Pattern: ${f.pattern}`);
      console.log(`    Match: ${f.match}`);
      console.log('');
    });
  }

  if (high.length > 0) {
    console.log('\n🟠 HIGH SEVERITY:');
    high.forEach(f => {
      console.log(`  ${f.file}:${f.line}`);
      console.log(`    Pattern: ${f.pattern}`);
      console.log(`    Match: ${f.match}`);
      console.log('');
    });
  }

  if (medium.length > 0) {
    console.log('\n🟡 MEDIUM SEVERITY:');
    medium.forEach(f => {
      console.log(`  ${f.file}:${f.line}`);
      console.log(`    Pattern: ${f.pattern}`);
      console.log(`    Match: ${f.match}`);
      console.log('');
    });
  }

  console.log('=' .repeat(80));
  console.log('\n❌ COMMIT BLOCKED - Potential secrets detected');
  console.log('\nTo fix:');
  console.log('  1. Remove the secrets from the files');
  console.log('  2. Use environment variables instead');
  console.log('  3. Add sensitive files to .gitignore');
  console.log('  4. If this is a false positive, update scripts/check-secrets.js\n');
  console.log('Total findings: ' + allFindings.length);
  console.log(`  Critical: ${critical.length}, High: ${high.length}, Medium: ${medium.length}\n`);

  process.exit(1);
}

main();

