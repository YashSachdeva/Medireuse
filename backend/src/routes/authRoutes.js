import express from 'express';
import { register, login, getMe, updateProfile, refreshToken, logout } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);

export default router;
