const cardService = require('../services/cardService');

class CardController {
  async createCard(req, res) {
    try {
      const { list_id, title } = req.body;
      if (!list_id || !title) {
        return res.status(400).json({ error: 'List ID and Title are required' });
      }

      const userId = 1;
      const newCard = await cardService.createCard(list_id, title, userId);
      res.status(201).json(newCard);
    } catch (error) {
      console.error('Error creating card:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async updateCard(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body; // { title, description, list_id, position, ... }
      const userId = 1;

      const updatedCard = await cardService.updateCard(id, updates, userId);
      
      if (!updatedCard) {
        return res.status(404).json({ error: 'Card not found' });
      }

      res.json(updatedCard);
    } catch (error) {
      console.error('Error updating card:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async deleteCard(req, res) {
    try {
      const { id } = req.params;
      const userId = 1;
      const deletedCard = await cardService.deleteCard(id, userId);
      
      if (!deletedCard) {
        return res.status(404).json({ error: 'Card not found' });
      }

      res.json({ message: 'Card deleted successfully' });
    } catch (error) {
      console.error('Error deleting card:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getCard(req, res) {
    try {
      const card = await cardService.getCardById(req.params.id);
      if (!card) return res.status(404).json({ error: 'Card not found' });
      res.json(card);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  async addLabel(req, res) {
    try {
      const { label_id } = req.body;
      const result = await cardService.addLabel(req.params.id, label_id);
      res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  async removeLabel(req, res) {
    try {
      await cardService.removeLabel(req.params.id, req.params.labelId);
      res.json({ message: 'Label removed' });
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  async addMember(req, res) {
    try {
      const { user_id } = req.body;
      const result = await cardService.addMember(req.params.id, user_id);
      res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  async removeMember(req, res) {
    try {
      await cardService.removeMember(req.params.id, req.params.userId);
      res.json({ message: 'Member removed' });
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  async getActivity(req, res) {
    try {
      const { id } = req.params;
      const { limit } = req.query;
      const auditService = require('../services/auditService');
      const activity = await auditService.getCardActivity(id, limit || 50);
      res.json(activity);
    } catch (error) {
      console.error('Error fetching card activity:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = new CardController();
