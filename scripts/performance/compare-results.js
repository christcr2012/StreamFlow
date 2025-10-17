#!/usr/bin/env node

/**
 * Performance Comparison Script
 * 
 * Compares current metrics against baseline to detect regressions or improvements
 * 
 * Usage: node scripts/performance/compare-results.js [baseline-file]
 */

const fs = require('fs');
const path = require('path');

const BASELINE_FILE = process.argv[2] || path.join(__dirname, 'baseline.json');
const CURRENT_FILE = path.join(__dirname, 'current.json');

/**
 * Parse size string (e.g., "1.2M", "500K") to bytes
 */
function parseSize(sizeStr) {
  if (!sizeStr || typeof sizeStr !== 'string') return 0;
  
  const match = sizeStr.match(/^([\d.]+)([KMGT]?)$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  const multipliers = {
    '': 1,
    'K': 1024,
    'M': 1024 * 1024,
    'G': 1024 * 1024 * 1024,
    'T': 1024 * 1024 * 1024 * 1024
  };
  
  return value * (multipliers[unit] || 1);
}

/**
 * Format bytes to human-readable size
 */
function formatSize(bytes) {
  if (bytes === 0) return '0B';
  
  const units = ['B', 'K', 'M', 'G', 'T'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)}${units[i]}`;
}

/**
 * Calculate percentage change
 */
function percentChange(oldVal, newVal) {
  if (oldVal === 0) return newVal > 0 ? 100 : 0;
  return ((newVal - oldVal) / oldVal) * 100;
}

/**
 * Compare two measurements
 */
function compareMeasurements(baseline, current) {
  console.log('📊 PERFORMANCE COMPARISON\n');
  console.log('='.repeat(70));
  
  console.log(`\nBaseline: ${baseline.timestamp}`);
  console.log(`Current:  ${current.timestamp}`);
  console.log(`\nBaseline Commit: ${baseline.git.commit.substring(0, 8)}`);
  console.log(`Current Commit:  ${current.git.commit.substring(0, 8)}\n`);
  
  const results = {
    improvements: [],
    regressions: [],
    unchanged: []
  };
  
  // Compare each app
  for (const appName of Object.keys(baseline.apps)) {
    if (!current.apps[appName]) {
      console.log(`⚠️  ${appName}: Not found in current measurement`);
      continue;
    }
    
    const baseApp = baseline.apps[appName];
    const currApp = current.apps[appName];
    
    console.log(`\n📦 ${appName}`);
    console.log('-'.repeat(70));
    
    // Compare bundle size
    if (!baseApp.bundleSize.error && !currApp.bundleSize.error) {
      const baseSize = parseSize(baseApp.bundleSize.total);
      const currSize = parseSize(currApp.bundleSize.total);
      const change = percentChange(baseSize, currSize);
      
      const icon = change < -5 ? '✅' : change > 5 ? '❌' : '➖';
      const changeStr = change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
      
      console.log(`  Bundle Size: ${baseApp.bundleSize.total} → ${currApp.bundleSize.total} (${changeStr}) ${icon}`);
      
      if (change < -5) {
        results.improvements.push(`${appName}: Bundle size reduced by ${Math.abs(change).toFixed(1)}%`);
      } else if (change > 5) {
        results.regressions.push(`${appName}: Bundle size increased by ${change.toFixed(1)}%`);
      }
    }
    
    // Compare build time
    if (baseApp.buildTime.success && currApp.buildTime.success) {
      const baseTime = baseApp.buildTime.durationMs;
      const currTime = currApp.buildTime.durationMs;
      const change = percentChange(baseTime, currTime);
      
      const icon = change < -5 ? '✅' : change > 5 ? '❌' : '➖';
      const changeStr = change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
      
      console.log(`  Build Time:  ${baseApp.buildTime.duration} → ${currApp.buildTime.duration} (${changeStr}) ${icon}`);
      
      if (change < -5) {
        results.improvements.push(`${appName}: Build time reduced by ${Math.abs(change).toFixed(1)}%`);
      } else if (change > 5) {
        results.regressions.push(`${appName}: Build time increased by ${change.toFixed(1)}%`);
      }
    }
    
    // Compare dependencies
    const baseDeps = baseApp.dependencies.total;
    const currDeps = currApp.dependencies.total;
    const depsChange = currDeps - baseDeps;
    
    if (depsChange !== 0) {
      const icon = depsChange < 0 ? '✅' : depsChange > 0 ? '⚠️' : '➖';
      console.log(`  Dependencies: ${baseDeps} → ${currDeps} (${depsChange > 0 ? '+' : ''}${depsChange}) ${icon}`);
    } else {
      console.log(`  Dependencies: ${baseDeps} (unchanged)`);
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📈 SUMMARY\n');
  
  if (results.improvements.length > 0) {
    console.log('✅ IMPROVEMENTS:');
    results.improvements.forEach(imp => console.log(`   ${imp}`));
    console.log('');
  }
  
  if (results.regressions.length > 0) {
    console.log('❌ REGRESSIONS:');
    results.regressions.forEach(reg => console.log(`   ${reg}`));
    console.log('');
  }
  
  if (results.improvements.length === 0 && results.regressions.length === 0) {
    console.log('➖ No significant changes detected (threshold: ±5%)\n');
  }
  
  console.log('='.repeat(70));
  
  // Exit with error if regressions detected
  if (results.regressions.length > 0) {
    console.log('\n⚠️  Performance regressions detected!');
    console.log('Consider rolling back or investigating the cause.\n');
    process.exit(1);
  } else {
    console.log('\n✅ No performance regressions detected!\n');
    process.exit(0);
  }
}

/**
 * Main function
 */
function main() {
  if (!fs.existsSync(BASELINE_FILE)) {
    console.error(`❌ Baseline file not found: ${BASELINE_FILE}`);
    console.error('Run "npm run perf:baseline" first to create a baseline.');
    process.exit(1);
  }
  
  if (!fs.existsSync(CURRENT_FILE)) {
    console.error(`❌ Current measurement file not found: ${CURRENT_FILE}`);
    console.error('Run "npm run perf:measure" first to create current measurements.');
    process.exit(1);
  }
  
  const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf-8'));
  const current = JSON.parse(fs.readFileSync(CURRENT_FILE, 'utf-8'));
  
  compareMeasurements(baseline, current);
}

main();

