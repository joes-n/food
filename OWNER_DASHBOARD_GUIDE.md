# Restaurant Owner Dashboard - Complete Guide

## 🎉 Overview

A comprehensive restaurant owner dashboard has been built where restaurant owners can:
- Edit restaurant details (banner, name, cuisine, etc.)
- Manage menu items (CRUD operations)
- Accept/reject customer orders
- View earnings and statistics
- Upload banner images

The current customer-facing view remains unchanged and serves as the customer dashboard.

## 🏗️ System Architecture

### Backend Components

#### Controllers & Routes Created:

1. **Menu Item Management**
   - `src/controllers/menuItemController.ts` - CRUD operations for menu items
   - `src/routes/menuItemRoutes.ts` - Menu item API endpoints

2. **Order Management**
   - `src/controllers/orderManagementController.ts` - Accept/reject orders
   - `src/routes/orderManagementRoutes.ts` - Order management API

3. **Restaurant Statistics**
   - `src/controllers/restaurantStatsController.ts` - Earnings & analytics
   - `src/routes/restaurantStatsRoutes.ts` - Statistics API

4. **Updated Server Routes**
   - `src/server.ts` - Registered all new routes

### Frontend Components

#### Pages Created:

1. **Owner Dashboard**
   - `src/pages/owner/OwnerDashboard.tsx` - Main dashboard with overview
   - Shows restaurant list, quick stats, popular items

2. **Restaurant Edit**
   - `src/pages/owner/RestaurantEdit.tsx` - Edit restaurant details
   - Includes banner upload integration

3. **Menu Management**
   - `src/pages/owner/MenuManagement.tsx` - CRUD menu items
   - Add, edit, delete, toggle availability

4. **Order Management**
   - `src/pages/owner/OrderManagement.tsx` - View & manage orders
   - Accept/reject orders, filter by status

5. **Earnings**
   - `src/pages/owner/Earnings.tsx` - View earnings & statistics
   - Revenue charts, popular items, order breakdowns

#### Services:
- `src/services/ownerService.ts` - API service for all owner operations

## 🚀 How to Access

### 1. Login as Restaurant Owner

Use any of these accounts:
- **Email**: `pizza.palace@owner.com`
- **Email**: `sushi.master@owner.com`
- **Email**: `curry.house@owner.com`
- etc.
- **Password**: `password123`

### 2. Access Dashboard

Visit: **http://localhost:3000/owner/dashboard**

## 📱 Features Guide

### 1. Owner Dashboard (`/owner/dashboard`)

**What it shows:**
- List of your restaurants (if you own multiple)
- Quick stats cards:
  - Total Orders
  - Monthly Revenue
  - Pending Orders
  - Completed Orders
- Popular items with sales data

**Quick Actions:**
- Edit Restaurant
- Manage Menu
- View Orders
- View Earnings

### 2. Edit Restaurant (`/owner/restaurants/:id/edit`)

**Features:**
- ✅ Update restaurant name
- ✅ Change description
- ✅ Update cuisine type
- ✅ Change price range
- ✅ Edit address, phone, email
- ✅ Set delivery fee & min order amount
- ✅ Update estimated delivery time
- ✅ Toggle open/closed status
- ✅ Upload/change banner image

**Banner Upload:**
- Click "Upload Banner Image"
- Select image file
- System validates: Images only, max 5MB
- Banner appears on restaurant card in customer view

### 3. Manage Menu (`/owner/restaurants/:id/menu`)

**Features:**
- ✅ Add new menu items
- ✅ Edit existing menu items
- ✅ Delete menu items
- ✅ Toggle item availability (enable/disable)
- ✅ Set price, description, prep time

**Add Menu Item:**
1. Click "Add Menu Item"
2. Fill in: Name, Price, Description
3. Set preparation time
4. Choose availability
5. Click "Create"

**Edit Menu Item:**
1. Click edit icon (pencil) on any item
2. Modify details
3. Click "Update"

**Delete Menu Item:**
1. Click trash icon
2. Confirm deletion

### 4. Manage Orders (`/owner/restaurants/:id/orders`)

**Features:**
- ✅ View all orders for your restaurant
- ✅ Filter by status (All, Pending, Confirmed, etc.)
- ✅ Accept pending orders
- ✅ Reject pending orders
- ✅ View customer details
- ✅ View order items & total

**Order Status Types:**
- `pending` - Awaiting action
- `confirmed` - Accepted, preparing
- `preparing` - In kitchen
- `ready_for_pickup` - Ready for delivery
- `out_for_delivery` - Being delivered
- `delivered` - Completed
- `cancelled` - Cancelled

**Accept Order:**
1. Find order with "pending" status
2. Click "Accept Order"
3. Order status changes to "confirmed"

**Reject Order:**
1. Find order with "pending" status
2. Click "Reject Order"
3. Confirm rejection
4. Order status changes to "cancelled"

### 5. View Earnings (`/owner/restaurants/:id/earnings`)

**Features:**
- 📊 Monthly Revenue
- 📊 Yearly Revenue
- 📊 Total Orders
- 📊 Average Order Value
- 📊 Order Status Breakdown
- 📊 Top 5 Popular Items

**Revenue Metrics:**
- Monthly revenue (current month)
- Yearly revenue (current year)
- Average order value
- Order counts by status

## 🔌 API Endpoints

### Menu Items
```
GET    /api/menu-items?restaurantId=xxx&categoryId=xxx
POST   /api/menu-items
PUT    /api/menu-items/:id
DELETE /api/menu-items/:id
```

### Order Management
```
GET    /api/orders/manage/restaurant/:restaurantId?status=pending
POST   /api/orders/manage/:orderId/accept
POST   /api/orders/manage/:orderId/reject
PUT    /api/orders/manage/:orderId/status
```

### Restaurant Statistics
```
GET    /api/stats/:restaurantId
```

## 🔐 Security Features

### Ownership Validation

All endpoints validate that the authenticated user owns the restaurant:

1. **Menu Items**: User must own the restaurant
2. **Orders**: User can only view/modify their restaurant's orders
3. **Statistics**: User can only view their restaurant's stats
4. **Restaurant Update**: User must own the restaurant

### Authentication Required

- All owner endpoints require JWT authentication
- Users must be logged in with `restaurant_owner` role
- Unauthorized requests receive `403 Forbidden`

## 🎯 Testing Guide

### Test Restaurant Owner Access

1. **Login**:
   ```
   Email: pizza.palace@owner.com
   Password: password123
   ```

2. **Dashboard**:
   - Visit: `http://localhost:3000/owner/dashboard`
   - Should see "Restaurant Owner Dashboard"
   - Should see Pizza Palace restaurant

3. **Edit Restaurant**:
   - Click "Edit Restaurant"
   - Update name to "Pizza Palace UPDATED"
   - Save changes
   - Verify changes persist

4. **Upload Banner**:
   - Go to Edit Restaurant
   - Upload new banner image
   - Check restaurant list shows new banner

5. **Add Menu Item**:
   - Go to "Manage Menu"
   - Click "Add Menu Item"
   - Add "Test Pizza" for $15.99
   - Verify it appears in menu

6. **Accept Order**:
   - Go to "View Orders"
   - See pending orders (if any)
   - Click "Accept Order"
   - Status changes to "confirmed"

### Test Ownership Validation

1. **Login** as Mario Rossi (pizza.palace@owner.com)
2. **Try to view** Sushi Master's orders
   - URL: `/owner/restaurants/seed-restaurant-2/orders`
   - Should receive 403 Forbidden error

## 📊 Database Structure

### New Tables/Models:

**MenuItem Model:**
```typescript
{
  id: string
  restaurantId: string
  categoryId: string
  name: string
  description: string
  price: number
  image?: string
  isAvailable: boolean
  preparationTime?: number
}
```

**Order Management:**
- Leverages existing Order model
- Adds ownership validation
- New endpoints for status updates

**Restaurant Statistics:**
- Aggregates existing Order data
- Calculates revenue metrics
- Tracks popular items

## 🎨 UI/UX Features

### Customer View (Unchanged)
The customer-facing application remains the same:
- Browse restaurants: `/restaurants`
- View restaurant details: `/restaurants/:id`
- Add to cart and checkout
- Current Navbar shows: Home, Restaurants, Cart, Login/Logout

### Owner View (New)
Separate owner dashboard:
- Owner dashboard: `/owner/dashboard`
- All owner pages use existing Navbar
- Owner pages accessible via dashboard links

## 🛠️ Development Notes

### State Management
- Uses Zustand auth store
- User role determines navigation
- Session persists across page reloads

### Error Handling
- Toast notifications for all actions
- Loading states on all async operations
- Form validation on frontend and backend

### File Structure
```
frontend/src/
├── pages/owner/
│   ├── OwnerDashboard.tsx
│   ├── RestaurantEdit.tsx
│   ├── MenuManagement.tsx
│   ├── OrderManagement.tsx
│   └── Earnings.tsx
├── services/
│   └── ownerService.ts
└── App.tsx (routes added)

backend/src/
├── controllers/
│   ├── menuItemController.ts
│   ├── orderManagementController.ts
│   └── restaurantStatsController.ts
├── routes/
│   ├── menuItemRoutes.ts
│   ├── orderManagementRoutes.ts
│   └── restaurantStatsRoutes.ts
└── server.ts (routes registered)
```

## 📈 Future Enhancements

Potential additions:
- ✅ Multiple restaurant support (already supported)
- Real-time order updates (Socket.io ready)
- Delivery management
- Customer reviews management
- Promotional codes
- Inventory tracking
- Staff management
- Analytics dashboard

## 🚨 Troubleshooting

### "Not authorized" error
- Ensure logged in as restaurant owner
- Check that restaurant ID matches your restaurant
- Verify JWT token is valid

### Orders not showing
- Check filter is set to "all" or correct status
- Verify restaurant ID is correct
- Check server logs for errors

### Banner upload fails
- Check file is image (JPG, PNG, etc.)
- Check file size < 5MB
- Verify logged in as restaurant owner

## 📚 Documentation Files

- `ACCOUNTS.md` - All user accounts
- `IMAGE_UPLOAD_GUIDE.md` - Banner upload instructions
- `OWNER_DASHBOARD_GUIDE.md` - This file

## 🎊 Summary

The restaurant owner dashboard is fully functional with:
- ✅ Complete restaurant management
- ✅ Menu item CRUD
- ✅ Order acceptance/rejection
- ✅ Earnings & statistics
- ✅ Secure ownership validation
- ✅ Professional UI/UX

**Ready to use!** 🚀