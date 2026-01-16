const listService = require('../services/listService');

class ListController {
  async createList(req, res) {
    try {
      const { board_id, title } = req.body;
      if (!board_id || !title) {
        return res.status(400).json({ error: 'Board ID and Title are required' });
      }

      const userId = 1; 
      const newList = await listService.createList(board_id, title, userId);
      res.status(201).json(newList);
    } catch (error) {
      console.error('Error creating list:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async updateList(req, res) {
    try {
      const { id } = req.params;
      const { title, position } = req.body; // Expecting calculated position from frontend
      const userId = 1;

      const updatedList = await listService.updateList(id, { title, position }, userId);
      
      if (!updatedList) {
        return res.status(404).json({ error: 'List not found' });
      }

      res.json(updatedList);
    } catch (error) {
      console.error('Error updating list:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async deleteList(req, res) {
    try {
      const { id } = req.params;
      const userId = 1;
      const deletedList = await listService.deleteList(id, userId);
      
      if (!deletedList) {
        return res.status(404).json({ error: 'List not found' });
      }

      res.json({ message: 'List deleted successfully' });
    } catch (error) {
      console.error('Error deleting list:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = new ListController();
