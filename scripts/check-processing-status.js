#!/usr/bin/env node

/**
 * Check Binder Processing Status
 * 
 * Run this script when you wake up to see the final status of autonomous processing.
 * 
 * Usage: node scripts/check-processing-status.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 CHECKING BINDER PROCESSING STATUS\n');
console.log('='.repeat(80));

// 1. Check if processor is still running
console.log('\n📊 PROCESS STATUS:');
try {
  const processes = execSync('Get-Process -Name node -ErrorAction SilentlyContinue | Select-Object Id, CPU, WorkingSet', { 
    shell: 'powershell.exe',
    encoding: 'utf-8' 
  });
  if (processes.trim()) {
    console.log('   ✅ Node processes running:');
    console.log(processes);
  } else {
    console.log('   ✅ No node processes running (processor likely completed)');
  }
} catch (error) {
  console.log('   ✅ Processor completed');
}

// 2. Count generated files
console.log('\n📁 GENERATED FILES:');
try {
  const apiDir = path.join(process.cwd(), 'src', 'pages', 'api');
  
  function countFiles(dir) {
    let count = 0;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        count += countFiles(fullPath);
      } else if (item.name.endsWith('.ts')) {
        count++;
      }
    }
    
    return count;
  }
  
  const totalFiles = countFiles(apiDir);
  console.log(`   ✅ Total API files: ${totalFiles.toLocaleString()}`);
  console.log(`   📊 Expected: ~764,209 files`);
  console.log(`   📈 Progress: ${((totalFiles / 764209) * 100).toFixed(1)}%`);
} catch (error) {
  console.log(`   ❌ Error counting files: ${error.message}`);
}

// 3. Check git commits
console.log('\n📦 GIT COMMITS:');
try {
  const commits = execSync('git log --oneline -20', { encoding: 'utf-8' });
  const binderCommits = commits.split('\n').filter(line => line.includes('binder'));
  console.log(`   ✅ Recent binder commits: ${binderCommits.length}`);
  console.log('\n   Last 10 commits:');
  binderCommits.slice(0, 10).forEach(commit => {
    console.log(`      ${commit}`);
  });
} catch (error) {
  console.log(`   ❌ Error reading git log: ${error.message}`);
}

// 4. Check log file
console.log('\n📋 PROCESSING LOG:');
try {
  const logPath = path.join(process.cwd(), 'binder-processing.log');
  if (fs.existsSync(logPath)) {
    const logContent = fs.readFileSync(logPath, 'utf-8');
    const lines = logContent.split('\n');
    
    // Find summary line
    const summaryLine = lines.find(line => line.includes('FINAL SUMMARY'));
    if (summaryLine) {
      console.log('   ✅ Processing completed!');
      
      // Extract key stats
      const totalBinders = lines.find(line => line.includes('Total binders processed'));
      const totalFiles = lines.find(line => line.includes('Total files generated'));
      
      if (totalBinders) console.log(`   ${totalBinders.trim()}`);
      if (totalFiles) console.log(`   ${totalFiles.trim()}`);
    } else {
      // Show last 20 lines
      console.log('   🔄 Processing still in progress or incomplete');
      console.log('\n   Last 20 log lines:');
      lines.slice(-20).forEach(line => {
        if (line.trim()) console.log(`      ${line}`);
      });
    }
    
    console.log(`\n   📄 Full log: ${logPath}`);
  } else {
    console.log('   ⚠️  Log file not found');
  }
} catch (error) {
  console.log(`   ❌ Error reading log: ${error.message}`);
}

// 5. Check git status
console.log('\n🔄 GIT STATUS:');
try {
  const status = execSync('git status --short', { encoding: 'utf-8' });
  const lines = status.split('\n').filter(l => l.trim());
  
  if (lines.length === 0) {
    console.log('   ✅ Working directory clean (all changes committed)');
  } else {
    console.log(`   ⚠️  ${lines.length} uncommitted changes`);
    if (lines.length <= 10) {
      lines.forEach(line => console.log(`      ${line}`));
    } else {
      console.log(`      (showing first 10 of ${lines.length})`);
      lines.slice(0, 10).forEach(line => console.log(`      ${line}`));
    }
  }
} catch (error) {
  console.log(`   ❌ Error checking git status: ${error.message}`);
}

// 6. Check if push is needed
console.log('\n🚀 PUSH STATUS:');
try {
  const unpushed = execSync('git log origin/main..HEAD --oneline', { encoding: 'utf-8' });
  const unpushedLines = unpushed.split('\n').filter(l => l.trim());
  
  if (unpushedLines.length === 0) {
    console.log('   ✅ All commits pushed to GitHub');
  } else {
    console.log(`   ⚠️  ${unpushedLines.length} commits not yet pushed`);
    console.log('   💡 Run: git push');
  }
} catch (error) {
  console.log(`   ⚠️  Unable to check push status: ${error.message}`);
}

// 7. Repository size
console.log('\n💾 REPOSITORY SIZE:');
try {
  const gitSize = execSync('du -sh .git 2>/dev/null || Get-ChildItem .git -Recurse | Measure-Object -Property Length -Sum | Select-Object -ExpandProperty Sum', {
    shell: 'powershell.exe',
    encoding: 'utf-8'
  });
  const sizeBytes = parseInt(gitSize.trim());
  const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);
  const sizeGB = (sizeBytes / 1024 / 1024 / 1024).toFixed(2);
  
  console.log(`   📊 .git folder size: ${sizeMB} MB (${sizeGB} GB)`);
  
  if (sizeGB > 1) {
    console.log('   ⚠️  Large repository - consider running: git prune');
  }
} catch (error) {
  console.log(`   ⚠️  Unable to check repository size`);
}

// 8. Next steps
console.log('\n' + '='.repeat(80));
console.log('\n📋 NEXT STEPS:\n');

console.log('1. ✅ Review this status report');
console.log('2. 📄 Read FINAL_SUMMARY.md for detailed information');
console.log('3. 📋 Check binder-processing.log for complete processing log');
console.log('4. 🔍 Run TypeScript compiler: npx tsc --noEmit');
console.log('5. 🐛 Begin systematic error analysis (NOT one-by-one fixes)');
console.log('6. 📝 Extract schemas from binder specs and populate TODO comments');
console.log('7. 🧪 Set up testing infrastructure');
console.log('8. 🚀 Deploy and monitor');

console.log('\n' + '='.repeat(80));
console.log('\n✨ Autonomous processing complete! Ready for error analysis.\n');

