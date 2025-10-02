/**
 * Contract Snapshot Generator
 * Stability Gate #1: Generate JSON snapshots of API contracts
 * 
 * Usage: npx ts-node scripts/generate-contract-snapshot.ts <binder-number>
 * Example: npx ts-node scripts/generate-contract-snapshot.ts 3
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

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

async function extractMiddleware(content: string): Promise<string[]> {
  const middleware: string[] = [];
  
  // Extract middleware from export default
  const exportMatch = content.match(/export default\s+([\s\S]+?);/);
  if (!exportMatch) return middleware;
  
  const exportContent = exportMatch[1];
  
  if (exportContent.includes('withRateLimit')) middleware.push('withRateLimit');
  if (exportContent.includes('withIdempotency')) middleware.push('withIdempotency');
  if (exportContent.includes('withAudience')) middleware.push('withAudience');
  if (exportContent.includes('withCostGuard')) middleware.push('withCostGuard');
  
  return middleware;
}

async function extractMethods(content: string): Promise<string[]> {
  const methods: string[] = [];
  
  // Extract methods from switch statement
  const switchMatch = content.match(/switch\s*\(\s*method\s*\)\s*{([\s\S]+?)}/);
  if (!switchMatch) return methods;
  
  const switchContent = switchMatch[1];
  const caseMatches = switchContent.matchAll(/case\s+['"](\w+)['"]/g);
  
  for (const match of caseMatches) {
    methods.push(match[1]);
  }
  
  return methods;
}

async function extractSchemas(content: string): Promise<{ request?: string; response?: string }> {
  const schemas: { request?: string; response?: string } = {};
  
  // Extract Zod schemas
  const schemaMatches = content.matchAll(/const\s+(\w+Schema)\s*=\s*z\.object\(([\s\S]+?)\);/g);
  for (const match of schemaMatches) {
    const schemaName = match[1];
    const schemaContent = match[2];
    
    if (schemaName.includes('Create') || schemaName.includes('Update') || schemaName.includes('Request')) {
      schemas.request = schemaName;
    }
  }
  
  return schemas;
}

async function scanAPIRoutes(binderNumber: number): Promise<Record<string, APIEndpoint>> {
  const apis: Record<string, APIEndpoint> = {};
  
  // Scan all API routes in src/pages/api/tenant
  const apiFiles = await glob('src/pages/api/tenant/**/*.ts', {
    ignore: ['**/*.test.ts', '**/*.spec.ts'],
  });
  
  for (const file of apiFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check if file belongs to this binder (by comment or by directory)
    const binderMatch = content.match(/Binder(\d+)/i);
    if (binderMatch && parseInt(binderMatch[1]) !== binderNumber) {
      continue;
    }
    
    // Convert file path to API path
    const apiPath = file
      .replace('src/pages/api', '/api')
      .replace(/\.ts$/, '')
      .replace(/\[(\w+)\]/g, ':$1')
      .replace(/\/index$/, '');
    
    const methods = await extractMethods(content);
    const middleware = await extractMiddleware(content);
    const schemas = await extractSchemas(content);
    
    if (methods.length > 0) {
      apis[apiPath] = {
        path: apiPath,
        methods,
        middleware,
        requestSchema: schemas.request,
        file: file.replace(/\\/g, '/'),
      };
    }
  }
  
  return apis;
}

async function scanTypes(binderNumber: number): Promise<Record<string, string>> {
  const types: Record<string, string> = {};
  
  // Scan service files for type definitions
  const serviceFiles = await glob('src/server/services/**/*.ts', {
    ignore: ['**/*.test.ts', '**/*.spec.ts'],
  });
  
  for (const file of serviceFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check if file belongs to this binder
    const binderMatch = content.match(/Binder(\d+)/i);
    if (binderMatch && parseInt(binderMatch[1]) !== binderNumber) {
      continue;
    }
    
    // Extract interface/type definitions
    const interfaceMatches = content.matchAll(/export\s+(interface|type)\s+(\w+)\s*[={]/g);
    for (const match of interfaceMatches) {
      const typeName = match[2];
      types[typeName] = file.replace(/\\/g, '/');
    }
  }
  
  return types;
}

async function scanComponents(binderNumber: number): Promise<Record<string, string>> {
  const components: Record<string, string> = {};
  
  // Scan React components
  const componentFiles = await glob('src/{app,components}/**/*.tsx', {
    ignore: ['**/*.test.tsx', '**/*.spec.tsx'],
  });
  
  for (const file of componentFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check if file belongs to this binder
    const binderMatch = content.match(/Binder(\d+)/i);
    if (binderMatch && parseInt(binderMatch[1]) !== binderNumber) {
      continue;
    }
    
    // Extract component name from file
    const componentName = path.basename(file, '.tsx');
    components[componentName] = file.replace(/\\/g, '/');
  }
  
  return components;
}

async function generateSnapshot(binderNumber: number): Promise<void> {
  console.log(`Generating contract snapshot for Binder ${binderNumber}...`);
  
  const apis = await scanAPIRoutes(binderNumber);
  const types = await scanTypes(binderNumber);
  const components = await scanComponents(binderNumber);
  
  const snapshot: ContractSnapshot = {
    version: '1.0.0',
    binder: binderNumber,
    timestamp: new Date().toISOString(),
    apis,
    types,
    components,
  };
  
  // Create ops/contracts directory if it doesn't exist
  const contractsDir = path.join(process.cwd(), 'ops', 'contracts');
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  
  // Write snapshot to file
  const snapshotPath = path.join(contractsDir, `binder${binderNumber}-snapshot.json`);
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
  
  console.log(`✅ Snapshot generated: ${snapshotPath}`);
  console.log(`   APIs: ${Object.keys(apis).length}`);
  console.log(`   Types: ${Object.keys(types).length}`);
  console.log(`   Components: ${Object.keys(components).length}`);
}

// Main execution
const binderNumber = parseInt(process.argv[2]);
if (isNaN(binderNumber)) {
  console.error('Usage: npx ts-node scripts/generate-contract-snapshot.ts <binder-number>');
  process.exit(1);
}

generateSnapshot(binderNumber).catch((error) => {
  console.error('Error generating snapshot:', error);
  process.exit(1);
});

