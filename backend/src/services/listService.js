const db = require('../config/db');
const auditService = require('./auditService');

class ListService {
  async createList(boardId, title, userId = 1) {
    // 1. Calculate new position (Method: Append to end)
    // Find the current max position for this board
    const posQuery = `SELECT MAX(position) as max_pos FROM lists WHERE board_id = $1`;
    const posResult = await db.query(posQuery, [boardId]);
    const maxPos = posResult.rows[0].max_pos || 0;
    const newPos = maxPos + 65535; // Large gap to allow insertions

    const query = `
      INSERT INTO lists (board_id, title, position)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [boardId, title, newPos];
    const { rows } = await db.query(query, values);
    const list = rows[0];

    // Log Activity
    if (list) {
      await auditService.logAction(boardId, userId, 'list', list.id, 'create', { title });
    }

    return list;
  }

  async updateList(id, { title, position, closed }, userId = 1) {
    // Dynamic query generation
    const fields = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(title);
    }
    if (position !== undefined) {
      fields.push(`position = $${idx++}`);
      values.push(position);
    }
    // "closed" or archived status could be added here if schema supported it

    fields.push(`updated_at = NOW()`);

    if (fields.length === 1) { // Only updated_at
        return null; // Nothing to update
    }

    values.push(id);
    const query = `
      UPDATE lists 
      SET ${fields.join(', ')} 
      WHERE id = $${idx} 
      RETURNING *
    `;

    const { rows } = await db.query(query, values);
    const updatedList = rows[0];

    if (updatedList) {
      try {
        let action = 'update';
        let details = {};
        
        if (title !== undefined) {
          action = 'rename';
          details.new_title = title;
        } else if (position !== undefined) {
          action = 'move';
          details.new_position = position; // Simplified log
        }

        // We need board_id.
        // It's in updatedList.
        await auditService.logAction(updatedList.board_id, userId, 'list', updatedList.id, action, details);
      } catch (e) {
        console.error('Audit Log Error', e);
      }
    }

    return updatedList;
  }

  async deleteList(id, userId = 1) {
    // Need board_id before delete
    const listQuery = `SELECT board_id, title FROM lists WHERE id = $1`;
    const listRes = await db.query(listQuery, [id]);
    const listToDelete = listRes.rows[0];

    const query = `DELETE FROM lists WHERE id = $1 RETURNING *`;
    const { rows } = await db.query(query, [id]);
    
    if (listToDelete) {
        try {
            await auditService.logAction(listToDelete.board_id, userId, 'list', id, 'delete', { title: listToDelete.title });
        } catch (e) { console.error('Audit Log Error', e); }
    }

    return rows[0];
  }
}

/**
 * Reordering Algorithm Implementation Note:
 * 
 * Strategy: "Fractional Indexing" (Simplified)
 * 
 * When a list is dropped between List A and List B:
 * New Position = (PosA + PosB) / 2
 * 
 * Case 1: Dropped at Start
 * New Position = FirstList.pos / 2
 * 
 * Case 2: Dropped at End
 * New Position = LastList.pos + 65535
 * 
 * Case 3: Dropped in Empty Area
 * New Position = 65535
 * 
 * Safety:
 * If (PosA - PosB) < 0.0001 (Collision imminent), we trigger a "Rebalance".
 * Rebalance: Fetch all lists, sort them, and reset positions to 65535, 131070...
 * 
 * The Frontend is expected to calculate the 'position' value based on the
 * surrounding items and send it to the 'updateList' endpoint.
 */

module.exports = new ListService();
