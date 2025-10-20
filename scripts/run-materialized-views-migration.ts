/**
 * Run Materialized Views Migration
 * 
 * This script creates all materialized views for analytics in the production database.
 * Run this script ONCE after deploying the materialized views SQL file.
 * 
 * Usage:
 *   npx tsx scripts/run-materialized-views-migration.ts
 */

import { PrismaClient } from '@prisma/client-tenant';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function runMigration() {
  console.log('🚀 Starting materialized views migration...\n');

  try {
    // Read the SQL file
    const sqlPath = join(__dirname, '../packages/db/prisma/migrations/create_materialized_views.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('📄 Read SQL file:', sqlPath);
    console.log('📊 SQL file size:', sql.length, 'bytes\n');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log('📝 Found', statements.length, 'SQL statements\n');

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 100).replace(/\n/g, ' ');
      
      console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);
      
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`✅ Success\n`);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message?.includes('already exists')) {
          console.log(`⚠️  Already exists (skipping)\n`);
        } else {
          console.error(`❌ Error:`, error.message);
          throw error;
        }
      }
    }

    console.log('✅ Materialized views migration completed successfully!\n');
    console.log('📊 Created views:');
    console.log('   - mv_schedule_adherence');
    console.log('   - mv_qa_scores');
    console.log('   - mv_revenue_analytics');
    console.log('   - mv_customer_analytics');
    console.log('\n🔄 Refresh function: refresh_all_analytics_views()');
    console.log('\n💡 Next steps:');
    console.log('   1. Set up pg_cron for automatic refresh (optional)');
    console.log('   2. Run: SELECT refresh_all_analytics_views(); to populate views');
    console.log('   3. Monitor view performance with /api/monitoring/slow-queries');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
runMigration();

