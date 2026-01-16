const db = require('../src/config/db');

async function seedUsers() {
  try {
    console.log('Seeding sample users...');

    const users = [
      { username: 'alice', email: 'alice@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
      { username: 'bob', email: 'bob@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
      { username: 'charlie', email: 'charlie@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie' },
      { username: 'dave', email: 'dave@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dave' },
      { username: 'eve', email: 'eve@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eve' },
    ];

    for (const user of users) {
      // Check if exists
      const check = await db.query('SELECT id FROM users WHERE email = $1', [user.email]);
      if (check.rows.length === 0) {
        await db.query(
          'INSERT INTO users (username, email, avatar_url) VALUES ($1, $2, $3)',
          [user.username, user.email, user.avatar]
        );
        console.log(`User created: ${user.username}`);
      } else {
        console.log(`User already exists: ${user.username}`);
      }
    }

    console.log('User seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding users failed:', error);
    process.exit(1);
  }
}

seedUsers();
