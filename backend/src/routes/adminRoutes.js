import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import { getAllUsers } from '../controllers/adminController.js';

const router = express.Router();

// all admin endpoints require authentication and admin role
router.use(protect, admin);

// example route: list all registered users
router.get('/users', getAllUsers);

export default router;
