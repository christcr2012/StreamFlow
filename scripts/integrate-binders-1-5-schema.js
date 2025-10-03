#!/usr/bin/env node

/**
 * BINDERS 1-5 PRISMA SCHEMA INTEGRATION
 * Creates a clean, integrated Prisma schema from holistic binder analysis
 */

const fs = require('fs');
const path = require('path');

class BinderSchemaIntegrator {
  constructor() {
    this.reportPath = 'ops/analysis/binders-1-5-holistic-report.json';
    this.currentSchemaPath = 'prisma/schema.prisma';
    this.backupSchemaPath = 'prisma/schema.prisma.backup';
  }

  async integrateSchema() {
    console.log('🔧 BINDERS 1-5 PRISMA SCHEMA INTEGRATION');
    console.log('=' .repeat(80));

    // Load holistic analysis
    if (!fs.existsSync(this.reportPath)) {
      console.error('❌ Holistic report not found. Run analyze-binders-1-5-holistic.js first');
      return;
    }

    const report = JSON.parse(fs.readFileSync(this.reportPath, 'utf8'));
    console.log(`📊 Integrating ${report.summary.totalTables} tables from binders 1-5`);

    // Backup current schema
    if (fs.existsSync(this.currentSchemaPath)) {
      fs.copyFileSync(this.currentSchemaPath, this.backupSchemaPath);
      console.log(`💾 Current schema backed up to: ${this.backupSchemaPath}`);
    }

    // Read current schema to preserve header and existing models
    const currentSchema = fs.existsSync(this.currentSchemaPath) ? 
      fs.readFileSync(this.currentSchemaPath, 'utf8') : '';

    // Extract schema header (generator, datasource, etc.)
    const schemaHeader = this.extractSchemaHeader(currentSchema);
    
    // Extract existing models to preserve
    const existingModels = this.extractExistingModels(currentSchema);

    // Generate integrated schema
    const integratedSchema = this.generateIntegratedSchema(
      schemaHeader, 
      existingModels, 
      report.tables
    );

    // Write integrated schema
    fs.writeFileSync(this.currentSchemaPath, integratedSchema);
    console.log(`✅ Integrated schema written to: ${this.currentSchemaPath}`);

    // Generate migration
    await this.generateMigration();
  }

  extractSchemaHeader(schema) {
    const lines = schema.split('\n');
    const headerLines = [];
    let inModel = false;

    for (const line of lines) {
      if (line.trim().startsWith('model ') || line.trim().startsWith('enum ')) {
        inModel = true;
        break;
      }
      if (!inModel) {
        headerLines.push(line);
      }
    }

    return headerLines.join('\n') + '\n\n';
  }

  extractExistingModels(schema) {
    const models = new Map();
    const lines = schema.split('\n');
    let currentModel = null;
    let modelLines = [];
    let inModel = false;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith('model ')) {
        // Save previous model if it exists and is complete
        if (currentModel && modelLines.length > 0 && braceCount === 0) {
          models.set(currentModel, modelLines.join('\n'));
        }

        // Start new model
        const modelMatch = line.match(/model (\w+)/);
        currentModel = modelMatch ? modelMatch[1] : null;
        modelLines = [line];
        inModel = true;
        braceCount = 0;

        // Count opening braces in the model line
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;

      } else if (inModel) {
        modelLines.push(line);

        // Count braces to track model completion
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;

        // Model is complete when braces are balanced
        if (braceCount === 0) {
          if (currentModel) {
            models.set(currentModel, modelLines.join('\n'));
          }
          currentModel = null;
          modelLines = [];
          inModel = false;
        }
      }
    }

    // Handle incomplete model at end of file
    if (currentModel && modelLines.length > 0) {
      // Add closing brace if missing
      if (braceCount > 0) {
        modelLines.push('}');
      }
      models.set(currentModel, modelLines.join('\n'));
    }

    return models;
  }

  generateIntegratedSchema(header, existingModels, binderTables) {
    let schema = header;
    
    // Add comment section
    schema += '// ============================================================================\n';
    schema += '// BINDERS 1-5 INTEGRATED SCHEMA\n';
    schema += `// Generated: ${new Date().toISOString()}\n`;
    schema += `// Total Binder Tables: ${Object.keys(binderTables).length}\n`;
    schema += '// ============================================================================\n\n';

    // Preserve existing models that aren't from binders
    const binderTableNames = new Set(Object.keys(binderTables));
    existingModels.forEach((modelContent, modelName) => {
      if (!binderTableNames.has(modelName)) {
        schema += modelContent + '\n\n';
      }
    });

    // Add binder tables with proper field handling
    Object.entries(binderTables).forEach(([tableName, tableInfo]) => {
      schema += this.generateCleanModel(tableName, tableInfo);
    });

    return schema;
  }

  generateCleanModel(tableName, tableInfo) {
    let model = `model ${tableName} {\n`;
    
    // Track field names to avoid duplicates
    const fieldNames = new Set();
    
    // Always start with id field
    model += `  id String @id @default(cuid())\n`;
    fieldNames.add('id');

    // Add fields from binder definition
    if (tableInfo.fields && Array.isArray(tableInfo.fields)) {
      tableInfo.fields.forEach(field => {
        if (!fieldNames.has(field.name)) {
          const prismaType = this.convertToPrismaType(field.type);
          const nullable = field.constraints && field.constraints.includes('NOT NULL') ? '' : '?';
          model += `  ${field.name} ${prismaType}${nullable}\n`;
          fieldNames.add(field.name);
        }
      });
    }

    // Add timestamps if not present
    if (!fieldNames.has('created_at') && !fieldNames.has('createdAt')) {
      model += `  createdAt DateTime @default(now())\n`;
    }
    if (!fieldNames.has('updated_at') && !fieldNames.has('updatedAt')) {
      model += `  updatedAt DateTime @updatedAt\n`;
    }

    // Add metadata
    model += `\n`;
    model += `  // Generated from ${tableInfo.binder} lines ${tableInfo.startLine}-${tableInfo.endLine}\n`;
    
    // Add indexes if this is a service event table
    if (tableName.includes('_events')) {
      model += `  @@index([tenant_id, createdAt])\n`;
      if (fieldNames.has('request_id')) {
        model += `  @@index([request_id])\n`;
      }
    }
    
    model += `  @@map("${tableName}")\n`;
    model += `}\n\n`;

    return model;
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
      'timestamp': 'DateTime',
      'jsonb': 'Json',
      'json': 'Json',
      'decimal': 'Decimal',
      'numeric': 'Decimal'
    };
    
    return typeMap[sqlType.toLowerCase()] || 'String';
  }

  async generateMigration() {
    console.log('\n🔄 GENERATING MIGRATION');
    console.log('-'.repeat(50));

    try {
      // Generate Prisma client
      console.log('📦 Generating Prisma client...');
      const { execSync } = require('child_process');
      execSync('npx prisma generate', { stdio: 'inherit' });

      // Create migration
      console.log('🔄 Creating migration...');
      const migrationName = `binders_1_5_integration_${Date.now()}`;
      execSync(`npx prisma migrate dev --name ${migrationName} --create-only`, { stdio: 'inherit' });
      
      console.log(`✅ Migration created: ${migrationName}`);
      
    } catch (error) {
      console.error('⚠️  Migration generation failed:', error.message);
      console.log('💡 You may need to run: npx prisma db push --force-reset');
    }
  }
}

// Run integration
if (require.main === module) {
  const integrator = new BinderSchemaIntegrator();
  integrator.integrateSchema().catch(console.error);
}

module.exports = BinderSchemaIntegrator;
