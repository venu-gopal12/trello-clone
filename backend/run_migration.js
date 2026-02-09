const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const sql = fs.readFileSync('admin_migration.sql', 'utf8');
    
    console.log('Running migration...');
    await pool.query(sql);
    console.log('✅ Migration completed successfully!');
    
    // Verify new columns
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('role', 'is_suspended')
      ORDER BY column_name
    `);
    
    console.log('\n✅ Verified new columns in users table:');
    console.table(result.rows);
    
    // Check admin_audit_logs table
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'admin_audit_logs'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ admin_audit_logs table created successfully');
    }
    
    // Get first user to make admin
    const users = await pool.query('SELECT id, username, email FROM users ORDER BY id LIMIT 1');
    if (users.rows.length > 0) {
      const firstUser = users.rows[0];
      console.log(`\n📝 First user found: ${firstUser.username} (${firstUser.email})`);
      console.log(`   To make this user a super admin, run:`);
      console.log(`   UPDATE users SET role = 'super_admin' WHERE id = ${firstUser.id};`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
