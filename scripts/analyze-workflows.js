#!/usr/bin/env node
/**
 * Analyze GitHub Actions workflows for relevance and issues
 * 
 * Categorizes workflows by:
 * - Essential (must keep and fix)
 * - Useful (keep if working, fix if simple)
 * - Deprecated (remove)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const workflowsDir = path.join(__dirname, '../.github/workflows');
const workflows = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

console.log('📊 GitHub Workflows Analysis\n');
console.log(`Found ${workflows.length} workflows\n`);

const analysis = {
  essential: [],
  useful: [],
  deprecated: [],
  errors: []
};

workflows.forEach(file => {
  const filePath = path.join(workflowsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  try {
    const workflow = yaml.parse(content);
    const name = workflow.name || file;
    const triggers = Object.keys(workflow.on || {});
    
    const info = {
      file,
      name,
      triggers: triggers.join(', '),
      hasSecrets: content.includes('secrets.'),
      hasSchedule: triggers.includes('schedule'),
      isManual: triggers.includes('workflow_dispatch')
    };
    
    // Categorize
    if (file.includes('ci.yml')) {
      analysis.essential.push({ ...info, reason: 'Core CI/CD pipeline' });
    } else if (file.includes('codeql')) {
      analysis.essential.push({ ...info, reason: 'Security scanning (CodeQL)' });
    } else if (file.includes('security-scan')) {
      analysis.essential.push({ ...info, reason: 'Security scanning (gitleaks, audit)' });
    } else if (file.includes('neon-preview')) {
      analysis.deprecated.push({ ...info, reason: 'Preview databases not in active use' });
    } else if (file.includes('auto-approve') || file.includes('auto-merge')) {
      analysis.deprecated.push({ ...info, reason: 'Auto-approve/merge dangerous in production' });
    } else if (file.includes('dod-')) {
      analysis.deprecated.push({ ...info, reason: 'DoD checklists - project management overhead' });
    } else if (file.includes('projects-v2')) {
      analysis.deprecated.push({ ...info, reason: 'GitHub Projects v2 - not actively used' });
    } else if (file.includes('issues-to-docs')) {
      analysis.deprecated.push({ ...info, reason: 'Issue automation - not needed' });
    } else if (file.includes('promote-contracts')) {
      analysis.useful.push({ ...info, reason: 'Contract promotion useful but manual' });
    } else if (file.includes('e2e-smoke')) {
      analysis.useful.push({ ...info, reason: 'E2E testing valuable when configured' });
    } else if (file.includes('performance')) {
      analysis.useful.push({ ...info, reason: 'Performance monitoring valuable' });
    } else if (file.includes('labels')) {
      analysis.useful.push({ ...info, reason: 'Label management helpful' });
    } else if (file.includes('setup-secrets')) {
      analysis.deprecated.push({ ...info, reason: 'One-time setup, not needed in CI' });
    } else {
      analysis.useful.push({ ...info, reason: 'May be useful' });
    }
    
    // Check for errors
    if (info.hasSecrets) {
      const secretMatches = content.match(/secrets\.(\w+)/g) || [];
      info.secrets = [...new Set(secretMatches.map(s => s.replace('secrets.', '')))];
    }
    
  } catch (error) {
    analysis.errors.push({ file, error: error.message });
  }
});

// Print analysis
console.log('✅ ESSENTIAL (Keep & Fix):');
analysis.essential.forEach(w => {
  console.log(`  - ${w.file.padEnd(40)} ${w.reason}`);
  console.log(`    Triggers: ${w.triggers}`);
  if (w.secrets) console.log(`    Secrets: ${w.secrets.join(', ')}`);
});

console.log('\n📦 USEFUL (Keep if Working):');
analysis.useful.forEach(w => {
  console.log(`  - ${w.file.padEnd(40)} ${w.reason}`);
  console.log(`    Triggers: ${w.triggers}`);
  if (w.secrets) console.log(`    Secrets: ${w.secrets.join(', ')}`);
});

console.log('\n❌ DEPRECATED (Remove):');
analysis.deprecated.forEach(w => {
  console.log(`  - ${w.file.padEnd(40)} ${w.reason}`);
});

console.log('\n⚠️  ERRORS:');
if (analysis.errors.length === 0) {
  console.log('  None');
} else {
  analysis.errors.forEach(e => {
    console.log(`  - ${e.file}: ${e.error}`);
  });
}

console.log('\n📋 SUMMARY:');
console.log(`  Essential: ${analysis.essential.length}`);
console.log(`  Useful: ${analysis.useful.length}`);
console.log(`  Deprecated: ${analysis.deprecated.length}`);
console.log(`  Errors: ${analysis.errors.length}`);
console.log(`  Total: ${workflows.length}`);

console.log('\n🔑 REQUIRED SECRETS (for essential workflows):');
const allSecrets = new Set();
analysis.essential.forEach(w => {
  if (w.secrets) w.secrets.forEach(s => allSecrets.add(s));
});
allSecrets.forEach(s => console.log(`  - ${s}`));
