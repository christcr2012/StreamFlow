#!/usr/bin/env node

/**
 * Complete Missing Endpoints for BINDER5_FULL.md
 * Identifies and generates any missing example endpoints
 */

const fs = require('fs');
const path = require('path');

class MissingEndpointCompleter {
  constructor() {
    this.totalExpected = 9326;
    this.missingEndpoints = [];
    this.generatedCount = 0;
  }

  findMissingEndpoints() {
    console.log('🔍 Scanning for missing endpoints...');
    
    const exampleDir = path.join('src/pages/api/v1/example');
    
    for (let i = 1; i <= this.totalExpected; i++) {
      const filePath = path.join(exampleDir, `${i}.ts`);
      if (!fs.existsSync(filePath)) {
        this.missingEndpoints.push(i);
      }
    }
    
    console.log(`❌ Found ${this.missingEndpoints.length} missing endpoints`);
    
    if (this.missingEndpoints.length > 0) {
      console.log(`Missing IDs: ${this.missingEndpoints.slice(0, 10).join(', ')}${this.missingEndpoints.length > 10 ? '...' : ''}`);
    }
  }

  generateEndpointTemplate(endpointId) {
    const template = `import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md API Endpoint Example ${endpointId}
const Example${endpointId}Schema = z.object({
  id: z.string(),
  payload: z.string(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = Example${endpointId}Schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: '400_INVALID_${endpointId}',
        details: validation.error.errors,
      });
    }

    const { id, payload } = validation.data;

    // RBAC check - tenant_manager, tenant_admin
    const userRole = req.headers['x-user-role'] as string;
    if (!['tenant_manager', 'tenant_admin', 'MANAGER', 'OWNER'].includes(userRole)) {
      return res.status(401).json({
        error: '401_UNAUTHORIZED',
        message: 'Insufficient permissions',
      });
    }

    // Create example record
    const exampleRecord = await prisma.note.create({
      data: {
        orgId,
        entityType: 'example_${endpointId}',
        entityId: id,
        userId: req.headers['x-user-id'] as string || 'system',
        body: \`EXAMPLE ${endpointId}: \${payload}\`,
        isPinned: false,
      },
    });

    await auditService.logBinderEvent({
      action: 'api.example.${endpointId}',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      status: 'ok',
      id: '${endpointId}',
      result: {
        recordId: exampleRecord.id,
        processed: true,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error in API Endpoint Example ${endpointId}:', error);
    return res.status(500).json({
      error: '500_INTERNAL',
      message: 'Internal server error',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));`;

    return template;
  }

  async generateMissingEndpoints() {
    if (this.missingEndpoints.length === 0) {
      console.log('✅ No missing endpoints found!');
      return;
    }

    console.log(`🔧 Generating ${this.missingEndpoints.length} missing endpoints...`);
    
    const promises = [];
    const batchSize = 100;
    
    for (let i = 0; i < this.missingEndpoints.length; i += batchSize) {
      const batch = this.missingEndpoints.slice(i, i + batchSize);
      
      for (const endpointId of batch) {
        const template = this.generateEndpointTemplate(endpointId);
        const filePath = path.join('src/pages/api/v1/example', `${endpointId}.ts`);
        
        promises.push(
          fs.promises.writeFile(filePath, template).then(() => {
            this.generatedCount++;
          })
        );
      }
      
      // Process batch
      await Promise.all(promises.splice(0, batch.length));
      
      const progress = Math.round(((i + batch.length) / this.missingEndpoints.length) * 100);
      console.log(`📊 Progress: ${progress}% (${Math.min(i + batch.length, this.missingEndpoints.length)}/${this.missingEndpoints.length})`);
    }
    
    console.log(`✅ Generated ${this.generatedCount} missing endpoints`);
  }

  async run() {
    console.log('🚀 Starting Missing Endpoint Completion...\n');
    
    this.findMissingEndpoints();
    await this.generateMissingEndpoints();
    
    // Verify completion
    console.log('\n🔍 Verifying completion...');
    let verifiedCount = 0;
    for (let i = 1; i <= this.totalExpected; i++) {
      const filePath = path.join('src/pages/api/v1/example', `${i}.ts`);
      if (fs.existsSync(filePath)) {
        verifiedCount++;
      }
    }
    
    console.log(`\n📊 COMPLETION VERIFICATION:`);
    console.log(`Expected: ${this.totalExpected}`);
    console.log(`Found: ${verifiedCount}`);
    console.log(`Completion: ${Math.round((verifiedCount / this.totalExpected) * 100)}%`);
    
    if (verifiedCount === this.totalExpected) {
      console.log('🎉 ALL ENDPOINTS COMPLETE!');
    } else {
      console.log(`❌ Still missing ${this.totalExpected - verifiedCount} endpoints`);
    }
    
    return {
      expected: this.totalExpected,
      found: verifiedCount,
      generated: this.generatedCount,
      completion: Math.round((verifiedCount / this.totalExpected) * 100)
    };
  }
}

// Run the completer
if (require.main === module) {
  const completer = new MissingEndpointCompleter();
  completer.run().catch(console.error);
}

module.exports = MissingEndpointCompleter;
