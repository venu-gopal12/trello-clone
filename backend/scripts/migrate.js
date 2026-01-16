const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

async function migrate() {
  try {
    const schemaPath = path.join(__dirname, '../schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Running migration...');
    await db.query(schemaSql);
    console.log('Migration completed successfully.');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
