const db = require('../config/db');

class AuditService {
  async logAction(boardId, userId, entityType, entityId, actionType, details = {}) {
    try {
      const query = `
        INSERT INTO audit_logs (board_id, user_id, entity_type, entity_id, action_type, details)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const values = [boardId, userId, entityType, entityId, actionType, JSON.stringify(details)];
      await db.query(query, values);
    } catch (error) {
      console.error('Failed to log action:', error);
      // We don't throw here to avoid blocking the main action if logging fails
    }
  }

  async getBoardActivity(boardId, limit = 50) {
    const query = `
      SELECT al.*, u.username, u.avatar_url 
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.board_id = $1
      ORDER BY al.created_at DESC
      LIMIT $2;
    `;
    const { rows } = await db.query(query, [boardId, limit]);
    return rows;
  }

  async getCardActivity(cardId, limit = 50) {
    const query = `
      SELECT al.*, u.username, u.avatar_url 
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.entity_type = 'card' AND al.entity_id = $1
      ORDER BY al.created_at DESC
      LIMIT $2;
    `;
    const { rows } = await db.query(query, [cardId, limit]);
    return rows;
  }
}

module.exports = new AuditService();
