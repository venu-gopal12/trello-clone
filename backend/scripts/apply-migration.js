const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function applyMigration() {
  try {
    const migrationPath = process.argv[2];
    if (!migrationPath) {
      console.error('Please provide a migration file path');
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(`Applying migration: ${migrationPath}`);
    
    await pool.query(sql);
    console.log('Migration applied successfully.');
  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    await pool.end();
  }
}

applyMigration();
