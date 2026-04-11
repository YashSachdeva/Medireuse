import SaleListing from '../models/SaleListing.js';
import { deleteImageFromCloudinary } from '../config/cloudinary.js';

// @desc    Get all active listings with filters
// @route   GET /api/sell
// @access  Public
export const getAllListings = async (req, res) => {
  try {
    const { page = 1, limit = 12, medicineType, priceMin, priceMax, sortBy = '-createdAt' } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { status: 'active', isActive: true };

    if (medicineType) {
      filter.medicineType = medicineType;
    }

    if (priceMin || priceMax) {
      filter.pricePerUnit = {};
      if (priceMin) filter.pricePerUnit.$gte = parseFloat(priceMin);
      if (priceMax) filter.pricePerUnit.$lte = parseFloat(priceMax);
    }

    // Get listings with pagination
    const listings = await SaleListing.find(filter)
      .populate('seller', 'name phone address')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    const total = await SaleListing.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    // Increment views for each listing
    await Promise.all(listings.map(listing => 
      SaleListing.updateOne({ _id: listing._id }, { $inc: { views: 1 } })
    ));

    res.status(200).json({
      success: true,
      totalListings: total,
      totalPages: pages,
      currentPage: parseInt(page),
      listings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching listings',
      error: error.message
    });
  }
};

// @desc    Search listings
// @route   GET /api/sell/search/:query
// @access  Public
export const searchListings = async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const listings = await SaleListing.find(
      { $text: { $search: query }, status: 'active', isActive: true },
      { score: { $meta: 'textScore' } }
    )
      .populate('seller', 'name phone address')
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    const total = await SaleListing.countDocuments({
      $text: { $search: query },
      status: 'active',
      isActive: true
    });

    res.status(200).json({
      success: true,
      total,
      listings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching listings',
      error: error.message
    });
  }
};

// @desc    Get single listing
// @route   GET /api/sell/:id
// @access  Public
export const getListingById = async (req, res) => {
  try {
    const listing = await SaleListing.findById(req.params.id)
      .populate('seller', 'name email phone address rating')
      .populate('verifiedBy', 'name');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Increment view count
    listing.views = (listing.views || 0) + 1;
    await listing.save();

    res.status(200).json({
      success: true,
      listing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching listing',
      error: error.message
    });
  }
};

// @desc    Create new listing with image upload
// @route   POST /api/sell
// @access  Protected
export const createListing = async (req, res) => {
  try {
    const { medicineName, medicineType, quantity, pricePerUnit, expiryDate, batchNumber, description, condition, manufacturer, shippingInfo } = req.body;

    // Validate required fields
    if (!medicineName || !medicineType || !quantity || !pricePerUnit || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate files uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one medicine image'
      });
    }

    if (req.files.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'You can upload maximum 5 images'
      });
    }

    // Prepare images array
    const images = req.files.map(file => ({
      url: file.path,
      publicId: file.filename
    }));

    // Create listing
    const listing = await SaleListing.create({
      seller: req.user._id,
      medicineName,
      medicineType,
      quantity: parseInt(quantity),
      pricePerUnit: parseFloat(pricePerUnit),
      expiryDate: new Date(expiryDate),
      batchNumber,
      description,
      condition,
      manufacturer,
      images,
      shippingInfo: shippingInfo ? JSON.parse(shippingInfo) : {},
      status: 'pending-verification'
    });

    const populatedListing = await listing.populate('seller', 'name email phone address');

    res.status(201).json({
      success: true,
      message: 'Listing created successfully and pending admin verification',
      listing: populatedListing
    });
  } catch (error) {
    // Delete uploaded images if there's an error
    if (req.files && req.files.length > 0) {
      await Promise.all(req.files.map(file => deleteImageFromCloudinary(file.path)));
    }

    res.status(400).json({
      success: false,
      message: error.message || 'Error creating listing'
    });
  }
};

// @desc    Get user's listings
// @route   GET /api/sell/user/my-listings
// @access  Protected
export const getUserListings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = { seller: req.user._id };
    if (status) {
      filter.status = status;
    }

    const listings = await SaleListing.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    const total = await SaleListing.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      total,
      pages,
      currentPage: parseInt(page),
      listings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your listings',
      error: error.message
    });
  }
};

// @desc    Update listing
// @route   PUT /api/sell/:id
// @access  Protected (seller or admin)
export const updateListing = async (req, res) => {
  try {
    let listing = await SaleListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check authorization
    if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this listing'
      });
    }

    // Handle image updates
    if (req.files && req.files.length > 0) {
      // Delete old images if replacing
      const deleteImageBody = req.body.deleteImages;
      if (deleteImageBody) {
        const imagesToDelete = JSON.parse(deleteImageBody);
        await Promise.all(imagesToDelete.map(url => deleteImageFromCloudinary(url)));
        listing.images = listing.images.filter(img => !imagesToDelete.includes(img.url));
      }

      // Add new images
      const newImages = req.files.map(file => ({
        url: file.path,
        publicId: file.filename
      }));
      listing.images.push(...newImages);

      if (listing.images.length > 5) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 5 images allowed'
        });
      }
    }

    // Update fields
    const updateableFields = ['medicineName', 'medicineType', 'quantity', 'pricePerUnit', 'expiryDate', 'batchNumber', 'description', 'condition', 'manufacturer', 'shippingInfo'];
    updateableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'shippingInfo') {
          listing[field] = JSON.parse(req.body[field]);
        } else if (field === 'quantity' || field === 'pricePerUnit') {
          listing[field] = parseFloat(req.body[field]);
        } else if (field === 'expiryDate') {
          listing[field] = new Date(req.body[field]);
        } else {
          listing[field] = req.body[field];
        }
      }
    });

    // Reset status if not admin
    if (req.user.role !== 'admin' && listing.status === 'active') {
      listing.status = 'pending-verification';
    }

    listing.updatedAt = new Date();
    listing = await listing.save();

    res.status(200).json({
      success: true,
      message: 'Listing updated successfully',
      listing
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating listing'
    });
  }
};

// @desc    Delete listing
// @route   DELETE /api/sell/:id
// @access  Protected (seller or admin)
export const deleteListing = async (req, res) => {
  try {
    const listing = await SaleListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check authorization
    if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this listing'
      });
    }

    // Delete images from Cloudinary
    await Promise.all(listing.images.map(img => deleteImageFromCloudinary(img.url)));

    await SaleListing.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting listing',
      error: error.message
    });
  }
};

// @desc    Mark quantity as sold
// @route   PUT /api/sell/:id/mark-sold
// @access  Protected (seller or admin)
export const markAsSold = async (req, res) => {
  try {
    const { quantitySold } = req.body;

    if (!quantitySold || quantitySold <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid quantity sold'
      });
    }

    let listing = await SaleListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check authorization
    if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const remainingQuantity = listing.quantity - listing.quantitySold;

    if (quantitySold > remainingQuantity) {
      return res.status(400).json({
        success: false,
        message: `Cannot sell more than available quantity (${remainingQuantity})`
      });
    }

    listing.quantitySold += quantitySold;

    if (listing.quantitySold >= listing.quantity) {
      listing.status = 'sold';
      listing.isActive = false;
    }

    listing.updatedAt = new Date();
    listing = await listing.save();

    res.status(200).json({
      success: true,
      message: 'Quantity updated successfully',
      listing
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating sold quantity'
    });
  }
};

// @desc    Get pending listings (admin only)
// @route   GET /api/sell/admin/pending
// @access  Protected (admin)
export const getPendingListings = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const listings = await SaleListing.find({ status: 'pending-verification' })
      .populate('seller', 'name email phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    const total = await SaleListing.countDocuments({ status: 'pending-verification' });
    const pages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      total,
      pages,
      currentPage: parseInt(page),
      listings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending listings',
      error: error.message
    });
  }
};

// @desc    Verify/Approve listing (admin only)
// @route   PUT /api/sell/admin/:id/verify
// @access  Protected (admin)
export const verifyListing = async (req, res) => {
  try {
    const { isVerified, verificationNotes } = req.body;

    let listing = await SaleListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    listing.isVerified = isVerified;
    listing.verificationNotes = verificationNotes;
    listing.verifiedBy = req.user._id;
    listing.status = isVerified ? 'active' : 'rejected';

    if (!isVerified) {
      listing.reason = verificationNotes || 'Listing rejected by admin';
    }

    listing.updatedAt = new Date();
    listing = await listing.save();

    res.status(200).json({
      success: true,
      message: isVerified ? 'Listing verified successfully' : 'Listing rejected',
      listing
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error verifying listing'
    });
  }
};
