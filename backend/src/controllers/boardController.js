const boardService = require('../services/boardService');

class BoardController {
  async createBoard(req, res) {
    try {
      const { title, background_color, owner_id, background_image } = req.body;
      
      // Basic validation
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      
      // Default owner_id if not provided (for "No Auth" requirement)
      // In a real app, this comes from req.user.id
      const finalOwnerId = owner_id || 1; 

      const newBoard = await boardService.createBoard(title, background_color, finalOwnerId, background_image);
      res.status(201).json(newBoard);
    } catch (error) {
      console.error('Error creating board:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getBoard(req, res) {
    try {
      const { id } = req.params;
      const board = await boardService.getBoardById(id);

      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      res.json(board);
    } catch (error) {
      console.error('Error fetching board:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getBoards(req, res) {
    try {
      const ownerId = req.query.owner_id || 1; // Default user
      const boards = await boardService.getAllBoards(ownerId);
      res.json(boards);
    } catch (error) {
      console.error('Error fetching boards:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  async updateBoard(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = 1; // Default user for now
      const updatedBoard = await boardService.updateBoard(id, updates, userId);
      
      if (!updatedBoard) {
        return res.status(404).json({ error: 'Board not found or no changes provided' });
      }
      
      res.json(updatedBoard);
    } catch (error) {
      console.error('Error updating board:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async deleteBoard(req, res) {
    try {
      const { id } = req.params;
      const deletedBoard = await boardService.deleteBoard(id);

      if (!deletedBoard) {
        return res.status(404).json({ error: 'Board not found' });
      }

      res.status(200).json({ message: 'Board deleted successfully', id });
    } catch (error) {
      console.error('Error deleting board:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getActivity(req, res) {
    try {
      const { id } = req.params;
      const { limit } = req.query;
      const auditService = require('../services/auditService');
      const activity = await auditService.getBoardActivity(id, limit || 50);
      res.json(activity);
    } catch (error) {
      console.error('Error fetching activity:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = new BoardController();
