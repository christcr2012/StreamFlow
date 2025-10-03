#!/usr/bin/env node

/**
 * Fix TypeScript errors in batch-generated endpoints
 */

const fs = require('fs');
const path = require('path');

class EndpointFixer {
  constructor() {
    this.fixedCount = 0;
  }

  fixResourceTypeErrors(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Extract the resource type from the file path
      const pathParts = filePath.split(/[/\\]/);
      const fileName = pathParts[pathParts.length - 1].replace('.ts', '');
      const resourceType = fileName;
      
      // Replace all instances of resourceType with the actual value
      content = content.replace(/resourceType\.toUpperCase\(\)\.substring\(0, 3\)/g, `'${resourceType.toUpperCase().substring(0, 3)}'`);
      content = content.replace(/resourceType/g, `'${resourceType}'`);
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
      this.fixedCount++;
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}: ${error.message}`);
    }
  }

  async run() {
    console.log('🔧 Fixing TypeScript errors in batch-generated endpoints...\n');

    // Files with resourceType errors
    const filesToFix = [
      'src/pages/api/field/work_orders/assist.ts',
      'src/pages/api/field/work_orders/chat.ts',
      'src/pages/api/field/work_orders/issues.ts',
      'src/pages/api/field/work_orders/navigate.ts',
      'src/pages/api/field/work_orders/notes.ts',
      'src/pages/api/field/work_orders/parts/return.ts',
      'src/pages/api/field/work_orders/parts/use.ts',
      'src/pages/api/field/work_orders/photos.ts',
      'src/pages/api/field/work_orders/signature.ts',
      'src/pages/api/field/work_orders/time.ts',
      'src/pages/api/tenant/maintenance/tickets.ts',
      'src/pages/api/tenant/migrations/jobs.ts',
      'src/pages/api/tenant/migrations/mapping/approve.ts',
      'src/pages/api/tenant/migrations/rollback.ts',
      'src/pages/api/tenant/migrations/upload.ts',
    ];

    for (const filePath of filesToFix) {
      if (fs.existsSync(filePath)) {
        this.fixResourceTypeErrors(filePath);
      }
    }

    console.log(`\n🎉 Fixed ${this.fixedCount} files!`);
  }
}

// Run the fixer
if (require.main === module) {
  const fixer = new EndpointFixer();
  fixer.run().catch(console.error);
}

module.exports = EndpointFixer;
