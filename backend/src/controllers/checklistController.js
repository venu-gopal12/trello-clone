const checklistService = require('../services/checklistService');

class ChecklistController {
  // Checklists
  async createChecklist(req, res) {
    try {
      const { card_id, title } = req.body;
      const checklist = await checklistService.createChecklist(card_id, title);
      res.status(201).json(checklist);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  async deleteChecklist(req, res) {
    try {
      await checklistService.deleteChecklist(req.params.id);
      res.json({ message: 'Checklist deleted' });
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  // Items
  async addItem(req, res) {
    try {
      const { checklist_id, content } = req.body;
      const item = await checklistService.addItem(checklist_id, content);
      res.status(201).json(item);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  async updateItem(req, res) {
    try {
      const item = await checklistService.updateItem(req.params.id, req.body);
      res.json(item);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }

  async deleteItem(req, res) {
    try {
      await checklistService.deleteItem(req.params.id);
      res.json({ message: 'Item deleted' });
    } catch (e) { res.status(500).json({ error: e.message }); }
  }
}

module.exports = new ChecklistController();
