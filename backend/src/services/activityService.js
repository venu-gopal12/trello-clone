const { pool } = require('../config/db');

class ActivityService {
  async logActivity({ userId, organizationId, boardId, entityType, entityId, actionType, details }) {
    const query = `
      INSERT INTO audit_logs (user_id, organization_id, board_id, entity_type, entity_id, action_type, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      userId,
      organizationId || null,
      boardId || null,
      entityType,
      entityId,
      actionType,
      details ? JSON.stringify(details) : null
    ];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw error to avoid blocking main action
      return null;
    }
  }

  async getOrganizationActivity(organizationId, limit = 50, offset = 0) {
    const query = `
      SELECT al.*, u.username, u.avatar_url
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.organization_id = $1
      ORDER BY al.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [organizationId, limit, offset]);
    return result.rows;
  }

  async getBoardActivity(boardId, limit = 50, offset = 0) {
    const query = `
      SELECT al.*, u.username, u.avatar_url
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.board_id = $1
      ORDER BY al.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [boardId, limit, offset]);
    return result.rows;
  }

  async getCardActivity(cardId, limit = 50, offset = 0) {
    // Card activity is logs where entity_type = 'card' and entity_id = cardId 
    // OR logs related to elements of the card (checklist items? maybe)
    // Simpler: entity_type = 'card' AND entity_id = cardId
    const query = `
      SELECT al.*, u.username, u.avatar_url
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.entity_type = 'card' AND al.entity_id = $1
      ORDER BY al.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [cardId, limit, offset]);
    return result.rows;
  }
}

module.exports = new ActivityService();
