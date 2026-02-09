const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          // Try parsing JSON, fallback to string
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function verify() {
  console.log('--- Verification Started ---');

  // 1. Health Check
  try {
    console.log('Checking /health...');
    const health = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/health',
      method: 'GET'
    });
    console.log('Health Status:', health.status);
    console.log('Health Body:', health.body);
  } catch (err) {
    console.error('Health Check Failed:', err.message);
  }

  // 2. Register User
  try {
    console.log('\nChecking /api/users/register...');
    const postData = JSON.stringify({
      username: 'verifyuser_' + Math.floor(Math.random() * 1000),
      email: 'verify_' + Math.floor(Math.random() * 1000) + '@example.com',
      password: 'password123'
    });

    const reg = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);
    
    console.log('Register Status:', reg.status);
    console.log('Register Body:', reg.body);
  } catch (err) {
    console.error('Register Failed:', err.message);
  }
}

verify();
