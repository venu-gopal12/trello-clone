const { pool } = require('../config/db');

class OrganizationService {
  async createOrganization(userId, { name, slug, logo_url }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create Organization
      const orgQuery = `
        INSERT INTO organizations (name, slug, logo_url)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const orgResult = await client.query(orgQuery, [name, slug, logo_url]);
      const org = orgResult.rows[0];

      // Add Creator as Admin
      const memberQuery = `
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES ($1, $2, $3)
      `;
      await client.query(memberQuery, [org.id, userId, 'admin']);

      await client.query('COMMIT');
      return org;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserOrganizations(userId) {
    const query = `
      SELECT o.*, om.role
      FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE om.user_id = $1
      ORDER BY o.name ASC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async getOrganizationById(userId, orgId) {
    // Check if user is member
    const memberCheck = `
      SELECT role FROM organization_members
      WHERE organization_id = $1 AND user_id = $2
    `;
    const memberResult = await pool.query(memberCheck, [orgId, userId]);
    
    if (memberResult.rows.length === 0) {
      throw new Error('Unauthorized or Organization not found');
    }

    const orgQuery = `SELECT * FROM organizations WHERE id = $1`;
    const orgResult = await pool.query(orgQuery, [orgId]);
    return { ...orgResult.rows[0], role: memberResult.rows[0].role };
  }

  async updateOrganization(userId, orgId, { name, logo_url }) {
    // Check admin role
    const memberCheck = `
      SELECT role FROM organization_members
      WHERE organization_id = $1 AND user_id = $2
    `;
    const memberResult = await pool.query(memberCheck, [orgId, userId]);
    
    if (memberResult.rows.length === 0 || memberResult.rows[0].role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const query = `
      UPDATE organizations
      SET name = COALESCE($1, name),
          logo_url = COALESCE($2, logo_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [name, logo_url, orgId]);
    return result.rows[0];
  }

  async deleteOrganization(userId, orgId) {
    // Check admin role
    const memberCheck = `
      SELECT role FROM organization_members
      WHERE organization_id = $1 AND user_id = $2
    `;
    const memberResult = await pool.query(memberCheck, [orgId, userId]);
    
    if (memberResult.rows.length === 0 || memberResult.rows[0].role !== 'admin') {
      throw new Error('Unauthorized');
    }

    await pool.query('DELETE FROM organizations WHERE id = $1', [orgId]);
    return { message: 'Organization deleted' };
  }
}

module.exports = new OrganizationService();
