const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');

// GET /api/boards - Get all boards for a user
router.get('/', boardController.getBoards);

// GET /api/boards/:id - Get a specific board with lists and cards
router.get('/:id', boardController.getBoard);

// POST /api/boards - Create a new board
router.post('/', boardController.createBoard);

// PUT /api/boards/:id - Update board (title, background)
router.put('/:id', boardController.updateBoard);

// DELETE /api/boards/:id - Delete a board
router.delete('/:id', boardController.deleteBoard);

// GET /api/boards/:id/activity - Get board activity log
router.get('/:id/activity', boardController.getActivity);

// POST /api/boards/:id/star - Toggle star
router.post('/:id/star', boardController.toggleStar);

module.exports = router;
