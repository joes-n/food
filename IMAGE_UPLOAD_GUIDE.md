# Image Upload Guide

This guide shows you how to upload banner images for restaurants using the new upload system with ownership validation.

## 🔐 Ownership Validation

**IMPORTANT**: Restaurant owners can only upload banners for their own restaurants. The system validates ownership before allowing uploads.

## 🚀 Quick Start

### 1. Backend Setup (Already Done)

The backend now includes:
- ✅ File upload middleware with multer
- ✅ Upload endpoint: `POST /api/upload/image`
- ✅ **Ownership validation** - Users can only upload to their own restaurants
- ✅ Static file serving for uploaded images
- ✅ File validation (images only, 5MB max)

### 2. Frontend Usage

#### Option A: Using the ImageUpload Component

```tsx
import { ImageUpload } from '../components/ImageUpload';
import { restaurantService } from '../services/restaurantService';

function RestaurantForm() {
  const [bannerUrl, setBannerUrl] = useState('');
  const restaurantId = 'seed-restaurant-1'; // Must be passed

  const handleBannerUpload = async (url: string) => {
    setBannerUrl(url);

    // Update restaurant with new banner
    try {
      await restaurantService.updateRestaurant(restaurantId, {
        banner: url,
      });
      toast.success('Banner updated successfully');
    } catch (error) {
      toast.error('Failed to update restaurant');
    }
  };

  return (
    <div>
      <ImageUpload
        label="Restaurant Banner"
        currentImage={bannerUrl}
        restaurantId={restaurantId} // Required prop
        onUploadComplete={handleBannerUpload}
      />
    </div>
  );
}
```

#### Option B: Manual Upload with Service

```tsx
import { uploadService } from '../services/uploadService';
import { restaurantService } from '../services/restaurantService';

async function uploadBanner(file: File, restaurantId: string) {
  try {
    // 1. Upload the image (includes ownership check)
    const { url } = await uploadService.uploadImage(file, restaurantId);
    console.log('Upload successful:', url);

    // 2. Update restaurant with banner URL
    await restaurantService.updateRestaurant(restaurantId, {
      banner: url,
    });

    toast.success('Banner uploaded and updated!');
  } catch (error) {
    toast.error(error.message || 'Upload failed');
  }
}

// Usage in file input handler
<input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadBanner(file, 'seed-restaurant-1');
    }
  }}
/>
```

## 📡 API Reference

### Upload Endpoint

**POST** `/api/upload/image`

- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Body**: FormData with 'image' field

**Request Example (cURL):**
```bash
curl -X POST http://localhost:5000/api/upload/image \
  -H "Authorization: Bearer <your-token>" \
  -F "image=@/path/to/banner.jpg" \
  -F "restaurantId=seed-restaurant-1"
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "filename": "banner-123456789-123456789.jpg",
    "url": "/uploads/banner-123456789-123456789.jpg",
    "path": "/home/raner/swe3500/food/backend/uploads/banner-123456789-123456789.jpg"
  }
}
```

**Error Response - File Too Large:**
```json
{
  "success": false,
  "error": "File size too large"
}
```

**Error Response - Not Authorized:**
```json
{
  "success": false,
  "error": "You are not authorized to upload images for this restaurant"
}
```

**Error Response - Missing Restaurant ID:**
```json
{
  "success": false,
  "error": "Restaurant ID is required"
}
```

### Accessing Uploaded Images

Images are served from: `http://localhost:5000/uploads/<filename>`

Example:
```html
<img src="http://localhost:5000/uploads/banner-123.jpg" alt="Banner" />
```

## 🎨 Restaurant Banner Update Example

Here's a complete example of updating a restaurant's banner:

```tsx
import { useState } from 'react';
import { ImageUpload } from '../components/ImageUpload';
import { restaurantService } from '../services/restaurantService';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

export function EditRestaurantBanner() {
  const { id } = useParams<{ id: string }>();
  const [bannerUrl, setBannerUrl] = useState('');

  const handleUpload = async (url: string) => {
    try {
      // Save the URL to state
      setBannerUrl(url);

      // Update the restaurant in database
      await restaurantService.updateRestaurant(id!, {
        banner: url,
      });

      toast.success('Banner updated successfully!');
    } catch (error) {
      toast.error('Failed to update banner');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Edit Restaurant Banner</h2>

      <ImageUpload
        label="Upload Banner Image"
        currentImage={bannerUrl}
        onUploadComplete={handleUpload}
      />

      {bannerUrl && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Preview:</h3>
          <img
            src={bannerUrl}
            alt="Banner preview"
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
```

## 🔧 File Requirements

- **Formats**: JPEG, JPG, PNG, GIF, WebP
- **Max Size**: 5MB
- **Storage**: Files stored in `/backend/uploads/` directory
- **Access**: Images accessible at `http://localhost:5000/uploads/<filename>`

## 🛡️ Security Features

- ✅ File type validation (images only)
- ✅ File size limits (5MB default)
- ✅ Unique filenames to prevent conflicts
- ✅ Authentication required for uploads
- ✅ CORS enabled for frontend access

## 📝 Restaurant Update Example

To update a restaurant's banner after upload:

```javascript
// Using the restaurant service
await restaurantService.updateRestaurant(restaurantId, {
  banner: '/uploads/banner-123456789.jpg',
  // or full URL: 'http://localhost:5000/uploads/banner-123456789.jpg'
});
```

The banner URL is stored in the database and can be used in your restaurant cards:

```tsx
{restaurant.banner && (
  <img
    src={restaurant.banner}
    alt={restaurant.name}
    className="w-full h-48 object-cover rounded-t-lg"
  />
)}
```

## 🎯 Testing Ownership Validation

### Test Case 1: Authorized Upload
1. Login as Mario Rossi: `pizza.palace@owner.com` / `password123`
2. Navigate to: `http://localhost:3000/restaurants/seed-restaurant-1/banner`
3. Upload banner image
4. ✅ Expected: Upload succeeds

### Test Case 2: Unauthorized Upload
1. Login as Mario Rossi: `pizza.palace@owner.com` / `password123`
2. Navigate to: `http://localhost:3000/restaurants/seed-restaurant-2/banner`
3. Upload banner image
4. ❌ Expected: Upload fails with 403 error

## 🎯 Testing (General)

1. Start the backend server
2. Login to get an authentication token
3. Use the ImageUpload component or API directly
4. Check the uploads directory: `/backend/uploads/`
5. Access images at: `http://localhost:5000/uploads/<filename>`

### Required Login
All uploads require authentication. Use any restaurant owner account:
- Email: `pizza.palace@owner.com` (etc.)
- Password: `password123`

See [ACCOUNTS.md](./ACCOUNTS.md) for full list of accounts.

## 📦 What's Included

- `src/utils/upload.ts` - Multer configuration
- `src/routes/uploadRoutes.ts` - Upload endpoints
- `src/services/uploadService.ts` - Frontend upload service
- `src/components/ImageUpload.tsx` - Reusable upload component

## 💡 Tips

1. **Always validate on the client side** before uploading
2. **Show upload progress** for better UX
3. **Handle errors gracefully** with try-catch blocks
4. **Compress images** before upload if needed (client-side)
5. **Use the ImageUpload component** for consistent UI/UX