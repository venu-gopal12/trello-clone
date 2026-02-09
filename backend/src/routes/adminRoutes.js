const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middlewares/adminMiddleware');

// All routes require admin authentication
router.use(adminAuth);

// ==================== User Management ====================
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/suspend', adminController.suspendUser);
router.patch('/users/:id/activate', adminController.activateUser);
router.patch('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// ==================== Organization Management ====================
router.get('/organizations', adminController.getAllOrganizations);
router.get('/organizations/:id', adminController.getOrganizationById);
router.delete('/organizations/:id', adminController.deleteOrganization);

// ==================== Analytics ====================
router.get('/analytics', adminController.getAnalytics);

// ==================== Audit Logs ====================
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
