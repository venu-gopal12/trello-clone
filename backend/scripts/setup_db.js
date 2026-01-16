const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Venu@gopal123',
  port: 5432,
};
const DB_NAME = 'trello_clone';

async function setup() {
  console.log('Starting setup...');
  
  // 1. Check/Create DB
  const client1 = new Client(dbConfig);
  try {
    await client1.connect();
    console.log('Connected to postgres.');
    
    // Check if DB exists
    const res = await client1.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME]);
    if (res.rowCount === 0) {
      console.log(`Database ${DB_NAME} not found. Creating...`);
      // Warning: Injection risk if DB_NAME input is untrusted, but here it is hardcoded/trusted.
      // Parameterized queries don't work for identifiers like database names in CREATE DATABASE.
      await client1.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log('Database created.');
    } else {
      console.log('Database already exists.');
    }
  } catch (err) {
    console.error('Error checking/creating DB:', err);
    process.exit(1);
  } finally {
    await client1.end();
  }

  // 2. Apply Schema
  console.log('Applying schema...');
  const client2 = new Client({
    ...dbConfig,
    database: DB_NAME,
  });

  try {
    await client2.connect();
    console.log(`Connected to ${DB_NAME}.`);

    const schemaPath = path.join(__dirname, '../schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    await client2.query(schemaSql);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Error applying schema:', err);
    process.exit(1);
  } finally {
    await client2.end();
  }
}

setup();
