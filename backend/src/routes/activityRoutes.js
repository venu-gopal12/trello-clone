const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

// These should be nested or separate?
// Use structure: /api/organizations/:organizationId/activity
// But sticking to simple resource based for now or query params?
// For now: specific endpoints

router.get('/organization/:organizationId', activityController.getOrganizationLogs);
router.get('/board/:boardId', activityController.getBoardLogs);
router.get('/card/:cardId', activityController.getCardLogs);

module.exports = router;
