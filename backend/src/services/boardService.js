const db = require('../config/db');
const auditService = require('./auditService');

class BoardService {
  async createBoard(title, background_color, owner_id, background_image, organization_id) {
    const query = `
      INSERT INTO boards (title, background_color, owner_id, background_image, organization_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [title, background_color || '#0079bf', owner_id, background_image || null, organization_id || null];
    const { rows } = await db.query(query, values);
    const newBoard = rows[0];

    // Create Default Labels
    if (newBoard) {
        const defaultLabels = [
            { name: 'Urgent', color: '#ff0000' },
            { name: 'Bug', color: '#ff9900' },
            { name: 'Feature', color: '#00cc00' },
            { name: 'Documentation', color: '#0066cc' },
            { name: 'Design', color: '#89609e' }
        ];
        
        for (const label of defaultLabels) {
            await db.query(`INSERT INTO labels (board_id, name, color) VALUES ($1, $2, $3)`, [newBoard.id, label.name, label.color]);
        }
        
        // Log creation
        await auditService.logAction(newBoard.id, owner_id, 'board', newBoard.id, 'create', { title });
    }
    
    return newBoard;
  }

  async getBoardById(boardId, userId = 1) {
    // 1. Fetch Board
    const boardQuery = `
      SELECT b.*,
        CASE WHEN sb.board_id IS NOT NULL THEN true ELSE false END as is_starred
      FROM boards b
      LEFT JOIN starred_boards sb ON b.id = sb.board_id AND sb.user_id = $2
      WHERE b.id = $1
    `;
    const boardResult = await db.query(boardQuery, [boardId, userId]);
    
    if (boardResult.rows.length === 0) {
      return null;
    }

    const board = boardResult.rows[0];

    // 2. Fetch Lists provided for this board, ordered by position
    const listsQuery = `SELECT * FROM lists WHERE board_id = $1 ORDER BY position ASC`;
    const listsResult = await db.query(listsQuery, [boardId]);
    const lists = listsResult.rows;

    // 3. Fetch Cards for all lists in this board
    const listIds = lists.map(list => list.id);
    let cards = [];
    
    if (listIds.length > 0) {
      const cardsQuery = `
        SELECT cards.* 
        FROM cards 
        JOIN lists ON cards.list_id = lists.id 
        WHERE lists.board_id = $1 
        ORDER BY cards.position ASC
      `;
      const cardsResult = await db.query(cardsQuery, [boardId]);
      cards = cardsResult.rows;
    }

    // 4. Fetch Meta (Labels & Members)
    if (cards.length > 0) {
        const cardIds = cards.map(c => c.id);
        
        // Labels
        const labelsQuery = `
          SELECT cl.card_id, l.id, l.name, l.color 
          FROM card_labels cl 
          JOIN labels l ON cl.label_id = l.id 
          WHERE cl.card_id = ANY($1)
        `;
        const labelsResult = await db.query(labelsQuery, [cardIds]);
        
        // Members
        const membersQuery = `
          SELECT cm.card_id, u.id, u.username, u.avatar_url
          FROM card_members cm
          JOIN users u ON cm.user_id = u.id
          WHERE cm.card_id = ANY($1)
        `;
        const membersResult = await db.query(membersQuery, [cardIds]);

        // Attach to cards
        cards = cards.map(card => {
            const cardLabels = labelsResult.rows.filter(l => l.card_id === card.id).map(l => ({ id: l.id, name: l.name, color: l.color }));
            const cardMembers = membersResult.rows.filter(m => m.card_id === card.id).map(m => ({ id: m.id, username: m.username, avatar_url: m.avatar_url }));
            return { ...card, labels: cardLabels, members: cardMembers };
        });
    }

    // 5. Assemble Hierarchy
    const listsWithCards = lists.map(list => ({
      ...list,
      cards: cards.filter(card => card.list_id === list.id)
    }));

    // 6. Fetch All Board Labels (Definitions)
    const boardLabelsQuery = `SELECT * FROM labels WHERE board_id = $1 ORDER BY id ASC`;
    const boardLabelsRes = await db.query(boardLabelsQuery, [boardId]);
    const boardLabels = boardLabelsRes.rows;

    return {
      ...board,
      lists: listsWithCards,
      labels: boardLabels
    };
  }

  async updateBoard(boardId, updates, userId = 1) {
    const { title, background_color, background_image } = updates;
    const fields = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(title);
    }
    if (background_color !== undefined) {
      fields.push(`background_color = $${idx++}`);
      values.push(background_color);
    }
    if (background_image !== undefined) {
      fields.push(`background_image = $${idx++}`);
      values.push(background_image);
    }

    if (fields.length === 0) return null;

    values.push(boardId);
    const query = `
      UPDATE boards
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *;
    `;
    
    const { rows } = await db.query(query, values);
    const updatedBoard = rows[0];

    if (updatedBoard) {
        try {
            let action = 'update';
            let details = {};

            if (title !== undefined) {
                action = 'rename';
                details.new_title = title;
            } else if (background_color !== undefined || background_image !== undefined) {
                action = 'change_background';
                details.new_background = background_color || background_image;
            }

            await auditService.logAction(boardId, userId, 'board', boardId, action, details);
        } catch (e) { console.error('Audit Log Error', e); }
    }

    return updatedBoard;
  }

  async getAllBoards(ownerId, organizationId) {
    let query;
    let values;

    if (organizationId) {
       query = `
         SELECT b.*, 
           CASE WHEN sb.board_id IS NOT NULL THEN true ELSE false END as is_starred
         FROM boards b
         LEFT JOIN starred_boards sb ON b.id = sb.board_id AND sb.user_id = $2
         WHERE b.organization_id = $1 
         ORDER BY b.created_at DESC
       `;
       values = [organizationId, ownerId];
    } else {
       // Personal boards
       query = `
         SELECT b.*,
           CASE WHEN sb.board_id IS NOT NULL THEN true ELSE false END as is_starred
         FROM boards b
         LEFT JOIN starred_boards sb ON b.id = sb.board_id AND sb.user_id = $1
         WHERE b.owner_id = $1 AND b.organization_id IS NULL 
         ORDER BY b.created_at DESC
       `;
       values = [ownerId];
    }
    
    const { rows } = await db.query(query, values);
    return rows;
  }

  async toggleStar(boardId, userId) {
    // Check if exists
    const check = `SELECT * FROM starred_boards WHERE board_id = $1 AND user_id = $2`;
    const { rows } = await db.query(check, [boardId, userId]);

    if (rows.length > 0) {
        // Unstar
        await db.query(`DELETE FROM starred_boards WHERE board_id = $1 AND user_id = $2`, [boardId, userId]);
        return { is_starred: false };
    } else {
        // Star
        await db.query(`INSERT INTO starred_boards (board_id, user_id) VALUES ($1, $2)`, [boardId, userId]);
        return { is_starred: true };
    }
  }

  async deleteBoard(boardId) {
    const query = `DELETE FROM boards WHERE id = $1 RETURNING *`;
    const { rows } = await db.query(query, [boardId]);
    return rows[0];
  }
}

module.exports = new BoardService();
