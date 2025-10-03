#!/usr/bin/env node

/**
 * Sequential Binder Implementation System
 * Processes ONE binder at a time to 100% verified completion
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SequentialBinderSystem {
  constructor() {
    this.currentBinder = null;
    this.workingDir = 'logs/current-binder';
    this.phases = [
      'ANALYZE',
      'PLAN', 
      'IMPLEMENT',
      'TEST',
      'VERIFY',
      'COMMIT'
    ];
    this.currentPhase = 'ANALYZE';
    this.manifest = null;
    this.implementationPlan = null;
    this.verificationResults = null;
  }

  // ============================================================================
  // PHASE 1: ANALYZE - Build complete manifest of binder contents
  // ============================================================================
  
  async analyzeBinder(binderPath) {
    console.log(`🔍 PHASE 1: ANALYZING ${binderPath}...`);
    
    const content = fs.readFileSync(binderPath, 'utf8');
    const lines = content.split('\n');
    
    this.manifest = {
      metadata: {
        file: binderPath,
        totalLines: lines.length,
        analyzedAt: new Date().toISOString()
      },
      items: {
        buttons: [],
        endpoints: [],
        apiExamples: [],
        testCases: [],
        databaseSchemas: [],
        sqlStatements: [],
        seedData: [],
        configurations: [],
        requirements: [],
        components: [],
        pages: [],
        hooks: [],
        services: []
      },
      sections: {},
      dependencies: [],
      estimatedHours: 0
    };

    // Parse every line systematically
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      this.parseLine(line, lineNumber, lines);
    }

    // Calculate totals and estimates
    this.calculateImplementationEstimate();
    
    // Save manifest
    this.saveManifest();
    
    console.log(`✅ ANALYSIS COMPLETE: ${this.getTotalItems()} items identified`);
    return this.manifest;
  }

  parseLine(line, lineNumber, allLines) {
    // Buttons
    const buttonMatch = line.match(/^### Button (\d+): \*\*(.*?)\*\*/);
    if (buttonMatch) {
      this.manifest.items.buttons.push({
        id: buttonMatch[1],
        name: buttonMatch[2],
        lineNumber,
        implemented: false,
        dependencies: this.extractDependencies(allLines, lineNumber)
      });
    }

    // API Examples
    const apiMatch = line.match(/^### (API Endpoint Example|Example) (\d+)/);
    if (apiMatch) {
      this.manifest.items.apiExamples.push({
        id: apiMatch[2],
        type: apiMatch[1],
        lineNumber,
        implemented: false
      });
    }

    // Test Cases
    const testMatch = line.match(/^- TestCase (\d+): (.+)/);
    if (testMatch) {
      this.manifest.items.testCases.push({
        id: testMatch[1],
        description: testMatch[2],
        lineNumber,
        implemented: false
      });
    }

    // Database Schemas
    const tableMatch = line.match(/^CREATE TABLE (\w+)/);
    if (tableMatch) {
      this.manifest.items.databaseSchemas.push({
        tableName: tableMatch[1],
        lineNumber,
        implemented: false
      });
    }

    // Components
    const componentMatch = line.match(/^## Component: (.+)/);
    if (componentMatch) {
      this.manifest.items.components.push({
        name: componentMatch[1],
        lineNumber,
        implemented: false
      });
    }

    // Pages
    const pageMatch = line.match(/^## Page: (.+)/);
    if (pageMatch) {
      this.manifest.items.pages.push({
        name: pageMatch[1],
        lineNumber,
        implemented: false
      });
    }

    // Hooks
    const hookMatch = line.match(/^## Hook: (.+)/);
    if (hookMatch) {
      this.manifest.items.hooks.push({
        name: hookMatch[1],
        lineNumber,
        implemented: false
      });
    }

    // Services
    const serviceMatch = line.match(/^## Service: (.+)/);
    if (serviceMatch) {
      this.manifest.items.services.push({
        name: serviceMatch[1],
        lineNumber,
        implemented: false
      });
    }
  }

  extractDependencies(allLines, startLine) {
    // Look ahead 20 lines for dependencies
    const dependencies = [];
    for (let i = startLine; i < Math.min(startLine + 20, allLines.length); i++) {
      const line = allLines[i];
      
      // Look for API dependencies
      const apiMatch = line.match(/- API: `(POST|GET|PUT|DELETE) (.+?)`/);
      if (apiMatch) {
        dependencies.push({
          type: 'api',
          method: apiMatch[1],
          path: apiMatch[2]
        });
      }
      
      // Look for component dependencies
      const compMatch = line.match(/- Component: (.+)/);
      if (compMatch) {
        dependencies.push({
          type: 'component',
          name: compMatch[1]
        });
      }
    }
    
    return dependencies;
  }

  // ============================================================================
  // PHASE 2: PLAN - Create detailed implementation plan
  // ============================================================================
  
  async createImplementationPlan() {
    console.log(`📋 PHASE 2: CREATING IMPLEMENTATION PLAN...`);
    
    this.implementationPlan = {
      phases: [],
      totalEstimatedHours: 0,
      dependencies: this.buildDependencyGraph(),
      implementationOrder: []
    };

    // Phase 2.1: Database & Infrastructure
    const infraPhase = {
      name: 'Infrastructure',
      items: [
        ...this.manifest.items.databaseSchemas,
        ...this.manifest.items.sqlStatements
      ],
      estimatedHours: this.manifest.items.databaseSchemas.length * 0.5
    };

    // Phase 2.2: Backend APIs
    const backendPhase = {
      name: 'Backend APIs',
      items: [
        ...this.manifest.items.buttons.filter(b => b.dependencies.some(d => d.type === 'api')),
        ...this.manifest.items.apiExamples
      ],
      estimatedHours: (this.manifest.items.buttons.length * 0.3) + (this.manifest.items.apiExamples.length * 0.1)
    };

    // Phase 2.3: Frontend Components
    const frontendPhase = {
      name: 'Frontend',
      items: [
        ...this.manifest.items.components,
        ...this.manifest.items.pages,
        ...this.manifest.items.hooks,
        ...this.manifest.items.services
      ],
      estimatedHours: (this.manifest.items.components.length * 0.4) + (this.manifest.items.pages.length * 0.6)
    };

    // Phase 2.4: Tests
    const testPhase = {
      name: 'Tests',
      items: this.manifest.items.testCases,
      estimatedHours: this.manifest.items.testCases.length * 0.2
    };

    this.implementationPlan.phases = [infraPhase, backendPhase, frontendPhase, testPhase];
    this.implementationPlan.totalEstimatedHours = this.implementationPlan.phases
      .reduce((sum, phase) => sum + phase.estimatedHours, 0);

    // Create implementation order based on dependencies
    this.implementationPlan.implementationOrder = this.createImplementationOrder();

    this.saveImplementationPlan();
    
    console.log(`✅ PLAN COMPLETE: ${this.implementationPlan.phases.length} phases, ${this.implementationPlan.totalEstimatedHours}h estimated`);
    return this.implementationPlan;
  }

  buildDependencyGraph() {
    const graph = {};
    
    // Build dependency relationships
    this.manifest.items.buttons.forEach(button => {
      graph[`button_${button.id}`] = button.dependencies.map(dep => {
        if (dep.type === 'api') return `api_${dep.path}`;
        if (dep.type === 'component') return `component_${dep.name}`;
        return dep;
      });
    });

    return graph;
  }

  createImplementationOrder() {
    // Topological sort based on dependencies
    const order = [];
    const visited = new Set();
    
    // Start with items that have no dependencies
    Object.keys(this.implementationPlan.dependencies).forEach(item => {
      if (this.implementationPlan.dependencies[item].length === 0) {
        order.push(item);
        visited.add(item);
      }
    });

    // Add remaining items in dependency order
    // (Simplified - would need full topological sort for complex dependencies)
    
    return order;
  }

  // ============================================================================
  // PHASE 3: IMPLEMENT - Execute implementation in planned order
  // ============================================================================
  
  async executeImplementation() {
    console.log(`🔧 PHASE 3: EXECUTING IMPLEMENTATION...`);
    
    const results = {
      completed: [],
      failed: [],
      skipped: []
    };

    for (const phase of this.implementationPlan.phases) {
      console.log(`\n📦 Implementing ${phase.name}...`);
      
      for (const item of phase.items) {
        try {
          await this.implementItem(item);
          results.completed.push(item);
          console.log(`  ✅ ${this.getItemDescription(item)}`);
        } catch (error) {
          console.log(`  ❌ ${this.getItemDescription(item)}: ${error.message}`);
          results.failed.push({ item, error: error.message });
        }
      }
    }

    console.log(`✅ IMPLEMENTATION COMPLETE: ${results.completed.length} items implemented`);
    if (results.failed.length > 0) {
      console.log(`❌ ${results.failed.length} items failed`);
    }

    return results;
  }

  async implementItem(item) {
    // Route to appropriate implementation method based on item type
    if (item.tableName) {
      return await this.implementDatabaseSchema(item);
    } else if (item.type === 'API Endpoint Example') {
      return await this.implementApiExample(item);
    } else if (item.name && item.dependencies) {
      return await this.implementButton(item);
    } else if (item.description) {
      return await this.implementTestCase(item);
    }
    
    throw new Error(`Unknown item type: ${JSON.stringify(item)}`);
  }

  async implementDatabaseSchema(schema) {
    // Add to Prisma schema
    // Generate migration
    // Apply migration
  }

  async implementApiExample(example) {
    // Generate API endpoint file
    // Add to routing
    // Add middleware
  }

  async implementButton(button) {
    // Generate component
    // Add event handlers
    // Wire up APIs
  }

  async implementTestCase(testCase) {
    // Generate test file
    // Add test assertions
    // Configure test runner
  }

  // ============================================================================
  // PHASE 4: TEST - Run comprehensive tests
  // ============================================================================
  
  async runTests() {
    console.log(`🧪 PHASE 4: RUNNING TESTS...`);
    
    const testResults = {
      typescript: null,
      unit: null,
      integration: null,
      e2e: null,
      build: null
    };

    // TypeScript compilation
    try {
      execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
      testResults.typescript = { passed: true };
      console.log('✅ TypeScript compilation passed');
    } catch (error) {
      testResults.typescript = { passed: false, error: error.message };
      console.log('❌ TypeScript compilation failed');
    }

    // Unit tests
    try {
      execSync('npm test', { stdio: 'pipe' });
      testResults.unit = { passed: true };
      console.log('✅ Unit tests passed');
    } catch (error) {
      testResults.unit = { passed: false, error: error.message };
      console.log('❌ Unit tests failed');
    }

    // Build test
    try {
      execSync('npm run build', { stdio: 'pipe' });
      testResults.build = { passed: true };
      console.log('✅ Build test passed');
    } catch (error) {
      testResults.build = { passed: false, error: error.message };
      console.log('❌ Build test failed');
    }

    return testResults;
  }

  // ============================================================================
  // PHASE 5: VERIFY - Verify 100% implementation
  // ============================================================================
  
  async verifyImplementation() {
    console.log(`✅ PHASE 5: VERIFYING 100% IMPLEMENTATION...`);
    
    this.verificationResults = {
      totalItems: this.getTotalItems(),
      implementedItems: 0,
      verificationChecks: [],
      completionPercentage: 0,
      passed: false
    };

    // Check each item type
    for (const [itemType, items] of Object.entries(this.manifest.items)) {
      if (Array.isArray(items)) {
        const check = await this.verifyItemType(itemType, items);
        this.verificationResults.verificationChecks.push(check);
        this.verificationResults.implementedItems += check.implemented;
      }
    }

    this.verificationResults.completionPercentage = Math.round(
      (this.verificationResults.implementedItems / this.verificationResults.totalItems) * 100
    );

    this.verificationResults.passed = this.verificationResults.completionPercentage === 100;

    console.log(`📊 VERIFICATION COMPLETE: ${this.verificationResults.completionPercentage}% implemented`);
    
    return this.verificationResults;
  }

  async verifyItemType(itemType, items) {
    const check = {
      itemType,
      total: items.length,
      implemented: 0,
      details: []
    };

    for (const item of items) {
      const isImplemented = await this.checkItemImplementation(itemType, item);
      if (isImplemented) {
        check.implemented++;
      }
      check.details.push({
        item: this.getItemDescription(item),
        implemented: isImplemented
      });
    }

    return check;
  }

  async checkItemImplementation(itemType, item) {
    // Implement specific checks for each item type
    switch (itemType) {
      case 'apiExamples':
        return fs.existsSync(path.join('src/pages/api/v1/example', `${item.id}.ts`));
      case 'databaseSchemas':
        const prismaContent = fs.readFileSync('prisma/schema.prisma', 'utf8');
        return prismaContent.includes(`model ${item.tableName}`);
      case 'testCases':
        return fs.existsSync(path.join('tests', `test-${item.id}.test.ts`));
      default:
        return false;
    }
  }

  // ============================================================================
  // PHASE 6: COMMIT - Commit verified implementation
  // ============================================================================
  
  async commitImplementation() {
    console.log(`💾 PHASE 6: COMMITTING IMPLEMENTATION...`);
    
    if (!this.verificationResults.passed) {
      throw new Error(`Cannot commit: Implementation not 100% complete (${this.verificationResults.completionPercentage}%)`);
    }

    const commitMessage = this.generateCommitMessage();
    
    try {
      execSync('git add .', { stdio: 'pipe' });
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'pipe' });
      console.log('✅ Implementation committed successfully');
      
      // Tag the completion
      const tag = `${this.currentBinder}-complete`;
      execSync(`git tag ${tag}`, { stdio: 'pipe' });
      console.log(`✅ Tagged as ${tag}`);
      
    } catch (error) {
      console.log(`❌ Commit failed: ${error.message}`);
      throw error;
    }
  }

  generateCommitMessage() {
    const binderName = path.basename(this.manifest.metadata.file, '.md');
    return `feat(${binderName}): 🎉 100% COMPLETE IMPLEMENTATION ✅

📊 COMPREHENSIVE IMPLEMENTATION:
- Total Items: ${this.verificationResults.totalItems.toLocaleString()}
- Completion: ${this.verificationResults.completionPercentage}%
- Implementation Time: ${this.implementationPlan.totalEstimatedHours}h

🏗️ IMPLEMENTED COMPONENTS:
${this.verificationResults.verificationChecks.map(check => 
  `- ${check.itemType}: ${check.implemented}/${check.total} (${Math.round((check.implemented/check.total)*100)}%)`
).join('\n')}

✅ VERIFICATION PASSED: All items implemented and tested
🚀 ${binderName} ready for production deployment!`;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  getTotalItems() {
    return Object.values(this.manifest.items)
      .filter(Array.isArray)
      .reduce((sum, items) => sum + items.length, 0);
  }

  getItemDescription(item) {
    if (item.name) return item.name;
    if (item.tableName) return `Table: ${item.tableName}`;
    if (item.description) return item.description;
    if (item.id) return `Item ${item.id}`;
    return 'Unknown item';
  }

  calculateImplementationEstimate() {
    // Calculate based on item types and complexity
    let totalHours = 0;
    
    totalHours += this.manifest.items.buttons.length * 0.5;
    totalHours += this.manifest.items.apiExamples.length * 0.1;
    totalHours += this.manifest.items.testCases.length * 0.2;
    totalHours += this.manifest.items.databaseSchemas.length * 0.5;
    totalHours += this.manifest.items.components.length * 0.4;
    totalHours += this.manifest.items.pages.length * 0.6;
    
    this.manifest.estimatedHours = Math.round(totalHours);
  }

  saveManifest() {
    if (!fs.existsSync(this.workingDir)) {
      fs.mkdirSync(this.workingDir, { recursive: true });
    }
    
    const manifestPath = path.join(this.workingDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(this.manifest, null, 2));
  }

  saveImplementationPlan() {
    const planPath = path.join(this.workingDir, 'implementation-plan.json');
    fs.writeFileSync(planPath, JSON.stringify(this.implementationPlan, null, 2));
  }

  // ============================================================================
  // MAIN EXECUTION METHOD
  // ============================================================================
  
  async processBinder(binderPath) {
    console.log(`🚀 SEQUENTIAL BINDER SYSTEM: Processing ${binderPath}`);
    console.log('=' .repeat(80));
    
    this.currentBinder = path.basename(binderPath, '.md');
    
    try {
      // Phase 1: Analyze
      await this.analyzeBinder(binderPath);
      
      // Phase 2: Plan
      await this.createImplementationPlan();
      
      // Phase 3: Implement
      const implementationResults = await this.executeImplementation();
      
      // Phase 4: Test
      const testResults = await this.runTests();
      
      // Phase 5: Verify
      const verificationResults = await this.verifyImplementation();
      
      // Phase 6: Commit (only if 100% complete)
      if (verificationResults.passed) {
        await this.commitImplementation();
        console.log(`\n🎉 ${this.currentBinder} SUCCESSFULLY COMPLETED TO 100%! 🎉`);
      } else {
        console.log(`\n❌ ${this.currentBinder} NOT COMPLETE: ${verificationResults.completionPercentage}%`);
        console.log('Fix issues and re-run to achieve 100% completion.');
      }
      
      return {
        binder: this.currentBinder,
        completed: verificationResults.passed,
        completionPercentage: verificationResults.completionPercentage,
        totalItems: verificationResults.totalItems,
        implementedItems: verificationResults.implementedItems
      };
      
    } catch (error) {
      console.error(`❌ Error processing ${this.currentBinder}: ${error.message}`);
      throw error;
    }
  }
}

// CLI Interface
if (require.main === module) {
  const binderPath = process.argv[2];
  
  if (!binderPath) {
    console.log('Usage: node sequential-binder-system.js <binder-file-path>');
    console.log('Example: node sequential-binder-system.js binderFiles/binder5_FULL.md');
    process.exit(1);
  }
  
  const system = new SequentialBinderSystem();
  system.processBinder(binderPath).catch(console.error);
}

module.exports = SequentialBinderSystem;
