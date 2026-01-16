const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  password: 'Venu@gopal123',
  port: 5432,
};

const DB_NAME = 'trello_clone';

async function createDatabase() {
  console.log('Connecting to postgres database to check existence...');
  const client = new Client({
    ...dbConfig,
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to postgres database.');

    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`;
    const res = await client.query(checkDbQuery);

    if (res.rowCount === 0) {
      console.log(`Database ${DB_NAME} not found. Creating...`);
      await client.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`Database ${DB_NAME} created.`);
    } else {
      console.log(`Database ${DB_NAME} already exists.`);
    }
  } catch (err) {
    console.error('Error during database check/creation:', err);
    throw err;
  } finally {
    await client.end();
  }
}

async function runSchema() {
  try {
      await createDatabase();

      console.log(`Connecting to ${DB_NAME} to apply schema...`);
      const client = new Client({
        ...dbConfig,
        database: DB_NAME,
      });

      await client.connect();
      console.log(`Connected to ${DB_NAME}.`);
      
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
