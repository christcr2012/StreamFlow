#!/usr/bin/env node

/**
 * 🎯 STREAMFLOW TODO COMPLETION SYSTEM
 * 
 * Comprehensive system to identify, prioritize, and complete all TODO items:
 * - Scan all source files for TODO/FIXME/HACK items
 * - Categorize by priority and system
 * - Generate completion plan
 * - Track progress
 * - Validate completions
 */

const fs = require('fs');
const path = require('path');

// TODO categories and priorities
const TODO_PATTERNS = {
  'CRITICAL': /TODO.*CRITICAL|FIXME.*CRITICAL|HACK.*CRITICAL/gi,
  'HIGH': /TODO.*HIGH|FIXME.*HIGH|TODO.*URGENT|FIXME.*URGENT/gi,
  'MEDIUM': /TODO.*MEDIUM|TODO(?!.*LOW)(?!.*HIGH)(?!.*CRITICAL)/gi,
  'LOW': /TODO.*LOW|HACK(?!.*CRITICAL)/gi,
  'FIXME': /FIXME(?!.*CRITICAL)(?!.*HIGH)/gi
};

const SYSTEM_CATEGORIES = {
  'Authentication': ['auth', 'login', 'session', 'cookie', 'token'],
  'Database': ['prisma', 'db', 'database', 'schema', 'migration'],
  'Security': ['security', 'encrypt', 'hash', 'validate', 'sanitize'],
  'API': ['api', 'endpoint', 'route', 'handler', 'middleware'],
  'UI/UX': ['component', 'layout', 'theme', 'style', 'responsive'],
  'Integration': ['webhook', 'stripe', 'twilio', 'external', 'third-party'],
  'Performance': ['optimize', 'cache', 'performance', 'speed', 'memory'],
  'Testing': ['test', 'spec', 'mock', 'validate', 'audit'],
  'Documentation': ['doc', 'comment', 'readme', 'guide', 'example']
};

/**
 * Scan directory for source files
 */
function scanSourceFiles(dir) {
  const files = [];
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.md', '.json'];
  
  function scan(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scan(fullPath);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  scan(dir);
  return files;
}

/**
 * Extract TODO items from file
 */
function extractTodos(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const todos = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Check for TODO patterns
      for (const [priority, pattern] of Object.entries(TODO_PATTERNS)) {
        const matches = trimmedLine.match(pattern);
        if (matches) {
          // Determine system category
          let category = 'General';
          for (const [system, keywords] of Object.entries(SYSTEM_CATEGORIES)) {
            if (keywords.some(keyword => 
              trimmedLine.toLowerCase().includes(keyword) ||
              filePath.toLowerCase().includes(keyword)
            )) {
              category = system;
              break;
            }
          }
          
          todos.push({
            file: path.relative(process.cwd(), filePath),
            line: index + 1,
            priority,
            category,
            text: trimmedLine,
            context: lines.slice(Math.max(0, index - 2), index + 3).join('\n')
          });
        }
      }
    });
    
    return todos;
  } catch (error) {
    return [];
  }
}

/**
 * Analyze TODO items
 */
function analyzeTodos() {
  console.log('🔍 SCANNING FOR TODO ITEMS...');
  
  const sourceFiles = scanSourceFiles(process.cwd());
  const allTodos = [];
  
  for (const file of sourceFiles) {
    const todos = extractTodos(file);
    allTodos.push(...todos);
  }
  
  console.log(`📝 Found ${allTodos.length} TODO items across ${sourceFiles.length} files`);
  
  return allTodos;
}

/**
 * Categorize and prioritize TODOs
 */
function categorizeTodos(todos) {
  const categorized = {
    byPriority: {},
    byCategory: {},
    byFile: {}
  };
  
  // Initialize categories
  Object.keys(TODO_PATTERNS).forEach(priority => {
    categorized.byPriority[priority] = [];
  });
  
  Object.keys(SYSTEM_CATEGORIES).forEach(category => {
    categorized.byCategory[category] = [];
  });
  categorized.byCategory['General'] = [];
  
  // Categorize todos
  todos.forEach(todo => {
    categorized.byPriority[todo.priority].push(todo);
    categorized.byCategory[todo.category].push(todo);
    
    if (!categorized.byFile[todo.file]) {
      categorized.byFile[todo.file] = [];
    }
    categorized.byFile[todo.file].push(todo);
  });
  
  return categorized;
}

/**
 * Generate completion plan
 */
function generateCompletionPlan(categorized) {
  console.log('\n📋 GENERATING TODO COMPLETION PLAN');
  console.log('='.repeat(50));
  
  const plan = {
    phases: [],
    totalItems: 0,
    estimatedHours: 0
  };
  
  // Phase 1: Critical items
  const criticalItems = categorized.byPriority.CRITICAL || [];
  if (criticalItems.length > 0) {
    plan.phases.push({
      name: 'Phase 1: Critical Issues',
      priority: 'CRITICAL',
      items: criticalItems,
      estimatedHours: criticalItems.length * 2
    });
  }
  
  // Phase 2: High priority items
  const highItems = categorized.byPriority.HIGH || [];
  if (highItems.length > 0) {
    plan.phases.push({
      name: 'Phase 2: High Priority',
      priority: 'HIGH', 
      items: highItems,
      estimatedHours: highItems.length * 1.5
    });
  }
  
  // Phase 3: Security and Authentication
  const securityItems = [
    ...(categorized.byCategory.Security || []),
    ...(categorized.byCategory.Authentication || [])
  ].filter(item => !criticalItems.includes(item) && !highItems.includes(item));
  
  if (securityItems.length > 0) {
    plan.phases.push({
      name: 'Phase 3: Security & Authentication',
      priority: 'SECURITY',
      items: securityItems,
      estimatedHours: securityItems.length * 1
    });
  }
  
  // Phase 4: API and Database
  const apiDbItems = [
    ...(categorized.byCategory.API || []),
    ...(categorized.byCategory.Database || [])
  ].filter(item => 
    !criticalItems.includes(item) && 
    !highItems.includes(item) && 
    !securityItems.includes(item)
  );
  
  if (apiDbItems.length > 0) {
    plan.phases.push({
      name: 'Phase 4: API & Database',
      priority: 'API_DB',
      items: apiDbItems,
      estimatedHours: apiDbItems.length * 0.75
    });
  }
  
  // Phase 5: UI/UX and Integration
  const uiIntegrationItems = [
    ...(categorized.byCategory['UI/UX'] || []),
    ...(categorized.byCategory.Integration || [])
  ].filter(item => 
    !criticalItems.includes(item) && 
    !highItems.includes(item) && 
    !securityItems.includes(item) &&
    !apiDbItems.includes(item)
  );
  
  if (uiIntegrationItems.length > 0) {
    plan.phases.push({
      name: 'Phase 5: UI/UX & Integration',
      priority: 'UI_INTEGRATION',
      items: uiIntegrationItems,
      estimatedHours: uiIntegrationItems.length * 0.5
    });
  }
  
  // Phase 6: Everything else
  const remainingItems = Object.values(categorized.byPriority)
    .flat()
    .filter(item => 
      !criticalItems.includes(item) && 
      !highItems.includes(item) && 
      !securityItems.includes(item) &&
      !apiDbItems.includes(item) &&
      !uiIntegrationItems.includes(item)
    );
  
  if (remainingItems.length > 0) {
    plan.phases.push({
      name: 'Phase 6: General Improvements',
      priority: 'GENERAL',
      items: remainingItems,
      estimatedHours: remainingItems.length * 0.25
    });
  }
  
  plan.totalItems = plan.phases.reduce((sum, phase) => sum + phase.items.length, 0);
  plan.estimatedHours = plan.phases.reduce((sum, phase) => sum + phase.estimatedHours, 0);
  
  return plan;
}

/**
 * Display completion plan
 */
function displayCompletionPlan(plan) {
  console.log(`\n🎯 TODO COMPLETION PLAN (${plan.totalItems} items, ~${plan.estimatedHours.toFixed(1)} hours)`);
  console.log('='.repeat(60));
  
  plan.phases.forEach((phase, index) => {
    console.log(`\n📌 ${phase.name} (${phase.items.length} items, ~${phase.estimatedHours.toFixed(1)}h)`);
    console.log('-'.repeat(40));
    
    // Group by file for better organization
    const byFile = {};
    phase.items.forEach(item => {
      if (!byFile[item.file]) byFile[item.file] = [];
      byFile[item.file].push(item);
    });
    
    Object.entries(byFile).forEach(([file, items]) => {
      console.log(`\n  📁 ${file} (${items.length} items)`);
      items.slice(0, 3).forEach(item => {
        const shortText = item.text.length > 60 ? 
          item.text.substring(0, 60) + '...' : 
          item.text;
        console.log(`    • Line ${item.line}: ${shortText}`);
      });
      
      if (items.length > 3) {
        console.log(`    ... and ${items.length - 3} more items`);
      }
    });
  });
  
  console.log('\n📊 SUMMARY BY CATEGORY:');
  const categoryStats = {};
  plan.phases.forEach(phase => {
    phase.items.forEach(item => {
      categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
    });
  });
  
  Object.entries(categoryStats)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count} items`);
    });
}

/**
 * Identify high-impact TODOs to complete first
 */
function identifyHighImpactTodos(plan) {
  console.log('\n🚀 HIGH-IMPACT TODOS TO COMPLETE IMMEDIATELY:');
  console.log('='.repeat(50));
  
  const highImpact = [];
  
  // Find critical authentication/security items
  plan.phases.forEach(phase => {
    phase.items.forEach(item => {
      if (
        (item.category === 'Authentication' || item.category === 'Security') &&
        (item.priority === 'CRITICAL' || item.priority === 'HIGH')
      ) {
        highImpact.push(item);
      }
    });
  });
  
  // Find items in key files
  const keyFiles = [
    'src/pages/api/auth/login.ts',
    'src/middleware.ts',
    'src/lib/auth-service.ts',
    'src/pages/api/_health.ts'
  ];
  
  plan.phases.forEach(phase => {
    phase.items.forEach(item => {
      if (keyFiles.some(keyFile => item.file.includes(keyFile))) {
        highImpact.push(item);
      }
    });
  });
  
  // Remove duplicates
  const uniqueHighImpact = highImpact.filter((item, index, self) => 
    index === self.findIndex(t => t.file === item.file && t.line === item.line)
  );
  
  uniqueHighImpact.slice(0, 10).forEach((item, index) => {
    console.log(`\n${index + 1}. 📁 ${item.file}:${item.line}`);
    console.log(`   🏷️  ${item.category} | ${item.priority}`);
    console.log(`   📝 ${item.text}`);
  });
  
  return uniqueHighImpact;
}

/**
 * Main execution
 */
function runTodoAnalysis() {
  console.log('🎯 STREAMFLOW TODO COMPLETION SYSTEM');
  console.log('='.repeat(60));
  console.log(`⏰ Started: ${new Date().toISOString()}`);
  
  try {
    // Analyze all TODOs
    const todos = analyzeTodos();
    
    if (todos.length === 0) {
      console.log('🎉 No TODO items found! System is complete.');
      return;
    }
    
    // Categorize and prioritize
    const categorized = categorizeTodos(todos);
    
    // Generate completion plan
    const plan = generateCompletionPlan(categorized);
    
    // Display plan
    displayCompletionPlan(plan);
    
    // Identify high-impact items
    const highImpact = identifyHighImpactTodos(plan);
    
    // Save results
    const results = {
      timestamp: new Date().toISOString(),
      totalTodos: todos.length,
      categorized,
      plan,
      highImpact
    };
    
    fs.writeFileSync('todo-analysis.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Analysis saved to todo-analysis.json');
    
    console.log('\n🎯 TODO ANALYSIS COMPLETE!');
    console.log(`📊 Total: ${todos.length} items | Estimated: ${plan.estimatedHours.toFixed(1)} hours`);
    
  } catch (error) {
    console.error('💥 Analysis error:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  runTodoAnalysis();
}

module.exports = { runTodoAnalysis };
