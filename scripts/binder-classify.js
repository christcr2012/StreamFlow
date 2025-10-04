#!/usr/bin/env node
/**
 * Binder Classification Script
 * Classifies endpoints/components as REQUIRED or CANDIDATE for removal
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const REPORTS_DIR = path.join(ROOT, 'ops/reports');

console.log('🔍 PHASE 3: Classifying Endpoints and Components...\n');

// Load usage graph
const usageGraphPath = path.join(REPORTS_DIR, 'usage_graph.json');
if (!fs.existsSync(usageGraphPath)) {
  console.error('❌ Error: usage_graph.json not found. Run binder-minify.js first.');
  process.exit(1);
}

const usageGraph = JSON.parse(fs.readFileSync(usageGraphPath, 'utf-8'));
const inventory = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'pre_minify_inventory.json'), 'utf-8'));

// Classification results
const classification = {
  timestamp: new Date().toISOString(),
  required_apis: [],
  required_ui: [],
  candidate_apis: [],
  candidate_ui: [],
  stats: {
    total_apis: inventory.counts.api_files,
    total_ui: inventory.counts.ui_files + inventory.counts.component_files,
    required_apis: 0,
    required_ui: 0,
    candidate_apis: 0,
    candidate_ui: 0,
  },
};

// Helper: Check if file is referenced
function isReferenced(filePath) {
  // Normalize path
  const normalized = filePath.replace(/\\/g, '/');
  
  // Check direct references
  if (usageGraph.references[normalized]) {
    return { referenced: true, by: usageGraph.references[normalized], reason: 'imported' };
  }
  
  // Check with various path formats
  const variants = [
    normalized,
    normalized.replace(/^src\//, '@/'),
    normalized.replace(/\.ts$/, ''),
    normalized.replace(/\.tsx$/, ''),
  ];
  
  for (const variant of variants) {
    if (usageGraph.references[variant]) {
      return { referenced: true, by: usageGraph.references[variant], reason: 'imported' };
    }
  }
  
  return { referenced: false, by: [], reason: 'no_imports' };
}

// Helper: Check if API route is fetched by UI
function isApiFetched(apiFile) {
  // Convert file path to route
  const routePath = apiFile
    .replace(/^src[\\/]pages[\\/]api[\\/]/, '/api/')
    .replace(/\.ts$/, '')
    .replace(/[\\/]index$/, '')
    .replace(/\\/g, '/');
  
  // Check if any UI file fetches this route
  for (const [uiFile, fetches] of Object.entries(usageGraph.uiFetches)) {
    for (const fetch of fetches) {
      if (fetch === routePath || fetch.startsWith(routePath + '?')) {
        return { fetched: true, by: [uiFile], route: routePath };
      }
    }
  }
  
  return { fetched: false, by: [], route: routePath };
}

// Helper: Check if file is in system registry or config
function isInSystemRegistry(filePath) {
  // Check if mentioned in config files
  for (const configFile of [
    path.join(ROOT, 'src/config/system-registry.ts'),
    path.join(ROOT, 'src/config/binder-map.json'),
  ]) {
    if (fs.existsSync(configFile)) {
      const content = fs.readFileSync(configFile, 'utf-8');
      const fileName = path.basename(filePath, path.extname(filePath));
      if (content.includes(fileName) || content.includes(filePath)) {
        return { inRegistry: true, file: configFile };
      }
    }
  }
  return { inRegistry: false };
}

// Helper: Check if file is tested
function isTested(filePath) {
  const testRoot = path.join(ROOT, 'tests');
  if (!fs.existsSync(testRoot)) {
    return { tested: false };
  }
  
  const fileName = path.basename(filePath, path.extname(filePath));
  const testFiles = [
    path.join(testRoot, `${fileName}.test.ts`),
    path.join(testRoot, `${fileName}.spec.ts`),
  ];
  
  for (const testFile of testFiles) {
    if (fs.existsSync(testFile)) {
      return { tested: true, testFile };
    }
  }
  
  return { tested: false };
}

console.log('   Classifying API endpoints...');

// Classify API files
let processedApis = 0;
for (const apiFile of inventory.files.apis) {
  const refCheck = isReferenced(apiFile);
  const fetchCheck = isApiFetched(apiFile);
  const registryCheck = isInSystemRegistry(apiFile);
  const testCheck = isTested(apiFile);
  
  const isRequired = 
    refCheck.referenced || 
    fetchCheck.fetched || 
    registryCheck.inRegistry || 
    testCheck.tested;
  
  const entry = {
    file: apiFile,
    route: fetchCheck.route,
    required: isRequired,
    reasons: [],
  };
  
  if (refCheck.referenced) {
    entry.reasons.push({ type: 'imported', by: refCheck.by.slice(0, 5) }); // Limit to 5 examples
  }
  if (fetchCheck.fetched) {
    entry.reasons.push({ type: 'fetched', by: fetchCheck.by });
  }
  if (registryCheck.inRegistry) {
    entry.reasons.push({ type: 'in_registry', file: registryCheck.file });
  }
  if (testCheck.tested) {
    entry.reasons.push({ type: 'tested', testFile: testCheck.testFile });
  }
  
  if (isRequired) {
    classification.required_apis.push(entry);
  } else {
    entry.reasons.push({ type: 'no_references', detail: 'Not imported, fetched, registered, or tested' });
    classification.candidate_apis.push(entry);
  }
  
  processedApis++;
  if (processedApis % 1000 === 0) {
    console.log(`   Processed ${processedApis}/${inventory.counts.api_files} APIs...`);
  }
}

console.log(`   ✅ Classified ${inventory.counts.api_files} API endpoints\n`);

console.log('   Classifying UI components...');

// Classify UI files
const allUiFiles = [...inventory.files.ui, ...inventory.files.components];
let processedUi = 0;

for (const uiFile of allUiFiles) {
  const refCheck = isReferenced(uiFile);
  const registryCheck = isInSystemRegistry(uiFile);
  const testCheck = isTested(uiFile);
  
  // UI files are required if referenced or in registry
  const isRequired = refCheck.referenced || registryCheck.inRegistry || testCheck.tested;
  
  const entry = {
    file: uiFile,
    required: isRequired,
    reasons: [],
  };
  
  if (refCheck.referenced) {
    entry.reasons.push({ type: 'imported', by: refCheck.by.slice(0, 5) });
  }
  if (registryCheck.inRegistry) {
    entry.reasons.push({ type: 'in_registry', file: registryCheck.file });
  }
  if (testCheck.tested) {
    entry.reasons.push({ type: 'tested', testFile: testCheck.testFile });
  }
  
  if (isRequired) {
    classification.required_ui.push(entry);
  } else {
    entry.reasons.push({ type: 'no_references', detail: 'Not imported, registered, or tested' });
    classification.candidate_ui.push(entry);
  }
  
  processedUi++;
  if (processedUi % 1000 === 0) {
    console.log(`   Processed ${processedUi}/${allUiFiles.length} UI files...`);
  }
}

console.log(`   ✅ Classified ${allUiFiles.length} UI files\n`);

// Update stats
classification.stats.required_apis = classification.required_apis.length;
classification.stats.required_ui = classification.required_ui.length;
classification.stats.candidate_apis = classification.candidate_apis.length;
classification.stats.candidate_ui = classification.candidate_ui.length;

// Save classification
fs.writeFileSync(
  path.join(REPORTS_DIR, 'classification.json'),
  JSON.stringify(classification, null, 2)
);

// Generate markdown report
const mdReport = `# Binder Classification Report

**Generated:** ${classification.timestamp}

## Summary

| Category | Count | Percentage |
|----------|-------|------------|
| **APIs** |
| Total APIs | ${classification.stats.total_apis} | 100% |
| Required APIs | ${classification.stats.required_apis} | ${((classification.stats.required_apis / classification.stats.total_apis) * 100).toFixed(2)}% |
| Candidate for Removal | ${classification.stats.candidate_apis} | ${((classification.stats.candidate_apis / classification.stats.total_apis) * 100).toFixed(2)}% |
| **UI** |
| Total UI Files | ${classification.stats.total_ui} | 100% |
| Required UI | ${classification.stats.required_ui} | ${((classification.stats.required_ui / classification.stats.total_ui) * 100).toFixed(2)}% |
| Candidate for Removal | ${classification.stats.candidate_ui} | ${((classification.stats.candidate_ui / classification.stats.total_ui) * 100).toFixed(2)}% |

## Required APIs (${classification.stats.required_apis})

Top 10 examples with reasons:

${classification.required_apis.slice(0, 10).map((api, i) => `
${i + 1}. **${api.route}**
   - File: \`${api.file}\`
   - Reasons: ${api.reasons.map(r => r.type).join(', ')}
`).join('\n')}

## Candidate APIs for Removal (${classification.stats.candidate_apis})

Top 10 examples:

${classification.candidate_apis.slice(0, 10).map((api, i) => `
${i + 1}. **${api.route}**
   - File: \`${api.file}\`
   - Reason: ${api.reasons[0]?.detail || 'No references found'}
`).join('\n')}

## Next Steps

1. Review classification results
2. Run dry-run pruning: \`node scripts/binder-prune-dryrun.js\`
3. Apply safe removals: \`node scripts/binder-prune-apply.js\`
`;

fs.writeFileSync(
  path.join(REPORTS_DIR, 'classification.md'),
  mdReport
);

console.log('✅ Classification complete!\n');
console.log('📊 Results:');
console.log(`   Required APIs: ${classification.stats.required_apis} (${((classification.stats.required_apis / classification.stats.total_apis) * 100).toFixed(1)}%)`);
console.log(`   Candidate APIs: ${classification.stats.candidate_apis} (${((classification.stats.candidate_apis / classification.stats.total_apis) * 100).toFixed(1)}%)`);
console.log(`   Required UI: ${classification.stats.required_ui} (${((classification.stats.required_ui / classification.stats.total_ui) * 100).toFixed(1)}%)`);
console.log(`   Candidate UI: ${classification.stats.candidate_ui} (${((classification.stats.candidate_ui / classification.stats.total_ui) * 100).toFixed(1)}%)\n`);
console.log('📄 Reports saved:');
console.log(`   - ops/reports/classification.json`);
console.log(`   - ops/reports/classification.md\n`);
console.log('▶️  Next: Run dry-run pruning with:');
console.log('   node scripts/binder-prune-dryrun.js\n');

