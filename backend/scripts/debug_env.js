const path = require('path');
const dotenv = require('dotenv');

const result = dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('Dotenv parsed:', result.parsed);
console.log('Dotenv error:', result.error);

if (result.error) {
  console.log('Error loading .env');
} else {
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_NAME:', process.env.DB_NAME);
}
