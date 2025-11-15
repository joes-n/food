# User Accounts

This document lists all user accounts in the Food Ordering System.

## 🔑 Test Accounts

### Restaurant Owner Accounts

All restaurant owners can upload banners for their own restaurants. Each restaurant has a unique owner.

#### 1. Mario Rossi - Pizza Palace
- **Email**: `pizza.palace@owner.com`
- **Password**: `password123`
- **Phone**: `+1234567890`
- **Restaurant**: Pizza Palace (Italian Cuisine)
- **Restaurant ID**: `seed-restaurant-1`
- **Login URL**: http://localhost:3000/login

#### 2. Yuki Tanaka - Sushi Master
- **Email**: `sushi.master@owner.com`
- **Password**: `password123`
- **Phone**: `+1234567891`
- **Restaurant**: Sushi Master (Japanese Cuisine)
- **Restaurant ID**: `seed-restaurant-2`
- **Login URL**: http://localhost:3000/login

#### 3. Carlos Rodriguez - Taco Ville
- **Email**: `taco.ville@owner.com`
- **Password**: `password123`
- **Phone**: `+1234567892`
- **Restaurant**: Taco Ville (Mexican Cuisine)
- **Restaurant ID**: `seed-restaurant-3`
- **Login URL**: http://localhost:3000/login

#### 4. John Smith - Burger Blast
- **Email**: `burger.blast@owner.com`
- **Password**: `password123`
- **Phone**: `+1234567893`
- **Restaurant**: Burger Blast (American Cuisine)
- **Restaurant ID**: `seed-restaurant-4`
- **Login URL**: http://localhost:3000/login

#### 5. Priya Sharma - Curry House
- **Email**: `curry.house@owner.com`
- **Password**: `password123`
- **Phone**: `+1234567894`
- **Restaurant**: Curry House (Indian Cuisine)
- **Restaurant ID**: `seed-restaurant-5`
- **Login URL**: http://localhost:3000/login

#### 6. Li Wei - Dragon Wok
- **Email**: `dragon.wok@owner.com`
- **Password**: `password123`
- **Phone**: `+1234567895`
- **Restaurant**: Dragon Wok (Chinese Cuisine)
- **Restaurant ID**: `seed-restaurant-6`
- **Login URL**: http://localhost:3000/login

### Customer Accounts

Customers can browse restaurants and place orders.

#### 1. John Doe
- **Email**: `john.doe@example.com`
- **Password**: `password123`
- **Phone**: `+1234567896`
- **Role**: Customer

#### 2. Jane Smith
- **Email**: `jane.smith@example.com`
- **Password**: `password123`
- **Phone**: `+1234567897`
- **Role**: Customer

## 🖼️ Banner Upload Permission

### Ownership Validation

The banner upload system now enforces ownership validation:

1. **Restaurant owners can only upload banners for their own restaurants**
2. **The system validates ownership before allowing uploads**
3. **Unauthorized users receive a 403 Forbidden error**

### How It Works

1. Restaurant owner logs in
2. Navigates to banner upload page
3. Selects image file
4. System checks if user owns the restaurant
5. If authorized: Upload proceeds
6. If unauthorized: Upload rejected with error message

### Testing Ownership Validation

To test ownership validation:

1. Log in as Mario Rossi (pizza.palace@owner.com)
2. Try to upload banner for Sushi Master (seed-restaurant-2)
3. Expected result: `403 Forbidden - You are not authorized to upload images for this restaurant`

## 🚀 Quick Start Guide

### For Restaurant Owners

1. **Login**:
   - Go to http://localhost:3000/login
   - Use any owner email and password `password123`

2. **Upload Banner**:
   - Navigate to: http://localhost:3000/restaurants/{restaurant-id}/banner
   - Example: http://localhost:3000/restaurants/seed-restaurant-1/banner
   - Upload image file
   - Banner will be saved and displayed on restaurant card

3. **View Restaurant**:
   - Go to http://localhost:3000/restaurants
   - Click on your restaurant
   - View uploaded banner

### For Customers

1. **Login**:
   - Go to http://localhost:3000/login
   - Use `john.doe@example.com` / `password123`

2. **Browse Restaurants**:
   - Go to http://localhost:3000/restaurants
   - View restaurant cards with banners

3. **Place Order**:
   - Click on a restaurant
   - Add items to cart
   - Proceed to checkout

## 📊 Database Statistics

After seeding, the database contains:

- **Users**: 9 total
  - 6 Restaurant Owners
  - 2 Customers
  - 1 Admin (implied)
- **Restaurants**: 6
- **Menu Categories**: 13
- **Menu Items**: 64
- **Operating Hours**: 42 (7 days × 6 restaurants)

## 🔐 Security Features

### Implemented

✅ **Authentication Required**: All upload endpoints require login
✅ **Ownership Validation**: Users can only modify their own restaurants
✅ **File Type Validation**: Only images (JPEG, PNG, GIF, WebP) allowed
✅ **File Size Limits**: Maximum 5MB per file
✅ **Unique Filenames**: Prevents file conflicts
✅ **CORS Enabled**: Frontend can access uploaded files

### Error Responses

- **400 Bad Request**: Missing file or invalid restaurant ID
- **401 Unauthorized**: Not logged in
- **403 Forbidden**: Not the owner of the restaurant
- **404 Not Found**: Restaurant doesn't exist
- **413 Payload Too Large**: File exceeds size limit

## 🛠️ API Endpoints

### Upload Banner
```
POST /api/upload/image
Content-Type: multipart/form-data

Headers:
  Authorization: Bearer <token>

Body:
  - image: <image file>
  - restaurantId: <restaurant-id>

Response:
  {
    "success": true,
    "data": {
      "filename": "banner-123.jpg",
      "url": "/uploads/banner-123.jpg",
      "path": "/path/to/file"
    }
  }
```

### Serve Images
```
GET /uploads/<filename>

Response: Image file
```

## 📝 Restaurant Management

Each restaurant owner can:

1. View their restaurant details
2. Upload/update restaurant banner
3. Manage menu items (when menu management is implemented)
4. View orders (when order management is implemented)

## 💡 Tips

- All passwords are `password123` for testing
- Restaurant IDs are prefixed with `seed-restaurant-`
- Banner images are served from `/uploads/` directory
- Use browser console to debug API calls
- Check network tab for upload progress

## 🐛 Troubleshooting

### Upload Fails with 403 Error
- Ensure you're logged in as the correct restaurant owner
- Check that restaurantId matches your restaurant
- Verify JWT token is valid

### Image Not Displaying
- Check if file exists in `/backend/uploads/` directory
- Verify server is running and static file serving is enabled
- Check browser console for errors

### "Restaurant not found"
- Ensure restaurantId is correct
- Check database has been seeded
- Verify restaurant exists in database

## 📧 Support

For issues or questions:
- Check server logs for detailed error messages
- Verify all dependencies are installed
- Ensure database is running and migrated