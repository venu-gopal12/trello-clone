const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function countUsers() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT COUNT(*) FROM users');
    const count = res.rows[0].count;
    console.log(`Total users in database: ${count}`);
    
    if (count > 0) {
        const users = await client.query('SELECT id, username, email FROM users ORDER BY id');
        console.log('\nUser List:');
        users.rows.forEach(u => {
            console.log(`- [${u.id}] ${u.username} (${u.email})`);
        });
    }

  } catch (err) {
    console.error('Error counting users:', err);
  } finally {
    client.release();
    pool.end();
  }
}

countUsers();
