const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class UserService {
  async getAllUsers() {
    const query = 'SELECT id, username, email, avatar_url FROM users ORDER BY username ASC';
    const { rows } = await db.query(query);
    return rows.map(u => ({
        id: u.id,
        name: u.username, // Map username to name for frontend consistency
        username: u.username,
        email: u.email,
        avatar: (u.username[0] || 'U').toUpperCase(), // Simple fallback if url fails or for UI
        avatarUrl: u.avatar_url,
        color: this.getColorForUser(u.username) // Generate consistent color
    }));
  }

  getColorForUser(username) {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
  }

   async register({ username, email, password }) {
    const passwordHash = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, username, email
    `;

    const { rows } = await db.query(query, [
      username,
      email,
      passwordHash
    ]);

    return {
        id: rows[0].id,
        username: rows[0].username,
        email: rows[0].email,
        role: 'user' // Default role
    };
  }

  async login({ email, password }) {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    const user = rows[0];
    if (!user || !user.password_hash) {
      throw new Error('Invalid credentials');
    }

    // Check if user is suspended
    if (user.is_suspended) {
      throw new Error('Account is suspended. Please contact support.');
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw new Error('Invalid credentials');

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: user.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await this.storeRefreshToken(user.id, refreshToken);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar_url,
        role: user.role
      }
    };
  }

  async storeRefreshToken(userId, refreshToken) {
    await db.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, userId]);
  }

  async refreshAccessToken(refreshToken) {
    if (!refreshToken) throw new Error('Refresh Token required');

    // 1. Verify token signature
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (e) {
      throw new Error('Invalid Refresh Token');
    }

    // 2. Check if token matches DB
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    const user = rows[0];

    if (!user || user.refresh_token !== refreshToken) {
      throw new Error('Invalid Refresh Token');
    }

    // Check if user is suspended
    if (user.is_suspended) {
      throw new Error('Account is suspended. Please contact support.');
    }

    // 3. Issue new tokens
    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    // Optional: Rotate refresh token here if strict security needed
    return { token: newAccessToken, user };
  }

  async googleLogin({ email, googleId, avatar, name }) {
    // Check if user exists
    let { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = rows[0];

    if (!user) {
      // Create new user
      const username = name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000);
      const insertQuery = `
        INSERT INTO users (username, email, google_id, avatar_url, auth_provider)
        VALUES ($1, $2, $3, $4, 'google')
        RETURNING *
      `;
      const result = await db.query(insertQuery, [username, email, googleId, avatar]);
      user = result.rows[0];
    } else {
      // Link google_id if not linked
      if (!user.google_id) {
        await db.query('UPDATE users SET google_id = $1, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3', [googleId, avatar, user.id]);
      }
    }

    return this.loginById(user.id);
  }

  // Helper to login without password (for OAuth)
  async loginById(userId) {
     const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
     const user = rows[0];
     if(!user) throw new Error('User not found');

     // Check if user is suspended
     if (user.is_suspended) {
       throw new Error('Account is suspended. Please contact support.');
     }

     const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'user' }, process.env.JWT_SECRET, { expiresIn: '15m' });
     const refreshToken = jwt.sign({ id: user.id, role: user.role || 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });
     
     await this.storeRefreshToken(user.id, refreshToken);

     return {
       token,
       refreshToken,
       user: {
         id: user.id,
         username: user.username,
         email: user.email,
         avatar: user.avatar_url,
         role: user.role
       }
     };
  }
}

module.exports = new UserService();
