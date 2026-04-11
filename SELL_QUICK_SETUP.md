# Sell Medicine Feature - Quick Start Guide

## What Was Created

### Backend Enhancements

#### 1. **New Files Created:**
- `backend/src/config/cloudinary.js` - Cloudinary configuration & image upload/delete functions
- `backend/src/models/SaleListing.js` - Database schema for medicine listings
- `backend/src/controllers/sellController.js` - Controller with all business logic
- `backend/src/routes/sellRoutes.js` - API routes for sell endpoints
- `backend/.env.example` - Environment variables template

#### 2. **Files Modified:**
- `backend/package.json` - Added: `cloudinary`, `multer`, `multer-storage-cloudinary`
- `backend/server.js` - Added sell routes import and middleware
- `src/services/api.js` - Added `sellAPI` object with all frontend integration methods

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Get Cloudinary Credentials
1. Go to https://cloudinary.com/users/register/free
2. Sign up (free account)
3. From your dashboard, copy:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### Step 3: Configure Environment Variables
Create/update `backend/.env` with:
```env
# Cloudinary (REQUIRED for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Database
MONGODB_URI=your_mongodb_uri

# JWT
JWT_SECRET=your_jwt_secret

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Step 4: Start Backend
```bash
npm run dev
```

---

## 📱 API Overview

### Public Routes (No Authentication Required)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/sell` | Get all active listings with filters & pagination |
| GET | `/api/sell/search/:query` | Search medicine listings |
| GET | `/api/sell/:id` | Get single listing details |

### Protected Routes (Auth Required)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/sell` | Create new listing with images |
| GET | `/api/sell/user/my-listings` | Get user's own listings |
| PUT | `/api/sell/:id` | Update listing (with optional images) |
| DELETE | `/api/sell/:id` | Delete listing |
| PUT | `/api/sell/:id/mark-sold` | Mark quantity as sold |

### Admin Routes (Admin Only)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/sell/admin/pending` | View pending listings for verification |
| PUT | `/api/sell/admin/:id/verify` | Approve or reject listings |

---

## 🎨 Frontend Integration Examples

### Import the API
```javascript
import { sellAPI } from './services/api.js';
```

### Example 1: Fetch All Listings
```javascript
async function loadMedicines() {
  try {
    const data = await sellAPI.getAllListings({
      page: 1,
      limit: 12,
      medicineType: 'Tablet',
      priceMax: 500
    });
    
    console.log('Total listings:', data.totalListings);
    console.log('Listings:', data.listings);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Example 2: Create Listing with Images
```javascript
async function createListing(e) {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('medicineName', 'Paracetamol');
  formData.append('medicineType', 'Tablet');
  formData.append('manufacturer', 'Cipla');
  formData.append('quantity', 100);
  formData.append('pricePerUnit', 5);
  formData.append('expiryDate', '2025-12-31');
  formData.append('description', 'Original paracetamol tablets');
  formData.append('condition', 'New');
  
  // Add up to 5 images
  Array.from(imageInputRef.current.files).forEach(file => {
    formData.append('images', file);
  });
  
  // Shipping info
  formData.append('shippingInfo', JSON.stringify({
    shipsFrom: 'Mumbai',
    shippingCost: 50,
    estimatedDelivery: '3-5 days'
  }));
  
  try {
    const response = await sellAPI.createListing(formData);
    alert('Listing created! Awaiting admin verification.');
    console.log('New listing:', response.listing);
  } catch (error) {
    alert('Error: ' + error.message);
  }
}
```

### Example 3: Get User's Listings
```javascript
async function loadMyListings() {
  try {
    const data = await sellAPI.getMyListings('active', 1, 10);
    console.log('My listings:', data.listings);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Example 4: Update Listing
```javascript
async function updateListingPrice(listingId, newPrice) {
  const formData = new FormData();
  formData.append('pricePerUnit', newPrice);
  
  try {
    const response = await sellAPI.updateListing(listingId, formData);
    console.log('Updated listing:', response.listing);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Example 5: Mark as Sold
```javascript
async function markItemsSold(listingId, quantity) {
  try {
    const response = await sellAPI.markAsSold(listingId, quantity);
    console.log('Items marked as sold:', response.listing);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

---

## 📊 Database Schema

### SaleListing Collection
```javascript
{
  _id: ObjectId,
  
  // Seller Info
  seller: ObjectId (User reference),
  
  // Medicine Details
  medicineName: String,
  medicineType: String (Tablet/Capsule/Syrup/etc),
  manufacturer: String,
  batchNumber: String,
  expiryDate: Date,
  
  // Inventory
  quantity: Number,
  quantitySold: Number,
  pricePerUnit: Number,
  totalPrice: Number (auto-calculated),
  
  // Condition & Description
  condition: String (New/Unopened/Sealed/Used),
  description: String,
  
  // Images (Cloudinary)
  images: [{
    url: String (Cloudinary URL),
    publicId: String (Cloudinary ID),
    uploadedAt: Date
  }],
  
  // Admin Verification
  status: String (pending-verification/active/sold/rejected/inactive),
  isVerified: Boolean,
  verifiedBy: ObjectId (Admin user),
  verificationNotes: String,
  reason: String (if rejected),
  
  // Shipping
  shippingInfo: {
    shipsFrom: String,
    shippingCost: Number,
    estimatedDelivery: String
  },
  
  // Engagement
  rating: {
    averageRating: Number,
    totalReviews: Number
  },
  views: Number,
  
  // Status
  isActive: Boolean,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  expiresAt: Date (30 days from creation)
}
```

---

## 🔍 Status Flow

```
User creates listing
        ↓
  pending-verification (awaits admin review)
        ↓
    ┌───────┴────────┐
    ↓                ↓
  active         rejected
    ↓
  (items sold)
    ↓
  sold
```

---

## ⚙️ Image Upload Configuration

- **Storage**: Cloudinary (cloud-based)
- **Folder**: `medireuse/medicines/`
- **Max images per listing**: 5
- **Max file size**: 10MB
- **Supported formats**: JPG, PNG, GIF, WebP
- **Optimization**: Auto quality adjustment

---

## 🛡️ Security Features

✅ **Authentication Required** for:
- Creating listings
- Updating own listings
- Deleting own listings
- Marking as sold

✅ **Admin Only** for:
- Approving/rejecting listings
- Viewing all pending listings

✅ **Authorization Checks**:
- Users can only edit/delete their own listings
- Admins can manage all listings

✅ **Validation**:
- File type validation
- File size limits
- Field validation
- Price/quantity constraints

---

## 🐛 Troubleshooting

### Issue: "Cloudinary credentials missing"
**Solution**: Check `.env` file has all three Cloudinary variables set correctly

### Issue: "File upload failed"
**Solution**: 
- Ensure file size < 10MB
- Verify file is valid image format
- Check frontend sends files as FormData

### Issue: "Listing remains pending"
**Solution**: 
- Admin needs to verify via admin panel
- Check `/api/sell/admin/pending` endpoint
- Admin should call verify endpoint with `isVerified: true`

### Issue: "401 Unauthorized"
**Solution**: 
- User needs to login first
- Check token exists in localStorage: `localStorage.getItem('token')`
- Try logging out and back in

### Issue: "403 Forbidden"
**Solution**:
- Only owner can edit/delete listing
- Only admin can verify listings
- Check user role and permissions

---

## 📈 Next Steps

1. **Frontend Pages to Create**:
   - Sell Medicine form page
   - Browse medicine listings page
   - User's listings management page
   - Admin verification panel

2. **Features to Add**:
   - Rating and reviews system
   - Messaging between buyer-seller
   - Transaction history
   - Wishlist/favorites

3. **Optimizations**:
   - Implement caching
   - Add image compression
   - Batch operations for admin

---

## 📞 Support

For issues or questions about the sell feature implementation, refer to:
- `backend/SELL_BACKEND_README.md` - Detailed API documentation
- `.env.example` - Environment setup template
- Model schema in `backend/src/models/SaleListing.js`

---

**Backend is ready for integration! 🎉**
