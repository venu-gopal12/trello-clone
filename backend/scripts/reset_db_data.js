const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function resetDbData() {
  const client = await pool.connect();
  try {
    console.log('Connected to database. Starting data reset...');
    
    await client.query('BEGIN');
    
    // Disable triggers temporarily to avoid constraint issues during truncate
    // (though truncate cascade should handle foreign keys)
    // Actually, TRUNCATE CASCADE is cleaner.
    
    const tables = [
      'admin_audit_logs',
      'audit_logs',
      'card_members',
      'board_members',
      'checklist_items',
      'checklists',
      'card_labels',
      'labels',
      'cards',
      'lists',
      'boards',
      'organization_members',
      'organizations',
      'users'
    ];
    
    console.log(`Truncating tables: ${tables.join(', ')}`);
    
    // TRUNCATE TABLE ... RESTART IDENTITY CASCADE
    // This resets sequences and handles FKs if tables are empty or CASCADE is used.
    // CASCADE causes truncation of referencing tables too, so order doesn't matter much for TRUNCATE.
    await client.query(`TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE;`);
    
    await client.query('COMMIT');
    console.log('All data deleted successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error resetting database data:', error);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

resetDbData();
