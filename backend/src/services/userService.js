const db = require('../config/db');

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
}

module.exports = new UserService();
