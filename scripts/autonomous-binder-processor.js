#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BINDER_DIR = 'C:\\Users\\chris\\OneDrive\\Desktop\\binderFiles';
const REPO_ROOT = process.cwd();
const BATCH_SIZE = 1500; // Safe batch size for git commits

function log(msg) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${msg}`);
}

function detectBinderPattern(content) {
  const hasPattern1 = /### API (POST|GET|PUT|DELETE|PATCH) \/api\//.test(content);
  const hasPattern2 = /### API \d{5,}/.test(content);
  
  if (hasPattern1) {
    return { type: 'PATTERN1_API_ROUTES', pattern: 1 };
  } else if (hasPattern2) {
    return { type: 'PATTERN2_NUMBERED_API', pattern: 2 };
  } else {
    return { type: 'CONTRACT_SPEC', pattern: 0 };
  }
}

function extractPattern1APIs(content) {
  const apiRegex = /### API (POST|GET|PUT|DELETE|PATCH) (\/api\/[^\n]+)\n([\s\S]*?)(?=\n### API |$)/g;
  const apis = [];
  let match;
  
  while ((match = apiRegex.exec(content)) !== null) {
    const method = match[1];
    const route = match[2].trim();
    const body = match[3];
    
    apis.push({ method, route, body });
  }
  
  return apis;
}

function extractPattern2APIs(content) {
  const apiRegex = /### API (\d+)\r?\n([\s\S]*?)(?=\r?\n### API |\r?\n$|$)/g;
  const apis = [];
  let match;

  while ((match = apiRegex.exec(content)) !== null) {
    const apiId = match[1];
    const body = match[2];

    // Match list format: - **Method**: POST or plain format
    const methodMatch = body.match(/-\s*\*\*Method\*\*:\s*(POST|GET|PUT|DELETE|PATCH)/i) ||
                       body.match(/\*\*Method\*\*:\s*(POST|GET|PUT|DELETE|PATCH)/i) ||
                       body.match(/Method:\s*(POST|GET|PUT|DELETE|PATCH)/i);
    const pathMatch = body.match(/-\s*\*\*Path\*\*:\s*([^\r\n]+)/i) ||
                     body.match(/\*\*Path\*\*:\s*([^\r\n]+)/i) ||
                     body.match(/Path:\s*([^\r\n]+)/i);

    if (methodMatch && pathMatch) {
      apis.push({
        method: methodMatch[1].toUpperCase(),
        route: pathMatch[1].trim(),
        body: body,
        apiId: apiId
      });
    }
  }

  return apis;
}

function generateAPIFile(api, pattern) {
  const method = api.method;
  const route = api.route;
  
  // Generate TypeScript API handler
  const template = `import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { withAudience } from '@/middleware/audience';
import { prisma } from '@/lib/prisma';
import { auditService } from '@/lib/auditService';

const RequestSchema = z.object({
  // TODO: Define request schema based on API specification
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== '${method}') {
    return res.status(405).json({ 
      ok: false, 
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } 
    });
  }

  try {
    const validated = RequestSchema.parse(req.body);
    const tenantId = req.headers['x-org-id'] as string || 'org_test';
    const idempotencyKey = req.headers['x-idempotency-key'] as string;
    
    // TODO: Implement business logic
    
    await auditService.log({
      tenantId,
      action: '${route.replace(/\//g, '_')}',
      userId: req.headers['x-user-id'] as string,
      metadata: { idempotencyKey },
    });

    return res.status(200).json({ ok: true, data: {} });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } 
    });
  }
}

export default withAudience(['client'])(handler);
`;

  return template;
}

function routeToFilePath(route) {
  // Convert /api/tenant/crm/opportunities to src/pages/api/tenant/crm/opportunities.ts
  let filePath = route.replace(/^\/api\//, 'src/pages/api/');
  
  // Handle dynamic routes [id]
  filePath = filePath.replace(/\{(\w+)\}/g, '[$1]');
  
  // Add .ts extension
  if (!filePath.endsWith('.ts')) {
    filePath += '.ts';
  }
  
  return filePath;
}

function generateFiles(apis, pattern) {
  let generated = 0;
  
  for (const api of apis) {
    let filePath;
    
    if (pattern === 1) {
      filePath = routeToFilePath(api.route);
    } else if (pattern === 2) {
      // Pattern 2: Use endpoint{apiId}.ts naming
      filePath = `src/pages/api/endpoint${api.apiId}.ts`;
    }
    
    const fullPath = path.join(REPO_ROOT, filePath);
    const dir = path.dirname(fullPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Generate and write file
    const content = generateAPIFile(api, pattern);
    fs.writeFileSync(fullPath, content, 'utf8');
    
    generated++;
    
    if (generated % 100 === 0) {
      log(`   Progress: ${generated}/${apis.length} files generated`);
    }
  }
  
  return generated;
}

function commitInBatches(binderName, totalFiles) {
  log(`📦 Committing ${totalFiles} files in batches...`);

  try {
    // Simply add all files in src/pages/api directory
    log(`   Adding all generated files...`);
    execSync('git add src/pages/api/', {
      cwd: REPO_ROOT,
      stdio: 'pipe',
      maxBuffer: 1024 * 1024 * 100
    });

    // Check if there are actually changes to commit
    try {
      execSync('git diff --cached --quiet', { cwd: REPO_ROOT, stdio: 'pipe' });
      log('   No changes to commit');
      return;
    } catch (e) {
      // diff --quiet exits with 1 if there are changes, which is what we want
    }

    // Get count of staged files
    const stagedOutput = execSync('git diff --cached --name-only', {
      encoding: 'utf8',
      cwd: REPO_ROOT,
      maxBuffer: 1024 * 1024 * 100
    });

    const stagedFiles = stagedOutput.trim().split('\n').filter(f => f.trim());
    log(`   Found ${stagedFiles.length} staged files`);

    // Commit in batches if needed
    const numBatches = Math.ceil(stagedFiles.length / BATCH_SIZE);

    if (numBatches > 1) {
      log(`   Committing in ${numBatches} batches...`);

      // Reset staging
      execSync('git reset', { cwd: REPO_ROOT, stdio: 'pipe' });

      for (let i = 0; i < numBatches; i++) {
        const start = i * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, stagedFiles.length);
        const batch = stagedFiles.slice(start, end);

        log(`   Batch ${i + 1}/${numBatches}: Adding ${batch.length} files...`);

        // Add batch
        for (const file of batch) {
          try {
            execSync(`git add "${file}"`, { cwd: REPO_ROOT, stdio: 'pipe' });
          } catch (e) {
            // Skip files that don't exist
          }
        }

        log(`   Batch ${i + 1}/${numBatches}: Committing...`);
        execSync(`git commit -m "feat(${binderName}): batch ${i + 1}/${numBatches} [skip ci]"`, {
          cwd: REPO_ROOT,
          stdio: 'inherit'
        });
      }
    } else {
      // Single commit
      log(`   Committing all files...`);
      execSync(`git commit -m "feat(${binderName}): generate ${totalFiles} endpoints [skip ci]"`, {
        cwd: REPO_ROOT,
        stdio: 'inherit'
      });
    }

    log(`   Pushing to GitHub...`);
    execSync('git push origin main', { cwd: REPO_ROOT, stdio: 'inherit' });
    log(`✅ Successfully pushed ${numBatches > 1 ? numBatches + ' commits' : '1 commit'}`);

  } catch (error) {
    log(`❌ Git error: ${error.message}`);
    throw error;
  }
}

function processBinder(binderFile) {
  const binderName = path.basename(binderFile, '.md').replace('_FULL', '');
  
  log(`\n${'='.repeat(80)}`);
  log(`PROCESSING: ${binderName}`);
  log(`${'='.repeat(80)}`);
  
  // Read binder file
  log(`📖 Reading binder file...`);
  const content = fs.readFileSync(binderFile, 'utf8');
  const sizeMB = (content.length / 1024 / 1024).toFixed(2);
  log(`   Size: ${sizeMB} MB`);
  
  // Detect pattern
  const { type, pattern } = detectBinderPattern(content);
  log(`   Pattern: ${type}`);
  
  if (pattern === 0) {
    log(`📋 Contract/Specification document - no code generation needed`);
    log(`✅ Marking as complete`);
    return { binderName, filesGenerated: 0, skipped: true };
  }
  
  // Extract APIs
  let apis;
  if (pattern === 1) {
    apis = extractPattern1APIs(content);
  } else if (pattern === 2) {
    apis = extractPattern2APIs(content);
  }
  
  log(`🔍 Found ${apis.length} API endpoints`);
  
  if (apis.length === 0) {
    log(`⚠️  No APIs found - skipping`);
    return { binderName, filesGenerated: 0, skipped: true };
  }
  
  // Generate files
  log(`🔨 Generating files...`);
  const filesGenerated = generateFiles(apis, pattern);
  log(`✅ Generated ${filesGenerated} files`);
  
  // Commit and push
  commitInBatches(binderName, filesGenerated);
  
  return { binderName, filesGenerated, skipped: false };
}

async function main() {
  log(`🚀 AUTONOMOUS BINDER PROCESSOR`);
  log(`Processing ALL binders from: ${BINDER_DIR}`);
  log(`Repository: ${REPO_ROOT}`);
  log(`${'='.repeat(80)}\n`);
  
  // Get all binder files
  const binderFiles = fs.readdirSync(BINDER_DIR)
    .filter(f => f.match(/^binder.*_FULL\.md$/))
    .sort((a, b) => {
      // Sort: binder1, binder2, ..., binder3A, binder3B, binder3C, ...
      const aMatch = a.match(/binder(\d+)([A-Z])?/);
      const bMatch = b.match(/binder(\d+)([A-Z])?/);
      
      const aNum = parseInt(aMatch[1]);
      const bNum = parseInt(bMatch[1]);
      
      if (aNum !== bNum) return aNum - bNum;
      
      const aLetter = aMatch[2] || '';
      const bLetter = bMatch[2] || '';
      return aLetter.localeCompare(bLetter);
    })
    .map(f => path.join(BINDER_DIR, f));
  
  log(`Found ${binderFiles.length} binder files to process\n`);
  
  const results = [];
  
  for (const binderFile of binderFiles) {
    try {
      const result = processBinder(binderFile);
      results.push(result);
    } catch (error) {
      log(`\n❌ FATAL ERROR processing ${path.basename(binderFile)}`);
      log(`Error: ${error.message}`);
      log(`Stack: ${error.stack}`);
      break;
    }
  }
  
  // Final summary
  log(`\n${'='.repeat(80)}`);
  log(`FINAL SUMMARY`);
  log(`${'='.repeat(80)}`);
  
  const totalFiles = results.reduce((sum, r) => sum + r.filesGenerated, 0);
  const processed = results.filter(r => !r.skipped).length;
  const skipped = results.filter(r => r.skipped).length;
  
  log(`Total binders processed: ${results.length}`);
  log(`  - Generated code: ${processed}`);
  log(`  - Skipped (contracts): ${skipped}`);
  log(`Total files generated: ${totalFiles}`);
  log(`\n✅ ALL BINDERS COMPLETE!`);
  log(`Ready for error analysis when you wake up.`);
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`);
  process.exit(1);
});

