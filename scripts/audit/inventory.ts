/**
 * Module: Repository Inventory Script
 * Purpose: Audit all routes, models, auth helpers, and client fetches
 * Scope: System-wide analysis for refactor planning
 * Notes: Run with `tsx scripts/audit/inventory.ts`
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

interface InventoryReport {
  timestamp: string;
  routes: {
    pages: string[];
    apiRoutes: string[];
  };
  prismaModels: {
    all: string[];
    withOrgId: string[];
    withoutOrgId: string[];
  };
  authHelpers: string[];
  clientFetches: Array<{ file: string; endpoint: string; line: number }>;
}

/**
 * Recursively find all files matching pattern
 */
function findFiles(dir: string, pattern: RegExp, results: string[] = []): string[] {
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        findFiles(filePath, pattern, results);
      }
    } else if (pattern.test(file)) {
      results.push(path.relative(ROOT, filePath));
    }
  }
  
  return results;
}

/**
 * Extract Prisma models from schema
 */
function extractPrismaModels(): { all: string[]; withOrgId: string[]; withoutOrgId: string[] } {
  const schemaPath = path.join(ROOT, 'prisma/schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    return { all: [], withOrgId: [], withoutOrgId: [] };
  }
  
  const content = fs.readFileSync(schemaPath, 'utf-8');
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
  
  const all: string[] = [];
  const withOrgId: string[] = [];
  const withoutOrgId: string[] = [];
  
  let match;
  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1];
    const modelBody = match[2];
    
    all.push(modelName);
    
    if (modelBody.includes('orgId')) {
      withOrgId.push(modelName);
    } else {
      withoutOrgId.push(modelName);
    }
  }
  
  return { all, withOrgId, withoutOrgId };
}

/**
 * Find all auth/session helper files
 */
function findAuthHelpers(): string[] {
  const libDir = path.join(ROOT, 'src/lib');
  const authPatterns = [
    /auth/i,
    /session/i,
    /guard/i,
    /policy/i,
    /rbac/i,
    /permission/i,
  ];
  
  const helpers: string[] = [];
  
  if (!fs.existsSync(libDir)) return helpers;
  
  function scan(dir: string) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scan(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        if (authPatterns.some(pattern => pattern.test(file))) {
          helpers.push(path.relative(ROOT, filePath));
        }
      }
    }
  }
  
  scan(libDir);
  return helpers;
}

/**
 * Find all client-side API fetches
 */
function findClientFetches(): Array<{ file: string; endpoint: string; line: number }> {
  const srcDir = path.join(ROOT, 'src');
  const fetches: Array<{ file: string; endpoint: string; line: number }> = [];
  
  if (!fs.existsSync(srcDir)) return fetches;
  
  function scan(dir: string) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip api directory
        if (file !== 'api') {
          scan(filePath);
        }
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          // Match fetch('/api/...') or fetch("/api/...")
          const fetchMatch = line.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/);
          if (fetchMatch && fetchMatch[1].startsWith('/api')) {
            fetches.push({
              file: path.relative(ROOT, filePath),
              endpoint: fetchMatch[1],
              line: index + 1,
            });
          }
        });
      }
    }
  }
  
  scan(srcDir);
  return fetches;
}

/**
 * Generate inventory report
 */
function generateInventory(): InventoryReport {
  console.log('🔍 Scanning repository...\n');
  
  // Find all pages
  const pagesDir = path.join(ROOT, 'src/pages');
  const pages = findFiles(pagesDir, /\.(tsx|ts|jsx|js)$/)
    .filter(p => !p.includes('/api/'))
    .filter(p => !p.includes('/_app') && !p.includes('/_document'));
  
  // Find all API routes
  const apiRoutes = findFiles(path.join(pagesDir, 'api'), /\.(ts|js)$/);
  
  // Extract Prisma models
  const prismaModels = extractPrismaModels();
  
  // Find auth helpers
  const authHelpers = findAuthHelpers();
  
  // Find client fetches
  const clientFetches = findClientFetches();
  
  return {
    timestamp: new Date().toISOString(),
    routes: {
      pages,
      apiRoutes,
    },
    prismaModels,
    authHelpers,
    clientFetches,
  };
}

/**
 * Format report as markdown
 */
function formatReport(report: InventoryReport): string {
  let md = `# StreamFlow Repository Inventory\n\n`;
  md += `**Generated:** ${report.timestamp}\n\n`;
  md += `---\n\n`;
  
  // Routes
  md += `## 📄 Routes\n\n`;
  md += `### Pages (${report.routes.pages.length})\n\n`;
  report.routes.pages.slice(0, 50).forEach(p => {
    md += `- ${p}\n`;
  });
  if (report.routes.pages.length > 50) {
    md += `\n... and ${report.routes.pages.length - 50} more\n`;
  }
  
  md += `\n### API Routes (${report.routes.apiRoutes.length})\n\n`;
  report.routes.apiRoutes.slice(0, 50).forEach(r => {
    md += `- ${r}\n`;
  });
  if (report.routes.apiRoutes.length > 50) {
    md += `\n... and ${report.routes.apiRoutes.length - 50} more\n`;
  }
  
  // Prisma Models
  md += `\n---\n\n## 🗄️ Prisma Models\n\n`;
  md += `**Total Models:** ${report.prismaModels.all.length}\n`;
  md += `**With orgId:** ${report.prismaModels.withOrgId.length}\n`;
  md += `**Without orgId:** ${report.prismaModels.withoutOrgId.length}\n\n`;
  
  md += `### Models WITH orgId (${report.prismaModels.withOrgId.length})\n\n`;
  report.prismaModels.withOrgId.forEach(m => {
    md += `- ✅ ${m}\n`;
  });
  
  md += `\n### Models WITHOUT orgId (${report.prismaModels.withoutOrgId.length})\n\n`;
  report.prismaModels.withoutOrgId.forEach(m => {
    md += `- ⚠️ ${m}\n`;
  });
  
  // Auth Helpers
  md += `\n---\n\n## 🔐 Auth/Session Helpers (${report.authHelpers.length})\n\n`;
  report.authHelpers.forEach(h => {
    md += `- ${h}\n`;
  });
  
  // Client Fetches
  md += `\n---\n\n## 🌐 Client API Fetches (${report.clientFetches.length})\n\n`;
  
  // Group by endpoint
  const byEndpoint = new Map<string, Array<{ file: string; line: number }>>();
  report.clientFetches.forEach(f => {
    if (!byEndpoint.has(f.endpoint)) {
      byEndpoint.set(f.endpoint, []);
    }
    byEndpoint.get(f.endpoint)!.push({ file: f.file, line: f.line });
  });
  
  Array.from(byEndpoint.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(0, 30)
    .forEach(([endpoint, locations]) => {
      md += `### \`${endpoint}\` (${locations.length} calls)\n\n`;
      locations.slice(0, 5).forEach(loc => {
        md += `- ${loc.file}:${loc.line}\n`;
      });
      if (locations.length > 5) {
        md += `- ... and ${locations.length - 5} more\n`;
      }
      md += `\n`;
    });
  
  if (byEndpoint.size > 30) {
    md += `\n... and ${byEndpoint.size - 30} more endpoints\n`;
  }
  
  return md;
}

/**
 * Main execution
 */
async function main() {
  try {
    const report = generateInventory();
    const markdown = formatReport(report);
    
    // Ensure docs directory exists
    const docsDir = path.join(ROOT, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    // Write report
    const date = new Date().toISOString().split('T')[0];
    const outputPath = path.join(docsDir, `audit-${date}.md`);
    fs.writeFileSync(outputPath, markdown);
    
    console.log('✅ Inventory complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   - Pages: ${report.routes.pages.length}`);
    console.log(`   - API Routes: ${report.routes.apiRoutes.length}`);
    console.log(`   - Prisma Models: ${report.prismaModels.all.length} (${report.prismaModels.withOrgId.length} with orgId)`);
    console.log(`   - Auth Helpers: ${report.authHelpers.length}`);
    console.log(`   - Client Fetches: ${report.clientFetches.length}`);
    console.log(`\n📄 Report saved to: ${path.relative(ROOT, outputPath)}`);
  } catch (error) {
    console.error('❌ Error generating inventory:', error);
    process.exit(1);
  }
}

main();

