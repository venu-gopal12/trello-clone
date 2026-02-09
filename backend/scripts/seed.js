const db = require('../src/config/db');

const bcrypt = require('bcrypt');

async function seed() {
  try {
    console.log('Seeding database...');

    // 1. Clear existing data (Order matters due to foreign keys)
    await db.query('TRUNCATE users, boards, lists, cards, labels, checklists, checklist_items, board_members, card_members, card_labels RESTART IDENTITY CASCADE');

    // 2. Create Default User
    const passwordHash = await bcrypt.hash('password123', 10);
    const userQuery = `
      INSERT INTO users (username, email, password_hash, avatar_url)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    const userResult = await db.query(userQuery, ['testuser', 'test@example.com', passwordHash, 'https://placehold.co/100x100']);
    const userId = userResult.rows[0].id;
    console.log('User created:', userId);

    // 3. Create Sample Board
    const boardQuery = `
      INSERT INTO boards (title, background_color, owner_id)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;
    const boardResult = await db.query(boardQuery, ['Project Alpha', '#0079bf', userId]);
    const boardId = boardResult.rows[0].id;
    console.log('Board created:', boardId);

    // 4. Create Lists
    const listTitles = ['To Do', 'In Progress', 'Done'];
    const listIds = [];
    
    for (let i = 0; i < listTitles.length; i++) {
        const listQuery = `
            INSERT INTO lists (board_id, title, position)
            VALUES ($1, $2, $3)
            RETURNING id;
        `;
        // Position: 65535, 131070, 196605
        const position = (i + 1) * 65535; 
        const listResult = await db.query(listQuery, [boardId, listTitles[i], position]);
        listIds.push(listResult.rows[0].id);
    }
    console.log('Lists created:', listIds);

    // 4.5 Create Labels
    const labelsData = [
        { name: 'Urgent', color: '#ff0000' },
        { name: 'Bug', color: '#ff9900' },
        { name: 'Feature', color: '#00cc00' },
        { name: 'Documentation', color: '#0066cc' }
    ];
    
    for (let i = 0; i < labelsData.length; i++) {
        const { name, color } = labelsData[i];
        await db.query(`INSERT INTO labels (board_id, name, color) VALUES ($1, $2, $3)`, [boardId, name, color]);
    }
    console.log('Labels created.');

    // 5. Create Cards
    const cardsData = [
        { listIdx: 0, title: 'Research competitors', desc: 'Look at Jira, Asana, etc.' },
        { listIdx: 0, title: 'Draft technical specs', desc: 'Define API endpoints' },
        { listIdx: 1, title: 'Setup Database', desc: 'PostgreSQL installation' },
        { listIdx: 2, title: 'Initialize Repo', desc: 'Git init and push' },
    ];

    for (let i = 0; i < cardsData.length; i++) {
        const { listIdx, title, desc } = cardsData[i];
        const cardQuery = `
            INSERT INTO cards (list_id, title, description, position)
            VALUES ($1, $2, $3, $4);
        `;
        const position = (i + 1) * 65535;
        await db.query(cardQuery, [listIds[listIdx], title, desc, position]);
    }
    console.log('Cards created.');

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
