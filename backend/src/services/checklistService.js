const db = require('../config/db');

class ChecklistService {
  async createChecklist(cardId, title) {
    const query = `
      INSERT INTO checklists (card_id, title)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const { rows } = await db.query(query, [cardId, title || 'Checklist']);
    return rows[0];
  }

  async deleteChecklist(id) {
    const query = `DELETE FROM checklists WHERE id = $1 RETURNING *`;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  async addItem(checklistId, content) {
    // 1. Calculate position
    const posQuery = `SELECT MAX(position) as max_pos FROM checklist_items WHERE checklist_id = $1`;
    const posResult = await db.query(posQuery, [checklistId]);
    const maxPos = posResult.rows[0].max_pos || 0;
    const newPos = maxPos + 65535;

    const query = `
      INSERT INTO checklist_items (checklist_id, content, position)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const { rows } = await db.query(query, [checklistId, content, newPos]);
    return rows[0];
  }

  async updateItem(itemId, { is_completed, content, position }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (is_completed !== undefined) {
      fields.push(`is_completed = $${idx++}`);
      values.push(is_completed);
    }
    if (content !== undefined) {
      fields.push(`content = $${idx++}`);
      values.push(content);
    }
    if (position !== undefined) {
      fields.push(`position = $${idx++}`);
      values.push(position);
    }

    if (fields.length === 0) return null;

    values.push(itemId);
    const query = `
      UPDATE checklist_items 
      SET ${fields.join(', ')} 
      WHERE id = $${idx} 
      RETURNING *
    `;

    const { rows } = await db.query(query, values);
    return rows[0];
  }

  async deleteItem(itemId) {
    const query = `DELETE FROM checklist_items WHERE id = $1 RETURNING *`;
    const { rows } = await db.query(query, [itemId]);
    return rows[0];
  }
}

module.exports = new ChecklistService();
