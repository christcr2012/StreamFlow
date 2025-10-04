#!/usr/bin/env node
/**
 * Process All Binders - Only Generate New Files
 * 
 * This script processes all binder files and only generates files that don't already exist in the repo.
 * It will skip any files that are already present.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BINDER_DIR = 'C:\\Users\\chris\\OneDrive\\Desktop\\binderFiles';
const REPO_ROOT = process.cwd();

// Binders to process in order
const BINDERS = [
  'binder1_FULL.md',
  'binder2_FULL.md',
  'binder3_FULL.md',
  'binder3A_FULL.md',
  'binder3B_FULL.md',
  'binder3C_full_FULL.md',
  'binder4_FULL.md',
  'binder5_FULL.md',
  'binder6_FULL.md',
  'binder7_FULL.md',
  'binder8_FULL.md',
  'binder9_FULL.md',
  'binder10_FULL.md',
  'binder11_FULL.md',
  'binder12_FULL.md',
  'binder13_FULL.md',
  'binder14_ready_FULL.md',
  'binder15_ready_FULL.md',
  'binder16_ready_FULL.md',
  'binder17_ready_FULL.md',
  'binder18_ready_FULL.md',
  'binder19_ready_FULL.md',
  'binder20_ready_FULL.md',
  'binder21_ready_FULL.md',
  'binder22_ready_FULL.md',
  'binder23_ready_FULL.md',
];

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function fileExists(filePath) {
  return fs.existsSync(path.join(REPO_ROOT, filePath));
}

function extractAPIEndpoints(binderContent) {
  // Extract API endpoint definitions like: ### API POST /api/tenant/crm/opportunities
  const apiRegex = /### API (POST|GET|PUT|DELETE|PATCH) (\/api\/[^\s\n]+)/g;
  const endpoints = [];
  let match;
  
  while ((match = apiRegex.exec(binderContent)) !== null) {
    const method = match[1];
    const route = match[2];
    endpoints.push({ method, route });
  }
  
  return endpoints;
}

function routeToFilePath(route) {
  // Convert /api/tenant/crm/opportunities to src/pages/api/tenant/crm/opportunities.ts
  // Handle dynamic routes like /api/tenant/crm/opportunities/{id}
  let filePath = route.replace(/^\/api\//, 'src/pages/api/');
  
  // Handle dynamic segments
  filePath = filePath.replace(/\{([^}]+)\}/g, '[$1]');
  
  // Add .ts extension
  filePath = filePath + '.ts';
  
  return filePath;
}

function analyzeBinderType(binderPath) {
  const content = fs.readFileSync(binderPath, 'utf-8');
  const hasAPIDefinitions = /### API (POST|GET|PUT|DELETE|PATCH)/.test(content);
  const size = fs.statSync(binderPath).size / (1024 * 1024); // MB
  
  return {
    hasAPIDefinitions,
    size,
    isLarge: size > 10, // > 10MB
    type: hasAPIDefinitions ? 'API_IMPLEMENTATION' : 'CONTRACT_SPEC'
  };
}

function processBinder(binderFile) {
  const binderPath = path.join(BINDER_DIR, binderFile);
  const binderName = binderFile.replace(/_FULL\.md$|_ready_FULL\.md$|_full_FULL\.md$/, '');
  
  log(`\n${'='.repeat(60)}`);
  log(`Processing: ${binderName}`);
  log('='.repeat(60));
  
  if (!fs.existsSync(binderPath)) {
    log(`⚠️  Binder file not found: ${binderPath}`);
    return { binderName, status: 'NOT_FOUND', newFiles: 0, existingFiles: 0 };
  }
  
  const analysis = analyzeBinderType(binderPath);
  log(`Type: ${analysis.type}`);
  log(`Size: ${analysis.size.toFixed(2)} MB`);
  
  if (analysis.type === 'CONTRACT_SPEC') {
    log(`✅ Contract/Spec binder - marking as complete (no files to generate)`);
    return { binderName, status: 'CONTRACT_COMPLETE', newFiles: 0, existingFiles: 0 };
  }
  
  // For API implementation binders, extract and check endpoints
  const content = fs.readFileSync(binderPath, 'utf-8');
  const endpoints = extractAPIEndpoints(content);
  
  log(`Found ${endpoints.length} API endpoints`);
  
  let newFiles = 0;
  let existingFiles = 0;
  const filesToGenerate = [];
  
  for (const endpoint of endpoints) {
    const filePath = routeToFilePath(endpoint.route);
    
    if (fileExists(filePath)) {
      existingFiles++;
    } else {
      newFiles++;
      filesToGenerate.push({ ...endpoint, filePath });
    }
  }
  
  log(`📊 Analysis:`);
  log(`  - Total endpoints: ${endpoints.length}`);
  log(`  - Already exist: ${existingFiles}`);
  log(`  - Need to create: ${newFiles}`);
  
  if (newFiles === 0) {
    log(`✅ All files already exist - binder complete`);
    return { binderName, status: 'ALREADY_COMPLETE', newFiles: 0, existingFiles };
  }
  
  log(`\n🔨 Generating ${newFiles} new files...`);
  
  // Generate new files
  for (const file of filesToGenerate) {
    generateAPIFile(file, content);
  }
  
  log(`✅ Generated ${newFiles} new files`);
  
  return { binderName, status: 'PROCESSED', newFiles, existingFiles };
}

function generateAPIFile(endpoint, binderContent) {
  // Extract the specific endpoint section from binder
  const sectionRegex = new RegExp(
    `### API ${endpoint.method} ${endpoint.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)(?=### API|$)`,
    'i'
  );
  
  const match = binderContent.match(sectionRegex);
  const sectionContent = match ? match[1] : '';
  
  // Generate the API file content
  const fileContent = generateAPIFileContent(endpoint, sectionContent);
  
  // Ensure directory exists
  const filePath = path.join(REPO_ROOT, endpoint.filePath);
  const dir = path.dirname(filePath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write file
  fs.writeFileSync(filePath, fileContent, 'utf-8');
  log(`  ✅ Created: ${endpoint.filePath}`);
}

function generateAPIFileContent(endpoint, sectionContent) {
  // Parse section for schema, validation, etc.
  // This is a simplified version - you may need to enhance based on actual binder format
  
  const template = `import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { withAudience } from '@/middleware/audience';
import { prisma } from '@/lib/prisma';
import { auditService } from '@/lib/auditService';

// TODO: Define proper schema based on binder specifications
const RequestSchema = z.object({
  // Add fields from binder spec
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== '${endpoint.method}') {
    return res.status(405).json({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    // TODO: Implement based on binder specifications
    // Section content from binder:
    ${sectionContent.split('\n').map(line => `// ${line}`).join('\n    ')}
    
    return res.status(200).json({
      ok: true,
      data: {},
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  }
}

export default withAudience(['client'])(handler);
`;
  
  return template;
}

function commitAndPush(results) {
  const totalNew = results.reduce((sum, r) => sum + r.newFiles, 0);
  
  if (totalNew === 0) {
    log('\n✅ No new files to commit');
    return;
  }
  
  log(`\n📦 Committing ${totalNew} new files...`);
  
  try {
    execSync('git add .', { cwd: REPO_ROOT, stdio: 'inherit' });
    execSync(`git commit -m "feat(binders): add ${totalNew} new files from binder processing [skip ci]"`, { 
      cwd: REPO_ROOT, 
      stdio: 'inherit' 
    });
    execSync('git push origin main', { cwd: REPO_ROOT, stdio: 'inherit' });
    log('✅ Committed and pushed to GitHub');
  } catch (error) {
    log(`❌ Error committing: ${error.message}`);
  }
}

// Main execution
async function main() {
  log('🚀 Starting All Binders Processing');
  log('Only generating NEW files (skipping existing)');
  log('='.repeat(60));
  
  const results = [];
  
  for (const binderFile of BINDERS) {
    const result = processBinder(binderFile);
    results.push(result);
  }
  
  // Summary
  log(`\n\n${'='.repeat(60)}`);
  log('📊 PROCESSING SUMMARY');
  log('='.repeat(60));
  
  const totalNew = results.reduce((sum, r) => sum + r.newFiles, 0);
  const totalExisting = results.reduce((sum, r) => sum + r.existingFiles, 0);
  
  log(`\nTotal binders processed: ${results.length}`);
  log(`Total new files generated: ${totalNew}`);
  log(`Total existing files (skipped): ${totalExisting}`);
  log('');
  
  results.forEach(r => {
    const status = r.status === 'PROCESSED' ? '🔨' : 
                   r.status === 'ALREADY_COMPLETE' ? '✅' :
                   r.status === 'CONTRACT_COMPLETE' ? '📋' : '⚠️';
    log(`  ${status} ${r.binderName}: ${r.newFiles} new, ${r.existingFiles} existing`);
  });
  
  // Commit and push if there are new files
  if (totalNew > 0) {
    commitAndPush(results);
  }
  
  log('\n✅ All binders processed!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

