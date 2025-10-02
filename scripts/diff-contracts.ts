/**
 * Contract Diff Tool
 * Stability Gate #2: Compare contract snapshots between binders
 * 
 * Usage: npx ts-node scripts/diff-contracts.ts <old-binder> <new-binder>
 * Example: npx ts-node scripts/diff-contracts.ts 3 4
 */

import * as fs from 'fs';
import * as path from 'path';

interface APIEndpoint {
  path: string;
  methods: string[];
  middleware: string[];
  requestSchema?: string;
  responseSchema?: string;
  file: string;
}

interface ContractSnapshot {
  version: string;
  binder: number;
  timestamp: string;
  apis: Record<string, APIEndpoint>;
  types: Record<string, string>;
  components: Record<string, string>;
}

interface ContractDiff {
  breaking: string[];
  additive: string[];
  unchanged: string[];
  removed: string[];
}

function loadSnapshot(binderNumber: number): ContractSnapshot | null {
  const snapshotPath = path.join(process.cwd(), 'ops', 'contracts', `binder${binderNumber}-snapshot.json`);
  
  if (!fs.existsSync(snapshotPath)) {
    console.error(`❌ Snapshot not found: ${snapshotPath}`);
    return null;
  }
  
  return JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
}

function diffAPIs(oldAPIs: Record<string, APIEndpoint>, newAPIs: Record<string, APIEndpoint>): ContractDiff {
  const diff: ContractDiff = {
    breaking: [],
    additive: [],
    unchanged: [],
    removed: [],
  };
  
  // Check for removed or modified APIs
  for (const [path, oldAPI] of Object.entries(oldAPIs)) {
    const newAPI = newAPIs[path];
    
    if (!newAPI) {
      diff.removed.push(`API removed: ${path}`);
      diff.breaking.push(`BREAKING: API removed: ${path}`);
      continue;
    }
    
    // Check for removed methods
    for (const method of oldAPI.methods) {
      if (!newAPI.methods.includes(method)) {
        diff.breaking.push(`BREAKING: Method removed: ${method} ${path}`);
      }
    }
    
    // Check for removed middleware (potential security regression)
    for (const mw of oldAPI.middleware) {
      if (!newAPI.middleware.includes(mw)) {
        diff.breaking.push(`BREAKING: Middleware removed: ${mw} from ${path}`);
      }
    }
    
    // Check for schema changes
    if (oldAPI.requestSchema !== newAPI.requestSchema) {
      diff.breaking.push(`BREAKING: Request schema changed: ${path}`);
    }
    
    // Check for added methods (additive)
    for (const method of newAPI.methods) {
      if (!oldAPI.methods.includes(method)) {
        diff.additive.push(`Method added: ${method} ${path}`);
      }
    }
    
    // Check for added middleware (additive)
    for (const mw of newAPI.middleware) {
      if (!oldAPI.middleware.includes(mw)) {
        diff.additive.push(`Middleware added: ${mw} to ${path}`);
      }
    }
    
    // If no changes, mark as unchanged
    if (
      JSON.stringify(oldAPI.methods.sort()) === JSON.stringify(newAPI.methods.sort()) &&
      JSON.stringify(oldAPI.middleware.sort()) === JSON.stringify(newAPI.middleware.sort()) &&
      oldAPI.requestSchema === newAPI.requestSchema
    ) {
      diff.unchanged.push(`Unchanged: ${path}`);
    }
  }
  
  // Check for new APIs (additive)
  for (const [path, newAPI] of Object.entries(newAPIs)) {
    if (!oldAPIs[path]) {
      diff.additive.push(`API added: ${path} (${newAPI.methods.join(', ')})`);
    }
  }
  
  return diff;
}

function diffTypes(oldTypes: Record<string, string>, newTypes: Record<string, string>): ContractDiff {
  const diff: ContractDiff = {
    breaking: [],
    additive: [],
    unchanged: [],
    removed: [],
  };
  
  for (const [typeName, oldFile] of Object.entries(oldTypes)) {
    const newFile = newTypes[typeName];
    
    if (!newFile) {
      diff.removed.push(`Type removed: ${typeName}`);
      diff.breaking.push(`BREAKING: Type removed: ${typeName}`);
    } else if (oldFile === newFile) {
      diff.unchanged.push(`Type unchanged: ${typeName}`);
    }
  }
  
  for (const [typeName, newFile] of Object.entries(newTypes)) {
    if (!oldTypes[typeName]) {
      diff.additive.push(`Type added: ${typeName}`);
    }
  }
  
  return diff;
}

function diffComponents(oldComponents: Record<string, string>, newComponents: Record<string, string>): ContractDiff {
  const diff: ContractDiff = {
    breaking: [],
    additive: [],
    unchanged: [],
    removed: [],
  };
  
  for (const [componentName, oldFile] of Object.entries(oldComponents)) {
    const newFile = newComponents[componentName];
    
    if (!newFile) {
      diff.removed.push(`Component removed: ${componentName}`);
      // Component removal is not breaking (frontend can be rebuilt)
    } else if (oldFile === newFile) {
      diff.unchanged.push(`Component unchanged: ${componentName}`);
    }
  }
  
  for (const [componentName, newFile] of Object.entries(newComponents)) {
    if (!oldComponents[componentName]) {
      diff.additive.push(`Component added: ${componentName}`);
    }
  }
  
  return diff;
}

function printDiff(label: string, diff: ContractDiff): void {
  console.log(`\n## ${label}`);
  
  if (diff.breaking.length > 0) {
    console.log('\n🔴 BREAKING CHANGES:');
    diff.breaking.forEach(change => console.log(`  - ${change}`));
  }
  
  if (diff.additive.length > 0) {
    console.log('\n🟡 ADDITIVE CHANGES:');
    diff.additive.forEach(change => console.log(`  - ${change}`));
  }
  
  if (diff.removed.length > 0) {
    console.log('\n⚠️  REMOVED:');
    diff.removed.forEach(change => console.log(`  - ${change}`));
  }
  
  if (diff.unchanged.length > 0) {
    console.log(`\n✅ UNCHANGED: ${diff.unchanged.length} items`);
  }
}

function generateReconciliationTasks(apiDiff: ContractDiff, typeDiff: ContractDiff): void {
  const tasks: string[] = [];
  
  // Generate tasks for breaking changes
  for (const change of apiDiff.breaking) {
    if (change.includes('Method removed')) {
      tasks.push(`Update frontend to remove calls to removed method`);
    } else if (change.includes('Middleware removed')) {
      tasks.push(`Re-apply missing middleware to route`);
    } else if (change.includes('Request schema changed')) {
      tasks.push(`Update frontend to match new request schema`);
    }
  }
  
  // Generate tasks for additive changes
  for (const change of apiDiff.additive) {
    if (change.includes('Middleware added')) {
      tasks.push(`Update frontend to include new headers (e.g., X-Idempotency-Key)`);
    }
  }
  
  if (tasks.length > 0) {
    console.log('\n## RECONCILIATION TASKS');
    tasks.forEach((task, i) => console.log(`${i + 1}. ${task}`));
  }
}

async function diffContracts(oldBinder: number, newBinder: number): Promise<void> {
  console.log(`Comparing contracts: Binder ${oldBinder} → Binder ${newBinder}`);
  
  const oldSnapshot = loadSnapshot(oldBinder);
  const newSnapshot = loadSnapshot(newBinder);
  
  if (!oldSnapshot || !newSnapshot) {
    process.exit(1);
  }
  
  const apiDiff = diffAPIs(oldSnapshot.apis, newSnapshot.apis);
  const typeDiff = diffTypes(oldSnapshot.types, newSnapshot.types);
  const componentDiff = diffComponents(oldSnapshot.components, newSnapshot.components);
  
  printDiff('API Endpoints', apiDiff);
  printDiff('Types', typeDiff);
  printDiff('Components', componentDiff);
  
  generateReconciliationTasks(apiDiff, typeDiff);
  
  // Determine overall status
  const hasBreakingChanges = apiDiff.breaking.length > 0 || typeDiff.breaking.length > 0;
  const hasAdditiveChanges = apiDiff.additive.length > 0 || typeDiff.additive.length > 0;
  
  console.log('\n## OVERALL STATUS');
  if (hasBreakingChanges) {
    console.log('🔴 RED: Breaking changes detected - reconciliation required');
    process.exit(1);
  } else if (hasAdditiveChanges) {
    console.log('🟡 YELLOW: Additive changes only - review recommended');
    process.exit(0);
  } else {
    console.log('✅ GREEN: No changes - proceed');
    process.exit(0);
  }
}

// Main execution
const oldBinder = parseInt(process.argv[2]);
const newBinder = parseInt(process.argv[3]);

if (isNaN(oldBinder) || isNaN(newBinder)) {
  console.error('Usage: npx ts-node scripts/diff-contracts.ts <old-binder> <new-binder>');
  process.exit(1);
}

diffContracts(oldBinder, newBinder).catch((error) => {
  console.error('Error diffing contracts:', error);
  process.exit(1);
});

