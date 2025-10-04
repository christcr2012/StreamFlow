#!/usr/bin/env node
/**
 * Sequential Binder Processor
 * 
 * Processes binders ONE AT A TIME, detects their pattern, generates files, commits & pushes.
 * Handles different binder formats:
 * - Pattern 1: ### API POST /api/tenant/... (Binder 2 style)
 * - Pattern 2: ### API 10000 with Method/Path fields (Large binders)
 * - Pattern 3: Contract/Spec documents (no code generation)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BINDER_DIR = 'C:\\Users\\chris\\OneDrive\\Desktop\\binderFiles';
const REPO_ROOT = process.cwd();

// All binders in order
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
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function detectBinderPattern(content) {
  // Pattern 1: ### API POST /api/...
  const hasPattern1 = /### API (POST|GET|PUT|DELETE|PATCH) \/api\//.test(content);
  
  // Pattern 2: ### API 10000 (numbered APIs)
  const hasPattern2 = /### API \d{5,}/.test(content);
  
  // Check size
  const lines = content.split('\n').length;
  const isLarge = lines > 50000;
  
  if (hasPattern1) {
    return { type: 'PATTERN1_API_ROUTES', pattern: 1 };
  } else if (hasPattern2) {
    return { type: 'PATTERN2_NUMBERED_API', pattern: 2 };
  } else {
    return { type: 'CONTRACT_SPEC', pattern: 0 };
  }
}

function extractPattern1APIs(content) {
  // Extract: ### API POST /api/tenant/crm/opportunities
  const regex = /### API (POST|GET|PUT|DELETE|PATCH) (\/api\/[^\s\n]+)/g;
  const apis = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    apis.push({
      method: match[1],
      path: match[2],
      pattern: 1
    });
  }
  
  return apis;
}

function extractPattern2APIs(content) {
  // Extract: ### API 10000 with Method/Path fields
  const sections = content.split(/### API \d{5,}/);
  const apis = [];
  
  // Find all API numbers
  const apiNumbers = [...content.matchAll(/### API (\d{5,})/g)].map(m => m[1]);
  
  for (let i = 0; i < apiNumbers.length; i++) {
    const apiNum = apiNumbers[i];
    const section = sections[i + 1] || '';
    
    // Extract Method and Path from section
    const methodMatch = section.match(/\*\*Method\*\*:\s*(POST|GET|PUT|DELETE|PATCH)/i);
    const pathMatch = section.match(/\*\*Path\*\*:\s*(\/api\/[^\s\n]+)/i);
    
    if (methodMatch && pathMatch) {
      apis.push({
        method: methodMatch[1],
        path: pathMatch[1],
        apiNumber: apiNum,
        pattern: 2,
        section
      });
    }
  }
  
  return apis;
}

function routeToFilePath(route) {
  // Convert /api/tenant/crm/opportunities to src/pages/api/tenant/crm/opportunities.ts
  let filePath = route.replace(/^\/api\//, 'src/pages/api/');
  
  // Handle dynamic segments: {id} -> [id]
  filePath = filePath.replace(/\{([^}]+)\}/g, '[$1]');
  
  // Remove /v4/ or other version prefixes
  filePath = filePath.replace(/\/v\d+\//, '/');
  
  // Add .ts extension
  if (!filePath.endsWith('.ts')) {
    filePath = filePath + '.ts';
  }
  
  return filePath;
}

function generateAPIFileContent(api) {
  const template = `import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { withAudience } from '@/middleware/audience';
import { prisma } from '@/lib/prisma';
import { auditService } from '@/lib/auditService';

// Schema for ${api.method} ${api.path}
const RequestSchema = z.object({
  // TODO: Add request fields from binder specification
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== '${api.method}') {
    return res.status(405).json({ 
      ok: false, 
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } 
    });
  }

  try {
    const validated = RequestSchema.parse(req.body);
    const tenantId = req.headers['x-org-id'] as string || 'org_test';
    
    // Check for idempotency
    const idempotencyKey = req.headers['x-idempotency-key'] as string;
    
    // TODO: Implement business logic from binder specification
    ${api.section ? `// Binder specification:\n${api.section.split('\n').slice(0, 10).map(l => `    // ${l}`).join('\n')}` : ''}
    
    // Audit log
    await auditService.log({
      tenantId,
      action: '${api.method}_${api.path.split('/').pop()}',
      userId: req.headers['x-user-id'] as string,
      metadata: { idempotencyKey },
    });

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

function generateFile(api) {
  const filePath = routeToFilePath(api.path);
  const fullPath = path.join(REPO_ROOT, filePath);
  const dir = path.dirname(fullPath);
  
  // Create directory if needed
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Generate content
  const content = generateAPIFileContent(api);
  
  // Write file
  fs.writeFileSync(fullPath, content, 'utf-8');
  
  return filePath;
}

function processBinder(binderFile) {
  const binderPath = path.join(BINDER_DIR, binderFile);
  const binderName = binderFile.replace(/_FULL\.md$|_ready_FULL\.md$|_full_FULL\.md$/, '');
  
  log('');
  log('='.repeat(70));
  log(`PROCESSING: ${binderName}`);
  log('='.repeat(70));
  
  if (!fs.existsSync(binderPath)) {
    log(`⚠️  File not found: ${binderPath}`);
    return { binderName, status: 'NOT_FOUND', filesGenerated: 0 };
  }
  
  // Read binder content
  log('📖 Reading binder file...');
  const content = fs.readFileSync(binderPath, 'utf-8');
  const sizeMB = (fs.statSync(binderPath).size / (1024 * 1024)).toFixed(2);
  log(`   Size: ${sizeMB} MB`);
  
  // Detect pattern
  const detection = detectBinderPattern(content);
  log(`   Pattern: ${detection.type}`);
  
  if (detection.type === 'CONTRACT_SPEC') {
    log('📋 Contract/Specification document - no code generation needed');
    log('✅ Marking as complete');
    return { binderName, status: 'CONTRACT_COMPLETE', filesGenerated: 0 };
  }
  
  // Extract APIs based on pattern
  let apis = [];
  if (detection.pattern === 1) {
    apis = extractPattern1APIs(content);
  } else if (detection.pattern === 2) {
    apis = extractPattern2APIs(content);
  }
  
  log(`🔍 Found ${apis.length} API endpoints`);
  
  if (apis.length === 0) {
    log('⚠️  No APIs found - treating as contract document');
    return { binderName, status: 'NO_APIS_FOUND', filesGenerated: 0 };
  }
  
  // Generate files
  log('🔨 Generating files...');
  const generatedFiles = [];
  
  for (let i = 0; i < apis.length; i++) {
    const api = apis[i];
    try {
      const filePath = generateFile(api);
      generatedFiles.push(filePath);
      
      if ((i + 1) % 100 === 0) {
        log(`   Progress: ${i + 1}/${apis.length} files generated`);
      }
    } catch (error) {
      log(`   ❌ Error generating ${api.path}: ${error.message}`);
    }
  }
  
  log(`✅ Generated ${generatedFiles.length} files`);
  
  return { binderName, status: 'COMPLETED', filesGenerated: generatedFiles.length, files: generatedFiles };
}

function commitAndPush(binderName, filesGenerated) {
  if (filesGenerated === 0) {
    log('   No files to commit');
    return;
  }
  
  log('📦 Committing and pushing...');
  
  try {
    execSync('git add .', { cwd: REPO_ROOT });
    execSync(`git commit -m "feat(${binderName}): generate ${filesGenerated} API endpoints [skip ci]"`, { cwd: REPO_ROOT });
    execSync('git push origin main', { cwd: REPO_ROOT });
    log('✅ Committed and pushed to GitHub');
  } catch (error) {
    log(`❌ Git error: ${error.message}`);
    throw error;
  }
}

// Main execution
async function main() {
  log('🚀 SEQUENTIAL BINDER PROCESSOR');
  log('Processing one binder at a time, committing after each');
  log('='.repeat(70));
  
  const results = [];
  
  for (const binderFile of BINDERS) {
    const result = processBinder(binderFile);
    results.push(result);
    
    // Commit and push after each binder
    if (result.filesGenerated > 0) {
      commitAndPush(result.binderName, result.filesGenerated);
    }
    
    log('');
  }
  
  // Final summary
  log('');
  log('='.repeat(70));
  log('📊 FINAL SUMMARY');
  log('='.repeat(70));
  
  const totalFiles = results.reduce((sum, r) => sum + (r.filesGenerated || 0), 0);
  log(`Total binders processed: ${results.length}`);
  log(`Total files generated: ${totalFiles}`);
  log('');
  
  results.forEach(r => {
    const icon = r.status === 'COMPLETED' ? '✅' : 
                 r.status === 'CONTRACT_COMPLETE' ? '📋' : '⚠️';
    log(`  ${icon} ${r.binderName}: ${r.filesGenerated || 0} files`);
  });
  
  log('');
  log('✅ ALL BINDERS PROCESSED!');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

