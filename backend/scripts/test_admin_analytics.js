const jwt = require('jsonwebtoken');
require('dotenv').config();

// Mock an admin token
// Using hardcoded secret to match .env.example or what I saw in .env
const secret = process.env.JWT_SECRET || 'super_secret_key'; 
const adminToken = jwt.sign(
  { id: 1, email: 'test@example.com', role: 'super_admin' },
  secret,
  { expiresIn: '1h' }
);

async function testAnalytics() {
  try {
    console.log('Testing /api/admin/analytics with admin token...');
    
    // Explicitly use http://localhost:5000/api/admin/analytics
    const response = await fetch('http://localhost:5000/api/admin/analytics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();
    console.log('✅ Analytics Data:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Analytics Request Failed:', error.message);
  }
}

testAnalytics();
