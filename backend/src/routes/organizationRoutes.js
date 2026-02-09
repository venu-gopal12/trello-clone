const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');

router.post('/', organizationController.create);
router.get('/', organizationController.getAll);
router.get('/:id', organizationController.getOne);
router.put('/:id', organizationController.update);
router.delete('/:id', organizationController.delete);

// Member management routes
router.get('/:id/members', organizationController.getMembers);
router.post('/:id/members', organizationController.addMember);
router.put('/:id/members/:userId', organizationController.updateMemberRole);
router.delete('/:id/members/:userId', organizationController.removeMember);

module.exports = router;
