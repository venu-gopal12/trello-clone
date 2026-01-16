const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklistController');

// Checklists
router.post('/', checklistController.createChecklist); // body: { card_id, title }
router.delete('/:id', checklistController.deleteChecklist);

// Items
router.post('/:id/items', (req, res, next) => {
    req.body.checklist_id = req.params.id; // convenient
    next();
}, checklistController.addItem);

router.put('/items/:id', checklistController.updateItem);
router.delete('/items/:id', checklistController.deleteItem);

module.exports = router;
