const { Client } = require('pg');

const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Venu@gopal123',
  port: 5432,
};

async function run() {
  console.log('Starting async debug...');
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected!');
    await client.end();
    console.log('Disconnected.');
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
