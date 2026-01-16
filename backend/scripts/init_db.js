const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const clientConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'trello_clone'
    };

async function runSchema() {
  const client = new Client(clientConfig);

  try {
      await client.connect();
      console.log('Connected to database.');
      
      const schemaPath = path.join(__dirname, '../schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      console.log('Running schema.sql...');
      await client.query(schemaSql);
      console.log('Schema applied successfully.');
      await client.end();
  } catch (err) {
      console.error('Error in runSchema:', err);
      process.exit(1);
  }
}

runSchema();
