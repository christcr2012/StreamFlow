const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = 'src/pages/api/binder2_FULL';
const BATCH_SIZE = 1000;

function exec(command) {
  console.log(`\n💻 ${command}`);
  try {
    const output = execSync(command, { 
      encoding: 'utf-8',
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    if (output) console.log(output);
    return output;
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
}

function main() {
  console.log('🚀 Committing remaining Binder2 files...\n');
  
  // Add all remaining files
  console.log('📌 Adding all remaining files...');
  exec(`git add "${OUTPUT_DIR}"`);
  exec('git add scripts/commit-binder2-batches.js');
  exec('git add scripts/commit-remaining-binder2.js');
  
  // Check status
  const status = exec('git status --short');
  const addedFiles = status.split('\n').filter(line => line.trim()).length;
  
  console.log(`\n📊 Files to commit: ${addedFiles}`);
  
  if (addedFiles === 0) {
    console.log('\n✅ No files to commit - everything is already pushed!');
    return;
  }
  
  // Commit
  console.log('\n💾 Committing batch 2/3...');
  exec('git commit -m "feat(binder2): API endpoints batch 2/3 (remaining files)"');
  
  // Push
  console.log('\n🚀 Pushing to GitHub...');
  exec('git push origin main');
  
  console.log('\n✅ Batch 2/3 pushed successfully!');
  
  // Final status check
  console.log('\n📊 Final verification:');
  exec('git status');
  
  console.log('\n✅ All Binder2 files committed and pushed!');
}

// Run
try {
  main();
} catch (error) {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
}

