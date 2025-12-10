/**
 * Schema Verification Script
 * Verifies database schema matches Drizzle ORM schema before deployments
 * 
 * Usage: npx tsx server/scripts/verifySchema.ts
 * 
 * This script compares the actual database schema with the Drizzle schema
 * to detect schema drift before it causes production errors.
 */

import 'dotenv/config';
import pg from 'pg';
import * as schema from '@shared/schema';

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface VerificationResult {
  table: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  missingColumns?: string[];
  extraColumns?: string[];
}

// Tables to verify - add more as needed
const VERIFICATION_TABLES = [
  'users',
  'organizations',
  'projects',
  'tasks',
  'stakeholders',
  'risks',
  'issues',
  'change_requests',
  'resource_assignments',
  'project_templates',
  'project_statuses',
] as const;

// Map Drizzle schema objects to table names
const schemaMap: Record<string, any> = {
  users: schema.users,
  organizations: schema.organizations,
  projects: schema.projects,
  tasks: schema.tasks,
  stakeholders: schema.stakeholders,
  risks: schema.risks,
  issues: schema.issues,
  change_requests: schema.changeRequests,
  resource_assignments: schema.resourceAssignments,
  project_templates: schema.projectTemplates,
  project_statuses: schema.projectStatuses,
};

/**
 * Get actual columns from database
 */
async function getTableColumns(pool: pg.Pool, tableName: string): Promise<ColumnInfo[]> {
  const result = await pool.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);
  
  return result.rows as ColumnInfo[];
}

/**
 * Check if table exists in database
 */
async function tableExists(pool: pg.Pool, tableName: string): Promise<boolean> {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = $1
    )
  `, [tableName]);
  
  return result.rows[0].exists;
}

/**
 * Get expected columns from Drizzle schema
 * Drizzle stores column definitions in the table object
 */
function getExpectedColumns(tableName: string): string[] {
  const tableSchema = schemaMap[tableName];
  if (!tableSchema) {
    return [];
  }
  
  // Drizzle table objects have column definitions as properties
  // We need to extract the column names (snake_case in database)
  const columns: string[] = [];
  
  for (const key in tableSchema) {
    // Skip non-column properties (Drizzle adds metadata)
    if (typeof tableSchema[key] === 'object' && tableSchema[key] !== null) {
      const col = tableSchema[key];
      // Check if it's a column definition (has name property)
      if (col.name) {
        columns.push(col.name);
      }
    }
  }
  
  return columns;
}

/**
 * Verify a single table
 */
async function verifyTable(pool: pg.Pool, tableName: string): Promise<VerificationResult> {
  try {
    // Check if table exists
    const exists = await tableExists(pool, tableName);
    if (!exists) {
      return {
        table: tableName,
        status: 'fail',
        message: `Table does not exist in database`,
      };
    }
    
    const actualColumns = await getTableColumns(pool, tableName);
    const expectedColumns = getExpectedColumns(tableName);
    
    if (expectedColumns.length === 0) {
      return {
        table: tableName,
        status: 'warning',
        message: 'Could not extract expected columns from schema (schema mapping may be missing)',
      };
    }
    
    const actualColumnNames = actualColumns.map(col => col.column_name);
    const missingColumns = expectedColumns.filter(col => !actualColumnNames.includes(col));
    const extraColumns = actualColumnNames.filter(col => !expectedColumns.includes(col));
    
    if (missingColumns.length > 0) {
      return {
        table: tableName,
        status: 'fail',
        message: `Missing columns: ${missingColumns.join(', ')}`,
        missingColumns,
        extraColumns: extraColumns.length > 0 ? extraColumns : undefined,
      };
    }
    
    if (extraColumns.length > 0) {
      return {
        table: tableName,
        status: 'warning',
        message: `Extra columns in database (not in schema): ${extraColumns.join(', ')}`,
        extraColumns,
      };
    }
    
    return {
      table: tableName,
      status: 'pass',
      message: `All ${actualColumnNames.length} columns verified`,
    };
  } catch (error: any) {
    return {
      table: tableName,
      status: 'fail',
      message: `Error verifying table: ${error.message}`,
    };
  }
}

/**
 * Main verification function
 */
async function verifySchema(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  console.log('🔍 Verifying database schema alignment...\n');
  console.log(`Database: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}\n`);
  
  // Determine SSL requirement
  const requiresSSL = databaseUrl.includes('neon.tech') || process.env.K_SERVICE !== undefined;
  
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: requiresSSL ? { rejectUnauthorized: false } : undefined,
  });
  
  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    const results: VerificationResult[] = [];
    
    for (const table of VERIFICATION_TABLES) {
      process.stdout.write(`Checking ${table}... `);
      const result = await verifyTable(pool, table);
      results.push(result);
      
      const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${result.message}`);
    }
    
    // Summary
    const passed = results.filter(r => r.status === 'pass').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const failed = results.filter(r => r.status === 'fail').length;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Verification Summary:');
    console.log(`   ✅ Passed: ${passed}/${results.length}`);
    console.log(`   ⚠️  Warnings: ${warnings}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log('='.repeat(60));
    
    if (failed > 0) {
      console.log('\n❌ Schema verification FAILED.');
      console.log('   Run migrations to align schema: npm run db:push');
      console.log('   Or create a migration file to add missing columns.');
      
      // Show details of failures
      console.log('\n📋 Failed Tables Details:');
      for (const result of results.filter(r => r.status === 'fail')) {
        console.log(`\n   ${result.table}:`);
        if (result.missingColumns) {
          console.log(`   Missing: ${result.missingColumns.join(', ')}`);
        }
        if (result.extraColumns) {
          console.log(`   Extra: ${result.extraColumns.join(', ')}`);
        }
      }
      
      process.exit(1);
    } else if (warnings > 0) {
      console.log('\n⚠️  Schema verification passed with warnings.');
      console.log('   Review extra columns - they may be technical debt.');
      process.exit(0);
    } else {
      console.log('\n✅ Schema verification PASSED.');
      console.log('   Database schema is aligned with Drizzle schema.');
      process.exit(0);
    }
  } catch (error: any) {
    console.error('\n❌ Verification script error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run verification
verifySchema();
