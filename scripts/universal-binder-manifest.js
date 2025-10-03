#!/usr/bin/env node

/**
 * Universal Binder Manifest System
 * Handles ALL _FULL binder files with intelligent chunking and resource management
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class UniversalBinderManifest {
  constructor() {
    this.binderDir = 'binderFiles';
    this.outputDir = 'logs/binder-manifests';
    this.chunkSize = 2000; // Larger chunks for efficiency
    this.maxConcurrentFiles = 3; // Process max 3 files at once to manage memory
    this.allBinders = [];
    this.masterManifest = {
      metadata: {
        totalBinders: 0,
        totalLines: 0,
        processedAt: new Date().toISOString(),
        version: '1.0.0'
      },
      binders: {},
      globalSummary: {
        buttons: { total: 0, implemented: 0 },
        endpoints: { total: 0, implemented: 0 },
        apiExamples: { total: 0, implemented: 0 },
        testCases: { total: 0, implemented: 0 },
        databaseSchemas: { total: 0, implemented: 0 },
        sqlStatements: { total: 0, implemented: 0 },
        seedData: { total: 0, implemented: 0 },
        configurations: { total: 0, implemented: 0 }
      }
    };
  }

  discoverBinderFiles() {
    console.log('🔍 Discovering all _FULL binder files...');
    
    const files = fs.readdirSync(this.binderDir);
    this.allBinders = files
      .filter(file => file.includes('_FULL.md'))
      .sort((a, b) => {
        // Sort by binder number
        const aNum = parseInt(a.match(/binder(\d+)/)?.[1] || '0');
        const bNum = parseInt(b.match(/binder(\d+)/)?.[1] || '0');
        return aNum - bNum;
      })
      .map(file => ({
        filename: file,
        path: path.join(this.binderDir, file),
        name: file.replace('_FULL.md', ''),
        processed: false,
        size: 0,
        lines: 0
      }));

    // Get file sizes
    this.allBinders.forEach(binder => {
      const stats = fs.statSync(binder.path);
      binder.size = stats.size;
      binder.lines = fs.readFileSync(binder.path, 'utf8').split('\n').length;
      this.masterManifest.metadata.totalLines += binder.lines;
    });

    this.masterManifest.metadata.totalBinders = this.allBinders.length;
    
    console.log(`✅ Found ${this.allBinders.length} _FULL binder files`);
    console.log(`📊 Total lines across all binders: ${this.masterManifest.metadata.totalLines.toLocaleString()}`);
    
    // Show size breakdown
    this.allBinders.forEach(binder => {
      const sizeMB = (binder.size / 1024 / 1024).toFixed(1);
      console.log(`   ${binder.name}: ${binder.lines.toLocaleString()} lines (${sizeMB}MB)`);
    });
  }

  async processSingleBinder(binder) {
    console.log(`\n🔨 Processing ${binder.name}...`);
    
    const content = fs.readFileSync(binder.path, 'utf8');
    const lines = content.split('\n');
    
    const binderManifest = {
      metadata: {
        filename: binder.filename,
        lines: lines.length,
        processedAt: new Date().toISOString()
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
        requirements: []
      },
      sections: {},
      coverage: {}
    };

    // Process in chunks to manage memory
    const totalChunks = Math.ceil(lines.length / this.chunkSize);
    
    for (let i = 0; i < lines.length; i += this.chunkSize) {
      const endLine = Math.min(i + this.chunkSize, lines.length);
      const chunkNumber = Math.floor(i / this.chunkSize) + 1;
      
      if (chunkNumber % 10 === 0 || chunkNumber === totalChunks) {
        console.log(`   📊 Chunk ${chunkNumber}/${totalChunks} (${Math.round((chunkNumber/totalChunks)*100)}%)`);
      }
      
      const chunkLines = lines.slice(i, endLine);
      this.processChunk(chunkLines, i, binderManifest);
    }

    // Calculate coverage
    Object.keys(binderManifest.items).forEach(key => {
      binderManifest.coverage[key] = {
        total: binderManifest.items[key].length,
        implemented: 0 // Will be calculated later
      };
    });

    // Check implementation status
    this.checkBinderImplementation(binderManifest, binder.name);
    
    // Save individual binder manifest
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    const manifestPath = path.join(this.outputDir, `${binder.name}-manifest.json`);
    fs.writeFileSync(manifestPath, JSON.stringify(binderManifest, null, 2));
    
    console.log(`✅ ${binder.name} processed: ${Object.values(binderManifest.coverage).reduce((sum, c) => sum + c.total, 0)} total items`);
    
    return binderManifest;
  }

  processChunk(chunkLines, startLineIndex, binderManifest) {
    chunkLines.forEach((line, i) => {
      const lineNumber = startLineIndex + i + 1;

      // Buttons
      const buttonMatch = line.match(/^### Button (\d+): \*\*(.*?)\*\*/);
      if (buttonMatch) {
        binderManifest.items.buttons.push({
          id: buttonMatch[1],
          name: buttonMatch[2],
          lineNumber,
          implemented: false
        });
      }

      // API Examples
      const apiMatch = line.match(/^### (API Endpoint Example|Example) (\d+)/);
      if (apiMatch) {
        binderManifest.items.apiExamples.push({
          id: apiMatch[2],
          type: apiMatch[1],
          lineNumber,
          implemented: false
        });
      }

      // Test Cases
      const testMatch = line.match(/^- TestCase (\d+): (.+)/);
      if (testMatch) {
        binderManifest.items.testCases.push({
          id: testMatch[1],
          description: testMatch[2],
          lineNumber,
          implemented: false
        });
      }

      // Database Schemas
      const tableMatch = line.match(/^CREATE TABLE (\w+)/);
      if (tableMatch) {
        binderManifest.items.databaseSchemas.push({
          tableName: tableMatch[1],
          lineNumber,
          implemented: false
        });
      }

      // SQL Statements
      const sqlMatch = line.match(/^(CREATE|INSERT|UPDATE|DELETE|ALTER|DROP)\s+/i);
      if (sqlMatch) {
        binderManifest.items.sqlStatements.push({
          type: sqlMatch[1].toUpperCase(),
          lineNumber,
          implemented: false
        });
      }

      // Seed Data
      const insertMatch = line.match(/^INSERT INTO (\w+)/);
      if (insertMatch) {
        binderManifest.items.seedData.push({
          table: insertMatch[1],
          lineNumber,
          implemented: false
        });
      }

      // Configurations
      const configMatch = line.match(/^## (.+)/);
      if (configMatch) {
        binderManifest.items.configurations.push({
          section: configMatch[1],
          lineNumber
        });
      }

      // Requirements
      const reqMatch = line.match(/^- \*\*(.*?)\*\*: (.+)/);
      if (reqMatch) {
        binderManifest.items.requirements.push({
          requirement: reqMatch[1],
          description: reqMatch[2],
          lineNumber,
          implemented: false
        });
      }
    });
  }

  checkBinderImplementation(binderManifest, binderName) {
    // Check API examples (like binder5)
    binderManifest.items.apiExamples.forEach(example => {
      const filePath = path.join('src/pages/api/v1/example', `${example.id}.ts`);
      if (fs.existsSync(filePath)) {
        example.implemented = true;
        binderManifest.coverage.apiExamples.implemented++;
      }
    });

    // Check database schemas
    const prismaPath = 'prisma/schema.prisma';
    if (fs.existsSync(prismaPath)) {
      const prismaContent = fs.readFileSync(prismaPath, 'utf8');
      binderManifest.items.databaseSchemas.forEach(schema => {
        if (prismaContent.includes(`model ${schema.tableName}`) || 
            prismaContent.includes(`table ${schema.tableName}`)) {
          schema.implemented = true;
          binderManifest.coverage.databaseSchemas.implemented++;
        }
      });
    }

    // Check buttons (look for corresponding API files)
    binderManifest.items.buttons.forEach(button => {
      // This would need more sophisticated mapping based on button content
      // For now, mark as not implemented
      button.implemented = false;
    });
  }

  async processAllBinders() {
    console.log('\n🚀 Processing all _FULL binder files...');
    
    // Process in batches to manage memory
    for (let i = 0; i < this.allBinders.length; i += this.maxConcurrentFiles) {
      const batch = this.allBinders.slice(i, i + this.maxConcurrentFiles);
      console.log(`\n📦 Processing batch ${Math.floor(i/this.maxConcurrentFiles) + 1}/${Math.ceil(this.allBinders.length/this.maxConcurrentFiles)}`);
      
      const batchPromises = batch.map(binder => this.processSingleBinder(binder));
      const batchResults = await Promise.all(batchPromises);
      
      // Add to master manifest
      batch.forEach((binder, index) => {
        this.masterManifest.binders[binder.name] = batchResults[index];
        binder.processed = true;
        
        // Add to global summary
        Object.keys(batchResults[index].coverage).forEach(key => {
          if (this.masterManifest.globalSummary[key]) {
            this.masterManifest.globalSummary[key].total += batchResults[index].coverage[key].total;
            this.masterManifest.globalSummary[key].implemented += batchResults[index].coverage[key].implemented;
          }
        });
      });
      
      // Force garbage collection between batches
      if (global.gc) {
        global.gc();
      }
    }
  }

  generateGlobalSummary() {
    const summary = {
      totalBinders: this.masterManifest.metadata.totalBinders,
      totalLines: this.masterManifest.metadata.totalLines,
      totalItems: 0,
      implementedItems: 0,
      overallPercentage: 0,
      byCategory: {},
      byBinder: {}
    };

    // Calculate totals
    Object.keys(this.masterManifest.globalSummary).forEach(key => {
      const category = this.masterManifest.globalSummary[key];
      summary.totalItems += category.total;
      summary.implementedItems += category.implemented;
      summary.byCategory[key] = {
        total: category.total,
        implemented: category.implemented,
        percentage: category.total > 0 ? Math.round((category.implemented / category.total) * 100) : 0
      };
    });

    summary.overallPercentage = summary.totalItems > 0 ? 
      Math.round((summary.implementedItems / summary.totalItems) * 100) : 0;

    // Per-binder summary
    Object.keys(this.masterManifest.binders).forEach(binderName => {
      const binder = this.masterManifest.binders[binderName];
      const binderTotal = Object.values(binder.coverage).reduce((sum, c) => sum + c.total, 0);
      const binderImplemented = Object.values(binder.coverage).reduce((sum, c) => sum + c.implemented, 0);
      
      summary.byBinder[binderName] = {
        total: binderTotal,
        implemented: binderImplemented,
        percentage: binderTotal > 0 ? Math.round((binderImplemented / binderTotal) * 100) : 0,
        lines: binder.metadata.lines
      };
    });

    return summary;
  }

  async saveMasterManifest() {
    const masterPath = path.join(this.outputDir, 'master-manifest.json');
    fs.writeFileSync(masterPath, JSON.stringify(this.masterManifest, null, 2));
    
    const summary = this.generateGlobalSummary();
    const summaryPath = path.join(this.outputDir, 'global-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log(`\n💾 Master manifest saved to: ${masterPath}`);
    console.log(`📊 Global summary saved to: ${summaryPath}`);
    
    return summary;
  }

  async run() {
    console.log('🌟 UNIVERSAL BINDER MANIFEST SYSTEM STARTING...\n');
    
    this.discoverBinderFiles();
    await this.processAllBinders();
    const summary = await this.saveMasterManifest();
    
    console.log('\n🎯 UNIVERSAL BINDER ANALYSIS COMPLETE!');
    console.log(`📚 Processed: ${summary.totalBinders} binder files`);
    console.log(`📄 Total lines: ${summary.totalLines.toLocaleString()}`);
    console.log(`📋 Total items: ${summary.totalItems.toLocaleString()}`);
    console.log(`✅ Implemented: ${summary.implementedItems.toLocaleString()}`);
    console.log(`🎯 Overall completion: ${summary.overallPercentage}%`);
    
    console.log('\n📊 BY CATEGORY:');
    Object.keys(summary.byCategory).forEach(key => {
      const cat = summary.byCategory[key];
      if (cat.total > 0) {
        console.log(`   ${key}: ${cat.implemented}/${cat.total} (${cat.percentage}%)`);
      }
    });
    
    console.log('\n📚 BY BINDER:');
    Object.keys(summary.byBinder).forEach(binderName => {
      const binder = summary.byBinder[binderName];
      console.log(`   ${binderName}: ${binder.implemented}/${binder.total} (${binder.percentage}%) - ${binder.lines.toLocaleString()} lines`);
    });
    
    return summary;
  }
}

// Run the universal manifest system
if (require.main === module) {
  const manifest = new UniversalBinderManifest();
  manifest.run().catch(console.error);
}

module.exports = UniversalBinderManifest;
