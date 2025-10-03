#!/usr/bin/env node

/**
 * BINDER5_FULL.md Progress Analysis Tool
 * Systematically analyzes the 244,524-line file to track implementation progress
 */

const fs = require('fs');
const path = require('path');

class BinderProgressAnalyzer {
  constructor(binderPath) {
    this.binderPath = binderPath;
    this.content = '';
    this.lines = [];
    this.analysis = {
      totalLines: 0,
      sections: [],
      buttons: [],
      endpoints: [],
      implementationStatus: {},
      progressMetrics: {}
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

  analyzeSections() {
    console.log('🔍 Analyzing sections...');
    
    const sectionPatterns = [
      { id: '01_field_pwa', pattern: /^# 01 • Field PWA/, title: 'Field PWA' },
      { id: '02_fleet_dvir', pattern: /^# 02 • Fleet, DVIR/, title: 'Fleet DVIR & Maintenance' },
      { id: '03_assets_qr', pattern: /^# 03 • Assets/, title: 'Assets & QR Tracking' },
      { id: '04_migration', pattern: /^# 04 • Migration/, title: 'Migration Engine' },
      { id: '05_federation', pattern: /^# 05 • Federation/, title: 'Federation & Provider Setup' },
      { id: '06_api_examples', pattern: /^# API Examples|^## API Endpoint/, title: 'API Examples' }
    ];

    let currentSection = null;
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      // Check for section headers
      for (const section of sectionPatterns) {
        if (section.pattern.test(line)) {
          if (currentSection) {
            currentSection.endLine = i - 1;
            currentSection.lineCount = currentSection.endLine - currentSection.startLine + 1;
          }
          
          currentSection = {
            id: section.id,
            title: section.title,
            startLine: i,
            endLine: null,
            lineCount: 0,
            buttons: [],
            endpoints: []
          };
          
          this.analysis.sections.push(currentSection);
          break;
        }
      }
    }
    
    // Close last section
    if (currentSection) {
      currentSection.endLine = this.lines.length - 1;
      currentSection.lineCount = currentSection.endLine - currentSection.startLine + 1;
    }

    console.log(`✅ Found ${this.analysis.sections.length} sections`);
  }

  analyzeButtons() {
    console.log('🔍 Analyzing buttons...');
    
    const buttonPattern = /^### Button \d+: \*\*(.*?)\*\*/;
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const match = buttonPattern.exec(line);
      
      if (match) {
        const buttonName = match[1];
        const section = this.findSectionForLine(i);
        
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
        
        const button = {
          name: buttonName,
          lineNumber: i + 1,
          section: section?.id || 'unknown',
          endpoint: endpoint,
          implemented: this.checkIfImplemented(endpoint)
        };
        
        this.analysis.buttons.push(button);
        if (section) {
          section.buttons.push(button);
        }
      }
    }

    console.log(`✅ Found ${this.analysis.buttons.length} buttons`);
  }

  analyzeEndpoints() {
    console.log('🔍 Analyzing API endpoints...');
    
    const endpointPatterns = [
      /- API: `(POST|GET|PUT|DELETE) (.+?)`/,
      /^(POST|GET|PUT|DELETE) (.+?)$/,
      /endpoint.*?["`](.+?)["`]/i
    ];
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      for (const pattern of endpointPatterns) {
        const match = pattern.exec(line);
        if (match) {
          const method = match[1] || 'POST';
          const path = match[2] || match[1];
          
          if (path && path.startsWith('/')) {
            const section = this.findSectionForLine(i);
            const endpoint = {
              method: method,
              path: path,
              lineNumber: i + 1,
              section: section?.id || 'unknown',
              implemented: this.checkIfImplemented({ method, path })
            };
            
            this.analysis.endpoints.push(endpoint);
            if (section) {
              section.endpoints.push(endpoint);
            }
          }
          break;
        }
      }
    }

    console.log(`✅ Found ${this.analysis.endpoints.length} API endpoints`);
  }

  findSectionForLine(lineNumber) {
    for (const section of this.analysis.sections) {
      if (lineNumber >= section.startLine && lineNumber <= section.endLine) {
        return section;
      }
    }
    return null;
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

  calculateProgress() {
    console.log('📊 Calculating progress metrics...');
    
    const totalButtons = this.analysis.buttons.length;
    const implementedButtons = this.analysis.buttons.filter(b => b.implemented).length;
    
    const totalEndpoints = this.analysis.endpoints.length;
    const implementedEndpoints = this.analysis.endpoints.filter(e => e.implemented).length;
    
    this.analysis.progressMetrics = {
      buttons: {
        total: totalButtons,
        implemented: implementedButtons,
        percentage: totalButtons > 0 ? Math.round((implementedButtons / totalButtons) * 100) : 0
      },
      endpoints: {
        total: totalEndpoints,
        implemented: implementedEndpoints,
        percentage: totalEndpoints > 0 ? Math.round((implementedEndpoints / totalEndpoints) * 100) : 0
      },
      sections: this.analysis.sections.map(section => ({
        id: section.id,
        title: section.title,
        lineCount: section.lineCount,
        buttonsTotal: section.buttons.length,
        buttonsImplemented: section.buttons.filter(b => b.implemented).length,
        endpointsTotal: section.endpoints.length,
        endpointsImplemented: section.endpoints.filter(e => e.implemented).length,
        progressPercentage: this.calculateSectionProgress(section)
      }))
    };
  }

  calculateSectionProgress(section) {
    const totalItems = section.buttons.length + section.endpoints.length;
    if (totalItems === 0) return 0;
    
    const implementedItems = 
      section.buttons.filter(b => b.implemented).length +
      section.endpoints.filter(e => e.implemented).length;
    
    return Math.round((implementedItems / totalItems) * 100);
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      file: this.binderPath,
      totalLines: this.analysis.totalLines,
      summary: this.analysis.progressMetrics,
      sections: this.analysis.progressMetrics.sections,
      unimplementedButtons: this.analysis.buttons.filter(b => !b.implemented),
      unimplementedEndpoints: this.analysis.endpoints.filter(e => !e.implemented),
      nextPriorities: this.generatePriorities()
    };

    return report;
  }

  generatePriorities() {
    return this.analysis.sections
      .map(section => {
        const unimplementedButtons = section.buttons.filter(b => !b.implemented).length;
        const unimplementedEndpoints = section.endpoints.filter(e => !e.implemented).length;
        const totalUnimplemented = unimplementedButtons + unimplementedEndpoints;
        
        return {
          section: section.id,
          title: section.title,
          unimplementedButtons,
          unimplementedEndpoints,
          totalUnimplemented,
          estimatedHours: Math.ceil(totalUnimplemented * 0.25) // 15 min per item
        };
      })
      .filter(p => p.totalUnimplemented > 0)
      .sort((a, b) => b.totalUnimplemented - a.totalUnimplemented);
  }

  async run() {
    console.log('🚀 Starting BINDER5_FULL.md Progress Analysis...\n');
    
    await this.loadFile();
    this.analyzeSections();
    this.analyzeButtons();
    this.analyzeEndpoints();
    this.calculateProgress();
    
    const report = this.generateReport();
    
    // Save detailed report
    const reportPath = 'logs/binder5-analysis-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 PROGRESS SUMMARY:');
    console.log(`Total Lines: ${report.totalLines.toLocaleString()}`);
    console.log(`Buttons: ${report.summary.buttons.implemented}/${report.summary.buttons.total} (${report.summary.buttons.percentage}%)`);
    console.log(`Endpoints: ${report.summary.endpoints.implemented}/${report.summary.endpoints.total} (${report.summary.endpoints.percentage}%)`);
    
    console.log('\n📋 SECTION BREAKDOWN:');
    report.sections.forEach(section => {
      console.log(`  ${section.title}: ${section.progressPercentage}% (${section.buttonsImplemented + section.endpointsImplemented}/${section.buttonsTotal + section.endpointsTotal} items)`);
    });
    
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
    
    return report;
  }
}

// Run the analyzer
if (require.main === module) {
  const analyzer = new BinderProgressAnalyzer('binderFiles/binder5_FULL.md');
  analyzer.run().catch(console.error);
}

module.exports = BinderProgressAnalyzer;
