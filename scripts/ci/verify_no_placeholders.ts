/**
 * Intelligent Placeholder/Stub Detector
 * 
 * Detects placeholders and classifies them as:
 * - BLOCKED: Cannot be implemented yet (dependencies missing)
 * - ACTIONABLE: Can be implemented now (fails CI in strict mode)
 * - DOCUMENTATION: Informational only
 *
 * Detects:
 * - TODO, FIXME, HACK, XXX, STUB
 * - "Not implemented" phrases
 * - status: 501 responses
 * - "Coming Soon" or "Under Construction" text
 */
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "fs";
import { join, resolve, dirname } from "path";
import { 
  analyzePlaceholder, 
  generateStructuredTodo, 
  generateGitHubIssue,
  type PlaceholderClassification 
} from "./placeholder-analyzer";

const ROOT = resolve(process.cwd());

const PLACEHOLDER_PATTERNS: { label: string; regex: RegExp }[] = [
  { label: "TODO", regex: /\bTODO\b/i },
  { label: "FIXME", regex: /\bFIXME\b/i },
  { label: "HACK", regex: /\bHACK\b/i },
  { label: "XXX", regex: /\bXXX\b/i },
  { label: "STUB", regex: /\bSTUB\b/i },
  { label: "Not implemented", regex: /not\s+implemented/i },
  { label: "HTTP 501", regex: /status\s*:\s*501/ },
  { label: "Coming Soon", regex: /coming\s+soon/i },
  { label: "Under Construction", regex: /under\s+construction/i },
];

const EXCLUDED_DIRS = new Set<string>([
  "node_modules",
  ".next",
  "dist",
  "build",
  ".git",
  "playwright-report",
  "test-results",
  "coverage",
  "logs",
 ".ai-placeholders",
  // Allow placeholders in docs
  "docs",
]);

const EXCLUDED_FILES = new Set<string>([
  "scripts/ci/verify_no_placeholders.ts",
  "scripts/ci/placeholder-analyzer.ts",
]);

const INCLUDED_EXTS = new Set<string>([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mdx",
  ".json",
]);

function shouldSkipPath(relativePath: string): boolean {
  const parts = relativePath.split(/[\\/]/);
  return parts.some((p) => EXCLUDED_DIRS.has(p));
}

function hasIncludedExtension(file: string): boolean {
  const idx = file.lastIndexOf(".");
  if (idx === -1) return false;
  return INCLUDED_EXTS.has(file.slice(idx));
}

type Violation = { 
  file: string; 
  line: number; 
  label: string; 
  snippet: string;
  classification?: PlaceholderClassification;
};

function scanFile(filePath: string): Violation[] {
  const relFromRoot = filePath.replace(ROOT + /[\\/]/, "").replace(/\\/g, "/");
  if (EXCLUDED_FILES.has(relFromRoot)) return [];
  if (!hasIncludedExtension(filePath)) return [];
  
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);
  const violations: Violation[] = [];

  lines.forEach((line, i) => {
    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.regex.test(line)) {
        // Analyze this placeholder
        const classification = analyzePlaceholder(
          filePath,
          i + 1,
          pattern.label,
          line.trim().slice(0, 240),
          content
        );
        
        violations.push({
          file: filePath,
          line: i + 1,
          label: pattern.label,
          snippet: line.trim().slice(0, 240),
          classification,
        });
      }
    }
  });

  return violations;
}

function scanDir(dir: string, base = ""): Violation[] {
  const entries = readdirSync(dir);
  let results: Violation[] = [];
  for (const entry of entries) {
    const abs = join(dir, entry);
    const rel = base ? join(base, entry) : entry;
    if (shouldSkipPath(rel)) continue;
    const st = statSync(abs);
    if (st.isDirectory()) {
      results = results.concat(scanDir(abs, rel));
    } else if (st.isFile()) {
      results = results.concat(scanFile(abs));
    }
  }
  return results;
}

const violations = scanDir(ROOT);

// Separate violations by classification
const blocked = violations.filter(v => v.classification?.classification === 'BLOCKED');
const actionable = violations.filter(v => v.classification?.classification === 'ACTIONABLE');
const documentation = violations.filter(v => v.classification?.classification === 'DOCUMENTATION');

// Strict mode is now ON by default - only fail on actionable items
const strict = process.env.PLACEHOLDER_STRICT !== "false";

if (violations.length > 0) {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 INTELLIGENT PLACEHOLDER ANALYSIS');
  console.log('='.repeat(80) + '\n');
  
  // Summary
  console.log(`📊 Summary:`);
  console.log(`   Total placeholders: ${violations.length}`);
  console.log(`   🔴 Actionable (can be implemented now): ${actionable.length}`);
  console.log(`   🟡 Blocked (dependencies missing): ${blocked.length}`);
  console.log(`   📝 Documentation only: ${documentation.length}\n`);
  
  // Show actionable items (these will fail in strict mode)
  if (actionable.length > 0) {
    console.error(`\n${'='.repeat(80)}`);
    console.error(`🔴 ACTIONABLE PLACEHOLDERS (${actionable.length})`);
    console.error(`These can be implemented NOW and will fail CI in strict mode`);
    console.error('='.repeat(80));
    
    const groupedActionable = new Map<string, Violation[]>();
    for (const v of actionable) {
      const rel = v.file.replace(ROOT + /[\\/]/, "");
      if (!groupedActionable.has(rel)) groupedActionable.set(rel, []);
      groupedActionable.get(rel)!.push(v);
    }
    
    groupedActionable.forEach((items, file) => {
      console.error(`\n📁 ${file}`);
      items.forEach((v) => {
        console.error(`  Line ${v.line}: [${v.label}] ${v.snippet}`);
        if (v.classification) {
          console.error(`    ⚡ ${v.classification.reasoning}`);
          console.error(`    📊 Confidence: ${(v.classification.confidence * 100).toFixed(0)}%`);
        }
      });
    });
  }
  
  // Show blocked items (informational)
  if (blocked.length > 0) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🟡 BLOCKED PLACEHOLDERS (${blocked.length})`);
    console.log(`These have legitimate dependencies - will NOT fail CI`);
    console.log('='.repeat(80));
    
    const groupedBlocked = new Map<string, Violation[]>();
    for (const v of blocked) {
      const rel = v.file.replace(ROOT + /[\\/]/, "");
      if (!groupedBlocked.has(rel)) groupedBlocked.set(rel, []);
      groupedBlocked.get(rel)!.push(v);
    }
    
    groupedBlocked.forEach((items, file) => {
      console.log(`\n📁 ${file}`);
      items.forEach((v) => {
        console.log(`  Line ${v.line}: [${v.label}] ${v.snippet.slice(0, 80)}...`);
        if (v.classification) {
          console.log(`    🔒 ${v.classification.reasoning}`);
          if (v.classification.phaseMarker) {
            console.log(`    📅 ${v.classification.phaseMarker}`);
          }
          if (v.classification.dependencies.length > 0) {
            console.log(`    🔗 Dependencies:`);
            v.classification.dependencies.forEach(dep => {
              console.log(`       - [${dep.type}] ${dep.name}`);
            });
          }
        }
      });
    });
  }
  
  // Generate tracking files
  console.log(`\n${'='.repeat(80)}`);
  console.log('📝 GENERATING TRACKING FILES');
  console.log('='.repeat(80) + '\n');
  
  // Generate AI-readable tracking file
  const trackingDir = join(ROOT, '.ai-placeholders');
  mkdirSync(trackingDir, { recursive: true });
  
  const trackingData = {
    generatedAt: new Date().toISOString(),
    summary: {
      total: violations.length,
      actionable: actionable.length,
      blocked: blocked.length,
      documentation: documentation.length,
    },
    actionable: actionable.map(v => ({
      file: v.file.replace(ROOT + /[\\/]/, ""),
      line: v.line,
      marker: v.label,
      snippet: v.snippet,
      reasoning: v.classification?.reasoning,
      confidence: v.classification?.confidence,
    })),
    blocked: blocked.map(v => ({
      file: v.file.replace(ROOT + /[\\/]/, ""),
      line: v.line,
      marker: v.label,
      snippet: v.snippet,
      phase: v.classification?.phaseMarker,
      dependencies: v.classification?.dependencies,
      reasoning: v.classification?.reasoning,
      confidence: v.classification?.confidence,
    })),
  };
  
  writeFileSync(
    join(trackingDir, 'placeholders.json'),
    JSON.stringify(trackingData, null, 2)
  );
  console.log(`✅ Created .ai-placeholders/placeholders.json (AI-readable)`);
  
  // Generate GitHub issues file
  const issuesData = blocked.map(v => v.classification ? generateGitHubIssue(v.classification) : null).filter(Boolean);
  writeFileSync(
    join(trackingDir, 'github-issues.json'),
    JSON.stringify(issuesData, null, 2)
  );
  console.log(`✅ Created .ai-placeholders/github-issues.json (${issuesData.length} issues)`);
  
  // Generate markdown report
  const reportLines: string[] = [];
  reportLines.push('# Placeholder Analysis Report\n');
  reportLines.push(`**Generated:** ${new Date().toISOString()}\n`);
  reportLines.push('## Summary\n');
  reportLines.push(`- **Total Placeholders:** ${violations.length}`);
  reportLines.push(`- **🔴 Actionable:** ${actionable.length}`);
  reportLines.push(`- **🟡 Blocked:** ${blocked.length}`);
  reportLines.push(`- **📝 Documentation:** ${documentation.length}\n`);
  
  if (actionable.length > 0) {
    reportLines.push('## 🔴 Actionable Items\n');
    reportLines.push('These can be implemented immediately:\n');
    actionable.forEach(v => {
      const rel = v.file.replace(ROOT + /[\\/]/, "");
      reportLines.push(`### \`${rel}:${v.line}\``);
      reportLines.push(`**Marker:** ${v.label}`);
      reportLines.push(`**Reasoning:** ${v.classification?.reasoning}`);
      reportLines.push('```');
      reportLines.push(v.snippet);
      reportLines.push('```\n');
    });
  }
  
  if (blocked.length > 0) {
    reportLines.push('## 🟡 Blocked Items\n');
    reportLines.push('These require dependencies to be built first:\n');
    blocked.forEach(v => {
      const rel = v.file.replace(ROOT + /[\\/]/, "");
      reportLines.push(`### \`${rel}:${v.line}\``);
      reportLines.push(`**Marker:** ${v.label}`);
      if (v.classification?.phaseMarker) {
        reportLines.push(`**Phase:** ${v.classification.phaseMarker}`);
      }
      reportLines.push(`**Reasoning:** ${v.classification?.reasoning}`);
      if (v.classification?.dependencies && v.classification.dependencies.length > 0) {
        reportLines.push('**Dependencies:**');
        v.classification.dependencies.forEach(dep => {
          reportLines.push(`- \`[${dep.type}]\` ${dep.name}: ${dep.reason}`);
        });
      }
      reportLines.push('```');
      reportLines.push(v.snippet);
      reportLines.push('```\n');
    });
  }
  
  writeFileSync(
    join(trackingDir, 'REPORT.md'),
    reportLines.join('\n')
  );
  console.log(`✅ Created .ai-placeholders/REPORT.md (human-readable)\n`);
  
  // Final verdict
  console.log('='.repeat(80));
  if (actionable.length > 0 && strict) {
    console.error(`\n❌ CI FAILED: ${actionable.length} actionable placeholder(s) found`);
    console.error(`   These can be implemented now and should not remain as TODOs.`);
    console.error(`   Set PLACEHOLDER_STRICT=false to disable strict mode.\n`);
    process.exit(1);
  } else if (actionable.length > 0) {
    console.log(`\n⚠️  ${actionable.length} actionable placeholder(s) found (non-blocking)`);
    console.log(`   Strict mode is disabled. Set PLACEHOLDER_STRICT=true to enforce.\n`);
  } else {
    console.log(`\n✅ No actionable placeholders - ${blocked.length} legitimately blocked\n`);
  }
  
  process.exit(0);
} else {
  console.log("✅ No placeholders/stubs detected");
}
