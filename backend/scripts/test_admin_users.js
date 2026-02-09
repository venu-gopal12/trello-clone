const jwt = require('jsonwebtoken');
require('dotenv').config();

// Mock an admin token
const secret = process.env.JWT_SECRET || 'super_secret_key'; 
const adminToken = jwt.sign(
  { id: 1, email: 'test@example.com', role: 'super_admin' },
  secret,
  { expiresIn: '1h' }
);

async function testGetUsers() {
  try {
    console.log('Testing /api/admin/users with admin token...');
    
    // Test with default filters
    const response = await fetch('http://localhost:5000/api/admin/users?page=1&limit=10', {
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
    console.log('✅ Users Data:', JSON.stringify(data, null, 2));
    
    if (data.users && Array.isArray(data.users)) {
        console.log(`✅ Received ${data.users.length} users.`);
    } else {
        console.log('❌ Response structure is incorrect (missing users array).');
    }

  } catch (error) {
    console.error('❌ Users Request Failed:', error.message);
  }
}

testGetUsers();
