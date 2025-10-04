#!/usr/bin/env node
/**
 * Binder Pruning - Execute Safe Removals
 * Removes unreferenced API endpoints and UI files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const REPORTS_DIR = path.join(ROOT, 'ops/reports');

console.log('🗑️  BINDER PRUNING - EXECUTE SAFE REMOVALS\n');

// Load classification
const classificationPath = path.join(REPORTS_DIR, 'classification.json');
if (!fs.existsSync(classificationPath)) {
  console.error('❌ Error: classification.json not found');
  process.exit(1);
}

const classification = JSON.parse(fs.readFileSync(classificationPath, 'utf-8'));

console.log('📊 Classification Summary:');
console.log(`   Required APIs: ${classification.stats.required_apis}`);
console.log(`   Candidate APIs: ${classification.stats.candidate_apis}`);
console.log(`   Required UI: ${classification.stats.required_ui}`);
console.log(`   Candidate UI: ${classification.stats.candidate_ui}\n`);

console.log('🚀 Starting pruning process...\n');

// Phase 1: Remove candidate APIs
console.log('📦 Phase 1: Removing candidate API files...');
let removedApis = 0;
let failedApis = 0;

for (const api of classification.candidate_apis) {
  const filePath = path.join(ROOT, api.file);
  
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      removedApis++;
      
      if (removedApis % 5000 === 0) {
        console.log(`   Removed ${removedApis} APIs...`);
      }
    } catch (err) {
      failedApis++;
    }
  }
}

console.log(`   ✅ Removed ${removedApis} API files`);
if (failedApis > 0) {
  console.log(`   ⚠️  Failed: ${failedApis} files`);
}
console.log('');

// Phase 2: Remove candidate UI files
console.log('📦 Phase 2: Removing candidate UI files...');
let removedUi = 0;
let failedUi = 0;

for (const ui of classification.candidate_ui) {
  const filePath = path.join(ROOT, ui.file);
  
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      removedUi++;
      
      if (removedUi % 5000 === 0) {
        console.log(`   Removed ${removedUi} UI files...`);
      }
    } catch (err) {
      failedUi++;
    }
  }
}

console.log(`   ✅ Removed ${removedUi} UI files`);
if (failedUi > 0) {
  console.log(`   ⚠️  Failed: ${failedUi} files`);
}
console.log('');

// Phase 3: Clean empty directories
console.log('🧹 Phase 3: Cleaning empty directories...');
let cleanedDirs = 0;

function removeEmptyDirectories(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
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
}

removeEmptyDirectories(path.join(ROOT, 'src/pages/api'));
removeEmptyDirectories(path.join(ROOT, 'src/pages'));
removeEmptyDirectories(path.join(ROOT, 'src/components'));

console.log(`   ✅ Cleaned ${cleanedDirs} empty directories\n`);

// Phase 4: Generate post-prune inventory
console.log('📊 Phase 4: Generating post-prune inventory...');

function countFiles(dir, pattern) {
  if (!fs.existsSync(dir)) return 0;
  
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countFiles(fullPath, pattern);
    } else if (entry.name.endsWith(pattern)) {
      count++;
    }
  }
  
  return count;
}

const apiCount = countFiles(path.join(ROOT, 'src/pages/api'), '.ts');
const uiAppCount = countFiles(path.join(ROOT, 'src/app'), '.tsx');
const uiPagesCount = countFiles(path.join(ROOT, 'src/pages'), '.tsx');
const componentCount = countFiles(path.join(ROOT, 'src/components'), '.tsx');

const postInventory = {
  timestamp: new Date().toISOString(),
  counts: {
    api_files: apiCount,
    ui_files: uiAppCount + uiPagesCount,
    component_files: componentCount,
  },
  removed: {
    apis: removedApis,
    ui: removedUi,
    total: removedApis + removedUi,
  },
  failed: {
    apis: failedApis,
    ui: failedUi,
    total: failedApis + failedUi,
  },
};

fs.writeFileSync(
  path.join(REPORTS_DIR, 'post_prune_inventory.json'),
  JSON.stringify(postInventory, null, 2)
);

console.log('   ✅ Post-prune inventory saved\n');

// Summary
console.log('═══════════════════════════════════════════════════════════════');
console.log('                    ✅ PRUNING COMPLETE                         ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('Summary:');
console.log(`   APIs removed: ${removedApis}`);
console.log(`   UI files removed: ${removedUi}`);
console.log(`   Total removed: ${removedApis + removedUi}`);
console.log(`   Empty dirs cleaned: ${cleanedDirs}`);
console.log('');
console.log('Current counts:');
console.log(`   API files: ${apiCount}`);
console.log(`   UI files: ${uiAppCount + uiPagesCount}`);
console.log(`   Components: ${componentCount}`);
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

// Save summary for final report
const summary = {
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
};

fs.writeFileSync(
  path.join(REPORTS_DIR, 'prune_summary.json'),
  JSON.stringify(summary, null, 2)
);

console.log('Next steps:');
console.log('   1. Run typecheck: npm run typecheck');
console.log('   2. Run build: npm run build');
console.log('   3. Generate final report: node scripts/binder-minify-final.js\n');

