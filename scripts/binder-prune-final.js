#!/usr/bin/env node
/**
 * Binder Pruning - Final Correct Version
 * Keeps ONLY required files, removes everything else
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const REPORTS_DIR = path.join(ROOT, 'ops/reports');

console.log('🗑️  BINDER PRUNING - WHITELIST APPROACH\n');

// Load classification
const classificationPath = path.join(REPORTS_DIR, 'classification.json');
if (!fs.existsSync(classificationPath)) {
  console.error('❌ Error: classification.json not found');
  process.exit(1);
}

const classification = JSON.parse(fs.readFileSync(classificationPath, 'utf-8'));

console.log('📊 Strategy: Keep ONLY required files, remove all others\n');
console.log('Required files to KEEP:');
console.log(`   APIs: ${classification.stats.required_apis}`);
console.log(`   UI: ${classification.stats.required_ui}\n`);

// Build whitelist of files to KEEP
const keepFiles = new Set();

// Add required APIs
for (const api of classification.required_apis) {
  const normalized = api.file.replace(/\\/g, '/');
  keepFiles.add(normalized);
}

// Add required UI
for (const ui of classification.required_ui) {
  const normalized = ui.file.replace(/\\/g, '/');
  keepFiles.add(normalized);
}

// Add essential infrastructure files (always keep)
const essentialFiles = [
  'src/pages/api/health.ts',
  'src/pages/_app.tsx',
  'src/pages/_document.tsx',
  'src/pages/index.tsx',
  'src/app/layout.tsx',
  'src/app/page.tsx',
];

for (const file of essentialFiles) {
  keepFiles.add(file);
}

console.log(`Total files in whitelist: ${keepFiles.size}\n`);

// Function to get all files in directory
function getAllFiles(dir, pattern, basePath = dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) return files;
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllFiles(fullPath, pattern, basePath));
      } else if (entry.name.endsWith(pattern)) {
        const relativePath = path.relative(basePath, fullPath).replace(/\\/g, '/');
        files.push({ fullPath, relativePath });
      }
    }
  } catch (err) {
    // Ignore errors
  }
  
  return files;
}

// Phase 1: Remove non-whitelisted APIs
console.log('📦 Phase 1: Removing non-whitelisted API files...');
const apiDir = path.join(ROOT, 'src/pages/api');
const allApiFiles = getAllFiles(apiDir, '.ts', ROOT);

let removedApis = 0;
let keptApis = 0;

for (const { fullPath, relativePath } of allApiFiles) {
  if (keepFiles.has(relativePath)) {
    keptApis++;
  } else {
    try {
      fs.unlinkSync(fullPath);
      removedApis++;
      
      if (removedApis % 5000 === 0) {
        console.log(`   Removed ${removedApis} APIs...`);
      }
    } catch (err) {
      console.error(`   ⚠️  Failed to remove: ${relativePath}`);
    }
  }
}

console.log(`   ✅ Kept ${keptApis} required API files`);
console.log(`   ✅ Removed ${removedApis} unreferenced API files\n`);

// Phase 2: Remove non-whitelisted UI files
console.log('📦 Phase 2: Removing non-whitelisted UI files...');
const uiDirs = [
  path.join(ROOT, 'src/app'),
  path.join(ROOT, 'src/pages'),
  path.join(ROOT, 'src/components'),
];

let removedUi = 0;
let keptUi = 0;

for (const uiDir of uiDirs) {
  const allUiFiles = getAllFiles(uiDir, '.tsx', ROOT);
  
  for (const { fullPath, relativePath } of allUiFiles) {
    if (keepFiles.has(relativePath)) {
      keptUi++;
    } else {
      try {
        fs.unlinkSync(fullPath);
        removedUi++;
        
        if (removedUi % 5000 === 0) {
          console.log(`   Removed ${removedUi} UI files...`);
        }
      } catch (err) {
        console.error(`   ⚠️  Failed to remove: ${relativePath}`);
      }
    }
  }
}

console.log(`   ✅ Kept ${keptUi} required UI files`);
console.log(`   ✅ Removed ${removedUi} unreferenced UI files\n`);

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
        
        try {
          const contents = fs.readdirSync(fullPath);
          if (contents.length === 0) {
            fs.rmdirSync(fullPath);
            cleanedDirs++;
          }
        } catch (err) {
          // Ignore
        }
      }
    }
  } catch (err) {
    // Ignore
  }
}

for (const dir of [...uiDirs, apiDir]) {
  removeEmptyDirectories(dir);
}

console.log(`   ✅ Cleaned ${cleanedDirs} empty directories\n`);

// Phase 4: Final count
console.log('📊 Phase 4: Final file count...');

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
    // Ignore
  }
  
  return count;
}

const finalApiCount = countFiles(apiDir, '.ts');
const finalUiCount = countFiles(path.join(ROOT, 'src/app'), '.tsx') +
                     countFiles(path.join(ROOT, 'src/pages'), '.tsx') +
                     countFiles(path.join(ROOT, 'src/components'), '.tsx');

console.log(`   API files: ${finalApiCount}`);
console.log(`   UI files: ${finalUiCount}\n`);

// Generate summary
const summary = {
  timestamp: new Date().toISOString(),
  before: {
    api_files: classification.stats.total_apis,
    ui_files: classification.stats.total_ui,
  },
  after: {
    api_files: finalApiCount,
    ui_files: finalUiCount,
  },
  removed: {
    apis: removedApis,
    ui: removedUi,
    total: removedApis + removedUi,
  },
  kept: {
    apis: keptApis,
    ui: keptUi,
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

// Final output
console.log('═══════════════════════════════════════════════════════════════');
console.log('                    ✅ PRUNING COMPLETE                         ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log(`APIs: ${classification.stats.total_apis} → ${finalApiCount} (removed ${removedApis}, ${summary.reduction_percent.apis}%)`);
console.log(`UI: ${classification.stats.total_ui} → ${finalUiCount} (removed ${removedUi}, ${summary.reduction_percent.ui}%)`);
console.log(`Total removed: ${removedApis + removedUi} files`);
console.log(`Empty dirs cleaned: ${cleanedDirs}`);
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('✅ Next: npm run typecheck && npm run build\n');

