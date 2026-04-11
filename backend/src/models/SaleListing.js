import mongoose from 'mongoose';

const saleListingSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required'],
    index: true
  },
  medicineName: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
    index: true
  },
  medicineType: {
    type: String,
    enum: ['Tablet', 'Capsule', 'Syrup', 'Powder', 'Injection', 'Ointment', 'Drops', 'Other'],
    required: [true, 'Medicine type is required']
  },
  manufacturer: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [10000, 'Quantity cannot exceed 10000']
  },
  quantitySold: {
    type: Number,
    default: 0,
    min: 0
  },
  pricePerUnit: {
    type: Number,
    required: [true, 'Price per unit is required'],
    min: [0, 'Price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  batchNumber: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  condition: {
    type: String,
    enum: ['New', 'Unopened', 'Sealed', 'Used'],
    default: 'New'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationNotes: {
    type: String,
    trim: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'pending-verification', 'rejected', 'inactive'],
    default: 'pending-verification'
  },
  reason: {
    type: String,
    trim: true
  },
  shippingInfo: {
    shipsFrom: {
      type: String,
      trim: true
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0
    },
    estimatedDelivery: {
      type: String,
      default: '3-5 days'
    }
  },
  rating: {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  views: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    index: true
  }
});

// Index for search functionality
saleListingSchema.index({ medicineName: 'text', description: 'text' });

// Auto calculate total price
saleListingSchema.pre('save', function(next) {
  if (this.quantity && this.pricePerUnit) {
    this.totalPrice = this.quantity * this.pricePerUnit;
  }
  next();
});

// Remove expired listings before document operations
saleListingSchema.pre('find', function(next) {
  this.where({ expiresAt: { $gt: new Date() } });
  next();
});

saleListingSchema.pre('findOne', function(next) {
  this.where({ expiresAt: { $gt: new Date() } });
  next();
});

export default mongoose.model('SaleListing', saleListingSchema);
