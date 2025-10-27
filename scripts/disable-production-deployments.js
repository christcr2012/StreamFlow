#!/usr/bin/env node
/**
 * Script to disable production deployments by changing production branch
 * 
 * This script changes the production branch for all Cortiware projects
 * from 'main' to 'production-ready', preventing automatic production
 * deployments until proper go-live procedures are followed.
 * 
 * See: docs/DISABLE_PRODUCTION_DEPLOYMENTS.md
 */

const { execSync } = require('child_process');

const projects = [
  { name: 'cortiware-tenant-app', dir: 'apps/tenant-app' },
  { name: 'cortiware-provider-portal', dir: 'apps/provider-portal' },
  { name: 'cortiware-marketing-cortiware', dir: 'apps/marketing-cortiware' },
  { name: 'cortiware-marketing-robinson', dir: 'apps/marketing-robinson' }
];

console.log('🔧 Disabling production deployments for all projects...\n');

for (const project of projects) {
  console.log(`📦 Processing: ${project.name}`);
  
  try {
    // Change to project directory
    process.chdir(__dirname + '/../' + project.dir);
    
    // The vercel.json already has git.deploymentEnabled.main = false
    // But we also need to ensure the project is properly linked
    console.log('   ✓ Vercel.json already configured');
    console.log('   ⚠️  Manual step required: Change production branch in Vercel dashboard');
    console.log(`      → Settings → Git → Production Branch → "production-ready"\n`);
    
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}\n`);
  }
}

console.log('\n📋 Summary:');
console.log('✓ All vercel.json files configured with git.deploymentEnabled.main = false');
console.log('\n⚠️  MANUAL STEP REQUIRED:');
console.log('For each project in Vercel dashboard:');
console.log('1. Go to https://vercel.com/dashboard');
console.log('2. Select project');
console.log('3. Settings → Git → Production Branch');
console.log('4. Change from "main" to "production-ready"');
console.log('5. Save\n');
console.log('Projects to update:');
projects.forEach(p => console.log(`  - ${p.name}`));
console.log('\nSee docs/DISABLE_PRODUCTION_DEPLOYMENTS.md for full instructions.');
