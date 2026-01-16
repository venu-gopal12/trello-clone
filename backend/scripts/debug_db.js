const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Venu@gopal123',
  port: 5432,
});

client.connect()
  .then(() => {
    console.log('Connected successfully');
    return client.end();
  })
  .catch(e => {
    console.error('Connection failed');
    console.error(e);
    process.exit(1);
  });
