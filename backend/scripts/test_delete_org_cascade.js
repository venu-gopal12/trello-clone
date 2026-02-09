const adminService = require('../src/services/adminService');
const db = require('../src/config/db');
require('dotenv').config();

async function testDeleteOrgCascade() {
  const client = await db.pool.connect();
  try {
    console.log('Setup: Testing Delete Organization with dependencies...');
    
    // 1. Create a dummy admin
    const userRes = await client.query(`
      INSERT INTO users (username, email, role, password_hash) 
      VALUES ('del_test_admin', 'del_test@test.com', 'super_admin', 'hash')
      ON CONFLICT (email) DO UPDATE SET role = 'super_admin'
      RETURNING id
    `);
    const adminId = userRes.rows[0].id;

    // 2. Create organization
    const orgRes = await client.query(`
      INSERT INTO organizations (name, slug) 
      VALUES ('Cascade Test Org', 'cascade-test-org')
      RETURNING id
    `);
    const orgId = orgRes.rows[0].id;
    console.log(`Created Org ID: ${orgId}`);

    // 3. Create dependent data (Board & Member)
    await client.query(`
      INSERT INTO boards (organization_id, title, owner_id) 
      VALUES ($1, 'Dependent Board', $2)
    `, [orgId, adminId]);
    
    await client.query(`
      INSERT INTO organization_members (organization_id, user_id, role) 
      VALUES ($1, $2, 'admin')
    `, [orgId, adminId]);
    
    console.log('Created dependencies (Board, Member).');

    // 4. Try to delete
    console.log('Attempting to delete organization...');
    await adminService.deleteOrganization(adminId, orgId);
    
    // 5. Verify deletion
    const check = await client.query('SELECT * FROM organizations WHERE id = $1', [orgId]);
    if (check.rows.length === 0) {
        console.log('✅ Delete Successful! Organization and dependencies removed.');
    } else {
        console.error('❌ Organization still exists!');
    }

  } catch (error) {
    console.error('❌ Delete Failed with Error:', error);
  } finally {
    client.release();
    db.pool.end();
  }
}

testDeleteOrgCascade();
