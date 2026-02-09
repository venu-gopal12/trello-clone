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
    
    console.log('Updating Card:', id, 'Updates:', updates, 'Fields:', fields);

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
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Get card details before delete to know board_id
        const cardQuery = `
            SELECT c.*, l.board_id 
            FROM cards c 
            JOIN lists l ON c.list_id = l.id 
            WHERE c.id = $1
        `;
        const checkRes = await client.query(cardQuery, [id]);
        const cardToDelete = checkRes.rows[0];

        // Manual Cascade Delete (Safety fallback if DB cascade missing)
        await client.query('DELETE FROM card_labels WHERE card_id = $1', [id]);
        await client.query('DELETE FROM card_members WHERE card_id = $1', [id]);
        
        // Checklists require 2-step (items then lists, or cascade if confident)
        // Deleting checklists should cascade to items if schema is right, but being explicit:
        // We'll trust the DB cascade for checklists->items to be simple, 
        // or just delete checklists which usually cascades. 
        // If strict manual:
        const clRes = await client.query('SELECT id FROM checklists WHERE card_id = $1', [id]);
        const clIds = clRes.rows.map(r => r.id);
        if (clIds.length > 0) {
            await client.query('DELETE FROM checklist_items WHERE checklist_id = ANY($1::int[])', [clIds]);
            await client.query('DELETE FROM checklists WHERE card_id = $1', [id]);
        }

        const query = `DELETE FROM cards WHERE id = $1 RETURNING *`;
        const { rows } = await client.query(query, [id]);
        
        if (cardToDelete) {
            try {
                // We don't await audit log here to avoid transaction block or just do it inside?
                // Audit service uses its own pool usually? 
                // Let's just log it *after* commit or inside. 
                // Since audit uses db.query (pool), it's separate connection or same pool. 
                // It's safer to do it after COMMIT or inside if we pass client.
                // For now, let's keep it separate/after to assume success.
            } catch (e) { console.error('Audit Log Error', e); }
        }

        await client.query('COMMIT');
        
        // Log after commit
        if (cardToDelete) {
             auditService.logAction(cardToDelete.board_id, userId, 'card', id, 'delete', { title: cardToDelete.title }).catch(console.error);
        }

        return rows[0];
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
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

  async addLabel(cardId, labelId, userId = 1) {
    const query = `
      INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2)
      ON CONFLICT DO NOTHING RETURNING *
    `;
    const { rows } = await db.query(query, [cardId, labelId]);
    
    // Log Activity
    try {
        const ctxQuery = `
            SELECT c.title, l.board_id, lb.name as label_name, lb.color 
            FROM cards c 
            JOIN lists l ON c.list_id = l.id 
            JOIN labels lb ON lb.id = $2 
            WHERE c.id = $1
        `;
        const ctxRes = await db.query(ctxQuery, [cardId, labelId]);
        if (ctxRes.rows.length > 0) {
            const { title, board_id, label_name, color } = ctxRes.rows[0];
            await auditService.logAction(board_id, userId, 'card', cardId, 'add_label', { 
                cardTitle: title, 
                labelName: label_name, 
                labelColor: color 
            });
        }
    } catch (e) { console.error('Audit Log Error', e); }

    return rows[0];
  }

  async removeLabel(cardId, labelId, userId = 1) {
    // Get context before delete (label still exists in DB, but we query label table so it's fine)
    try {
        const ctxQuery = `
            SELECT c.title, l.board_id, lb.name as label_name 
            FROM cards c 
            JOIN lists l ON c.list_id = l.id 
            JOIN labels lb ON lb.id = $2 
            WHERE c.id = $1
        `;
        const ctxRes = await db.query(ctxQuery, [cardId, labelId]);
        if (ctxRes.rows.length > 0) {
            const { title, board_id, label_name } = ctxRes.rows[0];
            await auditService.logAction(board_id, userId, 'card', cardId, 'remove_label', { 
                cardTitle: title, 
                labelName: label_name 
            });
        }
    } catch (e) { console.error('Audit Log Error', e); }

    const query = `DELETE FROM card_labels WHERE card_id = $1 AND label_id = $2`;
    await db.query(query, [cardId, labelId]);
    return { message: 'Label removed' };
  }

  async addMember(cardId, targetUserId, actionUserId = 1) {
    const query = `
      INSERT INTO card_members (card_id, user_id) VALUES ($1, $2)
      ON CONFLICT DO NOTHING RETURNING *
    `;
    const { rows } = await db.query(query, [cardId, targetUserId]);
    
    try {
        const ctxQuery = `
            SELECT c.title, l.board_id, u.username 
            FROM cards c 
            JOIN lists l ON c.list_id = l.id 
            JOIN users u ON u.id = $2
            WHERE c.id = $1
        `;
        const ctxRes = await db.query(ctxQuery, [cardId, targetUserId]);
        if (ctxRes.rows.length > 0) {
            const { title, board_id, username } = ctxRes.rows[0];
            await auditService.logAction(board_id, actionUserId, 'card', cardId, 'add_member', { 
                cardTitle: title, 
                memberName: username 
            });
        }
    } catch (e) { console.error('Audit Log Error', e); }

    return rows[0];
  }

  async removeMember(cardId, targetUserId, actionUserId = 1) {
    try {
        const ctxQuery = `
             SELECT c.title, l.board_id, u.username 
             FROM cards c 
             JOIN lists l ON c.list_id = l.id 
             JOIN users u ON u.id = $2
             WHERE c.id = $1
        `;
        const ctxRes = await db.query(ctxQuery, [cardId, targetUserId]);
        if (ctxRes.rows.length > 0) {
             const { title, board_id, username } = ctxRes.rows[0];
             await auditService.logAction(board_id, actionUserId, 'card', cardId, 'remove_member', { 
                 cardTitle: title, 
                 memberName: username 
             });
        }
    } catch (e) { console.error('Audit Log Error', e); }

    const query = `DELETE FROM card_members WHERE card_id = $1 AND user_id = $2`;
    await db.query(query, [cardId, targetUserId]);
    return { message: 'Member removed' };
  }

  async copyCard(cardId, targetListId, userId, title = null) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Get Original Card
      const originalQuery = `SELECT * FROM cards WHERE id = $1`;
      const originalRes = await client.query(originalQuery, [cardId]);
      if (originalRes.rows.length === 0) throw new Error('Card not found');
      const original = originalRes.rows[0];

      // 2. Create New Card
      // Get max position in new list
      const posQuery = `SELECT MAX(position) as max_pos FROM cards WHERE list_id = $1`;
      const posRes = await client.query(posQuery, [targetListId]);
      const newPos = (posRes.rows[0].max_pos || 0) + 65535;

      const insertCard = `
        INSERT INTO cards (list_id, title, description, position, due_date)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const values = [targetListId, title || original.title, original.description, newPos, original.due_date];
      const newCardRes = await client.query(insertCard, values);
      const newCard = newCardRes.rows[0];

      // 3. Copy Labels
      const labelsQuery = `INSERT INTO card_labels (card_id, label_id) SELECT $1, label_id FROM card_labels WHERE card_id = $2`;
      await client.query(labelsQuery, [newCard.id, cardId]);

      // 4. Copy Members
      const membersQuery = `INSERT INTO card_members (card_id, user_id) SELECT $1, user_id FROM card_members WHERE card_id = $2`;
      await client.query(membersQuery, [newCard.id, cardId]);

      // 5. Copy Checklists
      const checkQuery = `SELECT * FROM checklists WHERE card_id = $1`;
      const checkRes = await client.query(checkQuery, [cardId]);
      
      for (const checklist of checkRes.rows) {
          const insertCheck = `INSERT INTO checklists (card_id, title, position) VALUES ($1, $2, $3) RETURNING id`;
          const checkInsertRes = await client.query(insertCheck, [newCard.id, checklist.title, checklist.position]);
          const newCheckId = checkInsertRes.rows[0].id;
          
          await client.query(`
              INSERT INTO checklist_items (checklist_id, content, is_completed, position)
              SELECT $1, content, is_completed, position FROM checklist_items WHERE checklist_id = $2
          `, [newCheckId, checklist.id]);
      }

      await client.query('COMMIT');
      return newCard;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
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
