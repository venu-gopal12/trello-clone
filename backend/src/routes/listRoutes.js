const express = require('express');
const router = express.Router();
const listController = require('../controllers/listController');

// POST /api/lists
router.post('/', listController.createList);

// PUT /api/lists/:id
router.put('/:id', listController.updateList);

// DELETE /api/lists/:id
router.delete('/:id', listController.deleteList);

module.exports = router;
