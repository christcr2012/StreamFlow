#!/usr/bin/env node
/**
 * Binder Minimization Script
 * Discovers referenced endpoints/components and prunes unreferenced code
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Configuration
const CONFIG = {
  apiRoot: path.join(ROOT, 'src/pages/api'),
  uiRoots: [
    path.join(ROOT, 'src/app'),
    path.join(ROOT, 'src/pages'),
    path.join(ROOT, 'src/components'),
  ],
  serverRoots: [
    path.join(ROOT, 'src/lib'),
    path.join(ROOT, 'src/middleware'),
    path.join(ROOT, 'src/services'),
    path.join(ROOT, 'src/repositories'),
  ],
  configFiles: [
    path.join(ROOT, 'src/config/system-registry.ts'),
    path.join(ROOT, 'src/config/binder-map.json'),
  ],
  testRoot: path.join(ROOT, 'tests'),
  reportsDir: path.join(ROOT, 'ops/reports'),
};

// Ensure reports directory exists
if (!fs.existsSync(CONFIG.reportsDir)) {
  fs.mkdirSync(CONFIG.reportsDir, { recursive: true });
}

console.log('🔍 PHASE 1: Creating Pre-Minify Snapshot...\n');

// Step 1: Create inventory
const inventory = {
  timestamp: new Date().toISOString(),
  counts: {
    api_files: 0,
    ui_files: 0,
    component_files: 0,
    server_files: 0,
    test_files: 0,
  },
  files: {
    apis: [],
    ui: [],
    components: [],
    server: [],
    tests: [],
  },
};

// Count API files
const apiFiles = glob.sync('**/*.ts', { cwd: CONFIG.apiRoot, absolute: true });
inventory.counts.api_files = apiFiles.length;
inventory.files.apis = apiFiles.map(f => path.relative(ROOT, f));

// Count UI files
for (const uiRoot of CONFIG.uiRoots) {
  if (fs.existsSync(uiRoot)) {
    const uiFiles = glob.sync('**/*.{tsx,ts}', { cwd: uiRoot, absolute: true });
    if (uiRoot.includes('components')) {
      inventory.counts.component_files += uiFiles.length;
      inventory.files.components.push(...uiFiles.map(f => path.relative(ROOT, f)));
    } else {
      inventory.counts.ui_files += uiFiles.length;
      inventory.files.ui.push(...uiFiles.map(f => path.relative(ROOT, f)));
    }
  }
}

// Count server files
for (const serverRoot of CONFIG.serverRoots) {
  if (fs.existsSync(serverRoot)) {
    const serverFiles = glob.sync('**/*.ts', { cwd: serverRoot, absolute: true });
    inventory.counts.server_files += serverFiles.length;
    inventory.files.server.push(...serverFiles.map(f => path.relative(ROOT, f)));
  }
}

// Count test files
if (fs.existsSync(CONFIG.testRoot)) {
  const testFiles = glob.sync('**/*.{ts,tsx}', { cwd: CONFIG.testRoot, absolute: true });
  inventory.counts.test_files = testFiles.length;
  inventory.files.tests = testFiles.map(f => path.relative(ROOT, f));
}

fs.writeFileSync(
  path.join(CONFIG.reportsDir, 'pre_minify_inventory.json'),
  JSON.stringify(inventory, null, 2)
);

console.log('✅ Pre-minify inventory saved');
console.log(`   API files: ${inventory.counts.api_files}`);
console.log(`   UI files: ${inventory.counts.ui_files}`);
console.log(`   Component files: ${inventory.counts.component_files}`);
console.log(`   Server files: ${inventory.counts.server_files}`);
console.log(`   Test files: ${inventory.counts.test_files}\n`);

console.log('🔍 PHASE 2: Discovering Truth Sources...\n');

// Step 2: Build usage graph
const usageGraph = {
  timestamp: new Date().toISOString(),
  imports: {},      // file -> [imported files]
  apiRoutes: {},    // route path -> file
  uiFetches: {},    // ui file -> [api routes fetched]
  references: {},   // file -> [files that reference it]
};

// Helper: Extract imports from file
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports = [];
    
    // Match import statements
    const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // Match dynamic imports
    const dynamicRegex = /import\s*\(['"]([^'"]+)['"]\)/g;
    while ((match = dynamicRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  } catch (err) {
    return [];
  }
}

// Helper: Extract fetch/API calls from UI files
function extractApiFetches(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fetches = [];
    
    // Match fetch('/api/...') or fetch("/api/...")
    const fetchRegex = /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = fetchRegex.exec(content)) !== null) {
      if (match[1].startsWith('/api/')) {
        fetches.push(match[1]);
      }
    }
    
    // Match axios.get('/api/...'), etc.
    const axiosRegex = /axios\.\w+\s*\(\s*['"`]([^'"`]+)['"`]/g;
    while ((match = axiosRegex.exec(content)) !== null) {
      if (match[1].startsWith('/api/')) {
        fetches.push(match[1]);
      }
    }
    
    return fetches;
  } catch (err) {
    return [];
  }
}

// Build import graph for all files
console.log('   Analyzing imports...');
const allFiles = [
  ...inventory.files.apis,
  ...inventory.files.ui,
  ...inventory.files.components,
  ...inventory.files.server,
].map(f => path.join(ROOT, f));

let processedCount = 0;
for (const file of allFiles) {
  const imports = extractImports(file);
  const relPath = path.relative(ROOT, file);
  usageGraph.imports[relPath] = imports;
  
  processedCount++;
  if (processedCount % 1000 === 0) {
    console.log(`   Processed ${processedCount}/${allFiles.length} files...`);
  }
}

console.log(`   ✅ Analyzed ${allFiles.length} files for imports\n`);

// Build API route map
console.log('   Mapping API routes...');
for (const apiFile of inventory.files.apis) {
  const routePath = apiFile
    .replace(/^src[\\/]pages[\\/]api[\\/]/, '/api/')
    .replace(/\.ts$/, '')
    .replace(/[\\/]index$/, '')
    .replace(/\\/g, '/');
  
  usageGraph.apiRoutes[routePath] = apiFile;
}
console.log(`   ✅ Mapped ${Object.keys(usageGraph.apiRoutes).length} API routes\n`);

// Build UI fetch map
console.log('   Analyzing UI fetches...');
const uiFiles = [...inventory.files.ui, ...inventory.files.components].map(f => path.join(ROOT, f));
for (const uiFile of uiFiles) {
  const fetches = extractApiFetches(uiFile);
  if (fetches.length > 0) {
    const relPath = path.relative(ROOT, uiFile);
    usageGraph.uiFetches[relPath] = fetches;
  }
}
console.log(`   ✅ Found ${Object.keys(usageGraph.uiFetches).length} UI files with API fetches\n`);

// Build reverse reference map
console.log('   Building reference map...');
for (const [file, imports] of Object.entries(usageGraph.imports)) {
  for (const imp of imports) {
    // Resolve relative imports
    let resolvedPath = imp;
    if (imp.startsWith('.') || imp.startsWith('@/')) {
      // Simplified resolution - would need full module resolution in production
      resolvedPath = imp.replace('@/', 'src/');
    }
    
    if (!usageGraph.references[resolvedPath]) {
      usageGraph.references[resolvedPath] = [];
    }
    usageGraph.references[resolvedPath].push(file);
  }
}
console.log(`   ✅ Built reference map\n`);

fs.writeFileSync(
  path.join(CONFIG.reportsDir, 'usage_graph.json'),
  JSON.stringify(usageGraph, null, 2)
);

console.log('✅ Usage graph saved to ops/reports/usage_graph.json\n');

console.log('📊 Summary:');
console.log(`   Total imports tracked: ${Object.keys(usageGraph.imports).length}`);
console.log(`   API routes mapped: ${Object.keys(usageGraph.apiRoutes).length}`);
console.log(`   UI files with fetches: ${Object.keys(usageGraph.uiFetches).length}`);
console.log(`   Files with references: ${Object.keys(usageGraph.references).length}\n`);

console.log('✅ Phase 2 complete. Run classification next with:');
console.log('   node scripts/binder-classify.js\n');

