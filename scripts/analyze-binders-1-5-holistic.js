#!/usr/bin/env node

/**
 * HOLISTIC BINDERS 1-5 ANALYSIS
 * Analyzes binders 1-5 as a cohesive system to understand complete database architecture
 */

const fs = require('fs');
const path = require('path');

class HolisticBinderAnalyzer {
  constructor() {
    this.binders = [
      'binderFiles/binder1_FULL.md',
      'binderFiles/binder2_FULL.md', 
      'binderFiles/binder3_FULL.md',
      'binderFiles/binder4_FULL.md',
      'binderFiles/binder5_FULL.md'
    ];
    this.completeSchema = {
      tables: new Map(),
      indexes: new Map(),
      relationships: new Map(),
      migrations: [],
      dependencies: new Map()
    };
  }

  async analyzeAllBinders() {
    console.log('🔍 HOLISTIC ANALYSIS: BINDERS 1-5 DATABASE ARCHITECTURE');
    console.log('=' .repeat(80));

    for (let i = 0; i < this.binders.length; i++) {
      const binderPath = this.binders[i];
      const binderName = `binder${i + 1}_FULL`;
      
      console.log(`\n📋 ANALYZING ${binderName.toUpperCase()}`);
      console.log('-'.repeat(50));
      
      if (fs.existsSync(binderPath)) {
        await this.analyzeBinder(binderPath, binderName);
      } else {
        console.log(`⚠️  ${binderPath} not found`);
      }
    }

    this.generateHolisticReport();
    this.generatePrismaSchemaFix();
  }

  async analyzeBinder(binderPath, binderName) {
    const content = fs.readFileSync(binderPath, 'utf8');
    const lines = content.split('\n');
    
    console.log(`📄 Processing ${lines.length} lines...`);
    
    let tableCount = 0;
    let indexCount = 0;
    let migrationCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect CREATE TABLE statements
      const createTableMatch = line.match(/^CREATE TABLE (\w+)/);
      if (createTableMatch) {
        const tableName = createTableMatch[1];
        const tableInfo = this.extractTableInfo(lines, i, binderName);
        this.completeSchema.tables.set(tableName, tableInfo);
        tableCount++;
      }

      // Detect CREATE INDEX statements
      const createIndexMatch = line.match(/^CREATE INDEX (\w+)/);
      if (createIndexMatch) {
        const indexName = createIndexMatch[1];
        const indexInfo = this.extractIndexInfo(lines, i, binderName);
        this.completeSchema.indexes.set(indexName, indexInfo);
        indexCount++;
      }

      // Detect Prisma model statements
      const prismaModelMatch = line.match(/^model (\w+) \{/);
      if (prismaModelMatch) {
        const modelName = prismaModelMatch[1];
        const modelInfo = this.extractPrismaModelInfo(lines, i, binderName);
        if (!this.completeSchema.tables.has(modelName)) {
          this.completeSchema.tables.set(modelName, modelInfo);
          tableCount++;
        }
      }

      // Detect migration patterns
      if (line.includes('migration') || line.includes('migrate') || line.includes('ALTER TABLE')) {
        migrationCount++;
        this.completeSchema.migrations.push({
          binder: binderName,
          line: i + 1,
          content: line
        });
      }

      // Detect relationships/foreign keys
      const fkMatch = line.match(/REFERENCES (\w+)\((\w+)\)/);
      if (fkMatch) {
        const [, refTable, refColumn] = fkMatch;
        const relationshipKey = `${binderName}_${i}`;
        this.completeSchema.relationships.set(relationshipKey, {
          binder: binderName,
          line: i + 1,
          referencedTable: refTable,
          referencedColumn: refColumn,
          context: line
        });
      }
    }

    console.log(`✅ Found: ${tableCount} tables, ${indexCount} indexes, ${migrationCount} migrations`);
  }

  extractTableInfo(lines, startIndex, binderName) {
    const fields = [];
    const constraints = [];
    let endIndex = startIndex;

    // Look ahead to find table definition
    for (let i = startIndex + 1; i < Math.min(startIndex + 50, lines.length); i++) {
      const line = lines[i].trim();
      
      if (line === ');' || line === ')') {
        endIndex = i;
        break;
      }

      // Extract field definitions
      const fieldMatch = line.match(/^\s*(\w+)\s+(VARCHAR|TEXT|INT|INTEGER|UUID|BOOLEAN|TIMESTAMPTZ|JSONB|BIGINT|SERIAL)/i);
      if (fieldMatch) {
        fields.push({
          name: fieldMatch[1],
          type: fieldMatch[2].toLowerCase(),
          line: i + 1,
          constraints: line.includes('NOT NULL') ? ['NOT NULL'] : []
        });
      }

      // Extract constraints
      if (line.includes('PRIMARY KEY') || line.includes('FOREIGN KEY') || line.includes('UNIQUE')) {
        constraints.push({
          type: line.includes('PRIMARY KEY') ? 'PRIMARY KEY' : 
                line.includes('FOREIGN KEY') ? 'FOREIGN KEY' : 'UNIQUE',
          definition: line,
          line: i + 1
        });
      }
    }

    return {
      binder: binderName,
      startLine: startIndex + 1,
      endLine: endIndex + 1,
      fields: fields,
      constraints: constraints,
      rawDefinition: lines.slice(startIndex, endIndex + 1).join('\n')
    };
  }

  extractIndexInfo(lines, startIndex, binderName) {
    const line = lines[startIndex];
    const onTableMatch = line.match(/ON (\w+)/);
    
    return {
      binder: binderName,
      line: startIndex + 1,
      table: onTableMatch ? onTableMatch[1] : null,
      definition: line
    };
  }

  extractPrismaModelInfo(lines, startIndex, binderName) {
    const fields = [];
    let endIndex = startIndex;

    // Look ahead to find model definition
    for (let i = startIndex + 1; i < Math.min(startIndex + 50, lines.length); i++) {
      const line = lines[i].trim();
      
      if (line === '}') {
        endIndex = i;
        break;
      }

      // Extract Prisma field definitions
      const fieldMatch = line.match(/^\s*(\w+)\s+(String|Int|Boolean|DateTime|Json|BigInt)/);
      if (fieldMatch) {
        fields.push({
          name: fieldMatch[1],
          type: fieldMatch[2].toLowerCase(),
          line: i + 1,
          prismaType: fieldMatch[2]
        });
      }
    }

    return {
      binder: binderName,
      startLine: startIndex + 1,
      endLine: endIndex + 1,
      fields: fields,
      type: 'prisma_model',
      rawDefinition: lines.slice(startIndex, endIndex + 1).join('\n')
    };
  }

  generateHolisticReport() {
    console.log('\n🎯 HOLISTIC ANALYSIS RESULTS');
    console.log('=' .repeat(80));
    
    console.log(`📊 TOTAL SCHEMA ELEMENTS:`);
    console.log(`   Tables/Models: ${this.completeSchema.tables.size}`);
    console.log(`   Indexes: ${this.completeSchema.indexes.size}`);
    console.log(`   Relationships: ${this.completeSchema.relationships.size}`);
    console.log(`   Migration References: ${this.completeSchema.migrations.length}`);

    // Group by binder
    const binderStats = {};
    this.completeSchema.tables.forEach((table, name) => {
      if (!binderStats[table.binder]) {
        binderStats[table.binder] = { tables: 0, fields: 0 };
      }
      binderStats[table.binder].tables++;
      binderStats[table.binder].fields += table.fields.length;
    });

    console.log(`\n📋 BY BINDER:`);
    Object.entries(binderStats).forEach(([binder, stats]) => {
      console.log(`   ${binder}: ${stats.tables} tables, ${stats.fields} fields`);
    });

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTables: this.completeSchema.tables.size,
        totalIndexes: this.completeSchema.indexes.size,
        totalRelationships: this.completeSchema.relationships.size,
        totalMigrations: this.completeSchema.migrations.length
      },
      binderStats: binderStats,
      tables: Object.fromEntries(this.completeSchema.tables),
      indexes: Object.fromEntries(this.completeSchema.indexes),
      relationships: Object.fromEntries(this.completeSchema.relationships),
      migrations: this.completeSchema.migrations
    };

    if (!fs.existsSync('ops/analysis')) {
      fs.mkdirSync('ops/analysis', { recursive: true });
    }

    fs.writeFileSync('ops/analysis/binders-1-5-holistic-report.json', JSON.stringify(report, null, 2));
    console.log(`\n💾 Detailed report saved: ops/analysis/binders-1-5-holistic-report.json`);
  }

  generatePrismaSchemaFix() {
    console.log('\n🔧 GENERATING PRISMA SCHEMA FIX');
    console.log('-'.repeat(50));

    let schemaFix = `// HOLISTIC BINDERS 1-5 SCHEMA FIX\n`;
    schemaFix += `// Generated: ${new Date().toISOString()}\n`;
    schemaFix += `// Total Tables: ${this.completeSchema.tables.size}\n\n`;

    // Generate clean Prisma models
    this.completeSchema.tables.forEach((table, tableName) => {
      if (table.fields && table.fields.length > 0) {
        schemaFix += `model ${tableName} {\n`;
        schemaFix += `  id String @id @default(cuid())\n`;
        
        table.fields.forEach(field => {
          const prismaType = this.convertToPrismaType(field.type);
          schemaFix += `  ${field.name} ${prismaType}\n`;
        });
        
        schemaFix += `  \n`;
        schemaFix += `  // Generated from ${table.binder} lines ${table.startLine}-${table.endLine}\n`;
        schemaFix += `  @@map("${tableName}")\n`;
        schemaFix += `}\n\n`;
      }
    });

    fs.writeFileSync('ops/analysis/binders-1-5-prisma-fix.prisma', schemaFix);
    console.log(`💾 Prisma schema fix saved: ops/analysis/binders-1-5-prisma-fix.prisma`);
  }

  convertToPrismaType(sqlType) {
    const typeMap = {
      'varchar': 'String',
      'text': 'String',
      'int': 'Int',
      'integer': 'Int',
      'bigint': 'BigInt',
      'serial': 'Int',
      'uuid': 'String',
      'boolean': 'Boolean',
      'timestamptz': 'DateTime',
      'jsonb': 'Json',
      'json': 'Json'
    };
    
    return typeMap[sqlType.toLowerCase()] || 'String';
  }
}

// Run analysis
if (require.main === module) {
  const analyzer = new HolisticBinderAnalyzer();
  analyzer.analyzeAllBinders().catch(console.error);
}

module.exports = HolisticBinderAnalyzer;
