#!/usr/bin/env node

/**
 * Performance Baseline Measurement Script
 * 
 * Captures baseline metrics before applying optimizations:
 * - Bundle sizes for all apps
 * - Build times
 * - Dev server startup time
 * - Dependencies count
 * 
 * Usage: node scripts/performance/measure-baseline.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const APPS = [
  'apps/provider-portal',
  'apps/tenant-app',
  'apps/marketing-robinson',
  'apps/marketing-cortiware'
];

const BASELINE_FILE = path.join(__dirname, 'baseline.json');
const RESULTS_DIR = path.join(__dirname, 'results');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

/**
 * Get bundle size for an app
 */
function getBundleSize(appPath) {
  const nextDir = path.join(appPath, '.next');
  
  if (!fs.existsSync(nextDir)) {
    return { error: 'Not built yet' };
  }

  try {
    // Get size of .next directory (excluding cache)
    const output = execSync(
      `du -sh "${nextDir}" | awk '{print $1}'`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();

    // Get detailed breakdown
    const staticDir = path.join(nextDir, 'static');
    const serverDir = path.join(nextDir, 'server');
    
    const staticSize = fs.existsSync(staticDir) 
      ? execSync(`du -sh "${staticDir}" | awk '{print $1}'`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim()
      : '0';
    
    const serverSize = fs.existsSync(serverDir)
      ? execSync(`du -sh "${serverDir}" | awk '{print $1}'`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim()
      : '0';

    return {
      total: output,
      static: staticSize,
      server: serverSize
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Get dependency count
 */
function getDependencyCount(appPath) {
  const packageJsonPath = path.join(appPath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return { error: 'No package.json' };
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  return {
    dependencies: Object.keys(packageJson.dependencies || {}).length,
    devDependencies: Object.keys(packageJson.devDependencies || {}).length,
    total: Object.keys(packageJson.dependencies || {}).length + 
           Object.keys(packageJson.devDependencies || {}).length
  };
}

/**
 * Measure build time for an app
 */
function measureBuildTime(appPath) {
  console.log(`\n📦 Building ${appPath}...`);
  
  const startTime = Date.now();
  
  try {
    execSync(`cd ${appPath} && npm run build`, {
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // seconds
    
    return {
      success: true,
      duration: `${duration.toFixed(2)}s`,
      durationMs: endTime - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get node_modules size
 */
function getNodeModulesSize() {
  try {
    const output = execSync(
      'du -sh node_modules | awk \'{print $1}\'',
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();
    
    return output;
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Main measurement function
 */
async function measureBaseline() {
  console.log('🎯 Measuring Performance Baseline\n');
  console.log('=' .repeat(60));
  
  const baseline = {
    timestamp: new Date().toISOString(),
    git: {
      commit: execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim(),
      branch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()
    },
    nodeVersion: process.version,
    platform: process.platform,
    apps: {},
    monorepo: {
      nodeModulesSize: getNodeModulesSize()
    }
  };

  // Measure each app
  for (const appPath of APPS) {
    const appName = path.basename(appPath);
    console.log(`\n📊 Measuring ${appName}...`);
    
    baseline.apps[appName] = {
      path: appPath,
      dependencies: getDependencyCount(appPath),
      bundleSize: getBundleSize(appPath),
      buildTime: measureBuildTime(appPath)
    };
    
    // Re-measure bundle size after build
    baseline.apps[appName].bundleSize = getBundleSize(appPath);
  }

  // Save baseline
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2));
  
  // Also save timestamped version
  const timestampedFile = path.join(
    RESULTS_DIR,
    `baseline-${new Date().toISOString().replace(/:/g, '-')}.json`
  );
  fs.writeFileSync(timestampedFile, JSON.stringify(baseline, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('✅ Baseline measurement complete!\n');
  console.log(`📄 Baseline saved to: ${BASELINE_FILE}`);
  console.log(`📄 Timestamped copy: ${timestampedFile}\n`);
  
  // Print summary
  printSummary(baseline);
}

/**
 * Print summary of baseline
 */
function printSummary(baseline) {
  console.log('📊 BASELINE SUMMARY\n');
  
  console.log(`Git Commit: ${baseline.git.commit.substring(0, 8)}`);
  console.log(`Git Branch: ${baseline.git.branch}`);
  console.log(`Node Version: ${baseline.nodeVersion}`);
  console.log(`Platform: ${baseline.platform}`);
  console.log(`node_modules Size: ${baseline.monorepo.nodeModulesSize}\n`);
  
  console.log('App Metrics:');
  console.log('-'.repeat(60));
  
  for (const [appName, metrics] of Object.entries(baseline.apps)) {
    console.log(`\n${appName}:`);
    console.log(`  Dependencies: ${metrics.dependencies.total} (${metrics.dependencies.dependencies} prod, ${metrics.dependencies.devDependencies} dev)`);
    
    if (metrics.bundleSize.error) {
      console.log(`  Bundle Size: ${metrics.bundleSize.error}`);
    } else {
      console.log(`  Bundle Size: ${metrics.bundleSize.total} (static: ${metrics.bundleSize.static}, server: ${metrics.bundleSize.server})`);
    }
    
    if (metrics.buildTime.success) {
      console.log(`  Build Time: ${metrics.buildTime.duration}`);
    } else {
      console.log(`  Build Time: FAILED - ${metrics.buildTime.error}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run measurement
measureBaseline().catch(error => {
  console.error('❌ Error measuring baseline:', error);
  process.exit(1);
});

