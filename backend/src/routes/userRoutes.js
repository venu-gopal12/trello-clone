const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/authMiddleware');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh-token', userController.refreshToken);
router.post('/auth/google', userController.googleAuth);

// 🔐 Protected
router.get('/', auth, userController.getAllUsers);

module.exports = router;
