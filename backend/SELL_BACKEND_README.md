# Sell Medicine Backend - Implementation Guide

## Overview
The Sell Medicine feature allows users to list medicines they want to sell on the platform. Images are stored on Cloudinary for efficient storage and delivery. Admin verification is required before listings go live.

## Features

### 1. **Medicine Listing Management**
- Create new medicine listings with up to 5 images
- Update existing listings
- Delete listings
- Mark quantity as sold
- Track sold vs available inventory

### 2. **Image Storage (Cloudinary)**
- Automatic upload to Cloudinary
- Up to 5 images per listing
- Automatic image optimization
- Safe deletion of images

### 3. **Admin Verification**
- All listings require admin approval before going live
- Admin can approve or reject listings
- Verification notes can be added
- Automatic status management

### 4. **Search & Filtering**
- Full-text search on medicine names and descriptions
- Filter by medicine type, price range
- Pagination support
- View tracking

### 5. **User Management**
- Get user's own listings
- Track listing status
- View seller information
- Buyer can contact seller through listings

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Cloudinary
1. Create a free account at [Cloudinary](https://cloudinary.com/)
2. Go to Dashboard to find:
   - Cloud Name
   - API Key
   - API Secret

3. Update `.env` file:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Set Other Environment Variables
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/medireuse

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
REFRESH_EXPIRE_DAYS=30

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 4. Start Backend
```bash
npm run dev
```

## API Endpoints

### Public Endpoints

#### Get All Listings
```
GET /api/sell
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 12)
  - medicineType: string (optional)
  - priceMin: number (optional)
  - priceMax: number (optional)
  - sortBy: string (default: '-createdAt')

Response:
{
  success: true,
  totalListings: number,
  totalPages: number,
  currentPage: number,
  listings: [{
    _id: string,
    seller: { name, phone, address },
    medicineName: string,
    medicineType: string,
    quantity: number,
    quantitySold: number,
    pricePerUnit: number,
    totalPrice: number,
    images: [{ url, publicId }],
    rating: { averageRating, totalReviews },
    views: number,
    ...
  }]
}
```

#### Search Listings
```
GET /api/sell/search/:query
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 12)
```

#### Get Single Listing
```
GET /api/sell/:id
Response: { success: true, listing: {...} }
```

### Protected Endpoints (Requires Authentication)

#### Create Listing
```
POST /api/sell
Content-Type: multipart/form-data

Form Data:
  - medicineName: string (required)
  - medicineType: string (required) - enum: ['Tablet', 'Capsule', 'Syrup', 'Powder', 'Injection', 'Ointment', 'Drops', 'Other']
  - quantity: number (required)
  - pricePerUnit: number (required)
  - expiryDate: date (required)
  - batchNumber: string (optional)
  - manufacturer: string (optional)
  - description: string (optional)
  - condition: string (optional) - enum: ['New', 'Unopened', 'Sealed', 'Used']
  - images: file[] (required) - max 5 files
  - shippingInfo: JSON string (optional)
    {
      shipsFrom: string,
      shippingCost: number,
      estimatedDelivery: string
    }

Response:
{
  success: true,
  message: 'Listing created successfully and pending admin verification',
  listing: {...}
}
```

#### Get My Listings
```
GET /api/sell/user/my-listings
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 10)
  - status: string (optional) - filter by status

Response:
{
  success: true,
  total: number,
  pages: number,
  currentPage: number,
  listings: [...]
}
```

#### Update Listing
```
PUT /api/sell/:id
Content-Type: multipart/form-data

Form Data: (same as create, all optional)
  - deleteImages: JSON array of URLs to delete (optional)
  - images: file[] (optional) - new images to add

Response: { success: true, message: 'Listing updated successfully', listing: {...} }
```

#### Delete Listing
```
DELETE /api/sell/:id
Response: { success: true, message: 'Listing deleted successfully' }
```

#### Mark as Sold
```
PUT /api/sell/:id/mark-sold
Body:
{
  quantitySold: number (required)
}

Response: { success: true, message: 'Quantity updated successfully', listing: {...} }
```

### Admin Endpoints

#### Get Pending Listings
```
GET /api/sell/admin/pending
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 20)

Response:
{
  success: true,
  total: number,
  pages: number,
  currentPage: number,
  listings: [...]
}
```

#### Verify Listing
```
PUT /api/sell/admin/:id/verify
Body:
{
  isVerified: boolean (required),
  verificationNotes: string (optional)
}

Response:
{
  success: true,
  message: 'Listing verified successfully' | 'Listing rejected',
  listing: {...}
}
```

## Database Schema (SaleListing)

```javascript
{
  seller: ObjectId (ref: User) - required
  medicineName: String - required
  medicineType: Enum - required
  manufacturer: String
  quantity: Number - required
  quantitySold: Number - default: 0
  pricePerUnit: Number - required
  totalPrice: Number - calculated
  expiryDate: Date - required
  batchNumber: String
  description: String
  images: [{
    url: String,
    publicId: String,
    uploadedAt: Date
  }]
  condition: Enum - default: 'New'
  isVerified: Boolean - default: false
  verificationNotes: String
  verifiedBy: ObjectId (ref: User)
  status: Enum - 'active', 'sold', 'pending-verification', 'rejected', 'inactive'
  reason: String
  shippingInfo: {
    shipsFrom: String,
    shippingCost: Number,
    estimatedDelivery: String
  }
  rating: {
    averageRating: Number,
    totalReviews: Number
  }
  views: Number
  isActive: Boolean
  createdAt: Date
  updatedAt: Date
  expiresAt: Date (30 days from creation)
}
```

## Frontend Integration

### Import API
```javascript
import { sellAPI } from './services/api.js';
```

### Usage Examples

#### Fetch All Listings
```javascript
try {
  const response = await sellAPI.getAllListings({
    page: 1,
    limit: 12,
    medicineType: 'Tablet',
    priceMax: 500
  });
  console.log(response.listings);
} catch (error) {
  console.error(error.message);
}
```

#### Create Listing with Images
```javascript
const formData = new FormData();
formData.append('medicineName', 'Aspirin');
formData.append('medicineType', 'Tablet');
formData.append('quantity', 100);
formData.append('pricePerUnit', 10);
formData.append('expiryDate', '2025-12-31');
formData.append('description', 'High quality aspirin');
formData.append('images', imageFile1);
formData.append('images', imageFile2);
formData.append('shippingInfo', JSON.stringify({
  shipsFrom: 'Mumbai',
  shippingCost: 50,
  estimatedDelivery: '3-5 days'
}));

try {
  const response = await sellAPI.createListing(formData);
  console.log('Listing created:', response.listing);
} catch (error) {
  console.error(error.message);
}
```

#### Get My Listings
```javascript
const myListings = await sellAPI.getMyListings('active', 1, 10);
```

#### Update Listing
```javascript
const formData = new FormData();
formData.append('medicineName', 'Aspirin Plus');
formData.append('pricePerUnit', 12);
// Add new images if needed
formData.append('images', newImageFile);
// Mark images to delete
formData.append('deleteImages', JSON.stringify([oldImageUrl1]));

try {
  const response = await sellAPI.updateListing(listingId, formData);
  console.log('Updated:', response.listing);
} catch (error) {
  console.error(error.message);
}
```

## Error Handling

All endpoints return error responses in this format:
```javascript
{
  success: false,
  message: 'Error description',
  error: 'Detailed error (development only)'
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

## Cloudinary Configuration Details

### Folder Structure
All medicine images are stored in: `medireuse/medicines/`

### Image Optimization
- Automatic format conversion
- Quality: 'auto' (optimal)
- Max file size: 10MB per image
- Supported formats: JPG, JPEG, PNG, GIF, WebP

### Deletion
Images are automatically deleted from Cloudinary when:
1. A listing is deleted
2. Images are replaced during update

## Listing Status Flow

```
pending-verification → active (approved by admin)
                    → rejected (declined by admin)

active → sold (when quantitySold >= quantity)
      → inactive (manually deactivated)

rejected → pending-verification (after re-edit)
inactive → active (re-activate)
```

## Best Practices

1. **Image Uploads**: Always validate file size and type on frontend before uploading
2. **Pricing**: Validate that prices are positive numbers
3. **Expiry Dates**: Use date picker to prevent invalid dates
4. **Search**: Implement debouncing for search input
5. **Pagination**: Load listings in batches for better performance
6. **Error Messages**: Display user-friendly error messages from API responses

## Testing

### Using cURL
```bash
# Get all listings
curl http://localhost:5000/api/sell

# Search
curl http://localhost:5000/api/sell/search/aspirin

# Create listing (requires token)
curl -X POST http://localhost:5000/api/sell \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "medicineName=Aspirin" \
  -F "medicineType=Tablet" \
  -F "quantity=100" \
  -F "pricePerUnit=10" \
  -F "expiryDate=2025-12-31" \
  -F "images=@path/to/image1.jpg" \
  -F "images=@path/to/image2.jpg"
```

## Troubleshooting

### Images not uploading
- Check Cloudinary credentials in `.env`
- Verify file size < 10MB
- Confirm file is valid image format

### Listing stuck in pending-verification
- Admin needs to verify the listing via `/api/sell/admin/:id/verify`
- Check admin panel for pending listings

### 401 Unauthorized
- Token might be expired
- Try logging in again
- Check token is properly set in localStorage

### 403 Forbidden
- You don't have permission to perform this action
- Only sellers can edit their own listings
- Only admins can verify listings

## Future Enhancements

1. Add rating and review system
2. Implement messaging between buyer and seller
3. Add transaction history
4. Implement warranty tracking
5. Add certificate/verification documents
6. Batch operations for admin
7. Advanced analytics for sellers
