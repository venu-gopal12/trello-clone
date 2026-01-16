const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/health',
  method: 'GET',
};

const req = http.request(options, res => {
  console.log(`StatusCode: ${res.statusCode}`);

  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error('Error verifying backend:', error.message);
  // Backend might not be running? User is running "npm run dev".
  // I should check if it's listening.
});

req.end();
