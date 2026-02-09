const activityService = require('../services/activityService');

class ActivityController {
  async getOrganizationLogs(req, res) {
    try {
      const { organizationId } = req.params;
      const logs = await activityService.getOrganizationActivity(organizationId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getBoardLogs(req, res) {
    try {
      const { boardId } = req.params;
      const logs = await activityService.getBoardActivity(boardId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCardLogs(req, res) {
    try {
      const { cardId } = req.params;
      const logs = await activityService.getCardActivity(cardId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ActivityController();
