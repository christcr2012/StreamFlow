const fs = require('fs');
const path = require('path');

const BINDER_FILE = 'binderFiles/binder2_FULL.md';
const OUTPUT_DIR = 'src/pages/api/binder2_FULL';
const REPORT_FILE = 'ops/reports/binder2_FULL_report.md';

// Ensure output directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Parse binder file and extract API endpoints
function parseBinder() {
  console.log('📖 Reading binder file...');
  const content = fs.readFileSync(BINDER_FILE, 'utf-8');
  const lines = content.split('\n');
  
  const endpoints = [];
  let currentEndpoint = null;
  let inCodeBlock = false;
  let codeBlockContent = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect API endpoint headers
    if (line.match(/^###\s+API\s+(POST|GET|PUT|DELETE|PATCH)\s+\/api\//)) {
      // Save previous endpoint if exists
      if (currentEndpoint) {
        currentEndpoint.implementation = codeBlockContent.join('\n');
        endpoints.push(currentEndpoint);
      }
      
      // Parse new endpoint
      const match = line.match(/^###\s+API\s+(POST|GET|PUT|DELETE|PATCH)\s+(\/api\/[^\s]+)/);
      if (match) {
        const method = match[1];
        const route = match[2];
        
        currentEndpoint = {
          method,
          route,
          line: i + 1,
          implementation: ''
        };
        codeBlockContent = [];
        inCodeBlock = false;
      }
    }
    // Collect code block content
    else if (currentEndpoint) {
      if (line.trim().startsWith('```typescript') || line.trim().startsWith('```ts')) {
        inCodeBlock = true;
      } else if (line.trim() === '```' && inCodeBlock) {
        inCodeBlock = false;
      } else if (inCodeBlock) {
        codeBlockContent.push(line);
      }
    }
  }
  
  // Save last endpoint
  if (currentEndpoint) {
    currentEndpoint.implementation = codeBlockContent.join('\n');
    endpoints.push(currentEndpoint);
  }
  
  console.log(`✅ Found ${endpoints.length} API endpoints`);
  return endpoints;
}

// Generate API route file
function generateRouteFile(endpoint) {
  // Convert route to file path
  // /api/tenant/crm/opportunities -> tenant/crm/opportunities.ts
  const routePath = endpoint.route.replace(/^\/api\//, '');
  const filePath = path.join(OUTPUT_DIR, `${routePath}.ts`);
  
  // Ensure directory exists
  ensureDir(path.dirname(filePath));
  
  // Use implementation from binder if available, otherwise generate stub
  let content;
  if (endpoint.implementation && endpoint.implementation.trim()) {
    content = endpoint.implementation;
  } else {
    // Generate stub
    content = `import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== '${endpoint.method}') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Implement ${endpoint.method} ${endpoint.route}
    res.status(501).json({ error: 'Not implemented' });
  } catch (error) {
    console.error('Error in ${endpoint.route}:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
`;
  }
  
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

// Generate report
function generateReport(endpoints, generatedFiles) {
  ensureDir(path.dirname(REPORT_FILE));
  
  const report = `# Binder2 Processing Report

**Generated:** ${new Date().toISOString()}
**Total Endpoints:** ${endpoints.length}
**Files Generated:** ${generatedFiles.length}

## Endpoints by Route

${endpoints.map((ep, idx) => `${idx + 1}. **${ep.method}** \`${ep.route}\` (line ${ep.line})`).join('\n')}

## Generated Files

${generatedFiles.map((file, idx) => `${idx + 1}. \`${file}\``).join('\n')}

## Summary

- ✅ All ${endpoints.length} endpoints processed
- ✅ ${generatedFiles.length} TypeScript files generated
- 📁 Output directory: \`${OUTPUT_DIR}\`

## Next Steps

1. Review generated files
2. Implement TODO items
3. Add tests
4. Commit changes in batches
`;
  
  fs.writeFileSync(REPORT_FILE, report, 'utf-8');
  console.log(`📄 Report saved to ${REPORT_FILE}`);
}

// Main execution
function main() {
  console.log('🚀 Processing Binder2...\n');
  
  // Parse binder
  const endpoints = parseBinder();
  
  if (endpoints.length === 0) {
    console.error('❌ No endpoints found!');
    process.exit(1);
  }
  
  // Generate files
  console.log('\n📝 Generating API route files...');
  const generatedFiles = [];
  
  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    try {
      const filePath = generateRouteFile(endpoint);
      generatedFiles.push(filePath);
      
      if ((i + 1) % 100 === 0) {
        console.log(`  Generated ${i + 1}/${endpoints.length} files...`);
      }
    } catch (error) {
      console.error(`❌ Error generating ${endpoint.route}:`, error.message);
    }
  }
  
  console.log(`✅ Generated ${generatedFiles.length} files\n`);
  
  // Generate report
  generateReport(endpoints, generatedFiles);
  
  console.log('\n✅ Binder2 processing complete!');
  console.log(`📊 Total: ${endpoints.length} endpoints → ${generatedFiles.length} files`);
}

// Run
try {
  main();
} catch (error) {
  console.error('❌ Fatal error:', error);
  process.exit(1);
}

