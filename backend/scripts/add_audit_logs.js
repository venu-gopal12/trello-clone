const db = require('../src/config/db');

async function migrate() {
  try {
    console.log('Creating audit_logs table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          entity_type VARCHAR(20),
          entity_id INTEGER,
          action_type VARCHAR(50),
          details JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
