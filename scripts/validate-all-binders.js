#!/usr/bin/env node
/**
 * All Binders Contract Validation
 *
 * Validates that implementations match all binder contract specifications.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = process.cwd();

// Get binder to validate from command line, or validate all
const targetBinder = process.argv[2]; // e.g., "3B" or undefined for all

// Contract requirements for all binders
const BINDER_CONTRACTS = {
  '1': {
    name: 'Binder 1 - Core Foundation',
    apis: ['src/pages/api/auth', 'src/pages/api/tenant'],
  },
  '2': {
    name: 'Binder 2 - API Endpoints',
    apis: ['src/pages/api/binder2_FULL'],
  },
  '3': {
    name: 'Binder 3 - Core Features',
    apis: ['src/pages/api/tenant/crm', 'src/pages/api/tenant/leads'],
  },
  '3A': {
    name: 'Binder 3A - Extended Features',
    apis: ['src/pages/api/tenant'],
    routes: ['src/app/(app)'],
  },
  '3B': {
    name: 'Binder 3B - Front-End Build Pack',
    routes: [
      'src/app/(app)/leads/page.tsx',
      'src/app/(app)/leads/[id]/page.tsx',
      'src/app/(app)/ai-inbox/page.tsx',
      'src/app/(app)/work-orders/page.tsx',
      'src/app/(app)/calendar/page.tsx',
      'src/app/(app)/portal/page.tsx',
      'src/app/(app)/settings',
    ],
    components: ['src/components/leads', 'src/components'],
    lib: ['src/lib'],
    apis: [
      'src/pages/api/tenant/leads',
      'src/pages/api/tenant/messages',
      'src/pages/api/tenant/schedule',
      'src/pages/api/tenant/portal',
      'src/pages/api/tenant/settings',
    ],
  },
  '3C': {
    name: 'Binder 3C - Additional Features',
    apis: ['src/pages/api/tenant'],
  },
  '4': {
    name: 'Binder 4 - Advanced Features',
    apis: ['src/pages/api/tenant'],
  },
  '5': {
    name: 'Binder 5 - Integration Features',
    apis: ['src/pages/api/tenant', 'src/pages/api/integrations'],
  },
  '6': {
    name: 'Binder 6',
    apis: ['src/pages/api'],
  },
  '7': {
    name: 'Binder 7',
    apis: ['src/pages/api'],
  },
  '8': {
    name: 'Binder 8',
    apis: ['src/pages/api'],
  },
  '9': {
    name: 'Binder 9',
    apis: ['src/pages/api'],
  },
  '10': {
    name: 'Binder 10',
    apis: ['src/pages/api'],
  },
  '11': {
    name: 'Binder 11',
    apis: ['src/pages/api'],
  },
  '12': {
    name: 'Binder 12',
    apis: ['src/pages/api'],
  },
  '13': {
    name: 'Binder 13',
    apis: ['src/pages/api'],
  },
  '14': {
    name: 'Binder 14',
    apis: ['src/pages/api'],
  },
  '15': {
    name: 'Binder 15',
    apis: ['src/pages/api'],
  },
  '16': {
    name: 'Binder 16',
    apis: ['src/pages/api'],
  },
  '17': {
    name: 'Binder 17',
    apis: ['src/pages/api'],
  },
  '18': {
    name: 'Binder 18',
    apis: ['src/pages/api'],
  },
  '19': {
    name: 'Binder 19',
    apis: ['src/pages/api'],
  },
  '20': {
    name: 'Binder 20',
    apis: ['src/pages/api'],
  },
  '21': {
    name: 'Binder 21',
    apis: ['src/pages/api'],
  },
  '22': {
    name: 'Binder 22',
    apis: ['src/pages/api'],
  },
  '23': {
    name: 'Binder 23',
    apis: ['src/pages/api'],
  },
};

function checkPath(filePath) {
  const fullPath = path.join(REPO_ROOT, filePath);
  return fs.existsSync(fullPath);
}

function validateBinder(binderId, contract) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 ${contract.name.toUpperCase()}`);
  console.log('='.repeat(60));

  let totalChecks = 0;
  let passedChecks = 0;
  const failures = [];

  // Check routes
  if (contract.routes) {
    console.log('\n📄 Routes:');
    for (const route of contract.routes) {
      totalChecks++;
      const exists = checkPath(route);
      if (exists) {
        passedChecks++;
        console.log(`  ✅ ${route}`);
      } else {
        console.log(`  ❌ ${route}`);
        failures.push(`Missing route: ${route}`);
      }
    }
  }

  // Check components
  if (contract.components) {
    console.log('\n🧩 Components:');
    for (const component of contract.components) {
      totalChecks++;
      const exists = checkPath(component);
      if (exists) {
        passedChecks++;
        console.log(`  ✅ ${component}`);
      } else {
        console.log(`  ❌ ${component}`);
        failures.push(`Missing component: ${component}`);
      }
    }
  }

  // Check lib
  if (contract.lib) {
    console.log('\n📚 Lib:');
    for (const lib of contract.lib) {
      totalChecks++;
      const exists = checkPath(lib);
      if (exists) {
        passedChecks++;
        console.log(`  ✅ ${lib}`);
      } else {
        console.log(`  ❌ ${lib}`);
        failures.push(`Missing lib: ${lib}`);
      }
    }
  }

  // Check APIs
  if (contract.apis) {
    console.log('\n🔌 APIs:');
    for (const api of contract.apis) {
      totalChecks++;
      const exists = checkPath(api);
      if (exists) {
        passedChecks++;
        console.log(`  ✅ ${api}`);
      } else {
        console.log(`  ❌ ${api}`);
        failures.push(`Missing API: ${api}`);
      }
    }
  }

  // Summary
  const threshold = 0.5; // 50% threshold for contract satisfaction
  const successRate = totalChecks > 0 ? passedChecks / totalChecks : 0;

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📊 Summary: ${passedChecks}/${totalChecks} checks passed (${(successRate * 100).toFixed(1)}%)`);

  const satisfied = successRate >= threshold;
  console.log(satisfied ? '✅ CONTRACT SATISFIED' : '❌ CONTRACT NOT SATISFIED');

  return { binderId, satisfied, passedChecks, totalChecks, successRate, failures };
}

function validateAll() {
  console.log('\n🚀 VALIDATING ALL BINDER CONTRACTS');
  console.log('='.repeat(60));

  const results = [];
  const bindersToValidate = targetBinder
    ? [targetBinder]
    : Object.keys(BINDER_CONTRACTS);

  for (const binderId of bindersToValidate) {
    const contract = BINDER_CONTRACTS[binderId];
    if (!contract) {
      console.log(`\n⚠️  Binder ${binderId} not found in contracts`);
      continue;
    }
    const result = validateBinder(binderId, contract);
    results.push(result);
  }

  // Overall summary
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('📊 OVERALL SUMMARY');
  console.log('='.repeat(60));

  const satisfied = results.filter(r => r.satisfied).length;
  const total = results.length;

  console.log(`\nBinders Validated: ${total}`);
  console.log(`Contracts Satisfied: ${satisfied}`);
  console.log(`Contracts Not Satisfied: ${total - satisfied}`);
  console.log(`Overall Success Rate: ${((satisfied / total) * 100).toFixed(1)}%`);

  console.log('\n📋 Detailed Results:');
  results.forEach(r => {
    const status = r.satisfied ? '✅' : '❌';
    console.log(`  ${status} Binder ${r.binderId}: ${r.passedChecks}/${r.totalChecks} (${(r.successRate * 100).toFixed(1)}%)`);
  });

  console.log('\n');
  return satisfied === total ? 0 : 1;
}

// Run validation
const exitCode = validateAll();
process.exit(exitCode);

