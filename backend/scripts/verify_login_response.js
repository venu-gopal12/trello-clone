async function testLogin() {
  try {
    const response = await fetch('http://localhost:5000/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('Login Status:', response.status);
    console.log('User Data:', JSON.stringify(data.user, null, 2));
    
    if (data.user.role) {
      console.log('✅ Role is present:', data.user.role);
    } else {
      console.log('❌ Role is MISSING from response!');
    }
  } catch (error) {
    console.error('Login failed:', error.message);
  }
}

testLogin();
