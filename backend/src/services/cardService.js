const db = require('../config/db');

const auditService = require('./auditService');

class CardService {
  async createCard(listId, title, userId = 1) {
    // 1. Calculate new position (Method: Append to end of list)
    const posQuery = `SELECT MAX(position) as max_pos FROM cards WHERE list_id = $1`;
    const posResult = await db.query(posQuery, [listId]);
    const maxPos = posResult.rows[0].max_pos || 0;
    const newPos = maxPos + 65535;

    const query = `
      INSERT INTO cards (list_id, title, position)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [listId, title, newPos];
    const { rows } = await db.query(query, values);
    const card = rows[0];

    // Log Activity
    try {
      const listQuery = `SELECT board_id FROM lists WHERE id = $1`;
      const listRes = await db.query(listQuery, [listId]);
      if (listRes.rows.length > 0) {
        await auditService.logAction(listRes.rows[0].board_id, userId, 'card', card.id, 'create', { title });
      }
    } catch (e) { console.error('Audit Log Error', e); }

    return card;
  }

  async updateCard(id, updates, userId = 1) {
    const { title, description, due_date, list_id, position } = updates;
    const fields = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(title);
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description);
    }
    if (due_date !== undefined) {
      fields.push(`due_date = $${idx++}`);
      values.push(due_date);
    }
    // Moving card logic
    if (list_id !== undefined) {
      fields.push(`list_id = $${idx++}`);
      values.push(list_id);
    }
    if (position !== undefined) {
      fields.push(`position = $${idx++}`);
      values.push(position);
    }

    fields.push(`updated_at = NOW()`);
    
    if (fields.length === 1) return null;

    values.push(id);
    const query = `
      UPDATE cards 
      SET ${fields.join(', ')} 
      WHERE id = $${idx} 
      RETURNING *
    `;

    // Fetch old data for logging comparison if needed (omitted for speed, just logging action)
    // We need board_id though.
    // Optimization: Log after update.
    
    const { rows } = await db.query(query, values);
    const updatedCard = rows[0];
    
    if (updatedCard) {
       try {
         // Determine action type
         let action = 'update';
         let details = {};
         if (list_id !== undefined || position !== undefined) {
             action = 'move';
             details = { list_id, position };
         } else {
             if (title) details.title = title;
             if (description) details.description_changed = true;
         }

         // Get board_id from list
         // This assumes list_id didn't change OR we fetch from new list_id
         // If list_id changed, we should use it. If not, use current list_id from card.
         const currentListId = updatedCard.list_id;
         const listQuery = `SELECT board_id FROM lists WHERE id = $1`;
         const listRes = await db.query(listQuery, [currentListId]);
         if (listRes.rows.length > 0) {
             await auditService.logAction(listRes.rows[0].board_id, userId, 'card', updatedCard.id, action, details);
         }
       } catch (e) { console.error('Audit Log Error', e); }
    }

    return updatedCard;
  }

  async deleteCard(id, userId = 1) {
    // Get card details before delete to know board_id
    const cardQuery = `
        SELECT c.*, l.board_id 
        FROM cards c 
        JOIN lists l ON c.list_id = l.id 
        WHERE c.id = $1
    `;
    const checkRes = await db.query(cardQuery, [id]);
    const cardToDelete = checkRes.rows[0];

    const query = `DELETE FROM cards WHERE id = $1 RETURNING *`;
    const { rows } = await db.query(query, [id]);
    
    if (cardToDelete) {
        try {
            await auditService.logAction(cardToDelete.board_id, userId, 'card', id, 'delete', { title: cardToDelete.title });
        } catch (e) { console.error('Audit Log Error', e); }
    }

    return rows[0];
  }

  // --- DETAILS FEATURES ---

  async getCardById(id) {
    // Fetch Card
    const cardQuery = `SELECT * FROM cards WHERE id = $1`;
    const cardRes = await db.query(cardQuery, [id]);
    if (cardRes.rows.length === 0) return null;
    const card = cardRes.rows[0];

    // Fetch Labels
    const labelsQuery = `
      SELECT l.* FROM labels l
      JOIN card_labels cl ON l.id = cl.label_id
      WHERE cl.card_id = $1
    `;
    const labelsRes = await db.query(labelsQuery, [id]);

    // Fetch Members
    const membersQuery = `
      SELECT u.id, u.username, u.avatar_url, u.email FROM users u
      JOIN card_members cm ON u.id = cm.user_id
      WHERE cm.card_id = $1
    `;
    const membersRes = await db.query(membersQuery, [id]);

    // Fetch Checklists & Items
    const checklistsQuery = `SELECT * FROM checklists WHERE card_id = $1 ORDER BY position ASC`;
    const checklistsRes = await db.query(checklistsQuery, [id]);
    const checklists = checklistsRes.rows;

    // Fetch Items for these checklists
    const checklistIds = checklists.map(c => c.id);
    let items = [];
    if (checklistIds.length > 0) {
      const itemsQuery = `
        SELECT * FROM checklist_items 
        WHERE checklist_id = ANY($1::int[]) 
        ORDER BY position ASC
      `;
      const itemsRes = await db.query(itemsQuery, [checklistIds]);
      items = itemsRes.rows;
    }

    // Assemble Checklists
    const checklistsWithItems = checklists.map(cl => ({
      ...cl,
      items: items.filter(i => i.checklist_id === cl.id)
    }));

    return {
      ...card,
      labels: labelsRes.rows,
      members: membersRes.rows,
      checklists: checklistsWithItems
    };
  }

  async addLabel(cardId, labelId) {
    const query = `
      INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2)
      ON CONFLICT DO NOTHING RETURNING *
    `;
    const { rows } = await db.query(query, [cardId, labelId]);
    return rows[0];
  }

  async removeLabel(cardId, labelId) {
    const query = `DELETE FROM card_labels WHERE card_id = $1 AND label_id = $2`;
    await db.query(query, [cardId, labelId]);
    return { message: 'Label removed' };
  }

  async addMember(cardId, userId) {
    const query = `
      INSERT INTO card_members (card_id, user_id) VALUES ($1, $2)
      ON CONFLICT DO NOTHING RETURNING *
    `;
    const { rows } = await db.query(query, [cardId, userId]);
    return rows[0];
  }

  async removeMember(cardId, userId) {
    const query = `DELETE FROM card_members WHERE card_id = $1 AND user_id = $2`;
    await db.query(query, [cardId, userId]);
    return { message: 'Member removed' };
  }
}

/**
 * Drag-and-Drop Persistence Logic:
 * 
 * 1. Frontend: When a user drags a card:
 *    - To a new position in the SAME list: Calculate new 'position' (avg of neighbors).
 *    - To a DIFFERENT list: Send new 'list_id' AND new 'position'.
 * 
 * 2. Backend (updateCard):
 *    - Simply updates `list_id` and `position` fields in the DB.
 *    - No complex shifting required because we use "Descriptive Positioning" (floating point logic with integers).
 * 
 * 3. Sorting:
 *    - `getBoardById` sorts cards by `position ASC`.
 */

module.exports = new CardService();
