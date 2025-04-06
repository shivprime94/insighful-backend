const express = require('express');
const router = express.Router();
const { register, verifyEmail, login, updatePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);

// Protected routes
router.put('/update-password', authenticate, updatePassword);

module.exports = router;