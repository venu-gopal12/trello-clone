const db = require('../src/config/db');

async function migrate() {
  try {
    console.log('Adding background_image column to boards table...');
    await db.query(`ALTER TABLE boards ADD COLUMN IF NOT EXISTS background_image TEXT;`);
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
