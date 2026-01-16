const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');

// POST /api/cards
router.post('/', cardController.createCard);

// PUT /api/cards/:id
router.put('/:id', cardController.updateCard);

// DELETE /api/cards/:id
router.delete('/:id', cardController.deleteCard);

// GET /api/cards/:id (Full Details)
router.get('/:id', cardController.getCard);

// Labels
router.post('/:id/labels', cardController.addLabel);
router.delete('/:id/labels/:labelId', cardController.removeLabel);

// Members
router.post('/:id/members', cardController.addMember);
router.delete('/:id/members/:userId', cardController.removeMember);

// Activity
router.get('/:id/activity', cardController.getActivity);

module.exports = router;
