const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

async function initDb() {
  try {
    const schemaPath = path.join(__dirname, '../schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Read schema.sql successfully.');
    console.log('Applying schema...');

    await pool.query(schemaSql);

    console.log('Schema applied successfully.');
  } catch (error) {
    console.error('Error applying schema:', error);
  } finally {
    await pool.end();
  }
}

initDb();
