const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
const boardRoutes = require('./routes/boardRoutes');
const listRoutes = require('./routes/listRoutes');
const cardRoutes = require('./routes/cardRoutes');
const checklistRoutes = require('./routes/checklistRoutes');

const auth = require('./middlewares/authMiddleware');

app.use('/api/boards', auth, boardRoutes);
app.use('/api/lists', auth, listRoutes);
app.use('/api/cards', auth, cardRoutes);
app.use('/api/checklists', auth, checklistRoutes);
app.use('/api/organizations', auth, require('./routes/organizationRoutes'));
app.use('/api/activity', auth, require('./routes/activityRoutes'));
app.use('/api/admin', require('./routes/adminRoutes')); // Admin routes have their own auth middleware

app.use('/api/users', require('./routes/userRoutes'));

// Health Check
app.get('/health', async (req, res) => {
  const db = require('./config/db');
  try {
    await db.query('SELECT NOW()');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

module.exports = app;
