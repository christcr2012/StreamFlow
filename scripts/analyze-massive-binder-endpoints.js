#!/usr/bin/env node

/**
 * Enhanced BINDER5_FULL.md Analysis Tool
 * Detects ALL API endpoints including the thousands of examples
 */

const fs = require('fs');
const path = require('path');

class MassiveBinderAnalyzer {
  constructor(binderPath) {
    this.binderPath = binderPath;
    this.content = '';
    this.lines = [];
    this.analysis = {
      totalLines: 0,
      coreButtons: [],
      exampleEndpoints: [],
      testCases: [],
      databaseSchemas: [],
      sections: {
        core: { start: 1, end: 2000, items: [] },
        schemas: { start: 2000, end: 3000, items: [] },
        examples: { start: 3000, end: 200000, items: [] },
        tests: { start: 200000, end: 244524, items: [] }
      }
    };
  }

  async loadFile() {
    try {
      this.content = fs.readFileSync(this.binderPath, 'utf8');
      this.lines = this.content.split('\n');
      this.analysis.totalLines = this.lines.length;
      console.log(`✅ Loaded ${this.analysis.totalLines} lines from ${this.binderPath}`);
    } catch (error) {
      console.error(`❌ Error loading file: ${error.message}`);
      throw error;
    }
  }

  analyzeCoreButtons() {
    console.log('🔍 Analyzing core buttons (lines 1-2000)...');
    
    const buttonPattern = /^### Button \d+: \*\*(.*?)\*\*/;
    let buttonCount = 0;
    
    for (let i = 0; i < Math.min(2000, this.lines.length); i++) {
      const line = this.lines[i];
      const match = buttonPattern.exec(line);
      
      if (match) {
        const buttonName = match[1];
        
        // Extract API endpoint from following lines
        let endpoint = null;
        for (let j = i + 1; j < Math.min(i + 20, this.lines.length); j++) {
          const apiMatch = /- API: `(POST|GET|PUT|DELETE) (.+?)`/.exec(this.lines[j]);
          if (apiMatch) {
            endpoint = {
              method: apiMatch[1],
              path: apiMatch[2]
            };
            break;
          }
        }
        
        this.analysis.coreButtons.push({
          name: buttonName,
          lineNumber: i + 1,
          endpoint: endpoint,
          implemented: this.checkIfImplemented(endpoint)
        });
        
        buttonCount++;
      }
    }
    
    console.log(`✅ Found ${buttonCount} core buttons`);
  }

  analyzeExampleEndpoints() {
    console.log('🔍 Analyzing example endpoints (lines 3000-200000)...');
    
    const patterns = [
      /### Example (\d+)/,
      /### API Endpoint Example (\d+)/,
      /- \*\*Path\*\*: (.+)/,
      /- \*\*Method\*\*: (POST|GET|PUT|DELETE)/
    ];
    
    let currentExample = null;
    let exampleCount = 0;
    
    for (let i = 3000; i < Math.min(200000, this.lines.length); i++) {
      const line = this.lines[i];
      
      // Check for example start
      const exampleMatch = patterns[0].exec(line) || patterns[1].exec(line);
      if (exampleMatch) {
        if (currentExample) {
          this.analysis.exampleEndpoints.push(currentExample);
          exampleCount++;
        }
        
        currentExample = {
          id: exampleMatch[1],
          lineNumber: i + 1,
          method: null,
          path: null,
          implemented: false
        };
      }
      
      // Extract method and path
      if (currentExample) {
        const pathMatch = patterns[2].exec(line);
        const methodMatch = patterns[3].exec(line);
        
        if (pathMatch) {
          currentExample.path = pathMatch[1];
        }
        if (methodMatch) {
          currentExample.method = methodMatch[1];
        }
        
        // Check if we have both method and path
        if (currentExample.method && currentExample.path) {
          currentExample.implemented = this.checkExampleEndpointImplemented(currentExample.id);
        }
      }
    }
    
    // Add the last example
    if (currentExample) {
      if (currentExample.method && currentExample.path) {
        currentExample.implemented = this.checkExampleEndpointImplemented(currentExample.id);
      }
      this.analysis.exampleEndpoints.push(currentExample);
      exampleCount++;
    }
    
    console.log(`✅ Found ${exampleCount} example endpoints`);
  }

  analyzeTestCases() {
    console.log('🔍 Analyzing test cases (lines 200000-244524)...');
    
    const testPattern = /- TestCase (\d+): (.+)/;
    let testCount = 0;
    
    for (let i = 200000; i < this.lines.length; i++) {
      const line = this.lines[i];
      const match = testPattern.exec(line);
      
      if (match) {
        this.analysis.testCases.push({
          id: match[1],
          description: match[2],
          lineNumber: i + 1
        });
        testCount++;
      }
    }
    
    console.log(`✅ Found ${testCount} test cases`);
  }

  analyzeDatabaseSchemas() {
    console.log('🔍 Analyzing database schemas (lines 2000-3000)...');
    
    const createTablePattern = /CREATE TABLE (\w+) \(/;
    let schemaCount = 0;
    
    for (let i = 2000; i < Math.min(3000, this.lines.length); i++) {
      const line = this.lines[i];
      const match = createTablePattern.exec(line);
      
      if (match) {
        this.analysis.databaseSchemas.push({
          tableName: match[1],
          lineNumber: i + 1
        });
        schemaCount++;
      }
    }
    
    console.log(`✅ Found ${schemaCount} database schemas`);
  }

  checkIfImplemented(endpoint) {
    if (!endpoint || !endpoint.path) return false;

    // Convert API path to file path
    const pathParts = endpoint.path.split('/').filter(p => p);
    const fileName = pathParts[pathParts.length - 1] + '.ts';
    const dirPath = pathParts.slice(0, -1).join('/');
    const filePath = path.join('src/pages/api', dirPath, fileName);

    return fs.existsSync(filePath);
  }

  checkExampleEndpointImplemented(endpointId) {
    // Check for example endpoints in /api/v1/example/{id}.ts format
    const filePath = path.join('src/pages/api/v1/example', `${endpointId}.ts`);
    return fs.existsSync(filePath);
  }

  generateReport() {
    const implementedCoreButtons = this.analysis.coreButtons.filter(b => b.implemented).length;
    const implementedExamples = this.analysis.exampleEndpoints.filter(e => e.implemented).length;
    
    const report = {
      timestamp: new Date().toISOString(),
      file: this.binderPath,
      totalLines: this.analysis.totalLines,
      
      summary: {
        coreButtons: {
          total: this.analysis.coreButtons.length,
          implemented: implementedCoreButtons,
          percentage: Math.round((implementedCoreButtons / this.analysis.coreButtons.length) * 100)
        },
        exampleEndpoints: {
          total: this.analysis.exampleEndpoints.length,
          implemented: implementedExamples,
          percentage: Math.round((implementedExamples / this.analysis.exampleEndpoints.length) * 100)
        },
        testCases: {
          total: this.analysis.testCases.length
        },
        databaseSchemas: {
          total: this.analysis.databaseSchemas.length
        }
      },
      
      overallProgress: {
        totalEndpoints: this.analysis.coreButtons.length + this.analysis.exampleEndpoints.length,
        implementedEndpoints: implementedCoreButtons + implementedExamples,
        percentage: Math.round(((implementedCoreButtons + implementedExamples) / (this.analysis.coreButtons.length + this.analysis.exampleEndpoints.length)) * 100)
      },
      
      sections: {
        core: {
          description: "Core functional buttons",
          lines: "1-2000",
          items: this.analysis.coreButtons.length,
          implemented: implementedCoreButtons
        },
        schemas: {
          description: "Database schemas",
          lines: "2000-3000", 
          items: this.analysis.databaseSchemas.length,
          implemented: 0
        },
        examples: {
          description: "API endpoint examples",
          lines: "3000-200000",
          items: this.analysis.exampleEndpoints.length,
          implemented: implementedExamples
        },
        tests: {
          description: "Test case specifications",
          lines: "200000-244524",
          items: this.analysis.testCases.length,
          implemented: 0
        }
      },
      
      nextPriorities: [
        {
          section: "examples",
          description: "Implement example API endpoints",
          remaining: this.analysis.exampleEndpoints.length - implementedExamples,
          estimatedHours: Math.ceil((this.analysis.exampleEndpoints.length - implementedExamples) * 0.1)
        },
        {
          section: "schemas",
          description: "Implement database migrations",
          remaining: this.analysis.databaseSchemas.length,
          estimatedHours: Math.ceil(this.analysis.databaseSchemas.length * 0.5)
        },
        {
          section: "tests",
          description: "Implement test cases",
          remaining: this.analysis.testCases.length,
          estimatedHours: Math.ceil(this.analysis.testCases.length * 0.25)
        }
      ]
    };

    return report;
  }

  async run() {
    console.log('🚀 Starting MASSIVE BINDER5_FULL.md Analysis...\n');
    
    await this.loadFile();
    this.analyzeCoreButtons();
    this.analyzeExampleEndpoints();
    this.analyzeTestCases();
    this.analyzeDatabaseSchemas();
    
    const report = this.generateReport();
    
    // Save detailed report
    const reportPath = 'logs/binder5-massive-analysis-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 MASSIVE ANALYSIS SUMMARY:');
    console.log(`Total Lines: ${report.totalLines.toLocaleString()}`);
    console.log(`Core Buttons: ${report.summary.coreButtons.implemented}/${report.summary.coreButtons.total} (${report.summary.coreButtons.percentage}%)`);
    console.log(`Example Endpoints: ${report.summary.exampleEndpoints.implemented}/${report.summary.exampleEndpoints.total} (${report.summary.exampleEndpoints.percentage}%)`);
    console.log(`Test Cases: ${report.summary.testCases.total.toLocaleString()}`);
    console.log(`Database Schemas: ${report.summary.databaseSchemas.total}`);
    
    console.log('\n🎯 OVERALL PROGRESS:');
    console.log(`Total Endpoints: ${report.overallProgress.totalEndpoints.toLocaleString()}`);
    console.log(`Implemented: ${report.overallProgress.implementedEndpoints} (${report.overallProgress.percentage}%)`);
    console.log(`Remaining: ${(report.overallProgress.totalEndpoints - report.overallProgress.implementedEndpoints).toLocaleString()}`);
    
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
    
    return report;
  }
}

// Run the analyzer
if (require.main === module) {
  const analyzer = new MassiveBinderAnalyzer('binderFiles/binder5_FULL.md');
  analyzer.run().catch(console.error);
}

module.exports = MassiveBinderAnalyzer;
