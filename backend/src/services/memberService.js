const { pool } = require('../config/db');

class MemberService {
  // Get all members of an organization
  async getOrganizationMembers(orgId, userId) {
    // Verify user is a member of the organization
    const memberCheck = await pool.query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [orgId, userId]
    );

    if (memberCheck.rows.length === 0) {
      throw new Error('Unauthorized');
    }

    // Get all members with user details
    const query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.avatar_url,
        om.role,
        om.joined_at
      FROM organization_members om
      JOIN users u ON om.user_id = u.id
      WHERE om.organization_id = $1
      ORDER BY om.joined_at ASC
    `;
    
    const result = await pool.query(query, [orgId]);
    return result.rows;
  }

  // Add a member to the organization
  async addMember(orgId, userId, { email, role = 'member' }) {
    // Verify requester is an admin
    const adminCheck = await pool.query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [orgId, userId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      throw new Error('Unauthorized: Only admins can add members');
    }

    // Find user by email
    const userResult = await pool.query(
      'SELECT id, username, email, avatar_url FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found. Please ask them to sign up first.');
    }

    const targetUser = userResult.rows[0];

    // Check if user is already a member
    const existingMember = await pool.query(
      'SELECT * FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [orgId, targetUser.id]
    );

    if (existingMember.rows.length > 0) {
      throw new Error('User is already a member of this organization');
    }

    // Add the member
    await pool.query(
      'INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)',
      [orgId, targetUser.id, role]
    );

    return {
      id: targetUser.id,
      username: targetUser.username,
      email: targetUser.email,
      avatar_url: targetUser.avatar_url,
      role,
      joined_at: new Date()
    };
  }

  // Update a member's role
  async updateMemberRole(orgId, userId, targetUserId, newRole) {
    // Verify requester is an admin
    const adminCheck = await pool.query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [orgId, userId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      throw new Error('Unauthorized: Only admins can change roles');
    }

    // Check if target user is a member
    const memberCheck = await pool.query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [orgId, targetUserId]
    );

    if (memberCheck.rows.length === 0) {
      throw new Error('User is not a member of this organization');
    }

    const currentRole = memberCheck.rows[0].role;

    // If demoting from admin, check if they're the last admin
    if (currentRole === 'admin' && newRole !== 'admin') {
      const adminCount = await pool.query(
        'SELECT COUNT(*) FROM organization_members WHERE organization_id = $1 AND role = $2',
        [orgId, 'admin']
      );

      if (parseInt(adminCount.rows[0].count) <= 1) {
        throw new Error('Cannot remove the last admin. Promote another member first.');
      }
    }

    // Update the role
    await pool.query(
      'UPDATE organization_members SET role = $1 WHERE organization_id = $2 AND user_id = $3',
      [newRole, orgId, targetUserId]
    );

    return { success: true, role: newRole };
  }

  // Remove a member from the organization
  async removeMember(orgId, userId, targetUserId) {
    // Verify requester is an admin
    const adminCheck = await pool.query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [orgId, userId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      throw new Error('Unauthorized: Only admins can remove members');
    }

    // Check if target user is a member
    const memberCheck = await pool.query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [orgId, targetUserId]
    );

    if (memberCheck.rows.length === 0) {
      throw new Error('User is not a member of this organization');
    }

    // If removing an admin, check if they're the last admin
    if (memberCheck.rows[0].role === 'admin') {
      const adminCount = await pool.query(
        'SELECT COUNT(*) FROM organization_members WHERE organization_id = $1 AND role = $2',
        [orgId, 'admin']
      );

      if (parseInt(adminCount.rows[0].count) <= 1) {
        throw new Error('Cannot remove the last admin');
      }
    }

    // Remove the member
    await pool.query(
      'DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [orgId, targetUserId]
    );

    return { success: true, message: 'Member removed successfully' };
  }
}

module.exports = new MemberService();
