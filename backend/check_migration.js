const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkMigration() {
  try {
    // Check columns
    const cols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('role', 'is_suspended')
    `);
    
    console.log('✅ Migration status:');
    const hasRole = cols.rows.some(r => r.column_name === 'role');
    const hasSuspended = cols.rows.some(r => r.column_name === 'is_suspended');
    console.log(`   - role column: ${hasRole ? 'EXISTS ✓' : 'MISSING ✗'}`);
    console.log(`   - is_suspended column: ${hasSuspended ? 'EXISTS ✓' : 'MISSING ✗'}`);
    
    // Check table
    const table = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'admin_audit_logs'
    `);
    console.log(`   - admin_audit_logs table: ${table.rows.length > 0 ? 'EXISTS ✓' : 'MISSING ✗'}`);
    
    // List users
    const users = await pool.query('SELECT id, username, email, role FROM users ORDER BY id LIMIT 5');
    console.log('\n📋 Users in database:');
    if (users.rows.length === 0) {
      console.log('   No users found. Please register a user first.');
    } else {
      users.rows.forEach(u => {
        console.log(`   ID ${u.id}: ${u.username} (${u.email}) - Role: ${u.role || 'user'}`);
      });
    }
    
    await pool.end();
  } catch(err) {
    console.error('❌ Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

checkMigration();
