const db = require('../config/db');

class AdminService {
  // ==================== User Management ====================
  
  async getAllUsers({ page = 1, limit = 50, search = '', role = '', suspended = '' }) {
    let query = `
      SELECT id, username, email, avatar_url, role, is_suspended, created_at
      FROM users
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Search filter
    if (search) {
      paramCount++;
      query += ` AND (username ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Role filter
    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(role);
    }

    // Suspended filter
    if (suspended !== '') {
      paramCount++;
      query += ` AND is_suspended = $${paramCount}`;
      params.push(suspended === 'true');
    }

    // Count total
    const countQuery = `SELECT COUNT(*) FROM (${query}) as filtered`;
    const { rows: countRows } = await db.query(countQuery, params);
    const total = parseInt(countRows[0].count);

    // Pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);

    return {
      users: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getUserById(userId) {
    const query = `
      SELECT u.id, u.username, u.email, u.avatar_url, u.role, u.is_suspended, 
             u.created_at, u.auth_provider,
             COUNT(DISTINCT om.organization_id) as organization_count,
             COUNT(DISTINCT bm.board_id) as board_count
      FROM users u
      LEFT JOIN organization_members om ON u.id = om.user_id
      LEFT JOIN board_members bm ON u.id = bm.user_id
      WHERE u.id = $1
      GROUP BY u.id
    `;
    const { rows } = await db.query(query, [userId]);
    
    if (rows.length === 0) {
      throw new Error('User not found');
    }

    return rows[0];
  }

  async suspendUser(adminUserId, userId, reason = '') {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update user
      await client.query(
        'UPDATE users SET is_suspended = TRUE WHERE id = $1',
        [userId]
      );

      // Log action
      await this.logAdminAction(client, {
        adminUserId,
        actionType: 'suspend_user',
        targetEntityType: 'user',
        targetEntityId: userId,
        details: { reason }
      });

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async activateUser(adminUserId, userId) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update user
      await client.query(
        'UPDATE users SET is_suspended = FALSE WHERE id = $1',
        [userId]
      );

      // Log action
      await this.logAdminAction(client, {
        adminUserId,
        actionType: 'activate_user',
        targetEntityType: 'user',
        targetEntityId: userId,
        details: {}
      });

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateUserRole(adminUserId, userId, newRole) {
    if (!['user', 'admin', 'super_admin'].includes(newRole)) {
      throw new Error('Invalid role');
    }

    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get old role
      const { rows } = await client.query('SELECT role FROM users WHERE id = $1', [userId]);
      const oldRole = rows[0]?.role;

      // Update user role
      await client.query(
        'UPDATE users SET role = $1 WHERE id = $2',
        [newRole, userId]
      );

      // Log action
      await this.logAdminAction(client, {
        adminUserId,
        actionType: 'change_role',
        targetEntityType: 'user',
        targetEntityId: userId,
        details: { oldRole, newRole }
      });

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteUser(adminUserId, userId) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get user info before deletion
      const { rows } = await client.query(
        'SELECT username, email FROM users WHERE id = $1',
        [userId]
      );
      const user = rows[0];

      // Delete user (cascades to related tables)
      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      // Log action
      await this.logAdminAction(client, {
        adminUserId,
        actionType: 'delete_user',
        targetEntityType: 'user',
        targetEntityId: userId,
        details: { username: user.username, email: user.email }
      });

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ==================== Organization Management ====================

  async getAllOrganizations({ page = 1, limit = 50, search = '' }) {
    let query = `
      SELECT o.id, o.name, o.slug, o.logo_url, o.created_at,
             COUNT(DISTINCT om.user_id) as member_count,
             COUNT(DISTINCT b.id) as board_count
      FROM organizations o
      LEFT JOIN organization_members om ON o.id = om.organization_id
      LEFT JOIN boards b ON o.id = b.organization_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Search filter
    if (search) {
      paramCount++;
      query += ` AND (o.name ILIKE $${paramCount} OR o.slug ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY o.id`;

    // Count total
    const countQuery = `SELECT COUNT(*) FROM (${query}) as filtered`;
    const { rows: countRows } = await db.query(countQuery, params);
    const total = parseInt(countRows[0].count);

    // Pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);

    return {
      organizations: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getOrganizationById(orgId) {
    const query = `
      SELECT o.id, o.name, o.slug, o.logo_url, o.created_at,
             COUNT(DISTINCT om.user_id) as member_count,
             COUNT(DISTINCT b.id) as board_count
      FROM organizations o
      LEFT JOIN organization_members om ON o.id = om.organization_id
      LEFT JOIN boards b ON o.id = b.organization_id
      WHERE o.id = $1
      GROUP BY o.id
    `;
    const { rows } = await db.query(query, [orgId]);
    
    if (rows.length === 0) {
      throw new Error('Organization not found');
    }

    // Get members
    const membersQuery = `
      SELECT u.id, u.username, u.email, u.avatar_url, om.role, om.joined_at
      FROM organization_members om
      JOIN users u ON om.user_id = u.id
      WHERE om.organization_id = $1
      ORDER BY om.joined_at DESC
    `;
    const { rows: members } = await db.query(membersQuery, [orgId]);

    return {
      ...rows[0],
      members
    };
  }

  async deleteOrganization(adminUserId, orgId) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get org info before deletion
      const { rows } = await client.query(
        'SELECT name, slug FROM organizations WHERE id = $1',
        [orgId]
      );
      const org = rows[0];

      // Delete organization (cascades to related tables)
      await client.query('DELETE FROM organizations WHERE id = $1', [orgId]);

      // Log action
      await this.logAdminAction(client, {
        adminUserId,
        actionType: 'delete_organization',
        targetEntityType: 'organization',
        targetEntityId: orgId,
        details: { name: org.name, slug: org.slug }
      });

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ==================== Analytics ====================

  async getPlatformAnalytics() {
    const queries = {
      totalUsers: 'SELECT COUNT(*) as count FROM users',
      activeUsers: `
        SELECT COUNT(DISTINCT user_id) as count 
        FROM audit_logs 
        WHERE created_at > NOW() - INTERVAL '30 days'
      `,
      suspendedUsers: 'SELECT COUNT(*) as count FROM users WHERE is_suspended = TRUE',
      totalOrganizations: 'SELECT COUNT(*) as count FROM organizations',
      totalBoards: 'SELECT COUNT(*) as count FROM boards',
      totalCards: 'SELECT COUNT(*) as count FROM cards',
      recentSignups: `
        SELECT COUNT(*) as count 
        FROM users 
        WHERE created_at > NOW() - INTERVAL '7 days'
      `
    };

    const results = {};
    
    for (const [key, query] of Object.entries(queries)) {
      const { rows } = await db.query(query);
      results[key] = parseInt(rows[0].count);
    }

    // Get user growth data (last 30 days)
    const growthQuery = `
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    const { rows: growthData } = await db.query(growthQuery);
    results.userGrowth = growthData;

    return results;
  }

  // ==================== Audit Logging ====================

  async logAdminAction(client, { adminUserId, actionType, targetEntityType, targetEntityId, details }) {
    const query = `
      INSERT INTO admin_audit_logs (admin_user_id, action_type, target_entity_type, target_entity_id, details)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    await client.query(query, [
      adminUserId,
      actionType,
      targetEntityType,
      targetEntityId,
      JSON.stringify(details)
    ]);
  }

  async getAdminAuditLogs({ page = 1, limit = 50, adminUserId = '', actionType = '' }) {
    let query = `
      SELECT aal.*, u.username as admin_username, u.email as admin_email
      FROM admin_audit_logs aal
      LEFT JOIN users u ON aal.admin_user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Filter by admin user
    if (adminUserId) {
      paramCount++;
      query += ` AND aal.admin_user_id = $${paramCount}`;
      params.push(adminUserId);
    }

    // Filter by action type
    if (actionType) {
      paramCount++;
      query += ` AND aal.action_type = $${paramCount}`;
      params.push(actionType);
    }

    // Count total
    const countQuery = `SELECT COUNT(*) FROM (${query}) as filtered`;
    const { rows: countRows } = await db.query(countQuery, params);
    const total = parseInt(countRows[0].count);

    // Pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY aal.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);

    return {
      logs: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new AdminService();
