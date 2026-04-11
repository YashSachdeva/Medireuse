import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';
import {
  getAllListings,
  searchListings,
  getListingById,
  createListing,
  getUserListings,
  updateListing,
  deleteListing,
  markAsSold,
  getPendingListings,
  verifyListing
} from '../controllers/sellController.js';

const router = express.Router();

// Public routes
router.get('/', getAllListings);
router.get('/search/:query', searchListings);
router.get('/:id', getListingById);

// Protected routes
router.post('/', protect, upload.array('images', 5), createListing);
router.get('/user/my-listings', protect, getUserListings);
router.put('/:id', protect, upload.array('images', 5), updateListing);
router.delete('/:id', protect, deleteListing);
router.put('/:id/mark-sold', protect, markAsSold);

// Admin routes
router.get('/admin/pending', protect, admin, getPendingListings);
router.put('/admin/:id/verify', protect, admin, verifyListing);

export default router;
