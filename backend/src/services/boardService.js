const db = require('../config/db');
const auditService = require('./auditService');

class BoardService {
  async createBoard(title, background_color, owner_id, background_image) {
    const query = `
      INSERT INTO boards (title, background_color, owner_id, background_image)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [title, background_color || '#0079bf', owner_id, background_image || null];
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

  async getBoardById(boardId) {
    // 1. Fetch Board
    const boardQuery = `SELECT * FROM boards WHERE id = $1`;
    const boardResult = await db.query(boardQuery, [boardId]);
    
    if (boardResult.rows.length === 0) {
      return null;
    }

    const board = boardResult.rows[0];

    // 2. Fetch Lists provided for this board, ordered by position
    const listsQuery = `SELECT * FROM lists WHERE board_id = $1 ORDER BY position ASC`;
    const listsResult = await db.query(listsQuery, [boardId]);
    const lists = listsResult.rows;

    // 3. Fetch Cards for all lists in this board
    // Optimization: Fetch all cards for the board in one query instead of N+1
    const listIds = lists.map(list => list.id);
    let cards = [];
    
    if (listIds.length > 0) {
      // Create placeholders $1, $2, ... for the IN clause
      // Actually, we can just select by board lists.
      // Or simpler: SELECT cards.* FROM cards JOIN lists ON cards.list_id = lists.id WHERE lists.board_id = $1
      
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
    // To avoid N+1, fetch all labels/members for these cards
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
    // Map cards to their lists
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

  // Update board (e.g. title, background)
  // Update board (e.g. title, background)
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

  // Helper to fetch all boards for a user (dashboard view)
  async getAllBoards(userId) {
    const query = `SELECT * FROM boards WHERE owner_id = $1 ORDER BY created_at DESC`;
    const { rows } = await db.query(query, [userId]);
    return rows;
  }

  async deleteBoard(boardId) {
    const query = `DELETE FROM boards WHERE id = $1 RETURNING *`;
    const { rows } = await db.query(query, [boardId]);
    return rows[0];
  }
}

module.exports = new BoardService();
