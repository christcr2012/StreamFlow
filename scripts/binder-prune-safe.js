#!/usr/bin/env node
/**
 * Binder Pruning - Safe Execution
 * Only removes files explicitly marked as candidates
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const REPORTS_DIR = path.join(ROOT, 'ops/reports');

console.log('🗑️  BINDER PRUNING - SAFE EXECUTION\n');

// Load classification
const classificationPath = path.join(REPORTS_DIR, 'classification.json');
if (!fs.existsSync(classificationPath)) {
  console.error('❌ Error: classification.json not found. Run binder-classify.js first.');
  process.exit(1);
}

const classification = JSON.parse(fs.readFileSync(classificationPath, 'utf-8'));

console.log('📊 Pre-Pruning Status:');
console.log(`   Total APIs: ${classification.stats.total_apis}`);
console.log(`   Required APIs: ${classification.stats.required_apis} (will keep)`);
console.log(`   Candidate APIs: ${classification.stats.candidate_apis} (will remove)`);
console.log(`   Total UI: ${classification.stats.total_ui}`);
console.log(`   Required UI: ${classification.stats.required_ui} (will keep)`);
console.log(`   Candidate UI: ${classification.stats.candidate_ui} (will remove)\n`);

// Verify files exist before starting
console.log('🔍 Verifying file system state...');
let existingCandidateApis = 0;
let existingCandidateUi = 0;

for (const api of classification.candidate_apis) {
  const filePath = path.join(ROOT, api.file);
  if (fs.existsSync(filePath)) {
    existingCandidateApis++;
  }
}

for (const ui of classification.candidate_ui) {
  const filePath = path.join(ROOT, ui.file);
  if (fs.existsSync(filePath)) {
    existingCandidateUi++;
  }
}

console.log(`   Candidate APIs found on disk: ${existingCandidateApis}`);
console.log(`   Candidate UI found on disk: ${existingCandidateUi}\n`);

if (existingCandidateApis === 0 && existingCandidateUi === 0) {
  console.log('✅ No files to remove (already pruned or classification issue)');
  process.exit(0);
}

console.log('🚀 Starting safe pruning...\n');

// Phase 1: Remove candidate APIs
console.log('📦 Phase 1: Removing candidate API files...');
let removedApis = 0;
let skippedApis = 0;

for (const api of classification.candidate_apis) {
  const filePath = path.join(ROOT, api.file);
  
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      removedApis++;
      
      if (removedApis % 5000 === 0) {
        console.log(`   Removed ${removedApis}/${existingCandidateApis} APIs...`);
      }
    } catch (err) {
      console.error(`   ⚠️  Failed to remove: ${api.file}`);
      skippedApis++;
    }
  } else {
    skippedApis++;
  }
}

console.log(`   ✅ Removed ${removedApis} API files`);
if (skippedApis > 0) {
  console.log(`   ⏭️  Skipped ${skippedApis} files (already removed or inaccessible)`);
}
console.log('');

// Phase 2: Remove candidate UI files
console.log('📦 Phase 2: Removing candidate UI files...');
let removedUi = 0;
let skippedUi = 0;

for (const ui of classification.candidate_ui) {
  const filePath = path.join(ROOT, ui.file);
  
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      removedUi++;
      
      if (removedUi % 5000 === 0) {
        console.log(`   Removed ${removedUi}/${existingCandidateUi} UI files...`);
      }
    } catch (err) {
      console.error(`   ⚠️  Failed to remove: ${ui.file}`);
      skippedUi++;
    }
  } else {
    skippedUi++;
  }
}

console.log(`   ✅ Removed ${removedUi} UI files`);
if (skippedUi > 0) {
  console.log(`   ⏭️  Skipped ${skippedUi} files (already removed or inaccessible)`);
}
console.log('');

// Phase 3: Clean empty directories
console.log('🧹 Phase 3: Cleaning empty directories...');
let cleanedDirs = 0;

function removeEmptyDirectories(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        removeEmptyDirectories(fullPath);
        
        // Check if directory is now empty
        try {
          const contents = fs.readdirSync(fullPath);
          if (contents.length === 0) {
            fs.rmdirSync(fullPath);
            cleanedDirs++;
          }
        } catch (err) {
          // Directory might have been removed already
        }
      }
    }
  } catch (err) {
    // Directory might not exist
  }
}

removeEmptyDirectories(path.join(ROOT, 'src/pages/api'));
removeEmptyDirectories(path.join(ROOT, 'src/pages'));
removeEmptyDirectories(path.join(ROOT, 'src/app'));
removeEmptyDirectories(path.join(ROOT, 'src/components'));

console.log(`   ✅ Cleaned ${cleanedDirs} empty directories\n`);

// Phase 4: Count remaining files
console.log('📊 Phase 4: Counting remaining files...');

function countFiles(dir, pattern) {
  if (!fs.existsSync(dir)) return 0;
  
  let count = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        count += countFiles(fullPath, pattern);
      } else if (entry.name.endsWith(pattern)) {
        count++;
      }
    }
  } catch (err) {
    // Directory might not exist
  }
  
  return count;
}

const apiCount = countFiles(path.join(ROOT, 'src/pages/api'), '.ts');
const uiAppCount = countFiles(path.join(ROOT, 'src/app'), '.tsx');
const uiPagesCount = countFiles(path.join(ROOT, 'src/pages'), '.tsx');
const componentCount = countFiles(path.join(ROOT, 'src/components'), '.tsx');

console.log(`   API files remaining: ${apiCount}`);
console.log(`   UI app files remaining: ${uiAppCount}`);
console.log(`   UI pages remaining: ${uiPagesCount}`);
console.log(`   Components remaining: ${componentCount}\n`);

// Generate summary
const summary = {
  timestamp: new Date().toISOString(),
  before: {
    api_files: classification.stats.total_apis,
    ui_files: classification.stats.total_ui,
  },
  after: {
    api_files: apiCount,
    ui_files: uiAppCount + uiPagesCount + componentCount,
  },
  removed: {
    apis: removedApis,
    ui: removedUi,
    total: removedApis + removedUi,
  },
  kept: {
    apis: apiCount,
    ui: uiAppCount + uiPagesCount + componentCount,
  },
  reduction_percent: {
    apis: ((removedApis / classification.stats.total_apis) * 100).toFixed(2),
    ui: ((removedUi / classification.stats.total_ui) * 100).toFixed(2),
  },
  empty_dirs_cleaned: cleanedDirs,
};

fs.writeFileSync(
  path.join(REPORTS_DIR, 'prune_summary.json'),
  JSON.stringify(summary, null, 2)
);

// Final summary
console.log('═══════════════════════════════════════════════════════════════');
console.log('                    ✅ PRUNING COMPLETE                         ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('Summary:');
console.log(`   APIs removed: ${removedApis} (${summary.reduction_percent.apis}%)`);
console.log(`   UI files removed: ${removedUi} (${summary.reduction_percent.ui}%)`);
console.log(`   Total removed: ${removedApis + removedUi}`);
console.log(`   Empty dirs cleaned: ${cleanedDirs}`);
console.log('');
console.log('Remaining:');
console.log(`   API files: ${apiCount} (expected: ${classification.stats.required_apis})`);
console.log(`   UI files: ${uiAppCount + uiPagesCount + componentCount} (expected: ${classification.stats.required_ui})`);
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('✅ Pruning complete! Next steps:');
console.log('   1. Verify: git status');
console.log('   2. Typecheck: npm run typecheck');
console.log('   3. Build: npm run build');
console.log('   4. Final report: node scripts/binder-minify-final.js\n');

