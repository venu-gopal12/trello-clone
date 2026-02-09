const adminService = require('../src/services/adminService');
const db = require('../src/config/db');
require('dotenv').config();

async function testDeleteOrg() {
  const client = await db.pool.connect();
  try {
    console.log('Setup: Creating a test user and organization...');
    
    // 1. Create a dummy admin user if not exists
    const userRes = await client.query(`
      INSERT INTO users (username, email, role, password_hash) 
      VALUES ('temp_admin', 'temp_admin@test.com', 'super_admin', 'hash')
      ON CONFLICT (email) DO UPDATE SET role = 'super_admin'
      RETURNING id
    `);
    const adminId = userRes.rows[0].id; // Access id correctly

    // 2. Create a dummy organization
    const orgRes = await client.query(`
      INSERT INTO organizations (name, slug) 
      VALUES ('Test Org to Delete', 'test-org-delete')
      RETURNING id
    `);
    const orgId = orgRes.rows[0].id;
    console.log(`Created Org ID: ${orgId}`);

    // 3. Try to delete it using the service
    console.log('Attempting to delete organization...');
    await adminService.deleteOrganization(adminId, orgId);
    
    console.log('✅ Delete Successful!');

  } catch (error) {
    console.error('❌ Delete Failed:', error);
  } finally {
    client.release();
    db.pool.end();
  }
}

testDeleteOrg();
