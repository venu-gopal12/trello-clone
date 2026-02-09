const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function makeAdmin() {
  try {
    // Get user ID from command line or use first user
    const userId = process.argv[2] || null;
    
    let user;
    if (userId) {
      const result = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [userId]);
      user = result.rows[0];
    } else {
      // Get first user
      const result = await pool.query('SELECT id, username, email, role FROM users ORDER BY id LIMIT 1');
      user = result.rows[0];
    }
    
    if (!user) {
      console.log('❌ No user found. Please register a user first.');
      await pool.end();
      return;
    }
    
    console.log(`\n👤 Current user: ${user.username} (${user.email})`);
    console.log(`   Current role: ${user.role || 'user'}`);
    
    // Update to super_admin
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['super_admin', user.id]);
    
    console.log(`\n✅ Successfully updated to super_admin!`);
    console.log(`\n🎉 You can now:`);
    console.log(`   1. Login with: ${user.email}`);
    console.log(`   2. Click your avatar (top-right)`);
    console.log(`   3. Click "⚡ Admin Panel"`);
    console.log(`   4. Access admin features at /admin`);
    
    await pool.end();
  } catch(err) {
    console.error('❌ Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

makeAdmin();
