#!/usr/bin/env tsx
// Verify that Prisma migrations do not contain destructive patterns without explicit approval

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const DESTRUCTIVE_PATTERNS = [
  { pattern: /DROP\s+TABLE/i, description: 'DROP TABLE' },
  { pattern: /DROP\s+COLUMN/i, description: 'DROP COLUMN' },
];

const OVERRIDE_MARKER = '@migration-guardrail-override';

interface MigrationIssue {
  file: string;
  line: number;
  pattern: string;
  content: string;
}

async function scanMigrations(): Promise<MigrationIssue[]> {
  const issues: MigrationIssue[] = [];
  
  // Scan both tenant and provider migration directories
  const migrationDirs = [
    'prisma/migrations',
    'apps/provider-portal/prisma/migrations',
  ];

  for (const dir of migrationDirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      continue;
    }

    // Find all migration.sql files
    const migrationFiles = await glob(`${dir}/**/migration.sql`, { cwd: process.cwd() });

    for (const file of migrationFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      // Check for override marker
      const hasOverride = content.includes(OVERRIDE_MARKER);
      if (hasOverride) {
        console.log(`ℹ️  Override marker found in ${file} - skipping guardrail checks`);
        continue;
      }

      // Scan each line for destructive patterns
      lines.forEach((line, index) => {
        for (const { pattern, description } of DESTRUCTIVE_PATTERNS) {
          if (pattern.test(line)) {
            issues.push({
              file,
              line: index + 1,
              pattern: description,
              content: line.trim(),
            });
          }
        }
      });
    }
  }

  return issues;
}

async function main() {
  console.log('🔍 Verifying Prisma migrations for destructive patterns...\n');

  const issues = await scanMigrations();

  if (issues.length === 0) {
    console.log('✅ PASSED: No destructive migration patterns detected\n');
    return;
  }

  console.error('❌ FAILED: Destructive migration patterns detected\n');
  console.error('The following migrations contain potentially destructive operations:\n');

  for (const issue of issues) {
    console.error(`  File: ${issue.file}`);
    console.error(`  Line: ${issue.line}`);
    console.error(`  Pattern: ${issue.pattern}`);
    console.error(`  Content: ${issue.content}`);
    console.error('');
  }

  console.error('Destructive migrations require explicit approval and a rollback plan.');
  console.error('If this migration is intentional and approved:');
  console.error(`  1. Add a comment with "${OVERRIDE_MARKER}" to the migration file`);
  console.error('  2. Document the rollback plan in the migration or PR description');
  console.error('  3. Ensure backups are enabled and tested\n');
  console.error('See docs/runbooks/GO_LIVE_RUNBOOK.md for migration safety guidelines.\n');

  process.exit(1);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

