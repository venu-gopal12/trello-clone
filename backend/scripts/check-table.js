const { pool } = require('../src/config/db');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function checkTable() {
  try {
    const res = await pool.query("SELECT to_regclass('public.starred_boards')");
    console.log('Table Check:', res.rows[0].to_regclass);
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    pool.end();
  }
}

checkTable();
