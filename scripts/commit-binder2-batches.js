const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = 'src/pages/api/binder2_FULL';
const BATCH_SIZE = 500;

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

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function getFileRange(files) {
  if (files.length === 0) return '';
  
  // Extract route names from file paths
  const routes = files.map(f => {
    const relative = path.relative(OUTPUT_DIR, f);
    return relative.replace(/\.ts$/, '').replace(/\\/g, '/');
  });
  
  routes.sort();
  
  if (routes.length === 1) {
    return routes[0];
  }
  
  // Get first and last route
  const first = routes[0];
  const last = routes[routes.length - 1];
  
  return `${first} to ${last}`;
}

function main() {
  console.log('🚀 Starting batched commit process for Binder2...\n');
  
  // First, commit the infrastructure (processor + report)
  console.log('📦 Step 1: Commit infrastructure files');
  exec('git add scripts/process-binder2.js ops/reports/binder2_FULL_report.md');
  exec('git commit -m "feat(binder2): add processor and report infrastructure"');
  exec('git push origin main');
  console.log('✅ Infrastructure committed and pushed\n');
  
  // Get all generated API files
  console.log('📂 Step 2: Collecting API files...');
  const allFiles = getAllFiles(OUTPUT_DIR);
  console.log(`Found ${allFiles.length} API files\n`);
  
  // Split into batches
  const batches = [];
  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    batches.push(allFiles.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`📊 Will process ${batches.length} batches of ~${BATCH_SIZE} files each\n`);
  
  // Process each batch
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchNum = i + 1;
    const totalBatches = batches.length;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 Batch ${batchNum}/${totalBatches}: ${batch.length} files`);
    console.log(`${'='.repeat(60)}`);
    
    // Get range for commit message
    const range = getFileRange(batch);
    const commitMsg = `feat(binder2): API endpoints batch ${batchNum}/${totalBatches} (${batch.length} files)`;
    
    console.log(`📝 Range: ${range.substring(0, 100)}${range.length > 100 ? '...' : ''}`);
    
    // Stage files
    console.log(`\n📌 Staging ${batch.length} files...`);
    batch.forEach(file => {
      exec(`git add "${file}"`);
    });
    
    // Commit
    console.log(`\n💾 Committing batch ${batchNum}/${totalBatches}...`);
    exec(`git commit -m "${commitMsg}"`);
    
    // Push
    console.log(`\n🚀 Pushing batch ${batchNum}/${totalBatches} to GitHub...`);
    exec('git push origin main');
    
    // Verify on GitHub using git ls-remote
    console.log(`\n✅ Batch ${batchNum}/${totalBatches} pushed successfully`);
    
    // Small delay between batches
    if (i < batches.length - 1) {
      console.log('\n⏳ Waiting 2 seconds before next batch...');
      execSync('timeout /t 2 /nobreak', { stdio: 'ignore' });
    }
  }
  
  // Final verification
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('🎉 ALL BATCHES COMPLETE');
  console.log(`${'='.repeat(60)}\n`);
  
  console.log('📊 Final verification:');
  exec('git status');
  
  console.log('\n✅ Binder2 processing and commit complete!');
  console.log(`📈 Total: ${allFiles.length} files committed in ${batches.length} batches`);
}

// Run
try {
  main();
} catch (error) {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
}

